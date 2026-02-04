#!/usr/bin/env python3
"""
Create a test tenant and admin user in the live Supabase database
"""
import psycopg2
import bcrypt
from datetime import datetime
import secrets

# Supabase connection
DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def generate_encryption_key():
    """Generate a 32-byte encryption key"""
    return secrets.token_urlsafe(32)

def create_tenant_and_user():
    """Create a test tenant and admin user"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Check if tenant already exists
        cursor.execute("SELECT id FROM tenants WHERE subdomain = %s", ('testcompany',))
        existing_tenant = cursor.fetchone()

        if existing_tenant:
            print(f"✓ Tenant 'testcompany' already exists (ID: {existing_tenant[0]})")
            tenant_id = existing_tenant[0]
        else:
            # Create tenant
            encryption_key = generate_encryption_key()
            webhook_username = "testco_webhook"
            webhook_password = "TestWebhook123!"

            cursor.execute("""
                INSERT INTO tenants (
                    company_name, subdomain, plan, status,
                    max_users, max_calls_per_month,
                    webhook_username, webhook_password,
                    encryption_key, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                'Test Company',
                'testcompany',
                'professional',
                'active',
                10,
                10000,
                webhook_username,
                webhook_password,
                encryption_key,
                datetime.utcnow()
            ))

            tenant_id = cursor.fetchone()[0]
            print(f"✓ Created tenant 'Test Company' (ID: {tenant_id})")
            print(f"  Subdomain: testcompany")
            print(f"  Webhook URL: https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany")
            print(f"  Webhook Username: {webhook_username}")
            print(f"  Webhook Password: {webhook_password}")

        # Check if user already exists
        cursor.execute("SELECT id, email FROM users WHERE email = %s", ('admin@testcompany.com',))
        existing_user = cursor.fetchone()

        if existing_user:
            print(f"✓ User already exists: {existing_user[1]} (ID: {existing_user[0]})")
        else:
            # Create admin user
            password = "TestPass123!"
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            cursor.execute("""
                INSERT INTO users (
                    tenant_id, email, password_hash, full_name,
                    role, is_active, email_verified, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                tenant_id,
                'admin@testcompany.com',
                password_hash,
                'Test Admin',
                'admin',
                True,
                True,
                datetime.utcnow()
            ))

            user_id = cursor.fetchone()[0]
            print(f"✓ Created admin user (ID: {user_id})")
            print(f"  Email: admin@testcompany.com")
            print(f"  Password: {password}")

        conn.commit()
        print("\n" + "="*60)
        print("SUCCESS! Test tenant created in live Supabase database")
        print("="*60)
        print("\nYou can now login at:")
        print("  URL: https://audiapro-backend.onrender.com/login")
        print("  Email: admin@testcompany.com")
        print("  Password: TestPass123!")
        print("\nWebhook Configuration for CloudUCM:")
        print("  URL: https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany")
        print("  Username: testco_webhook")
        print("  Password: TestWebhook123!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    print("Creating test tenant in live Supabase database...")
    print("="*60)
    create_tenant_and_user()
