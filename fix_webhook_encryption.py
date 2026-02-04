#!/usr/bin/env python3
"""
Fix webhook password encryption for testcompany tenant
The password was stored as plain text, needs to be encrypted
"""
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set database URL before importing app
os.environ['DATABASE_URL'] = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

# Generate encryption key if not set (same as what Render uses)
if not os.environ.get('ENCRYPTION_KEY'):
    import secrets
    os.environ['ENCRYPTION_KEY'] = secrets.token_urlsafe(32)
    print(f"[INFO] Generated ENCRYPTION_KEY: {os.environ['ENCRYPTION_KEY']}")
    print("[WARNING] This key must match what's in Render!")
    print()

from app import db, Tenant

def fix_webhook_password():
    """Update webhook password using proper encryption"""
    print("Fixing webhook password encryption...")
    print("-" * 60)

    # Find testcompany tenant
    tenant = Tenant.query.filter_by(subdomain='testcompany').first()

    if not tenant:
        print("[FAIL] Tenant 'testcompany' not found!")
        return False

    print(f"[INFO] Found tenant: {tenant.company_name} (ID: {tenant.id})")
    print(f"[INFO] Current webhook username: {tenant.webhook_username}")

    # Set webhook password using the property setter (which encrypts it)
    webhook_password = "TestWebhook123!"
    tenant.webhook_password = webhook_password  # This will encrypt it

    print(f"[INFO] Setting webhook password: {webhook_password}")

    # Commit changes
    try:
        db.session.commit()
        print("[OK] Webhook password encrypted and saved!")

        # Verify it can be decrypted
        decrypted = tenant.webhook_password
        if decrypted == webhook_password:
            print(f"[OK] Encryption verified - decrypts correctly to: {decrypted}")
            return True
        else:
            print(f"[FAIL] Decryption failed - got: {decrypted}")
            return False

    except Exception as e:
        db.session.rollback()
        print(f"[FAIL] Error saving: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    with app.app_context():
        success = fix_webhook_encryption()

    if success:
        print()
        print("="*60)
        print("[OK] Webhook password fixed successfully!")
        print("="*60)
        print()
        print("Webhook Configuration:")
        print("  URL: https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany")
        print("  Username: testco_webhook")
        print("  Password: TestWebhook123!")
        print()
        print("IMPORTANT: Run 'python test_ucm_webhook.py' to test again")
    else:
        print()
        print("[FAIL] Failed to fix webhook password")
        sys.exit(1)
