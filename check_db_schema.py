#!/usr/bin/env python3
"""Check the actual database schema"""
import psycopg2

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

print("Checking tenants table schema...")
cursor.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tenants'
    ORDER BY ordinal_position
""")

print("\nTENANTS TABLE COLUMNS:")
print("-" * 60)
for row in cursor.fetchall():
    print(f"{row[0]:<30} {row[1]:<20} NULL: {row[2]}")

print("\n\nChecking users table schema...")
cursor.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
""")

print("\nUSERS TABLE COLUMNS:")
print("-" * 60)
for row in cursor.fetchall():
    print(f"{row[0]:<30} {row[1]:<20} NULL: {row[2]}")

print("\n\nChecking existing tenants...")
cursor.execute("SELECT id, company_name, subdomain FROM tenants LIMIT 5")
rows = cursor.fetchall()
if rows:
    print("\nEXISTING TENANTS:")
    print("-" * 60)
    for row in rows:
        print(f"ID: {row[0]}, Company: {row[1]}, Subdomain: {row[2]}")
else:
    print("\nNo tenants found in database.")

cursor.close()
conn.close()
