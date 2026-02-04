#!/usr/bin/env python3
"""
Database Migration Script
Adds missing columns to existing database schema

Run this script to update the database with new fields:
    python migrate_database.py
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from datetime import datetime

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql:// (Railway uses postgres://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"🔗 Connecting to database...")
engine = create_engine(DATABASE_URL)

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def run_migration():
    """Run all database migrations"""
    print("\n📦 Starting database migration...\n")

    migrations = []

    with engine.connect() as conn:
        # Migration 1: Add call_date to cdr_records
        if not column_exists('cdr_records', 'call_date'):
            print("  ➕ Adding call_date column to cdr_records...")
            conn.execute(text("""
                ALTER TABLE cdr_records
                ADD COLUMN call_date TIMESTAMP DEFAULT NOW()
            """))
            conn.execute(text("""
                CREATE INDEX idx_cdr_call_date ON cdr_records(call_date)
            """))
            migrations.append("Added call_date to cdr_records")
            print("     ✅ call_date column added with index")
        else:
            print("  ⏭️  call_date already exists in cdr_records")

        # Migration 2: Add max_users to tenants
        if not column_exists('tenants', 'max_users'):
            print("  ➕ Adding max_users column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_users INTEGER DEFAULT 5
            """))
            migrations.append("Added max_users to tenants")
            print("     ✅ max_users column added")
        else:
            print("  ⏭️  max_users already exists in tenants")

        # Migration 3: Add max_calls_per_month to tenants
        if not column_exists('tenants', 'max_calls_per_month'):
            print("  ➕ Adding max_calls_per_month column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN max_calls_per_month INTEGER DEFAULT 1000
            """))
            migrations.append("Added max_calls_per_month to tenants")
            print("     ✅ max_calls_per_month column added")
        else:
            print("  ⏭️  max_calls_per_month already exists in tenants")

        # Migration 4: Add subscription_status to tenants
        if not column_exists('tenants', 'subscription_status'):
            print("  ➕ Adding subscription_status column to tenants...")
            conn.execute(text("""
                ALTER TABLE tenants
                ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active'
            """))
            migrations.append("Added subscription_status to tenants")
            print("     ✅ subscription_status column added")
        else:
            print("  ⏭️  subscription_status already exists in tenants")

        # Commit all changes
        conn.commit()

    print(f"\n✅ Migration complete! {len(migrations)} changes applied:")
    for i, migration in enumerate(migrations, 1):
        print(f"   {i}. {migration}")

    if not migrations:
        print("   ℹ️  No migrations needed - database is up to date")

    print("\n🎉 Database migration successful!\n")

def verify_schema():
    """Verify the schema after migration"""
    print("🔍 Verifying schema...\n")

    inspector = inspect(engine)

    # Check cdr_records table
    cdr_columns = [col['name'] for col in inspector.get_columns('cdr_records')]
    print(f"📋 cdr_records columns: {', '.join(cdr_columns)}")
    assert 'call_date' in cdr_columns, "call_date column missing!"

    # Check tenants table
    tenant_columns = [col['name'] for col in inspector.get_columns('tenants')]
    print(f"📋 tenants columns: {', '.join(tenant_columns)}")
    assert 'max_users' in tenant_columns, "max_users column missing!"
    assert 'max_calls_per_month' in tenant_columns, "max_calls_per_month column missing!"
    assert 'subscription_status' in tenant_columns, "subscription_status column missing!"

    print("\n✅ Schema verification passed!\n")

if __name__ == '__main__':
    try:
        run_migration()
        verify_schema()
        print("🚀 Ready for production!\n")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
