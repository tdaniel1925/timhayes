"""
Test UCM RECAPI for Individual Recording Downloads
Uses the authentication + recapi method provided by Grandstream support
"""
import requests
import hashlib
import json
import os
import sys
import codecs
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

# Configuration
UCM_URL = os.environ.get('UCM_IP', '071ffb.c.myucm.cloud')
UCM_PORT = os.environ.get('UCM_PORT', '8443')
UCM_USERNAME = os.environ.get('UCM_USERNAME', 'admin1')
UCM_PASSWORD = os.environ.get('UCM_PASSWORD')
UCM_BASE_URL = f"https://{UCM_URL}:{UCM_PORT}"

# Test recording filename (from support example)
TEST_FILENAME = "auto-1770401677-1000-2815058290.wav"

print("=" * 70)
print("Testing UCM RECAPI - Individual Recording Download")
print("=" * 70)
print(f"UCM URL: {UCM_BASE_URL}")
print(f"Username: {UCM_USERNAME}")
print(f"Test File: {TEST_FILENAME}")
print()

# Disable SSL warnings for self-signed certificates
requests.packages.urllib3.disable_warnings()

def authenticate():
    """Authenticate with UCM API and get session cookie"""
    print("[1] Sending challenge request...")

    # Step 1: Challenge
    challenge_payload = {
        "request": {
            "action": "challenge",
            "user": UCM_USERNAME,  # Use actual admin username
            "version": "1.0"
        }
    }

    response = requests.post(
        f"{UCM_BASE_URL}/api",
        json=challenge_payload,
        verify=False,
        timeout=30
    )

    print(f"    Response: {response.status_code}")
    challenge_data = response.json()
    print(f"    Challenge data: {json.dumps(challenge_data, indent=2)}")

    if 'response' not in challenge_data or 'challenge' not in challenge_data['response']:
        print("    ❌ Challenge failed!")
        return None

    challenge = challenge_data['response']['challenge']
    print(f"    ✅ Challenge: {challenge}")

    # Step 2: Create token (MD5 of challenge + password)
    print("\n[2] Creating authentication token...")
    token = hashlib.md5(f"{challenge}{UCM_PASSWORD}".encode()).hexdigest()
    print(f"    Token: {token}")

    # Step 3: Login
    print("\n[3] Sending login request...")
    login_payload = {
        "request": {
            "action": "login",
            "user": UCM_USERNAME,  # Use actual admin username
            "token": token
        }
    }

    response = requests.post(
        f"{UCM_BASE_URL}/api",
        json=login_payload,
        verify=False,
        timeout=30
    )

    print(f"    Response: {response.status_code}")
    login_data = response.json()
    print(f"    Login data: {json.dumps(login_data, indent=2)}")

    if 'response' not in login_data or 'cookie' not in login_data['response']:
        print("    ❌ Login failed!")
        return None

    cookie = login_data['response']['cookie']
    print(f"    ✅ Cookie: {cookie}")

    return cookie


def download_recording(cookie, filename):
    """Download recording using recapi endpoint"""
    print(f"\n[4] Downloading recording: {filename}")

    # Format from Grandstream support
    recapi_payload = {
        "request": {
            "action": "recapi",
            "cookie": cookie,
            "filedir": "monitor",
            "filename": filename
        }
    }

    print(f"    Request payload:")
    print(f"    {json.dumps(recapi_payload, indent=6)}")

    response = requests.post(
        f"{UCM_BASE_URL}/api",
        json=recapi_payload,
        verify=False,
        timeout=60
    )

    print(f"    Response status: {response.status_code}")
    print(f"    Response headers: {dict(response.headers)}")
    print(f"    Response size: {len(response.content)} bytes")

    # Check if it's JSON error or binary audio
    content_type = response.headers.get('Content-Type', '')

    if 'application/json' in content_type:
        # Error response
        print(f"    Response JSON: {response.json()}")
        return None
    else:
        # Binary audio file
        print(f"    ✅ Received binary data!")

        # Check first 4 bytes for WAV header
        header = response.content[:4]
        print(f"    First 4 bytes: {header.hex()} ({header})")

        if header == b'RIFF':
            print(f"    ✅ Valid RIFF WAV file!")
        elif header == b'GSFF':
            print(f"    ⚠️  GSFF format (Grandstream proprietary)")
        else:
            print(f"    ❓ Unknown format")

        # Save to file
        output_path = f"C:\\tmp\\recapi_test_{filename}"
        os.makedirs("C:\\tmp", exist_ok=True)

        with open(output_path, 'wb') as f:
            f.write(response.content)

        print(f"    💾 Saved to: {output_path}")

        return output_path


# Main flow
try:
    cookie = authenticate()

    if cookie:
        result = download_recording(cookie, TEST_FILENAME)

        if result:
            print("\n" + "=" * 70)
            print("✅ SUCCESS! RECAPI download works!")
            print("=" * 70)
            print(f"Downloaded file: {result}")
            print("\nNext steps:")
            print("1. Update scraper to use recapi instead of 'Download All'")
            print("2. Loop through CDR records and download each recording individually")
            print("3. This will get proper WAV files instead of GSFF in TGZ")
        else:
            print("\n❌ Download failed - file may not exist on UCM")
    else:
        print("\n❌ Authentication failed")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
