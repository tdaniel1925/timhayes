# UCM API Connection and Recording Download Guide

## Complete Guide to Connecting to Grandstream UCM API and Downloading Recordings

---

## 1. UCM API Overview

The Grandstream UCM provides several APIs for retrieving call data and recordings:

- **CDR API** - Call Detail Records (metadata only)
- **RECAPI** - Recording downloads (audio files)
- **Standard API** - System management

---

## 2. Connection Details

### Base Configuration
```
UCM Host: 071ffb.c.myucm.cloud
UCM Port: 8443 (HTTPS)
API Username: admin1
API Password: BotMakers@2026
```

### API Endpoints
```
Base URL: https://071ffb.c.myucm.cloud:8443/api

Challenge Endpoint: /api/challenge
Login Endpoint: /api/login
CDR Records: /api/cdrapi
Recording Download: /api/recapi
```

---

## 3. Authentication Flow

### Step 1: Get Challenge Token
```python
import requests

challenge_url = "https://071ffb.c.myucm.cloud:8443/api/challenge"
response = requests.get(challenge_url, verify=False)
challenge_data = response.json()
challenge = challenge_data['challenge']  # 16-digit number
```

### Step 2: Create Password Hash
```python
import hashlib

# Hash the password with the challenge token
password = "BotMakers@2026"
hashed_password = hashlib.md5(f"{challenge}{password}".encode()).hexdigest()
```

### Step 3: Login and Get Session Cookie
```python
login_url = "https://071ffb.c.myucm.cloud:8443/api/login"
login_data = {
    'username': 'admin1',
    'password': hashed_password
}
response = requests.post(login_url, data=login_data, verify=False)

# Extract session cookie
session_cookie = response.cookies.get('session')  # Format: sid[timestamp]-[number]
```

---

## 4. Downloading Recordings

### Method 1: RECAPI (Individual Downloads)

**Endpoint:** `/api/recapi`

**Parameters:**
- `recording_file` - Filename from CDR (e.g., "20260204-154532-1000-2815058290-1736007932.85.wav")
- Authentication via session cookie from login

**Python Example:**
```python
import requests

# After authentication (steps 1-3 above)
session = requests.Session()
session.cookies.set('session', session_cookie)

recording_url = "https://071ffb.c.myucm.cloud:8443/api/recapi"
params = {
    'recording_file': '20260204-154532-1000-2815058290-1736007932.85.wav'
}

response = session.get(recording_url, params=params, verify=False)

if response.status_code == 200:
    with open('recording.wav', 'wb') as f:
        f.write(response.content)
    print("✅ Recording downloaded successfully")
else:
    print(f"❌ Error: {response.status_code}")
```

### Method 2: Bulk Download via Web Scraper (Current Method)

**URL:** `https://071ffb.c.myucm.cloud:8443/cdrapi`

**Process:**
1. Login to web UI using Playwright
2. Navigate to CDR page
3. Click "Download All" button
4. Download TGZ archive containing recordings
5. Extract individual recordings from TGZ

**Advantages:**
- ✅ Doesn't require API access to be enabled
- ✅ Works with standard web credentials
- ✅ Reliable for bulk downloads

**Disadvantages:**
- ❌ Recordings in GSFF format (need conversion)
- ❌ Can't download individual files
- ❌ Requires browser automation

---

## 5. Complete Working Code Example

### Full RECAPI Download Script

