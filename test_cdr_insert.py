#!/usr/bin/env python3
"""Test CDR record insertion directly into database"""
import psycopg2
from datetime import datetime

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def test_insert():
    print("=" * 70)
    print("Testing CDR Record Insertion")
    print("=" * 70)
    print()

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Test data similar to what the webhook receives
    test_cdr = {
        'tenant_id': 1,
        'uniqueid': f'test-{datetime.now().timestamp()}',
        'src': '1001',
        'dst': '1002',
        'duration': 60,
        'billsec': 55,
        'disposition': 'ANSWERED',
        'start_time': '2024-01-01 10:00:00',
        'answer_time': '2024-01-01 10:00:05',
        'end_time': '2024-01-01 10:01:00',
        'call_date': datetime.now(),
        'received_at': datetime.now()
    }

    print(f"[INFO] Test CDR data:")
    print(f"  Tenant ID: {test_cdr['tenant_id']}")
    print(f"  Unique ID: {test_cdr['uniqueid']}")
    print(f"  Source: {test_cdr['src']}")
    print(f"  Destination: {test_cdr['dst']}")
    print(f"  Duration: {test_cdr['duration']}")
    print()

    try:
        print("[INFO] Attempting to insert CDR record...")
        cursor.execute("""
            INSERT INTO cdr_records (
                tenant_id, uniqueid, src, dst, duration, billsec,
                disposition, start_time, answer_time, end_time,
                call_date, received_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            test_cdr['tenant_id'],
            test_cdr['uniqueid'],
            test_cdr['src'],
            test_cdr['dst'],
            test_cdr['duration'],
            test_cdr['billsec'],
            test_cdr['disposition'],
            test_cdr['start_time'],
            test_cdr['answer_time'],
            test_cdr['end_time'],
            test_cdr['call_date'],
            test_cdr['received_at']
        ))

        record_id = cursor.fetchone()[0]
        conn.commit()

        print(f"[OK] Successfully inserted CDR record with ID: {record_id}")
        print()

        # Verify it was inserted
        cursor.execute("SELECT COUNT(*) FROM cdr_records WHERE tenant_id = 1")
        count = cursor.fetchone()[0]
        print(f"[OK] Total CDR records for tenant_id = 1: {count}")
        print()
        print("=" * 70)
        print("[SUCCESS] Database insertion works fine!")
        print("=" * 70)
        print()
        print("This means the 500 error is likely due to:")
        print("1. Data format mismatch in the webhook payload")
        print("2. Missing field in the webhook processing code")
        print("3. Issue with how the Flask app handles the data")
        print()

    except Exception as e:
        conn.rollback()
        print(f"[FAIL] Insert failed: {e}")
        print()
        import traceback
        traceback.print_exc()

    cursor.close()
    conn.close()

if __name__ == '__main__':
    test_insert()
