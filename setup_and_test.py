#!/usr/bin/env python3
"""
Complete setup and test for phone calls
This script will:
1. Initialize database
2. Create demo tenant
3. Create demo user
4. Test webhook
"""

import sys
import os

# Ensure fresh import
if 'app' in sys.modules:
    del sys.modules['app']

from app import app, db, Tenant, User
import bcrypt
import requests
from datetime import datetime, timezone
import random

def setup_database():
    """Initialize database and create demo tenant"""
    print("="*70)
    print("Step 1: Setting up database")
    print("="*70)

    with app.app_context():
        # Create all tables
        db.create_all()
        print("[OK] Database initialized")

        # Check if demo tenant exists
        tenant = Tenant.query.filter_by(subdomain='demo').first()

        if tenant:
            print(f"[OK] Demo tenant exists: {tenant.company_name}")
        else:
            print("[INFO] Creating demo tenant...")
            tenant = Tenant(
                subdomain='demo',
                company_name='Demo Company',
                plan='professional',
                status='active',
                max_users=10,
                max_calls_per_month=1000
            )
            db.session.add(tenant)
            db.session.flush()
            print(f"[OK] Created tenant: {tenant.company_name}")

            # Create user
            hashed_password = bcrypt.hashpw('User123!'.encode('utf-8'), bcrypt.gensalt())
            user = User(
                tenant_id=tenant.id,
                email='user@demo.com',
                password=hashed_password.decode('utf-8'),
                full_name='Demo User',
                role='admin',
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
            print(f"[OK] Created user: user@demo.com / User123!")

        print()
        return tenant


def test_webhook(tenant_subdomain):
    """Test phone call webhook"""
    print("="*70)
    print("Step 2: Testing phone call webhook")
    print("="*70)

    backend_url = "http://localhost:5000"
    webhook_url = f"{backend_url}/api/webhook/cdr/{tenant_subdomain}"

    # Test call data
    now = datetime.now(timezone.utc).isoformat()
    test_call = {
        "call_id": f"TEST-{random.randint(1000, 9999)}",
        "caller_number": "+15551234567",
        "called_number": "+15559876543",
        "call_type": "inbound",
        "call_outcome": "answered",
        "call_duration": 245,
        "start_time": now,
        "end_time": now
    }

    print(f"Sending test call to: {webhook_url}")
    print(f"  From: {test_call['caller_number']}")
    print(f"  To: {test_call['called_number']}")
    print(f"  Duration: {test_call['call_duration']}s")

    try:
        response = requests.post(
            webhook_url,
            json=test_call,
            auth=('admin', 'your_webhook_password'),
            headers={'Content-Type': 'application/json'},
            timeout=10
        )

        if response.status_code == 200:
            print("[SUCCESS] Phone call logged!")
            return True
        else:
            print(f"[ERROR] Status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"[ERROR] Cannot connect to {backend_url}")
        print("Make sure backend is running: python app.py")
        return False
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False


def main():
    print()
    print("="*70)
    print("AudiaPro Phone Call Setup & Test")
    print("="*70)
    print()

    # Step 1: Setup database
    tenant = setup_database()

    # Step 2: Test webhook
    success = test_webhook(tenant.subdomain)

    # Summary
    print()
    print("="*70)
    print("Setup Complete!")
    print("="*70)

    if success:
        print("[SUCCESS] Phone call tracking is working!")
        print()
        print("Next steps:")
        print("1. Start frontend: cd frontend && npm run dev")
        print("2. Open browser: http://localhost:5173")
        print("3. Login with: user@demo.com / User123!")
        print("4. Check dashboard for test call")
        print()
        print("To test more calls:")
        print("  python test_phone_calls.py http://localhost:5000")
    else:
        print("[ERROR] Phone call test failed!")
        print("Make sure backend is running: python app.py")

    print("="*70)


if __name__ == '__main__':
    main()
