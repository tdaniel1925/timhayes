#!/usr/bin/env python3
"""
CloudUCM CDR Polling Service
Fetches CDR records from CloudUCM API every 2 minutes and processes them
"""
import requests
import time
import logging
import hashlib
import json
from datetime import datetime, timedelta
from app import app, db, CDRRecord, Tenant, process_call_ai_async
import schedule
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CloudUCM API Configuration (from environment variables)
import os
UCM_API_BASE = os.getenv('UCM_API_BASE', 'https://071ffb.c.myucm.cloud:8443')
UCM_USERNAME = os.getenv('UCM_API_USERNAME', 'testco_webhook')
UCM_PASSWORD = os.getenv('UCM_API_PASSWORD', 'TestWebhook123!')
CDR_POLL_INTERVAL = int(os.getenv('CDR_POLL_INTERVAL', '2'))  # minutes

class CDRPoller:
    def __init__(self):
        self.last_sync_time = {}  # Track last sync per tenant
        self.session_cookie = None  # Store session cookie
        self.session_expiry = None  # Track when session expires

    def authenticate(self):
        """
        Authenticate with CloudUCM using challenge/response protocol
        Returns session cookie on success, None on failure
        """
        try:
            # Step 1: Request challenge (using POST with JSON)
            logger.info("Requesting authentication challenge from CloudUCM...")

            challenge_request = {
                "request": {
                    "action": "challenge",
                    "user": UCM_USERNAME,
                    "version": "1.0"
                }
            }

            challenge_response = requests.post(
                f"{UCM_API_BASE}/api",
                json=challenge_request,
                timeout=30,
                verify=False  # CloudUCM may use self-signed cert
            )

            if challenge_response.status_code != 200:
                logger.error(f"Challenge request failed: {challenge_response.status_code} - {challenge_response.text}")
                return None

            challenge_data = challenge_response.json()
            if 'response' not in challenge_data or 'challenge' not in challenge_data['response']:
                logger.error(f"Challenge failed: {challenge_data}")
                return None

            challenge = challenge_data['response']['challenge']
            logger.info(f"Received challenge: {challenge[:20]}...")

            # Step 2: Create MD5 hash of challenge + password
            token = hashlib.md5(f"{challenge}{UCM_PASSWORD}".encode()).hexdigest()
            logger.info(f"Created authentication token: {token[:20]}...")

            # Step 3: Login with username and token (using POST with JSON)
            login_request = {
                "request": {
                    "action": "login",
                    "token": token,
                    "user": UCM_USERNAME
                }
            }

            login_response = requests.post(
                f"{UCM_API_BASE}/api",
                json=login_request,
                timeout=30,
                verify=False
            )

            if login_response.status_code != 200:
                logger.error(f"Login request failed: {login_response.status_code} - {login_response.text}")
                return None

            login_data = login_response.json()

            # Extract session cookie from JSON response body (not HTTP cookie)
            if login_data.get('status') == 0 and 'cookie' in login_data.get('response', {}):
                session_cookie = login_data['response']['cookie']
                logger.info(f"✅ Authentication successful! Cookie: {session_cookie[:20]}...")
                self.session_cookie = session_cookie
                self.session_expiry = datetime.utcnow() + timedelta(minutes=30)  # Sessions typically last 30 min
                return session_cookie
            else:
                logger.error(f"Login failed: {login_data}")
                return None

        except Exception as e:
            logger.error(f"Authentication error: {e}", exc_info=True)
            return None

    def ensure_authenticated(self):
        """
        Ensure we have a valid session, re-authenticate if needed
        """
        # Check if session is still valid
        if self.session_cookie and self.session_expiry and datetime.utcnow() < self.session_expiry:
            return True

        # Need to authenticate
        logger.info("Session expired or not authenticated, logging in...")
        return self.authenticate() is not None

    def fetch_ucm_cdrs(self, since_time=None):
        """
        Fetch CDR records from CloudUCM API

        Args:
            since_time: datetime object - only fetch CDRs after this time
        """
        try:
            # Ensure we're authenticated
            if not self.ensure_authenticated():
                logger.error("Failed to authenticate with CloudUCM")
                return []

            # Calculate time range
            if since_time:
                start_time = since_time.strftime("%Y-%m-%d %H:%M:%S")
            else:
                # Default: last 1 hour
                start_time = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")

            end_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

            logger.info(f"Fetching CDRs from {start_time} to {end_time}")

            # Make API request to CloudUCM with session cookie (using POST with JSON)
            cdr_request = {
                "request": {
                    "action": "cdrapi",
                    "cookie": self.session_cookie,
                    "format": "json",
                    "startdate": start_time,
                    "enddate": end_time
                }
            }

            response = requests.post(
                f"{UCM_API_BASE}/api",
                json=cdr_request,
                timeout=30,
                verify=False
            )

            if response.status_code != 200:
                logger.error(f"Failed to fetch CDRs: {response.status_code} - {response.text}")
                return []

            data = response.json()

            # UCM returns CDRs in 'cdr_root' array
            if 'cdr_root' in data:
                # Flatten the CDR records - some are simple, some have sub_cdr_*
                records = []
                for cdr_entry in data['cdr_root']:
                    # If it's a simple CDR (has 'AcctId'), add it directly
                    if 'AcctId' in cdr_entry:
                        records.append(cdr_entry)
                    # If it has sub_cdr structure, extract the main call
                    elif 'main_cdr' in cdr_entry and 'sub_cdr_3' in cdr_entry:
                        # sub_cdr_3 usually has the recording and is the actual answered call
                        records.append(cdr_entry['sub_cdr_3'])

                logger.info(f"Fetched {len(records)} CDR records")
                return records
            elif 'response' in data and 'cdr' in data['response']:
                # Alternative format
                records = data['response']['cdr']
                logger.info(f"Fetched {len(records)} CDR records")
                return records
            else:
                logger.error(f"Unexpected CDR API response format: {list(data.keys())}")
                return []
            return records

        except Exception as e:
            logger.error(f"Error fetching CDRs from CloudUCM: {e}", exc_info=True)
            return []

    def process_cdr_record(self, cdr_data, tenant_id):
        """
        Process a single CDR record - save to database and trigger AI

        Args:
            cdr_data: dict - CDR record from CloudUCM
            tenant_id: int - Tenant ID to associate with
        """
        try:
            # Check if record already exists
            uniqueid = cdr_data.get('uniqueid')
            existing = CDRRecord.query.filter_by(
                tenant_id=tenant_id,
                uniqueid=uniqueid
            ).first()

            if existing:
                logger.debug(f"CDR {uniqueid} already exists, skipping")
                return

            # Create new CDR record
            cdr = CDRRecord(
                tenant_id=tenant_id,
                uniqueid=cdr_data.get('uniqueid'),
                src=cdr_data.get('src'),
                dst=cdr_data.get('dst'),
                caller_name=cdr_data.get('caller_name'),
                clid=cdr_data.get('clid'),
                channel=cdr_data.get('channel'),
                dstchannel=cdr_data.get('dstchannel'),
                start_time=cdr_data.get('start'),
                answer_time=cdr_data.get('answer'),
                end_time=cdr_data.get('end'),
                duration=cdr_data.get('duration'),
                billsec=cdr_data.get('billsec'),
                disposition=cdr_data.get('disposition'),
                recordfiles=cdr_data.get('recordfiles'),
                src_trunk_name=cdr_data.get('src_trunk_name'),
                dst_trunk_name=cdr_data.get('dst_trunk_name')
            )

            db.session.add(cdr)
            db.session.commit()

            logger.info(f"✅ Saved CDR {uniqueid}: {cdr.src} -> {cdr.dst} ({cdr.duration}s)")

            # Trigger AI processing if recording exists
            recording_path = cdr_data.get('recordfiles')
            if recording_path:
                logger.info(f"🤖 Triggering AI processing for call {cdr.id}")
                process_call_ai_async(cdr.id, recording_path)

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing CDR: {e}", exc_info=True)

    def poll_for_tenant(self, tenant):
        """
        Poll CloudUCM for new CDRs for a specific tenant

        Args:
            tenant: Tenant object
        """
        try:
            # Get last sync time for this tenant
            last_sync = self.last_sync_time.get(tenant.id)

            if not last_sync:
                # First sync - get last 2 hours
                last_sync = datetime.utcnow() - timedelta(hours=2)

            # Fetch new CDRs
            cdrs = self.fetch_ucm_cdrs(since_time=last_sync)

            # Process each CDR
            for cdr_data in cdrs:
                self.process_cdr_record(cdr_data, tenant.id)

            # Update last sync time
            self.last_sync_time[tenant.id] = datetime.utcnow()

            if cdrs:
                logger.info(f"✅ Processed {len(cdrs)} new CDRs for tenant {tenant.company_name}")

        except Exception as e:
            logger.error(f"Error polling for tenant {tenant.id}: {e}", exc_info=True)

    def poll_all_tenants(self):
        """
        Poll CloudUCM for all active tenants
        """
        with app.app_context():
            try:
                # Get all active tenants
                tenants = Tenant.query.filter_by(is_active=True).all()

                logger.info(f"🔄 Starting CDR poll for {len(tenants)} tenants")

                for tenant in tenants:
                    self.poll_for_tenant(tenant)

                logger.info("✅ CDR poll completed")

            except Exception as e:
                logger.error(f"Error in poll_all_tenants: {e}", exc_info=True)

# Global poller instance
poller = CDRPoller()

def run_poller():
    """
    Run the polling scheduler in background thread
    """
    # Schedule polling every N minutes (from env var)
    schedule.every(CDR_POLL_INTERVAL).minutes.do(poller.poll_all_tenants)

    logger.info(f"🚀 CDR Poller started - checking every {CDR_POLL_INTERVAL} minutes")

    # Run first poll immediately
    poller.poll_all_tenants()

    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(10)

def start_poller_thread():
    """
    Start the poller in a background thread
    """
    thread = threading.Thread(target=run_poller, daemon=True)
    thread.start()
    logger.info("📡 CDR Polling service started in background")

if __name__ == "__main__":
    # For standalone testing
    run_poller()
