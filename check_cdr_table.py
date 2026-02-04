#!/usr/bin/env python3
"""Check if cdr_records table exists and verify schema"""
import psycopg2

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def check_cdr_table():
    print("=" * 70)
    print("CDR Table Schema Check")
    print("=" * 70)
    print()

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Check if table exists
    print("[INFO] Checking if cdr_records table exists...")
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'cdr_records'
        )
    """)

    exists = cursor.fetchone()[0]

    if not exists:
        print("[FAIL] Table 'cdr_records' does NOT exist!")
        print()
        print("This is the problem! The table needs to be created.")
        print("The backend is trying to insert data into a non-existent table.")
        cursor.close()
        conn.close()
        return False

    print("[OK] Table 'cdr_records' exists")
    print()

    # Get column information
    print("[INFO] Fetching table schema...")
    cursor.execute("""
        SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'cdr_records'
        ORDER BY ordinal_position
    """)

    columns = cursor.fetchall()

    print("[OK] Table schema:")
    print("-" * 70)
    print(f"{'Column':<25} {'Type':<20} {'Nullable':<10} {'Default':<15}")
    print("-" * 70)

    for col_name, data_type, nullable, default in columns:
        nullable_str = "YES" if nullable == "YES" else "NO"
        default_str = str(default)[:15] if default else ""
        print(f"{col_name:<25} {data_type:<20} {nullable_str:<10} {default_str:<15}")

    print()

    # Check constraints
    print("[INFO] Checking table constraints...")
    cursor.execute("""
        SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'cdr_records'
        ORDER BY tc.constraint_type, tc.constraint_name
    """)

    constraints = cursor.fetchall()

    if constraints:
        print("[OK] Table constraints:")
        print("-" * 70)
        for constraint_name, constraint_type, column_name in constraints:
            print(f"  {constraint_type:<20} {constraint_name:<30} on {column_name or 'multiple'}")
    else:
        print("[INFO] No constraints found")

    print()

    # Check if tenant_id = 1 exists
    print("[INFO] Checking for tenant_id = 1...")
    cursor.execute("SELECT COUNT(*) FROM cdr_records WHERE tenant_id = 1")
    count = cursor.fetchone()[0]
    print(f"[OK] Found {count} existing CDR records for tenant_id = 1")
    print()

    cursor.close()
    conn.close()

    return True

if __name__ == '__main__':
    try:
        check_cdr_table()
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
