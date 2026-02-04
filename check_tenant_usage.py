#!/usr/bin/env python3
"""Check tenant usage_this_month value"""
import psycopg2

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

print("Checking tenant usage_this_month field...")
cursor.execute("""
    SELECT id, company_name, subdomain, usage_this_month, max_calls_per_month
    FROM tenants
    WHERE subdomain = 'testcompany'
""")

row = cursor.fetchone()

if row:
    tenant_id, company_name, subdomain, usage_this_month, max_calls = row
    print(f"Tenant ID: {tenant_id}")
    print(f"Company: {company_name}")
    print(f"Subdomain: {subdomain}")
    print(f"Usage this month: {usage_this_month} (Type: {type(usage_this_month).__name__})")
    print(f"Max calls per month: {max_calls}")
    print()

    if usage_this_month is None:
        print("[ISSUE FOUND] usage_this_month is NULL!")
        print("This causes the TypeError in check_usage_limit()")
        print()
        print("Fixing by setting usage_this_month = 0...")
        cursor.execute("""
            UPDATE tenants
            SET usage_this_month = 0
            WHERE subdomain = 'testcompany'
        """)
        conn.commit()
        print("[OK] Fixed! usage_this_month set to 0")
    else:
        print("[OK] usage_this_month has a valid value")

cursor.close()
conn.close()
