#!/usr/bin/env python3
"""Create super admin user for centralized management"""
import psycopg2
from werkzeug.security import generate_password_hash
from datetime import datetime

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def create_super_admin():
    print("=" * 70)
    print("Creating Super Admin User")
    print("=" * 70)
    print()

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    email = "tdaniel@botmakers.ai"
    password = "4Xkilla1@"

    # Check if user already exists
    cursor.execute("SELECT id, email, role FROM users WHERE email = %s", (email,))
    existing = cursor.fetchone()

    if existing:
        user_id, existing_email, role = existing
        print(f"[INFO] User already exists: {existing_email}")
        print(f"[INFO] User ID: {user_id}")
        print(f"[INFO] Current Role: {role}")
        print()

        # Update to superadmin role and password
        print("[INFO] Updating to superadmin role and new password...")
        password_hash = generate_password_hash(password)
        cursor.execute("""
            UPDATE users
            SET role = 'superadmin', password_hash = %s
            WHERE email = %s
        """, (password_hash, email))
        conn.commit()
        print("[OK] Updated to superadmin!")
    else:
        # Create new superadmin user
        print(f"[INFO] Creating new superadmin: {email}")

        # Ensure testcompany tenant exists (tenant_id = 1)
        cursor.execute("SELECT id FROM tenants WHERE subdomain = 'testcompany'")
        tenant = cursor.fetchone()

        if not tenant:
            print("[ERROR] testcompany tenant not found! Run create_tenant_correct.py first")
            conn.close()
            return False

        tenant_id = tenant[0]
        print(f"[INFO] Using tenant_id: {tenant_id}")

        password_hash = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users (
                tenant_id, email, password_hash, full_name, role, is_active, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            tenant_id, email, password_hash,
            'Super Admin', 'superadmin', True, datetime.now()
        ))

        user_id = cursor.fetchone()[0]
        conn.commit()
        print(f"[OK] Created superadmin user with ID: {user_id}")

    print()
    print("=" * 70)
    print("Super Admin Login Credentials")
    print("=" * 70)
    print(f"URL: https://audiapro-backend.onrender.com/login")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Role: superadmin")
    print()
    print("[INFO] Super admins can:")
    print("  - View ALL calls across all tenants")
    print("  - Manage all tenants and users")
    print("  - Access super admin dashboard")
    print("  - Configure system-wide settings")
    print()

    cursor.close()
    conn.close()
    return True

if __name__ == '__main__':
    create_super_admin()
