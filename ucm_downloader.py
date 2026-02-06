"""
UCM Recording Downloader with Supabase Storage Integration
Downloads recordings from Grandstream UCM using proper API authentication
"""

import os
import logging
import hashlib
import requests
from pathlib import Path
from typing import Optional
from urllib.parse import quote, urlencode
import tempfile
import warnings

# Disable SSL warnings for self-signed certificates
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

logger = logging.getLogger(__name__)


class UCMRecordingDownloader:
    """Downloads recording files from Grandstream UCM via authenticated API"""

    def __init__(self, ucm_ip: str, username: str, password: str, port: int = 8443):
        self.ucm_ip = ucm_ip
        self.username = username
        self.password = password
        self.port = port
        self.cookie = None
        self.session = requests.Session()

    def _md5(self, text: str) -> str:
        """Generate MD5 hash of text"""
        return hashlib.md5(text.encode()).hexdigest()

    def authenticate(self) -> bool:
        """
        Authenticate with UCM API using challenge-response authentication

        Returns:
            True if authentication successful, False otherwise
        """
        try:
            base_url = f"https://{self.ucm_ip}:{self.port}/api"

            logger.info(f"🔐 Authenticating with UCM at {self.ucm_ip}:{self.port}")

            # Step 1: Get challenge
            challenge_request = {
                "request": {
                    "action": "challenge",
                    "user": self.username,
                    "version": "1.0"
                }
            }

            logger.info(f"   Step 1: Requesting challenge for user '{self.username}'")
            response = self.session.post(
                base_url,
                json=challenge_request,
                verify=False,
                timeout=10
            )
            response.raise_for_status()

            response_data = response.json()
            if 'response' not in response_data or 'challenge' not in response_data['response']:
                logger.error(f"   Invalid challenge response: {response_data}")
                return False

            challenge = response_data['response']['challenge']
            logger.info(f"   Challenge received: {challenge[:20]}...")

            # Step 2: Login with hashed token
            # Token = MD5(challenge + password) - direct concatenation
            token = self._md5(challenge + self.password)

            login_request = {
                "request": {
                    "action": "login",
                    "token": token,
                    "user": self.username
                }
            }

            logger.info(f"   Step 2: Logging in with token")
            login_response = self.session.post(
                base_url,
                json=login_request,
                verify=False,
                timeout=10
            )
            login_response.raise_for_status()

            login_data = login_response.json()
            if 'response' not in login_data:
                logger.error(f"   Invalid login response: {login_data}")
                return False

            # Check if login successful (status 0 means success, cookie is returned)
            if login_data.get('status') == 0 and 'cookie' in login_data['response']:
                # Successful login
                self.cookie = login_data['response']['cookie']
                logger.info(f"   ✅ Authentication successful! Cookie: {self.cookie[:20]}...")
                return True
            else:
                logger.error(f"   Login failed: {login_data}")
                return False

        except requests.exceptions.Timeout:
            logger.error(f"   ❌ Timeout connecting to UCM at {self.ucm_ip}:{self.port}")
            return False
        except requests.exceptions.ConnectionError as e:
            logger.error(f"   ❌ Cannot connect to UCM at {self.ucm_ip}:{self.port}: {e}")
            return False
        except Exception as e:
            logger.error(f"   ❌ UCM authentication failed: {e}", exc_info=True)
            return False

    def download_recording(self, recording_path: str, local_path: str) -> Optional[str]:
        """
        Download recording file from UCM using authenticated API

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

        # Clean recording path - UCM sometimes appends @ to indicate server/partition
        original_path = recording_path
        recording_path = recording_path.rstrip('@').rstrip()

        if original_path != recording_path:
            logger.info(f"   Cleaned recording path: '{original_path}' -> '{recording_path}'")

        # Authenticate if not already authenticated
        if not self.cookie:
            logger.info("   Not authenticated, attempting authentication...")
            if not self.authenticate():
                logger.error("   Cannot download recording - authentication failed")
                return None

        try:
            # Use UCM recapi endpoint to download recording
            # Format: /recapi?cookie={cookie}&filename={file}
            # According to Grandstream UCM API documentation:
            # - Example shows: /recapi?filename=auto-1414771234-1000-1004.wav (just filename, no path)
            # - CDR provides paths like "2026-02/auto-xxx.wav@"
            # - Extract just the filename part (after the last /)

            # Extract just the filename (last part after /)
            parts = recording_path.split('/')
            filename = parts[-1]  # e.g., "auto-1770401677-1000-2815058290.wav"

            base_url = f"https://{self.ucm_ip}:{self.port}/recapi"

            # Use just the filename, not the full path
            params = {
                "cookie": self.cookie,
                "filename": filename
            }

            download_url = f"{base_url}?{urlencode(params)}"

            logger.info(f"🔽 Downloading recording from UCM recapi")
            logger.info(f"   Original recording path: {original_path}")
            logger.info(f"   Extracted filename: '{filename}'")
            logger.info(f"   URL: /recapi?cookie=***&filename={filename}")

            response = self.session.get(
                download_url,
                verify=False,
                timeout=60,  # Longer timeout for large recordings
                stream=True
            )

            logger.info(f"   Response status: {response.status_code}")
            logger.info(f"   Content-Type: {response.headers.get('Content-Type', 'unknown')}")

            if response.status_code == 200:
                # Check if we got audio data
                content_length = int(response.headers.get('Content-Length', 0))

                if content_length == 0:
                    # Try to download and measure
                    content = response.content
                    content_length = len(content)
                else:
                    content = response.content

                logger.info(f"   Content length: {content_length} bytes")

                if content_length < 100:
                    logger.warning(f"   Response too small ({content_length} bytes), probably not a recording")
                    logger.warning(f"   Response preview: {content[:200]}")
                    return None

                # Check content type
                content_type = response.headers.get('Content-Type', '')

                # Reject HTML responses (error pages)
                if 'text/html' in content_type:
                    logger.error(f"   ❌ UCM returned HTML error page instead of audio file")
                    logger.error(f"   Content-Type: {content_type}")
                    logger.error(f"   This usually means the file was not found at the specified path")
                    logger.error(f"   Response preview: {content[:500].decode('utf-8', errors='ignore')}")
                    return None

                if 'audio' not in content_type and 'octet-stream' not in content_type and content_length > 100:
                    # Might still be valid - UCM sometimes doesn't set proper content-type
                    logger.warning(f"   Unexpected content-type: {content_type}, but size looks good")

                # Save to local file
                with open(local_path, 'wb') as f:
                    f.write(content)

                logger.info(f"   ✅ Downloaded recording to: {local_path} ({content_length} bytes)")
                return local_path

            elif response.status_code == 401:
                logger.error(f"   ❌ Authentication expired, cookie invalid")
                self.cookie = None
                return None
            elif response.status_code == 404:
                logger.error(f"   ❌ Recording not found on UCM: {recording_path}")
                return None
            else:
                logger.error(f"   ❌ HTTP {response.status_code}: {response.text[:200]}")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"   ❌ Timeout downloading recording from UCM")
            return None
        except Exception as e:
            logger.error(f"   ❌ Recording download failed: {e}", exc_info=True)
            return None


def download_and_upload_recording(
    ucm_ip: str,
    ucm_username: str,
    ucm_password: str,
    recording_path: str,
    tenant_id: int,
    uniqueid: str,
    storage_manager,
    ucm_port: int = 8089
) -> Optional[str]:
    """
    Download recording from UCM and upload to Supabase Storage

    Args:
        ucm_ip: UCM IP address or hostname
        ucm_username: UCM username
        ucm_password: UCM password
        recording_path: Path on UCM server
        tenant_id: Tenant ID for organizing storage
        uniqueid: Call unique ID
        storage_manager: SupabaseStorageManager instance
        ucm_port: UCM HTTPS port (default 8089)

    Returns:
        Supabase storage path if successful, None otherwise
    """
    try:
        logger.info(f"📥 Starting download_and_upload_recording")
        logger.info(f"   UCM: {ucm_ip}:{ucm_port}")
        logger.info(f"   User: {ucm_username}")
        logger.info(f"   Recording Path: {recording_path}")
        logger.info(f"   Tenant ID: {tenant_id}")
        logger.info(f"   Unique ID: {uniqueid}")

        # Create UCM downloader
        downloader = UCMRecordingDownloader(ucm_ip, ucm_username, ucm_password, ucm_port)

        # Create temporary file for download
        filename = Path(recording_path).name.rstrip('@')  # Remove @ from filename
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, f"{uniqueid}_{filename}")

        logger.info(f"📂 Temporary download path: {local_path}")

        # Download from UCM
        logger.info(f"🔽 Attempting to download recording for call {uniqueid}")
        downloaded_path = downloader.download_recording(recording_path, local_path)

        if not downloaded_path:
            logger.error(f"❌ Failed to download recording for call {uniqueid}")
            logger.error(f"   Possible reasons:")
            logger.error(f"   1. UCM credentials are incorrect")
            logger.error(f"   2. Recording not found at path: {recording_path}")
            logger.error(f"   3. Network connectivity issues")
            logger.error(f"   4. UCM not accessible at {ucm_ip}:{ucm_port}")
            return None

        # Upload to Supabase Storage
        if storage_manager:
            # Organize by tenant: tenant_1/uniqueid_filename.wav
            remote_path = f"tenant_{tenant_id}/{uniqueid}_{filename}"

            logger.info(f"☁️  Uploading recording to Supabase: {remote_path}")
            supabase_path = storage_manager.upload_recording(downloaded_path, remote_path)

            # Clean up local temp file
            try:
                os.remove(downloaded_path)
                logger.debug(f"   Cleaned up temp file: {downloaded_path}")
            except Exception as cleanup_error:
                logger.warning(f"   Failed to clean up temp file: {cleanup_error}")

            if supabase_path:
                logger.info(f"   ✅ Recording uploaded successfully: {supabase_path}")
            else:
                logger.error(f"   ❌ Failed to upload recording to Supabase")

            return supabase_path

        else:
            logger.warning("⚠️  Supabase Storage not configured - keeping local recording")
            return downloaded_path

    except Exception as e:
        logger.error(f"❌ Error in download_and_upload_recording: {e}", exc_info=True)
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
