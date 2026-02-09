"""
UCM API Downloader - Uses RECAPI for Individual Recording Downloads
Downloads standard RIFF WAV files (not GSFF) via UCM API
"""
import requests
import hashlib
import logging
import os
from typing import Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class UCMAPIDownloader:
    """Downloads recordings from Grandstream UCM via RECAPI"""

    def __init__(self, ucm_url: str, username: str, password: str):
        """
        Initialize UCM API Downloader

        Args:
            ucm_url: UCM base URL (e.g., https://071ffb.c.myucm.cloud:8443)
            username: API username (usually 'cdrapi')
            password: API password
        """
        self.ucm_url = ucm_url
        self.username = username
        self.password = password
        self.session_cookie = None
        self.cookie_expires = None

        # Disable SSL warnings for self-signed certificates
        requests.packages.urllib3.disable_warnings()

        logger.info(f"Initialized UCM API Downloader: {ucm_url}, user: {username}")

    def authenticate(self) -> bool:
        """
        Authenticate with UCM API and get session cookie

        Returns:
            True if authentication successful, False otherwise
        """
        try:
            # Step 1: Challenge
            logger.info("Requesting challenge from UCM API...")
            response = requests.post(
                f"{self.ucm_url}/api",
                json={
                    "request": {
                        "action": "challenge",
                        "user": self.username,
                        "version": "1.0"
                    }
                },
                verify=False,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"Challenge request failed: {response.status_code}")
                return False

            data = response.json()
            if 'response' not in data or 'challenge' not in data['response']:
                logger.error(f"Invalid challenge response: {data}")
                return False

            challenge = data['response']['challenge']
            logger.info(f"Received challenge: {challenge}")

            # Step 2: Create token (MD5 of challenge + password)
            token = hashlib.md5(f"{challenge}{self.password}".encode()).hexdigest()

            # Step 3: Login
            logger.info("Sending login request...")
            response = requests.post(
                f"{self.ucm_url}/api",
                json={
                    "request": {
                        "action": "login",
                        "user": self.username,
                        "token": token
                    }
                },
                verify=False,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"Login request failed: {response.status_code}")
                return False

            data = response.json()
            if 'response' not in data or 'cookie' not in data['response']:
                logger.error(f"Login failed: {data}")
                return False

            self.session_cookie = data['response']['cookie']
            self.cookie_expires = datetime.now() + timedelta(hours=1)  # Assume 1 hour validity

            logger.info(f"✅ Authentication successful! Cookie: {self.session_cookie}")
            return True

        except Exception as e:
            logger.error(f"Authentication error: {e}", exc_info=True)
            return False

    def is_authenticated(self) -> bool:
        """Check if we have a valid session cookie"""
        if not self.session_cookie:
            return False
        if self.cookie_expires and datetime.now() >= self.cookie_expires:
            logger.info("Session cookie expired")
            return False
        return True

    def download_recording(self, filename: str, output_path: str) -> Optional[str]:
        """
        Download a recording file from UCM

        Args:
            filename: Recording filename from CDR (can be just filename or full path)
                     Examples: "auto-1770401677-1000-2815058290.wav"
                              "2026-02/auto-1770401677-1000-2815058290.wav"
            output_path: Where to save the downloaded file

        Returns:
            Output path if successful, None otherwise
        """
        try:
            # Ensure authenticated
            if not self.is_authenticated():
                logger.info("Not authenticated, authenticating now...")
                if not self.authenticate():
                    logger.error("Authentication failed")
                    return None

            # Parse filename to extract directory and filename
            # Format: "2026-02/auto-xxx.wav" or just "auto-xxx.wav"
            if '/' in filename:
                parts = filename.split('/')
                filedir = '/'.join(parts[:-1])  # Everything except last part
                just_filename = parts[-1]  # Last part
            else:
                filedir = "monitor"  # Default directory
                just_filename = filename

            logger.info(f"Downloading recording: {filename}")
            logger.info(f"   filedir: {filedir}")
            logger.info(f"   filename: {just_filename}")

            response = requests.post(
                f"{self.ucm_url}/api",
                json={
                    "request": {
                        "action": "recapi",
                        "cookie": self.session_cookie,
                        "filedir": filedir,
                        "filename": just_filename
                    }
                },
                verify=False,
                timeout=120  # Longer timeout for large files
            )

            if response.status_code != 200:
                logger.error(f"Download request failed: {response.status_code}")
                return None

            # Check if it's JSON error or binary audio
            content_type = response.headers.get('Content-Type', '')

            if 'application/json' in content_type:
                # Error response
                error_data = response.json()
                logger.error(f"RECAPI error: {error_data}")
                return None

            # Save binary audio file
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(response.content)

            file_size = os.path.getsize(output_path)
            logger.info(f"✅ Downloaded recording: {output_path} ({file_size:,} bytes)")

            # Verify it's a valid WAV file
            with open(output_path, 'rb') as f:
                header = f.read(4)
                if header == b'RIFF':
                    logger.info("✅ Valid RIFF WAV file")
                elif header == b'GSFF':
                    logger.warning("⚠️ GSFF format file (will need conversion)")
                else:
                    logger.warning(f"⚠️ Unknown format: {header.hex()}")

            return output_path

        except Exception as e:
            logger.error(f"Download error for {filename}: {e}", exc_info=True)
            return None


# Global instance
_ucm_downloader: Optional[UCMAPIDownloader] = None


def init_ucm_api_downloader(ucm_url: str, username: str = "cdrapi", password: str = None):
    """Initialize the global UCM API downloader"""
    global _ucm_downloader
    _ucm_downloader = UCMAPIDownloader(ucm_url, username, password)
    return _ucm_downloader


def get_ucm_api_downloader() -> Optional[UCMAPIDownloader]:
    """Get the global UCM API downloader instance"""
    return _ucm_downloader


if __name__ == "__main__":
    # Test the downloader
    import sys
    import codecs
    from dotenv import load_dotenv

    # Fix Windows encoding
    if sys.platform == 'win32':
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

    load_dotenv()

    UCM_URL = f"https://{os.environ.get('UCM_IP')}:{os.environ.get('UCM_PORT', '8443')}"
    PASSWORD = os.environ.get('UCM_PASSWORD')

    downloader = UCMAPIDownloader(UCM_URL, "cdrapi", PASSWORD)

    # Authenticate
    if downloader.authenticate():
        print("✅ Authentication successful!")

        # Test download
        test_file = "auto-1770401677-1000-2815058290.wav"
        output = f"C:\\tmp\\ucm_api_test_{test_file}"

        result = downloader.download_recording(test_file, output)

        if result:
            print(f"✅ Download successful: {result}")
        else:
            print("❌ Download failed")
    else:
        print("❌ Authentication failed")
