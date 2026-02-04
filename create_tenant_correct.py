#!/usr/bin/env python3
"""Create a test tenant with correct schema"""
import psycopg2
import bcrypt
from datetime import datetime
import secrets

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def create_tenant():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Create tenant (matching actual schema)
        cursor.execute("""
            INSERT INTO tenants (
                company_name,
                subdomain,
                plan,
                is_active,
                subscription_status,
                max_users,
                max_calls_per_month,
                webhook_username,
                webhook_password,
                transcription_enabled,
                sentiment_enabled,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'Test Company',
            'testcompany',
            'professional',
            True,  # is_active
            'active',  # subscription_status
            10,
            10000,
            'testco_webhook',
            'TestWebhook123!',
            True,
            True,
            datetime.now()
        ))

        tenant_id = cursor.fetchone()[0]
        print(f"Created tenant: Test Company (ID: {tenant_id})")

        # Create admin user
        password_hash = bcrypt.hashpw('TestPass123!'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("""
            INSERT INTO users (
                tenant_id,
                email,
                password_hash,
                full_name,
                role,
                is_active,
                email_verified,
                created_at
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
            datetime.now()
        ))

        user_id = cursor.fetchone()[0]
        print(f"Created user: admin@testcompany.com (ID: {user_id})")

        conn.commit()

        print("\n" + "="*70)
        print("SUCCESS! You can now login:")
        print("="*70)
        print("\nCUSTOMER LOGIN:")
        print("  URL: https://audiapro-backend.onrender.com/login")
        print("  Email: admin@testcompany.com")
        print("  Password: TestPass123!")
        print("\nCLOUDUCM WEBHOOK CONFIG:")
        print("  URL: https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany")
        print("  Username: testco_webhook")
        print("  Password: TestWebhook123!")

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    create_tenant()
