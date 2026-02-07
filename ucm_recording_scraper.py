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

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, CDRRecord, Transcription
from supabase_storage import get_storage_manager

# Configuration
UCM_URL = os.getenv('UCM_URL', 'https://071ffb.c.myucm.cloud:8443')
UCM_USERNAME = os.getenv('UCM_USERNAME', 'admin1')
UCM_PASSWORD = os.getenv('UCM_PASSWORD', 'BotMakers@2026')
SCRAPER_INTERVAL = int(os.getenv('SCRAPER_INTERVAL', '300'))  # 5 minutes default
DOWNLOAD_DIR = os.getenv('DOWNLOAD_DIR', '/tmp/ucm_recordings')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UCMRecordingScraper:
    """Scrapes recordings from CloudUCM web interface"""

    def __init__(self):
        self.ucm_url = UCM_URL
        self.username = UCM_USERNAME
        self.password = UCM_PASSWORD
        self.download_dir = Path(DOWNLOAD_DIR)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self.storage_manager = get_storage_manager()

    def scrape_recordings(self):
        """Main scraping function"""
        logger.info("=" * 70)
        logger.info("Starting CloudUCM recording scraper")
        logger.info(f"UCM URL: {self.ucm_url}")
        logger.info(f"Download dir: {self.download_dir}")
        logger.info("=" * 70)

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

                # Step 3: Get list of calls that need recordings downloaded
                with app.app_context():
                    # Find CDRs that have recording paths but no Supabase storage path
                    calls_needing_recordings = CDRRecord.query.filter(
                        CDRRecord.recordfiles.isnot(None),
                        CDRRecord.recordfiles != '',
                        db.or_(
                            CDRRecord.supabase_path.is_(None),
                            CDRRecord.supabase_path == ''
                        )
                    ).order_by(CDRRecord.created_at.desc()).limit(50).all()

                    logger.info(f"Found {len(calls_needing_recordings)} calls needing recordings")

                    if not calls_needing_recordings:
                        logger.info("No recordings to download at this time")
                        browser.close()
                        return

                    # Step 4: Download recordings
                    downloaded_count = 0
                    for call in calls_needing_recordings:
                        try:
                            logger.info(f"Processing call {call.uniqueid} (Caller: {call.src}, Callee: {call.dst})")

                            # Format call time to match CloudUCM display format: "2026-02-06 16:21:36"
                            call_time_str = call.calldate.strftime('%Y-%m-%d %H:%M:%S') if call.calldate else None

                            if not call_time_str:
                                logger.warning(f"Call {call.uniqueid} has no calldate, skipping")
                                continue

                            logger.info(f"Looking for call at time: {call_time_str}")

                            # Find the table row that matches this call
                            # Table structure: Checkbox | Caller | Callee | Call Time | Size | Play | Options
                            row_found = False

                            # Get all rows and check each one
                            rows = page.locator('tbody tr')
                            row_count = rows.count()
                            logger.info(f"Checking {row_count} rows on current page")

                            for i in range(row_count):
                                row = rows.nth(i)

                                # Get the call time from the 4th cell (index 3)
                                call_time_cell = row.locator('td').nth(3)
                                row_call_time = call_time_cell.text_content().strip()

                                # Also get caller and callee for verification
                                caller_cell = row.locator('td').nth(1)
                                callee_cell = row.locator('td').nth(2)
                                row_caller = caller_cell.text_content().strip()
                                row_callee = callee_cell.text_content().strip()

                                # Match by call time (most reliable)
                                if row_call_time == call_time_str:
                                    logger.info(f"✓ Found matching row: Caller={row_caller}, Callee={row_callee}, Time={row_call_time}")
                                    row_found = True

                                    # Click the download button in this row
                                    # The download icon is in the last cell (Options column)
                                    # It's a <span class="sprite sprite-download">
                                    download_button = row.locator('span.sprite-download')

                                    if download_button.count() > 0:
                                        logger.info("Clicking download button...")

                                        # Set up download listener
                                        with page.expect_download(timeout=30000) as download_info:
                                            download_button.click()

                                        download = download_info.value
                                        logger.info(f"✓ Download started: {download.suggested_filename}")

                                        # Save the downloaded file
                                        local_filename = f"{call.uniqueid}_{download.suggested_filename}"
                                        local_path = self.download_dir / local_filename
                                        download.save_as(str(local_path))
                                        logger.info(f"✓ Saved to: {local_path}")

                                        # Process the downloaded file (upload to Supabase)
                                        if self.process_downloaded_file(local_path, call):
                                            downloaded_count += 1
                                            logger.info(f"✓ Successfully processed recording for call {call.uniqueid}")
                                        else:
                                            logger.error(f"Failed to process downloaded file for call {call.uniqueid}")

                                    else:
                                        logger.warning(f"No download button found in row for call {call.uniqueid}")

                                    break  # Found and processed this call, move to next

                            if not row_found:
                                logger.warning(f"Could not find row for call {call.uniqueid} with time {call_time_str}")
                                logger.warning("Recording might be on a different page or not yet available")

                        except Exception as e:
                            logger.error(f"Error processing call {call.uniqueid}: {e}", exc_info=True)
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

            # Upload to Supabase
            remote_path = f"tenant_{call.tenant_id}/{call.uniqueid}_{file_path.name}"

            logger.info(f"Uploading to Supabase: {remote_path}")
            supabase_path = self.storage_manager.upload_recording(str(file_path), remote_path)

            if supabase_path:
                # Update database
                with app.app_context():
                    call.supabase_path = supabase_path
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
    """Main loop - runs continuously"""
    scraper = UCMRecordingScraper()

    logger.info("=" * 70)
    logger.info("UCM RECORDING SCRAPER STARTED")
    logger.info(f"Interval: {SCRAPER_INTERVAL} seconds")
    logger.info("=" * 70)

    iteration = 0
    while True:
        iteration += 1
        logger.info(f"\n{'=' * 70}")
        logger.info(f"ITERATION #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'=' * 70}")

        try:
            scraper.scrape_recordings()
        except Exception as e:
            logger.error(f"Error in scraper loop: {e}", exc_info=True)

        # Wait before next iteration
        logger.info(f"Sleeping for {SCRAPER_INTERVAL} seconds...")
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
