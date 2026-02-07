#!/usr/bin/env python3
"""
CloudUCM Recording Scraper
Uses Playwright to login to CloudUCM web interface and download recordings
Runs as a background worker on Render.com
"""
import os
import sys
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from pydub import AudioSegment

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, CDRRecord, Transcription, Tenant
from supabase_storage import get_storage_manager

# Configuration
SCRAPER_INTERVAL = int(os.getenv('SCRAPER_INTERVAL', '900'))  # 15 minutes default
DOWNLOAD_DIR = os.getenv('DOWNLOAD_DIR', '/tmp/ucm_recordings')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UCMRecordingScraper:
    """Scrapes recordings from CloudUCM web interface"""

    def __init__(self, tenant=None):
        """
        Initialize scraper for a specific tenant
        If tenant is None, uses environment variables (backward compatibility)
        """
        if tenant:
            # Multi-tenant mode: use tenant's UCM credentials
            self.tenant_id = tenant.id
            self.tenant_name = tenant.company_name
            self.ucm_url = f"https://{tenant.pbx_ip}:{tenant.pbx_port}" if tenant.pbx_ip else None
            self.username = tenant.pbx_username
            self.password = tenant.pbx_password
        else:
            # Single tenant mode: use environment variables
            self.tenant_id = 1  # Default tenant
            self.tenant_name = "Default"
            self.ucm_url = os.getenv('UCM_URL', 'https://071ffb.c.myucm.cloud:8443')
            self.username = os.getenv('UCM_USERNAME', 'admin1')
            self.password = os.getenv('UCM_PASSWORD', 'BotMakers@2026')

        self.download_dir = Path(DOWNLOAD_DIR)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self.storage_manager = get_storage_manager()

    def scrape_recordings(self):
        """Main scraping function"""
        logger.info("=" * 70)
        logger.info(f"Starting CloudUCM recording scraper for tenant: {self.tenant_name} (ID: {self.tenant_id})")
        logger.info(f"UCM URL: {self.ucm_url}")
        logger.info(f"Download dir: {self.download_dir}")
        logger.info("=" * 70)

        # Validate credentials
        if not self.ucm_url or not self.username or not self.password:
            logger.error(f"Missing UCM credentials for tenant {self.tenant_name}. Skipping.")
            logger.error(f"  URL: {self.ucm_url}, Username: {self.username}, Password: {'SET' if self.password else 'NOT SET'}")
            return

        try:
            with sync_playwright() as p:
                # Launch browser (headless in production)
                logger.info("Launching browser...")
                browser = p.chromium.launch(
                    headless=True,  # No GUI
                    args=['--no-sandbox', '--disable-setuid-sandbox']  # For Docker/Render
                )

                context = browser.new_context(
                    accept_downloads=True,
                    ignore_https_errors=True  # CloudUCM uses self-signed cert
                )

                page = context.new_page()

                # Step 1: Login
                logger.info("Navigating to CloudUCM login...")
                page.goto(self.ucm_url, timeout=30000)

                # Wait for login page to load
                logger.info("Waiting for login form...")
                page.wait_for_selector('input[id="username"]', timeout=10000)

                # Fill in credentials
                logger.info("Entering credentials...")
                page.fill('input[id="username"]', self.username)
                page.fill('input[id="password"]', self.password)

                # Click login button
                logger.info("Clicking login...")
                page.click('button[type="submit"]')

                # Wait for dashboard to load
                logger.info("Waiting for dashboard...")
                page.wait_for_load_state('networkidle', timeout=30000)
                page.wait_for_timeout(5000)  # Wait for React to render

                # Step 2: Navigate to CDR/Recordings page
                logger.info("Expanding CDR menu...")
                page.locator('li.ant-menu-submenu:has-text("CDR")').first.click()
                page.wait_for_timeout(2000)  # Wait for submenu animation

                logger.info("Clicking Recordings submenu...")
                page.locator('li[role="menuitem"]:has-text("Recordings")').click()
                page.wait_for_load_state('networkidle', timeout=15000)
                page.wait_for_timeout(5000)  # Wait for table to load

                # Step 3: Scrape ALL rows from the recordings table
                # Table structure: Checkbox | Caller | Callee | Call Time | Size | Play | Options
                rows = page.locator('tbody tr')
                row_count = rows.count()
                logger.info(f"Found {row_count} recordings on page")

                if row_count == 0:
                    logger.info("No recordings found on page")
                    browser.close()
                    return

                # Step 4: Process each row - create CDR if needed, download recording
                downloaded_count = 0
                with app.app_context():
                    for i in range(row_count):
                        try:
                            row = rows.nth(i)

                            # Extract call data from table cells
                            caller = row.locator('td').nth(1).text_content().strip()
                            callee = row.locator('td').nth(2).text_content().strip()
                            call_time_str = row.locator('td').nth(3).text_content().strip()  # "2026-02-06 16:21:36"

                            logger.info(f"Processing row {i+1}/{row_count}: {caller} → {callee} at {call_time_str}")

                            # Parse call time
                            call_datetime = datetime.strptime(call_time_str, '%Y-%m-%d %H:%M:%S')

                            # Create unique ID from call time and caller/callee
                            uniqueid = f"{int(call_datetime.timestamp())}.{caller[-4:]}"

                            # Check if CDR already exists
                            existing_cdr = CDRRecord.query.filter_by(
                                tenant_id=self.tenant_id,
                                src=caller,
                                dst=callee,
                                call_date=call_datetime
                            ).first()

                            if existing_cdr:
                                # Check if already has recording
                                if existing_cdr.recording_local_path:
                                    logger.info(f"  ✓ CDR exists and has recording - skipping")
                                    continue
                                else:
                                    logger.info(f"  ✓ CDR exists but needs recording")
                                    call = existing_cdr
                            else:
                                # Create new CDR record from recordings page data
                                logger.info(f"  Creating new CDR record...")
                                call = CDRRecord(
                                    tenant_id=self.tenant_id,
                                    uniqueid=uniqueid,
                                    src=caller,
                                    dst=callee,
                                    call_date=call_datetime,
                                    disposition='ANSWERED',  # We know it was answered if there's a recording
                                    duration=0,  # Will be calculated from recording
                                    billsec=0,
                                    received_at=datetime.utcnow()
                                )
                                db.session.add(call)
                                db.session.commit()
                                logger.info(f"  ✓ Created CDR record with ID: {call.id}")

                            # Download the recording
                            download_button = row.locator('span.sprite-download')

                            if download_button.count() > 0:
                                logger.info("  Downloading recording...")

                                # Set up download listener
                                with page.expect_download(timeout=30000) as download_info:
                                    download_button.click()

                                download = download_info.value
                                logger.info(f"  ✓ Download started: {download.suggested_filename}")

                                # Save the downloaded file
                                local_filename = f"{call.uniqueid}_{download.suggested_filename}"
                                local_path = self.download_dir / local_filename
                                download.save_as(str(local_path))
                                logger.info(f"  ✓ Saved to: {local_path}")

                                # Process the downloaded file (upload to Supabase)
                                if self.process_downloaded_file(local_path, call):
                                    downloaded_count += 1
                                    logger.info(f"  ✓ Successfully processed recording")
                                else:
                                    logger.error(f"  Failed to process downloaded file")

                            else:
                                logger.warning(f"  No download button found in row")

                        except Exception as e:
                            logger.error(f"Error processing row {i+1}: {e}", exc_info=True)
                            continue

                logger.info(f"✓ Downloaded {downloaded_count} recordings successfully")

                browser.close()
                logger.info("Browser closed")

        except Exception as e:
            logger.error(f"Scraping error: {e}", exc_info=True)

    def process_downloaded_file(self, file_path: Path, call: CDRRecord):
        """Upload downloaded recording to Supabase and update database"""
        try:
            logger.info(f"Processing downloaded file: {file_path}")

            if not self.storage_manager:
                logger.error("Supabase storage not configured")
                return False

            # Convert WAV to MP3 to reduce file size AND extract duration
            mp3_path = file_path.with_suffix('.mp3')
            audio_duration_seconds = 0

            try:
                logger.info(f"Converting {file_path.name} to MP3...")
                audio = AudioSegment.from_file(str(file_path))

                # Get duration in seconds
                audio_duration_seconds = int(len(audio) / 1000)
                logger.info(f"Audio duration: {audio_duration_seconds} seconds")

                # Export as MP3 with good quality (128 kbps)
                audio.export(
                    str(mp3_path),
                    format="mp3",
                    bitrate="128k",
                    parameters=["-q:a", "2"]  # VBR quality (0=best, 9=worst)
                )

                original_size = file_path.stat().st_size / (1024 * 1024)  # MB
                mp3_size = mp3_path.stat().st_size / (1024 * 1024)  # MB
                compression_ratio = ((original_size - mp3_size) / original_size) * 100

                logger.info(f"✓ Converted to MP3: {original_size:.2f}MB → {mp3_size:.2f}MB (saved {compression_ratio:.1f}%)")

                # Delete original WAV file
                file_path.unlink()
                logger.info(f"Deleted original WAV file: {file_path}")

                # Use MP3 file for upload
                file_path = mp3_path

            except Exception as e:
                logger.error(f"Failed to convert to MP3: {e}. Using original file.")
                # If conversion fails, use original WAV file
                if mp3_path.exists():
                    mp3_path.unlink()

            # Upload to Supabase
            remote_path = f"tenant_{call.tenant_id}/{call.uniqueid}_{file_path.name}"

            logger.info(f"Uploading to Supabase: {remote_path}")
            supabase_path = self.storage_manager.upload_recording(str(file_path), remote_path)

            if supabase_path:
                # Update database
                with app.app_context():
                    call.recording_local_path = supabase_path
                    call.recording_downloaded = True

                    # Update duration if we extracted it from the audio
                    if audio_duration_seconds > 0:
                        call.duration = audio_duration_seconds
                        call.billsec = audio_duration_seconds
                        logger.info(f"Updated call duration: {audio_duration_seconds}s")

                    db.session.commit()

                    logger.info(f"✅ Updated database with Supabase path: {supabase_path}")

                    # Trigger AI processing if not already done
                    if not Transcription.query.filter_by(cdr_id=call.id).first():
                        logger.info(f"Triggering AI processing for call {call.id}")
                        from app import process_call_ai_async
                        process_call_ai_async(call.id, supabase_path)

                # Clean up local file
                file_path.unlink()
                logger.info(f"Cleaned up local file: {file_path}")

                return True
            else:
                logger.error("Failed to upload to Supabase")
                return False

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}", exc_info=True)
            return False


