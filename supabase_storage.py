"""
Supabase Storage Manager for Call Recordings
Handles upload, download, and management of call recordings in Supabase Storage
"""

import os
import logging
from pathlib import Path
from typing import Optional
from datetime import timedelta

logger = logging.getLogger(__name__)

# Workaround for httpx proxy parameter TypeError
# supabase 2.3.4 passes 'proxy' to httpx.Client but some httpx versions don't support it
try:
    import httpx
    _original_client_init = httpx.Client.__init__

    def _patched_client_init(self, *args, **kwargs):
        # Remove proxy parameter if httpx doesn't support it
        if 'proxy' in kwargs:
            try:
                # Test if proxy parameter is accepted
                import inspect
                sig = inspect.signature(_original_client_init)
                if 'proxy' not in sig.parameters:
                    logger.warning("Removing unsupported 'proxy' parameter from httpx.Client")
                    kwargs.pop('proxy')
            except:
                pass
        return _original_client_init(self, *args, **kwargs)

    httpx.Client.__init__ = _patched_client_init
    logger.info("Applied httpx.Client proxy parameter patch")
except Exception as e:
    logger.warning(f"Failed to apply httpx patch: {e}")

from supabase import create_client, Client

class SupabaseStorageManager:
    """Manages call recordings in Supabase Storage"""

    def __init__(self, supabase_url: str, supabase_key: str, bucket_name: str = 'call-recordings'):
        """
        Initialize Supabase Storage Manager

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase API key (anon/service role)
            bucket_name: Name of the storage bucket
        """
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.bucket_name = bucket_name
        self.client: Client = create_client(supabase_url, supabase_key)

        logger.info(f"Initialized Supabase Storage Manager for bucket: {bucket_name}")

    def upload_recording(self, local_file_path: str, remote_file_name: str) -> Optional[str]:
        """
        Upload a recording file to Supabase Storage

        Args:
            local_file_path: Path to local file
            remote_file_name: Desired name in storage (e.g., "tenant_1/call_123.wav")

        Returns:
            Public URL of uploaded file, or None if failed
        """
        try:
            # Check if file exists locally
            if not os.path.exists(local_file_path):
                logger.error(f"Local file not found: {local_file_path}")
                return None

            # Read file content
            with open(local_file_path, 'rb') as f:
                file_data = f.read()

            # Determine MIME type
            mime_type = self._get_mime_type(local_file_path)

            # Upload to Supabase Storage
            logger.info(f"Uploading {local_file_path} to {self.bucket_name}/{remote_file_name}")

            result = self.client.storage.from_(self.bucket_name).upload(
                path=remote_file_name,
                file=file_data,
                file_options={"content-type": mime_type, "upsert": "true"}
            )

            # Get public URL (will require signed URL for private buckets)
            public_url = self.get_signed_url(remote_file_name)

            logger.info(f"✅ Uploaded recording: {remote_file_name}")
            return remote_file_name  # Return the path in storage

        except Exception as e:
            logger.error(f"Failed to upload recording {local_file_path}: {e}", exc_info=True)
            return None

    def download_recording(self, remote_file_name: str, local_file_path: str) -> Optional[str]:
        """
        Download a recording from Supabase Storage to local filesystem

        Args:
            remote_file_name: File path in storage
            local_file_path: Where to save locally

        Returns:
            Local file path if successful, None otherwise
        """
        try:
            logger.info(f"Downloading {remote_file_name} from Supabase Storage")

            # Download file data
            file_data = self.client.storage.from_(self.bucket_name).download(remote_file_name)

            # Ensure directory exists
            Path(local_file_path).parent.mkdir(parents=True, exist_ok=True)

            # Write to local file
            with open(local_file_path, 'wb') as f:
                f.write(file_data)

            logger.info(f"✅ Downloaded recording to: {local_file_path}")
            return local_file_path

        except Exception as e:
            logger.error(f"Failed to download recording {remote_file_name}: {e}", exc_info=True)
            return None

    def get_signed_url(self, remote_file_name: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get a signed URL for accessing a private recording

        Args:
            remote_file_name: File path in storage
            expires_in: URL expiration time in seconds (default 1 hour)

        Returns:
            Signed URL or None if failed
        """
        try:
            result = self.client.storage.from_(self.bucket_name).create_signed_url(
                remote_file_name,
                expires_in
            )

            # The result is a dict with 'signedURL' key
            if isinstance(result, dict) and 'signedURL' in result:
                return result['signedURL']
            elif isinstance(result, dict) and 'signedUrl' in result:
                return result['signedUrl']
            else:
                return result

        except Exception as e:
            logger.error(f"Failed to create signed URL for {remote_file_name}: {e}")
            return None

    def delete_recording(self, remote_file_name: str) -> bool:
        """
        Delete a recording from Supabase Storage

        Args:
            remote_file_name: File path in storage

        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.storage.from_(self.bucket_name).remove([remote_file_name])
            logger.info(f"✅ Deleted recording: {remote_file_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete recording {remote_file_name}: {e}")
            return False

    def list_recordings(self, folder: str = "") -> list:
        """
        List recordings in a folder

        Args:
            folder: Folder path (e.g., "tenant_1/")

        Returns:
            List of file objects
        """
        try:
            files = self.client.storage.from_(self.bucket_name).list(folder)
            return files

        except Exception as e:
            logger.error(f"Failed to list recordings in {folder}: {e}")
            return []

    def _get_mime_type(self, file_path: str) -> str:
        """Determine MIME type from file extension"""
        ext = Path(file_path).suffix.lower()
        mime_types = {
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
        }
        return mime_types.get(ext, 'audio/mpeg')


# Global instance (initialized in app.py)
storage_manager: Optional[SupabaseStorageManager] = None


def init_storage_manager(supabase_url: str, supabase_key: str, bucket_name: str = 'call-recordings'):
    """Initialize the global storage manager"""
    global storage_manager
    storage_manager = SupabaseStorageManager(supabase_url, supabase_key, bucket_name)
    return storage_manager


def get_storage_manager() -> Optional[SupabaseStorageManager]:
    """Get the global storage manager instance"""
    return storage_manager
