#!/usr/bin/env python3
"""
Test CloudUCM Login and Webhook Connectivity

Usage:
    python test_ucm_webhook.py [clouducm_password]

If password not provided, will skip CloudUCM login test
"""
import requests
import json
from datetime import datetime
import sys

# Configuration
CLOUDUCM_URL = "https://071ffb.c.myucm.cloud:8443"
CLOUDUCM_USERNAME = "admin"  # Change if needed
CLOUDUCM_PASSWORD = sys.argv[1] if len(sys.argv) > 1 else None

# Webhook Configuration
WEBHOOK_URL = "https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany"
WEBHOOK_USERNAME = "testco_webhook"
WEBHOOK_PASSWORD = "TestWebhook123!"

# API Configuration
API_URL = "https://audiapro-backend.onrender.com/api"
TENANT_EMAIL = "admin@testcompany.com"
TENANT_PASSWORD = "TestPass123!"

def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def print_success(text):
    """Print success message"""
    print(f"[OK] {text}")

def print_error(text):
    """Print error message"""
    print(f"[FAIL] {text}")

def print_info(text):
    """Print info message"""
    print(f"[INFO] {text}")

def test_clouducm_login():
    """Test CloudUCM login"""
    print_header("TEST 1: CloudUCM Login")

    try:
        print_info(f"Attempting to connect to: {CLOUDUCM_URL}")
        print_info(f"Username: {CLOUDUCM_USERNAME}")

        # Try to access the UCM web interface
        response = requests.get(
            CLOUDUCM_URL,
            auth=(CLOUDUCM_USERNAME, CLOUDUCM_PASSWORD),
            verify=False,  # CloudUCM uses self-signed cert
            timeout=10
        )

        if response.status_code == 200:
            print_success("Successfully connected to CloudUCM!")
            print_success(f"HTTP Status: {response.status_code}")
            return True
        elif response.status_code == 401:
            print_error("Authentication failed - Invalid username or password")
            print_info("Please check your CloudUCM credentials")
            return False
        else:
            print_error(f"Unexpected response: {response.status_code}")
            return False

    except requests.exceptions.SSLError as e:
        print_error(f"SSL Error: {e}")
        print_info("This is normal for CloudUCM with self-signed certificates")
        print_info("The connection is still secure, just self-signed")
        # Try again without SSL verification
        try:
            response = requests.get(
                CLOUDUCM_URL,
                auth=(CLOUDUCM_USERNAME, CLOUDUCM_PASSWORD),
                verify=False,
                timeout=10
            )
            if response.status_code in [200, 302]:
                print_success("Connected successfully (bypassing SSL verification)")
                return True
        except Exception as e2:
            print_error(f"Still failed: {e2}")
            return False

    except requests.exceptions.Timeout:
        print_error("Connection timeout - CloudUCM not responding")
        print_info("Check if CloudUCM URL is correct and accessible")
        return False

    except requests.exceptions.ConnectionError as e:
        print_error(f"Connection error: {e}")
        print_info("Check if CloudUCM URL is correct")
        return False

    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return False

