#!/usr/bin/env python3
"""Fix super admin password with correct hashing"""
import psycopg2
from werkzeug.security import generate_password_hash

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def fix_password():
    print("=" * 70)
    print("Fixing Super Admin Password")
    print("=" * 70)
    print()

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    email = "tdaniel@botmakers.ai"
    password = "4Xkilla1@"

    # Generate proper password hash
    print(f"[INFO] Generating password hash for: {email}")
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    print(f"[OK] Hash generated (length: {len(password_hash)})")
    print()

    # Update user
    cursor.execute("""
        UPDATE users
        SET password_hash = %s
        WHERE email = %s
        RETURNING id, email, role
    """, (password_hash, email))

    result = cursor.fetchone()
    if result:
        user_id, user_email, role = result
        conn.commit()
        print(f"[OK] Password updated successfully!")
        print(f"[INFO] User ID: {user_id}")
        print(f"[INFO] Email: {user_email}")
        print(f"[INFO] Role: {role}")
        print()
        print("=" * 70)
        print("Login Credentials")
        print("=" * 70)
        print(f"URL: https://audiapro-backend.onrender.com/")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print()
    else:
        print(f"[ERROR] User {email} not found!")
        conn.rollback()

    cursor.close()
    conn.close()

if __name__ == '__main__':
    fix_password()