def run_scraper_loop():
    """Main loop - runs continuously, processing all active tenants"""
    logger.info("=" * 70)
    logger.info("UCM RECORDING SCRAPER STARTED (MULTI-TENANT)")
    logger.info(f"Interval: {SCRAPER_INTERVAL} seconds ({SCRAPER_INTERVAL/60:.0f} minutes)")
    logger.info("=" * 70)

    iteration = 0
    while True:
        iteration += 1
        logger.info(f"\n{'=' * 70}")
        logger.info(f"ITERATION #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'=' * 70}")

        try:
            with app.app_context():
                # Get all active tenants with UCM configured
                tenants = Tenant.query.filter_by(
                    is_active=True,
                    phone_system_type='grandstream_ucm'
                ).all()

                logger.info(f"Found {len(tenants)} active tenants with UCM configured")

                if not tenants:
                    logger.warning("No active tenants found. Waiting for next iteration...")
                else:
                    # Process each tenant
                    for tenant in tenants:
                        logger.info(f"\n{'─' * 70}")
                        logger.info(f"Processing tenant: {tenant.company_name} (ID: {tenant.id})")
                        logger.info(f"{'─' * 70}")

                        try:
                            scraper = UCMRecordingScraper(tenant=tenant)
                            scraper.scrape_recordings()
                        except Exception as e:
                            logger.error(f"Error processing tenant {tenant.company_name}: {e}", exc_info=True)
                            continue  # Continue to next tenant

        except Exception as e:
            logger.error(f"Error in scraper loop: {e}", exc_info=True)

        # Wait before next iteration
        logger.info(f"\n{'=' * 70}")
        logger.info(f"Completed iteration #{iteration}")
        logger.info(f"Sleeping for {SCRAPER_INTERVAL} seconds ({SCRAPER_INTERVAL/60:.0f} minutes)...")
        logger.info(f"{'=' * 70}")
        time.sleep(SCRAPER_INTERVAL)


if __name__ == "__main__":
    # Check environment
    logger.info("Environment check:")
    logger.info(f"  UCM_URL: {UCM_URL}")
    logger.info(f"  UCM_USERNAME: {UCM_USERNAME}")
    logger.info(f"  UCM_PASSWORD: {'SET' if UCM_PASSWORD else 'NOT SET'}")
    logger.info(f"  DATABASE_URL: {'SET' if os.getenv('DATABASE_URL') else 'NOT SET'}")
    logger.info(f"  SUPABASE_URL: {'SET' if os.getenv('SUPABASE_URL') else 'NOT SET'}")

    # Run the scraper
    run_scraper_loop()
