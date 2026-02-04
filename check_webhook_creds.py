#!/usr/bin/env python3
"""Check webhook credentials in database"""
import psycopg2

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

print("Checking webhook credentials for testcompany tenant...")
print("-" * 60)

cursor.execute("""
    SELECT id, company_name, subdomain, webhook_username, webhook_password
    FROM tenants
    WHERE subdomain = 'testcompany'
""")

row = cursor.fetchone()

if row:
    tenant_id, company_name, subdomain, webhook_username, webhook_password = row
    print(f"Tenant ID: {tenant_id}")
    print(f"Company: {company_name}")
    print(f"Subdomain: {subdomain}")
    print(f"Webhook Username: {webhook_username}")
    print(f"Webhook Password: {webhook_password}")
    print()
    print("Use these credentials in CloudUCM webhook configuration:")
    print(f"  URL: https://audiapro-backend.onrender.com/api/webhook/cdr/{subdomain}")
    print(f"  Username: {webhook_username}")
    print(f"  Password: {webhook_password}")
else:
    print("Tenant 'testcompany' not found!")

cursor.close()
conn.close()
