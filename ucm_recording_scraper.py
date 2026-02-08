#!/usr/bin/env python3
"""
CloudUCM Recording Scraper
Uses UCM API to download recordings - NO web scraping!
Runs as a background worker on Render.com
"""
import os
import sys
import time
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from pydub import AudioSegment

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, CDRRecord, Transcription, Tenant
from supabase_storage import get_storage_manager

# Configuration
SCRAPER_INTERVAL = int(os.getenv('SCRAPER_INTERVAL', '900'))  # 15 minutes default
DOWNLOAD_DIR = os.getenv('DOWNLOAD_DIR', '/tmp/ucm_recordings')
MAX_RECORDINGS_PER_ITERATION = 20  # Limit recordings to prevent overwhelming UCM
RATE_LIMIT_DELAY_SECONDS = 3  # Delay between downloads to avoid overwhelming UCM

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UCMRecordingScraper:
    """Downloads recordings using UCM API"""

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
        """Main scraping function - downloads recordings using UCM API"""
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
            # Use database + API downloads instead of web scraping
            from ucm_downloader import UCMRecordingDownloader

            logger.info("Querying database for calls needing recordings...")
            with app.app_context():
                # Get calls with recording paths but not downloaded yet
                calls_needing_recordings = CDRRecord.query.filter(
                    CDRRecord.tenant_id == self.tenant_id,
                    CDRRecord.recordfiles.isnot(None),
                    CDRRecord.recordfiles != '',
                    CDRRecord.recording_local_path.is_(None)
                ).order_by(CDRRecord.id.desc()).limit(MAX_RECORDINGS_PER_ITERATION).all()

                logger.info(f"Found {len(calls_needing_recordings)} calls needing recordings")

                if len(calls_needing_recordings) == 0:
                    logger.info("No recordings to download")
                    return

                # Extract IP and port from UCM URL
                url_match = re.match(r'https?://([^:]+):?(\d+)?', self.ucm_url)
                if url_match:
                    ucm_ip = url_match.group(1)
                    ucm_port = int(url_match.group(2)) if url_match.group(2) else 8443
                else:
                    logger.error(f"Invalid UCM URL format: {self.ucm_url}")
                    return

                # Create API downloader
                logger.info(f"Creating UCM API downloader for {ucm_ip}:{ucm_port}")
                downloader = UCMRecordingDownloader(ucm_ip, self.username, self.password, ucm_port)

                # Authenticate once
                logger.info("Authenticating with UCM API...")
                if not downloader.authenticate():
                    logger.error("❌ Failed to authenticate with UCM API")
                    return

                logger.info("✅ Authentication successful")

                # Download each recording
                downloaded_count = 0
                for i, call in enumerate(calls_needing_recordings):
                    try:
                        logger.info(f"Processing call {i+1}/{len(calls_needing_recordings)}: ID={call.id}, {call.src} → {call.dst}")
                        logger.info(f"  Recording path: {call.recordfiles}")

                        # Create local filename
                        filename = Path(call.recordfiles).name.rstrip('@')
                        local_filename = f"{call.uniqueid}_{filename}"
                        local_path = self.download_dir / local_filename

                        # Download using API
                        logger.info(f"  Downloading via UCM API...")
                        downloaded_path = downloader.download_recording(call.recordfiles, str(local_path))

                        if downloaded_path:
                            logger.info(f"  ✅ Downloaded: {downloaded_path}")

                            # Process the downloaded file (upload to Supabase)
                            if self.process_downloaded_file(Path(downloaded_path), call):
                                downloaded_count += 1
                                logger.info(f"  ✅ Successfully processed recording")

                                # Rate limiting: delay between downloads
                                if i < len(calls_needing_recordings) - 1:
                                    logger.info(f"  ⏸️  Waiting {RATE_LIMIT_DELAY_SECONDS}s before next download...")
                                    time.sleep(RATE_LIMIT_DELAY_SECONDS)
                            else:
                                logger.error(f"  ❌ Failed to process downloaded file")
                        else:
                            logger.error(f"  ❌ Failed to download recording")

                    except Exception as e:
                        logger.error(f"Error processing call {call.id}: {e}", exc_info=True)
                        continue

                logger.info(f"✅ Downloaded {downloaded_count} recordings successfully")

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

                # Skip recordings under 30 seconds (not worth storing/transcribing)
                if audio_duration_seconds < 30:
                    logger.info(f"⏭️  Skipping recording under 30s (only {audio_duration_seconds}s)")
                    file_path.unlink()  # Delete file
                    if mp3_path.exists():
                        mp3_path.unlink()
                    return False

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
                # Update database - re-query the call to ensure it's in current session
                with app.app_context():
                    call_record = CDRRecord.query.get(call.id)
                    if call_record:
                        call_record.recording_local_path = supabase_path
                        call_record.recording_downloaded = True

                        # Update duration if we extracted it from the audio
                        if audio_duration_seconds > 0:
                            call_record.duration = audio_duration_seconds
                            call_record.billsec = audio_duration_seconds
                            logger.info(f"Updated call duration: {audio_duration_seconds}s")

                        db.session.commit()

                        logger.info(f"✅ Updated database with Supabase path: {supabase_path}")

                        # Trigger AI processing if not already done
                        if not Transcription.query.filter_by(cdr_id=call_record.id).first():
                            logger.info(f"Triggering AI processing for call {call_record.id}")
                            from app import process_call_ai_async
                            process_call_ai_async(call_record.id, supabase_path)

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
    logger.info(f"  DATABASE_URL: {'SET' if os.getenv('DATABASE_URL') else 'NOT SET'}")
    logger.info(f"  SUPABASE_URL: {'SET' if os.getenv('SUPABASE_URL') else 'NOT SET'}")
    logger.info(f"  SCRAPER_INTERVAL: {SCRAPER_INTERVAL} seconds")
    logger.info(f"  Mode: Multi-tenant (credentials from database)")

    # Run the scraper
    run_scraper_loop()
