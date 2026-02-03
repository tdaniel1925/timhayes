#!/usr/bin/env python3
"""
Test Phone Call Webhook Integration
Simulates phone calls being sent to your Railway backend
"""

import requests
import json
from datetime import datetime, timezone
import random

def test_webhook(backend_url, tenant_subdomain="demo", webhook_user="admin", webhook_pass="your_webhook_password"):
    """
    Send a test CDR (Call Detail Record) to your backend
    """

    print("=" * 70)
    print("Phone Call Webhook Test")
    print("=" * 70)
    print()
    print(f"Backend URL: {backend_url}")
    print(f"Tenant: {tenant_subdomain}")
    print()

    # Webhook endpoint
    webhook_url = f"{backend_url}/api/webhook/cdr/{tenant_subdomain}"

    # Generate test call data
    now = datetime.now(timezone.utc).isoformat()
    test_calls = [
        {
            "call_id": f"TEST-CALL-{random.randint(1000, 9999)}",
            "caller_number": "+15551234567",
            "called_number": "+15559876543",
            "call_type": "inbound",
            "call_outcome": "answered",
            "call_duration": 245,
            "start_time": now,
            "end_time": now
        },
        {
            "call_id": f"TEST-CALL-{random.randint(1000, 9999)}",
            "caller_number": "+15559876543",
            "called_number": "+15551112222",
            "call_type": "outbound",
            "call_outcome": "no-answer",
            "call_duration": 0,
            "start_time": now,
            "end_time": now
        },
        {
            "call_id": f"TEST-CALL-{random.randint(1000, 9999)}",
            "caller_number": "+15553334444",
            "called_number": "+15555556666",
            "call_type": "inbound",
            "call_outcome": "answered",
            "call_duration": 480,
            "start_time": now,
            "end_time": now
        }
    ]

    print(f"Sending {len(test_calls)} test calls to webhook...")
    print()

    success_count = 0
    error_count = 0

    for i, call_data in enumerate(test_calls, 1):
        print(f"[CALL {i}/{len(test_calls)}]")
        print(f"   From: {call_data['caller_number']}")
        print(f"   To: {call_data['called_number']}")
        print(f"   Type: {call_data['call_type']}")
        print(f"   Outcome: {call_data['call_outcome']}")
        print(f"   Duration: {call_data['call_duration']}s")

        try:
            # Send webhook with basic auth
            response = requests.post(
                webhook_url,
                json=call_data,
                auth=(webhook_user, webhook_pass),
                headers={'Content-Type': 'application/json'},
                timeout=10
            )

            if response.status_code == 200:
                print(f"   [SUCCESS] Call logged!")
                success_count += 1
            elif response.status_code == 401:
                print(f"   [ERROR] Authentication failed!")
                print(f"   Check webhook username/password in .env")
                error_count += 1
            elif response.status_code == 404:
                print(f"   [ERROR] Tenant '{tenant_subdomain}' not found!")
                print(f"   Create tenant first in super admin panel")
                error_count += 1
            else:
                print(f"   [ERROR] Status {response.status_code}")
                print(f"   Response: {response.text}")
                error_count += 1

        except requests.exceptions.ConnectionError:
            print(f"   [ERROR] Cannot connect to {backend_url}")
            print(f"   Make sure backend is running!")
            error_count += 1
        except requests.exceptions.Timeout:
            print(f"   [ERROR] Request timeout")
            error_count += 1
        except Exception as e:
            print(f"   [ERROR] {str(e)}")
            error_count += 1

        print()

    # Summary
    print("=" * 70)
    print("Test Results")
    print("=" * 70)
    print(f"[OK] Successful: {success_count}")
    print(f"[FAIL] Failed: {error_count}")
    print()

    if success_count > 0:
        print("[SUCCESS] Calls were logged successfully!")
        print(f"Check your dashboard: http://{tenant_subdomain}.localhost:5173")
        print(f"   Or Railway: https://{tenant_subdomain}.your-domain.com")
    else:
        print("[WARNING] No calls were logged. Check errors above.")

    print("=" * 70)

    return success_count, error_count


if __name__ == '__main__':
    import sys

    print()
    print("=" * 70)
    print("AudiaPro Phone Call Test")
    print("=" * 70)
    print()

    # Get parameters
    if len(sys.argv) < 2:
        print("Usage: python test_phone_calls.py <backend_url> [tenant] [user] [pass]")
        print()
        print("Examples:")
        print("  Local backend:")
        print("    python test_phone_calls.py http://localhost:5000")
        print()
        print("  Railway backend:")
        print("    python test_phone_calls.py https://your-app.railway.app demo admin your_password")
        print()
        sys.exit(1)

    backend_url = sys.argv[1].rstrip('/')
    tenant = sys.argv[2] if len(sys.argv) > 2 else 'demo'
    webhook_user = sys.argv[3] if len(sys.argv) > 3 else 'admin'
    webhook_pass = sys.argv[4] if len(sys.argv) > 4 else 'your_webhook_password'

    test_webhook(backend_url, tenant, webhook_user, webhook_pass)