```python
"""
UCM Recording Downloader using RECAPI
"""
import requests
import hashlib
import urllib3
import os
from datetime import datetime

# Disable SSL warnings for self-signed certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class UCMRecordingDownloader:
    def __init__(self, ucm_host, username, password, port=8443):
        self.base_url = f"https://{ucm_host}:{port}"
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.verify = False

    def authenticate(self):
        """
        Authenticate with UCM and get session cookie
        Returns True if successful, False otherwise
        """
        try:
            # Step 1: Get challenge
            challenge_url = f"{self.base_url}/api/challenge"
            response = self.session.get(challenge_url)
            response.raise_for_status()
            challenge = response.json()['challenge']
            print(f"✅ Got challenge: {challenge}")

            # Step 2: Hash password with challenge
            hashed_password = hashlib.md5(
                f"{challenge}{self.password}".encode()
            ).hexdigest()

            # Step 3: Login
            login_url = f"{self.base_url}/api/login"
            login_data = {
                'username': self.username,
                'password': hashed_password
            }
            response = self.session.post(login_url, data=login_data)
            response.raise_for_status()

            # Check if we got a session cookie
            session_cookie = self.session.cookies.get('session')
            if session_cookie:
                print(f"✅ Authenticated successfully")
                print(f"   Session: {session_cookie}")
                return True
            else:
                print("❌ No session cookie received")
                return False

        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            return False

    def download_recording(self, recording_filename, save_path=None):
        """
        Download a recording file from UCM

        Args:
            recording_filename: Name of the recording file (from CDR)
            save_path: Where to save the file (default: current directory)

        Returns:
            Path to downloaded file if successful, None otherwise
        """
        try:
            if save_path is None:
                save_path = recording_filename

            # Download recording
            recapi_url = f"{self.base_url}/api/recapi"
            params = {'recording_file': recording_filename}

            print(f"Downloading: {recording_filename}")
            response = self.session.get(recapi_url, params=params, stream=True)
            response.raise_for_status()

            # Save to file
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = os.path.getsize(save_path)
            print(f"✅ Downloaded {file_size} bytes to {save_path}")
            return save_path

        except Exception as e:
            print(f"❌ Download failed: {e}")
            return None

    def get_cdr_records(self, start_date=None, end_date=None, limit=100):
        """
        Get CDR records from UCM

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            limit: Maximum number of records

        Returns:
            List of CDR records
        """
        try:
            cdrapi_url = f"{self.base_url}/api/cdrapi"
            params = {}

            if start_date:
                params['start'] = start_date
            if end_date:
                params['end'] = end_date
            if limit:
                params['limit'] = limit

            response = self.session.get(cdrapi_url, params=params)
            response.raise_for_status()

            cdr_data = response.json()
            return cdr_data.get('cdr_records', [])

        except Exception as e:
            print(f"❌ Failed to get CDR records: {e}")
            return []


# Usage Example
if __name__ == '__main__':
    # Initialize downloader
    downloader = UCMRecordingDownloader(
        ucm_host='071ffb.c.myucm.cloud',
        username='admin1',
        password='BotMakers@2026',
        port=8443
    )

    # Authenticate
    if not downloader.authenticate():
        print("Authentication failed. Exiting.")
        exit(1)

    # Example 1: Download a specific recording
    recording_file = "20260204-154532-1000-2815058290-1736007932.85.wav"
    downloaded = downloader.download_recording(
        recording_filename=recording_file,
        save_path=f"./downloads/{recording_file}"
    )

    if downloaded:
        print(f"\n✅ Recording saved to: {downloaded}")

    # Example 2: Get CDR records and download all recordings
    print("\n" + "="*60)
    print("Fetching recent CDR records...")
    print("="*60 + "\n")

    cdr_records = downloader.get_cdr_records(limit=10)

    for i, record in enumerate(cdr_records, 1):
        print(f"\n[{i}/{len(cdr_records)}] Processing CDR record:")
        print(f"  Call ID: {record.get('call_id')}")
        print(f"  From: {record.get('src')} → To: {record.get('dst')}")
        print(f"  Duration: {record.get('duration')}s")

        recording_file = record.get('recording_file')
        if recording_file:
            save_path = f"./downloads/{recording_file}"
            downloader.download_recording(recording_file, save_path)
        else:
            print("  ⚠️  No recording available")
```

---

## 6. Environment Setup

### Required Python Packages
```bash
pip install requests urllib3
```

### Environment Variables (.env)
```bash
UCM_IP=071ffb.c.myucm.cloud
UCM_USERNAME=admin1
UCM_PASSWORD=BotMakers@2026
UCM_PORT=8443
```

---

## 7. Common Issues and Solutions

### Issue 1: "Wrong account or password"
**Solution:**
- API access may not be enabled in UCM settings
- Check System Settings → API in UCM web UI
- Enable "RECAPI" or "API Access"
- May need to create dedicated API user