def test_webhook_connectivity():
    """Test webhook endpoint connectivity"""
    print_header("TEST 2: Webhook Connectivity")

    try:
        print_info(f"Testing webhook: {WEBHOOK_URL}")

        # Create a test CDR payload
        test_cdr = {
            "uniqueid": f"test-{datetime.now().timestamp()}",
            "src": "1001",
            "dst": "1002",
            "duration": 60,
            "billsec": 55,
            "disposition": "ANSWERED",
            "start": datetime.now().isoformat(),
            "answer": datetime.now().isoformat(),
            "end": datetime.now().isoformat(),
            "caller_name": "Test Call",
            "clid": "Test User <1001>"
        }

        print_info("Sending test CDR...")
        print_info(f"Payload: {json.dumps(test_cdr, indent=2)}")

        response = requests.post(
            WEBHOOK_URL,
            json=test_cdr,
            auth=(WEBHOOK_USERNAME, WEBHOOK_PASSWORD),
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print_info(f"Response Status: {response.status_code}")
        print_info(f"Response Body: {response.text}")

        if response.status_code == 200:
            print_success("Webhook accepted the test CDR!")
            response_data = response.json()
            if response_data.get('status') == 'success':
                print_success("CDR processed successfully")
                return True, test_cdr['uniqueid']
            else:
                print_error(f"Webhook response: {response_data}")
                return False, None

        elif response.status_code == 401:
            print_error("Authentication failed - Invalid webhook credentials")
            print_info(f"Username used: {WEBHOOK_USERNAME}")
            print_info("Check webhook username and password")
            return False, None

        elif response.status_code == 404:
            print_error("Webhook endpoint not found")
            print_info("Check subdomain in webhook URL")
            return False, None

        else:
            print_error(f"Unexpected status code: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None

    except requests.exceptions.Timeout:
        print_error("Webhook request timeout")
        print_info("Backend may be slow or unresponsive")
        return False, None

    except requests.exceptions.ConnectionError as e:
        print_error(f"Connection error: {e}")
        print_info("Check if backend is running")
        return False, None

    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_api_login():
    """Test API login to verify backend is working"""
    print_header("TEST 3: Backend API Login")

    try:
        print_info(f"Logging in to: {API_URL}/auth/login")
        print_info(f"Email: {TENANT_EMAIL}")

        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": TENANT_EMAIL,
                "password": TENANT_PASSWORD
            },
            timeout=30
        )

        print_info(f"Response Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                print_success("Login successful!")
                print_success("Access token received")
                return True, data['access_token']
            else:
                print_error("No access token in response")
                return False, None
        elif response.status_code == 401:
            print_error("Login failed - Invalid credentials")
            print_error(f"Response: {response.text}")
            return False, None
        else:
            print_error(f"Unexpected status: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None

    except Exception as e:
        print_error(f"Login error: {e}")
        return False, None

def verify_call_in_dashboard(access_token, uniqueid):
    """Verify the test call appears in the dashboard"""
    print_header("TEST 4: Verify Call in Dashboard")

    try:
        print_info("Fetching recent calls from dashboard...")

        response = requests.get(
            f"{API_URL}/calls?limit=10",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            calls = data.get('calls', [])

            print_success(f"Found {len(calls)} recent calls")

            # Look for our test call
            test_call = None
            for call in calls:
                if call.get('uniqueid') == uniqueid:
                    test_call = call
                    break

            if test_call:
                print_success("Test call found in dashboard!")
                print_success(f"Call ID: {test_call.get('id')}")
                print_success(f"From: {test_call.get('src')} → To: {test_call.get('dst')}")
                print_success(f"Duration: {test_call.get('duration')} seconds")
                print_success(f"Status: {test_call.get('disposition')}")
                return True
            else:
                print_error("Test call NOT found in dashboard")
                print_info("This might take a few seconds to appear...")
                return False
        else:
            print_error(f"Failed to fetch calls: {response.status_code}")
            return False

    except Exception as e:
        print_error(f"Error fetching calls: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("  CloudUCM & Webhook Integration Test Suite")
    print("="*70)
    print()
    print("This will test:")
    print("  1. CloudUCM login credentials (SKIPPED if no password provided)")
    print("  2. Webhook connectivity and authentication")
    print("  3. Backend API login")
    print("  4. Call data verification in dashboard")
    print()

    if not CLOUDUCM_PASSWORD:
        print_info("CloudUCM password not provided - skipping CloudUCM login test")
        print_info("To test CloudUCM login, run: python test_ucm_webhook.py YOUR_PASSWORD")
        print()

    # Disable SSL warnings for self-signed certs
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    results = {
        'clouducm_login': None,  # None means skipped
        'webhook_test': False,
        'api_login': False,
        'call_verification': False
    }

    # Test 1: CloudUCM Login (optional)
    if CLOUDUCM_PASSWORD:
        results['clouducm_login'] = test_clouducm_login()
    else:
        print_header("TEST 1: CloudUCM Login (SKIPPED)")
        print_info("Run with password argument to test: python test_ucm_webhook.py YOUR_PASSWORD")

    # Test 2: Webhook
    webhook_success, test_uniqueid = test_webhook_connectivity()
    results['webhook_test'] = webhook_success

    # Test 3: API Login
    api_success, access_token = test_api_login()
    results['api_login'] = api_success

    # Test 4: Verify Call (only if webhook and login succeeded)
    if webhook_success and api_success and test_uniqueid:
        import time
        print_info("Waiting 5 seconds for call to be processed...")
        time.sleep(5)
        results['call_verification'] = verify_call_in_dashboard(access_token, test_uniqueid)

    # Summary
    print_header("TEST SUMMARY")

    # Count only tests that were run (not None/skipped)
    run_tests = {k: v for k, v in results.items() if v is not None}
    total_tests = len(run_tests)
    passed_tests = sum(1 for v in run_tests.values() if v)

    for test_name, passed in results.items():
        if passed is None:
            status = "[SKIP]"
        elif passed:
            status = "[PASS]"
        else:
            status = "[FAIL]"
        print(f"{status}  {test_name.replace('_', ' ').title()}")

    print()
    print(f"Results: {passed_tests}/{total_tests} tests passed")

    if passed_tests == total_tests:
        print()
        print_success("ALL TESTS PASSED! Your integration is working correctly.")
        print()
        print("Next steps:")
        print("  1. Configure webhook in CloudUCM at:")
        print(f"     {CLOUDUCM_URL}")
        print("  2. Navigate to: PBX Settings → CDR → HTTP Notification")
        print("  3. Use these settings:")
        print(f"     URL: {WEBHOOK_URL}")
        print(f"     Username: {WEBHOOK_USERNAME}")
        print(f"     Password: {WEBHOOK_PASSWORD}")
        print("  4. Make a real test call to verify end-to-end")
    else:
        print()
        print_error("Some tests failed. Review the output above for details.")

    return passed_tests == total_tests

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
