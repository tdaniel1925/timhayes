#!/usr/bin/env python3
"""Fix password using bcrypt (matching the app's hash method)"""
import psycopg2
import bcrypt

DATABASE_URL = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def fix_password():
    print("=" * 70)
    print("Fixing Password with Bcrypt")
    print("=" * 70)
    print()

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    email = "tdaniel@botmakers.ai"
    password = "4Xkilla1@"

    # Check current password_hash
    cursor.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user:
        user_id, user_email, current_hash = user
        print(f"[INFO] Found user: {user_email} (ID: {user_id})")
        print(f"[INFO] Current hash length: {len(current_hash) if current_hash else 'NULL'}")
        if current_hash:
            print(f"[INFO] Hash format: {current_hash[:10]}...")
        print()

    # Generate bcrypt hash (matching app.py User.set_password method)
    print(f"[INFO] Generating bcrypt hash...")
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    print(f"[OK] Bcrypt hash generated (length: {len(password_hash)})")
    print(f"[INFO] Hash format: {password_hash[:10]}...")
    print()

    # Update password
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

        # Verify the hash works
        print("[INFO] Verifying password...")
        if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            print("[OK] Password verification successful!")
        else:
            print("[ERROR] Password verification failed!")
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
