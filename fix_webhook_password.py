#!/usr/bin/env python3
"""
Fix webhook password encryption in database

Usage:
    python fix_webhook_password.py ENCRYPTION_KEY_FROM_RENDER

This will:
1. Encrypt "TestWebhook123!" using the Render encryption key
2. Update the database directly
"""
from cryptography.fernet import Fernet
import psycopg2
import sys

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def main():
    print("="*70)
    print("Webhook Password Encryption Fixer")
    print("="*70)
    print()

    # Check for encryption key argument
    if len(sys.argv) < 2:
        print("[ERROR] Missing ENCRYPTION_KEY argument!")
        print()
        print("Usage:")
        print("  python fix_webhook_password.py YOUR_ENCRYPTION_KEY")
        print()
        print("STEPS TO GET KEY:")
        print("1. Go to: https://dashboard.render.com")
        print("2. Select 'audiapro-backend' service")
        print("3. Click 'Environment' tab")
        print("4. Find and COPY 'ENCRYPTION_KEY' value")
        print("5. Run: python fix_webhook_password.py PASTE_KEY_HERE")
        print()
        sys.exit(1)

    encryption_key = sys.argv[1].strip()

    if not encryption_key:
        print("[ERROR] Empty encryption key!")
        sys.exit(1)

    try:
        # Create cipher with the key from Render
        print("[INFO] Creating cipher with provided key...")
        cipher = Fernet(encryption_key.encode())

        # Encrypt the webhook password
        webhook_password = "TestWebhook123!"
        print(f"[INFO] Encrypting password: {webhook_password}")
        encrypted = cipher.encrypt(webhook_password.encode()).decode()

        print(f"[OK] Encrypted successfully!")
        print(f"[INFO] Encrypted value: {encrypted[:50]}...")
        print()

        # Connect to database
        print("[INFO] Connecting to Supabase database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Update the tenant
        print("[INFO] Updating testcompany tenant...")
        cursor.execute("""
            UPDATE tenants
            SET webhook_password = %s
            WHERE subdomain = 'testcompany'
            RETURNING id, company_name, subdomain, webhook_username
        """, (encrypted,))

        result = cursor.fetchone()

        if result:
            tenant_id, company_name, subdomain, webhook_username = result
            conn.commit()

            print("[OK] Database updated successfully!")
            print()
            print("="*70)
            print("Tenant Information:")
            print("="*70)
            print(f"  ID: {tenant_id}")
            print(f"  Company: {company_name}")
            print(f"  Subdomain: {subdomain}")
            print(f"  Webhook Username: {webhook_username}")
            print(f"  Webhook Password: {webhook_password} (now encrypted in DB)")
            print()
            print("CloudUCM Webhook Configuration:")
            print("-"*70)
            print(f"  URL: https://audiapro-backend.onrender.com/api/webhook/cdr/{subdomain}")
            print(f"  Username: {webhook_username}")
            print(f"  Password: {webhook_password}")
            print()
            print("[INFO] Test webhook with:")
            print(f"  python test_ucm_webhook.py")
            print()

        else:
            print("[ERROR] Tenant 'testcompany' not found in database!")
            conn.rollback()
            sys.exit(1)

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        import traceback
        traceback.print_exc()
        print()
        print("Make sure you copied the ENCRYPTION_KEY correctly from Render!")
        sys.exit(1)

if __name__ == '__main__':
    main()