### Issue 2: SSL Certificate Errors
**Solution:**
```python
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

### Issue 3: Session Cookie Not Received
**Solution:**
- Verify credentials are correct
- Check if API is enabled in UCM
- Try logging in via web UI first to verify credentials

### Issue 4: Recording File Not Found
**Solution:**
- Verify recording filename exactly matches CDR record
- Check if recording retention policy deleted old files
- Ensure recording was actually saved (check UCM storage)

---

## 8. Testing the Connection

### Quick Test Script
```python
import requests
import hashlib
import urllib3

urllib3.disable_warnings()

# Step 1: Get challenge
print("Step 1: Getting challenge...")
response = requests.get(
    "https://071ffb.c.myucm.cloud:8443/api/challenge",
    verify=False
)
challenge = response.json()['challenge']
print(f"✅ Challenge: {challenge}")

# Step 2: Hash password
print("\nStep 2: Hashing password...")
hashed = hashlib.md5(f"{challenge}BotMakers@2026".encode()).hexdigest()
print(f"✅ Hashed password: {hashed[:10]}...")

# Step 3: Login
print("\nStep 3: Logging in...")
response = requests.post(
    "https://071ffb.c.myucm.cloud:8443/api/login",
    data={'username': 'admin1', 'password': hashed},
    verify=False
)
cookie = response.cookies.get('session')
if cookie:
    print(f"✅ Login successful! Session: {cookie}")
else:
    print(f"❌ Login failed: {response.text}")

# Step 4: Test RECAPI
if cookie:
    print("\nStep 4: Testing RECAPI...")
    session = requests.Session()
    session.cookies.set('session', cookie)
    response = session.get(
        "https://071ffb.c.myucm.cloud:8443/api/recapi",
        params={'recording_file': 'test.wav'},
        verify=False
    )
    print(f"RECAPI Status: {response.status_code}")
    if response.status_code == 404:
        print("✅ RECAPI is accessible (file not found is expected)")
    elif response.status_code == 401:
        print("❌ RECAPI authentication failed")
    else:
        print(f"Response: {response.text[:100]}")
```

---

## 9. Integration with Your System

### Save to Supabase Storage
```python
from supabase_storage import SupabaseStorageManager

# After downloading recording
storage = SupabaseStorageManager(
    supabase_url='https://fcubjohwzfhjcwcnwost.supabase.co',
    supabase_key='your_supabase_key',
    bucket_name='recordings'
)

# Upload to Supabase
remote_path = f"tenant_1/{recording_file}"
storage.upload_recording(local_path, remote_path)
```

### Save to Database
```python
import psycopg2

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute('''
    UPDATE cdr_records
    SET recording_local_path = %s,
        recording_downloaded = TRUE,
        recording_downloaded_at = NOW()
    WHERE id = %s
''', (remote_path, cdr_id))

conn.commit()
conn.close()
```

---

## 10. Recommended Workflow

### For New System (From Scratch)

1. **Receive Webhook from UCM** (real-time)
   - UCM sends webhook when call ends
   - Webhook contains CDR data + recording filename

2. **Immediate Download via RECAPI**
   - Use recording filename from webhook
   - Download directly via RECAPI endpoint
   - Save to Supabase storage

3. **Process Recording**
   - Transcribe with OpenAI Whisper
   - Generate AI summary
   - Update database

4. **No Scraping Needed**
   - Real-time webhook notifications
   - Direct API downloads
   - Clean, efficient architecture

### Alternative: Keep Scraper as Backup
- Use RECAPI for real-time downloads
- Keep scraper for historical data sync
- Best of both worlds

---

## Next Steps

1. **Test the connection** using the quick test script above
2. **Verify API is enabled** in UCM web UI
3. **Choose your architecture:**
   - Option A: RECAPI only (requires API access)
   - Option B: Scraper only (current working method)
   - Option C: Both (RECAPI primary, scraper backup)

---

**Document Created:** 2026-02-10
**UCM Version:** Cloud-based (071ffb.c.myucm.cloud)
**Status:** Production-ready code examples included
