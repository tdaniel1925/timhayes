"""
UCM Recording Downloader with Supabase Storage Integration
Downloads recordings from Grandstream UCM and uploads to Supabase Storage
"""

import os
import logging
import hashlib
import requests
from pathlib import Path
from typing import Optional
from urllib.parse import quote
import tempfile

logger = logging.getLogger(__name__)


class UCMRecordingDownloader:
    """Downloads recording files from Grandstream UCM via HTTPS API"""

    def __init__(self, ucm_ip: str, username: str, password: str, port: int = 8089):
        self.ucm_ip = ucm_ip
        self.username = username
        self.password = password
        self.port = port
        self.session = None
        self.authenticated = False

    def authenticate(self) -> bool:
        """Authenticate with UCM HTTPS API"""
        try:
            self.session = requests.Session()
            base_url = f"https://{self.ucm_ip}:{self.port}/api"

            # Step 1: Get challenge
            challenge_request = {
                "request": {
                    "action": "challenge",
                    "user": self.username,
                    "version": "1.0"
                }
            }

            response = self.session.post(base_url, json=challenge_request, verify=False, timeout=10)
            response.raise_for_status()
            challenge = response.json()['response']['challenge']

            # Step 2: Login with token
            token = hashlib.md5((challenge + self.password).encode()).hexdigest()
            login_request = {
                "request": {
                    "action": "login",
                    "token": token,
                    "user": self.username
                }
            }

            login_response = self.session.post(base_url, json=login_request, verify=False, timeout=10)
            login_response.raise_for_status()

            self.authenticated = True
            logger.info(f"Authenticated with UCM as {self.username}")
            return True

        except Exception as e:
            logger.error(f"UCM authentication failed: {e}")
            return False

    def download_recording(self, recording_path: str, local_path: str) -> Optional[str]:
        """
        Download recording file from UCM

        Args:
            recording_path: Path on UCM server (from CDR recordfiles field)
            local_path: Where to save the file locally

        Returns:
            Local file path if successful, None otherwise
        """
        if not recording_path or recording_path == "":
            logger.info("No recording file path provided")
            return None

        # Ensure directory exists
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)

        # Check if already downloaded
        if os.path.exists(local_path):
            logger.info(f"Recording already exists: {local_path}")
            return local_path

        # Try direct HTTPS download (UCM may expose recordings via web interface)
        try:
            # Common UCM recording paths
            download_urls = [
                f"https://{self.ucm_ip}:{self.port}/recordings{recording_path}",
                f"https://{self.ucm_ip}:{self.port}{recording_path}",
                f"https://{self.ucm_ip}/cdrapi/recording?file={quote(recording_path)}"
            ]

            for url in download_urls:
                try:
                    logger.info(f"Attempting download from: {url}")
                    response = requests.get(
                        url,
                        auth=(self.username, self.password),
                        verify=False,
                        timeout=30
                    )

                    if response.status_code == 200:
                        # Save to local file
                        with open(local_path, 'wb') as f:
                            f.write(response.content)

                        logger.info(f"✅ Downloaded recording to: {local_path}")
                        return local_path

                except Exception as url_error:
                    logger.debug(f"Failed to download from {url}: {url_error}")
                    continue

            logger.warning(f"Could not download recording from any URL")
            return None

        except Exception as e:
            logger.error(f"Recording download failed: {e}", exc_info=True)
            return None


def download_and_upload_recording(
    ucm_ip: str,
    ucm_username: str,
    ucm_password: str,
    recording_path: str,
    tenant_id: int,
    uniqueid: str,
    storage_manager
) -> Optional[str]:
    """
    Download recording from UCM and upload to Supabase Storage

    Args:
        ucm_ip: UCM IP address
        ucm_username: UCM username
        ucm_password: UCM password
        recording_path: Path on UCM server
        tenant_id: Tenant ID for organizing storage
        uniqueid: Call unique ID
        storage_manager: SupabaseStorageManager instance

    Returns:
        Supabase storage path if successful, None otherwise
    """
    try:
        # Create UCM downloader
        downloader = UCMRecordingDownloader(ucm_ip, ucm_username, ucm_password)

        # Create temporary file for download
        filename = Path(recording_path).name
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, f"{uniqueid}_{filename}")

        # Download from UCM
        logger.info(f"Downloading recording for call {uniqueid}")
        downloaded_path = downloader.download_recording(recording_path, local_path)

        if not downloaded_path:
            logger.error(f"Failed to download recording for call {uniqueid}")
            return None

        # Upload to Supabase Storage
        if storage_manager:
            # Organize by tenant: tenant_1/uniqueid_filename.wav
            remote_path = f"tenant_{tenant_id}/{uniqueid}_{filename}"

            logger.info(f"Uploading recording to Supabase: {remote_path}")
            supabase_path = storage_manager.upload_recording(downloaded_path, remote_path)

            # Clean up local temp file
            try:
                os.remove(downloaded_path)
                logger.debug(f"Cleaned up temp file: {downloaded_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temp file: {cleanup_error}")

            return supabase_path

        else:
            logger.warning("Supabase Storage not configured - keeping local recording")
            return downloaded_path

    except Exception as e:
        logger.error(f"Error in download_and_upload_recording: {e}", exc_info=True)
        return None


def get_recording_for_transcription(
    storage_path: str,
    storage_manager,
    tenant_id: int = None
) -> Optional[str]:
    """
    Get recording file for transcription (downloads from Supabase if needed)

    Args:
        storage_path: Path in Supabase Storage or local filesystem
        storage_manager: SupabaseStorageManager instance
        tenant_id: Tenant ID (for organizing downloads)

    Returns:
        Local file path ready for transcription, or None if failed
    """
    try:
        # If it's already a local file, return it
        if os.path.exists(storage_path):
            return storage_path

        # If it's a Supabase path, download temporarily
        if storage_manager and storage_path.startswith('tenant_'):
            temp_dir = tempfile.gettempdir()
            filename = Path(storage_path).name
            local_path = os.path.join(temp_dir, filename)

            logger.info(f"Downloading recording from Supabase for transcription: {storage_path}")
            downloaded = storage_manager.download_recording(storage_path, local_path)

            if downloaded:
                return downloaded
            else:
                logger.error(f"Failed to download recording from Supabase: {storage_path}")
                return None

        logger.warning(f"Recording not found: {storage_path}")
        return None

    except Exception as e:
        logger.error(f"Error getting recording for transcription: {e}", exc_info=True)
        return None
