#!/usr/bin/env python3
"""Test webhook processing logic locally to identify the exact error"""
import sys
import os
from datetime import datetime

# Set up environment
os.environ['DATABASE_URL'] = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ['ENCRYPTION_KEY'] = "n2TMzx4lLDV_Ok3Mac5KYuuOkQhZD05DbcqrEdRM4x0="

# Import after setting env
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("Testing Webhook Processing Logic")
print("=" * 70)
print()

try:
    print("[INFO] Importing Flask app...")
    from app import app, db, Tenant, CDRRecord
    print("[OK] Import successful")
    print()

    with app.app_context():
        # Test data matching what test_ucm_webhook.py sends
        cdr_data = {
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

        print("[INFO] Test CDR data:")
        for key, value in cdr_data.items():
            print(f"  {key}: {value}")
        print()

        # Get tenant
        print("[INFO] Looking up tenant 'testcompany'...")
        tenant = Tenant.query.filter_by(subdomain='testcompany').first()

        if not tenant:
            print("[FAIL] Tenant not found!")
            sys.exit(1)

        print(f"[OK] Found tenant: {tenant.company_name} (ID: {tenant.id})")
        print()

        # Check usage limit (this is what the webhook does first)
        print("[INFO] Checking usage limit...")
        from app import check_usage_limit
        within_limit = check_usage_limit(tenant.id)
        print(f"[OK] Usage check result: {within_limit}")
        print(f"     Current usage: {tenant.usage_this_month}")
        print(f"     Max calls: {tenant.max_calls_per_month}")
        print()

        # Try to create CDRRecord (exactly as webhook does)
        print("[INFO] Creating CDRRecord object...")
        try:
            cdr = CDRRecord(
                tenant_id=tenant.id,
                uniqueid=cdr_data.get('uniqueid'),
                src=cdr_data.get('src'),
                dst=cdr_data.get('dst'),
                caller_name=cdr_data.get('caller_name'),
                clid=cdr_data.get('clid'),
                channel=cdr_data.get('channel'),
                dstchannel=cdr_data.get('dstchannel'),
                start_time=cdr_data.get('start'),
                answer_time=cdr_data.get('answer'),
                end_time=cdr_data.get('end'),
                duration=cdr_data.get('duration'),
                billsec=cdr_data.get('billsec'),
                disposition=cdr_data.get('disposition'),
                recordfiles=cdr_data.get('recordfiles'),
                src_trunk_name=cdr_data.get('src_trunk_name'),
                dst_trunk_name=cdr_data.get('dst_trunk_name')
            )
            print("[OK] CDRRecord object created")
            print()

            # Try to add to session
            print("[INFO] Adding to database session...")
            db.session.add(cdr)
            print("[OK] Added to session")
            print()

            # Try to commit
            print("[INFO] Committing to database...")
            db.session.commit()
            print(f"[OK] Committed successfully! CDR ID: {cdr.id}")
            print()

            # Try increment usage
            print("[INFO] Incrementing usage counter...")
            from app import increment_usage
            increment_usage(tenant.id)
            print("[OK] Usage incremented")
            print()

            # Check if we would trigger AI processing
            recording_path = cdr_data.get('recordfiles')
            print(f"[INFO] Recording path: {recording_path}")
            if recording_path:
                print("[INFO] Would trigger AI processing (skipping for test)")
            else:
                print("[INFO] No recording, no AI processing needed")
            print()

            print("=" * 70)
            print("[SUCCESS] Webhook logic completed successfully!")
            print("=" * 70)
            print()
            print("This means the Flask app on Render has a different issue.")
            print("Possible causes:")
            print("1. Database connection issue on Render")
            print("2. Missing environment variable on Render")
            print("3. Flask app context issue")
            print("4. Different code version deployed on Render")
            print()

        except Exception as e:
            db.session.rollback()
            print(f"[FAIL] Error during CDR processing: {e}")
            print()
            print("This is the actual error the webhook is encountering!")
            print()
            import traceback
            traceback.print_exc()
            sys.exit(1)

except Exception as e:
    print(f"[FAIL] Setup error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
