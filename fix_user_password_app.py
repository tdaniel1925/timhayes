#!/usr/bin/env python3
"""Fix password using app context"""
import sys
import os

# Set environment
os.environ['DATABASE_URL'] = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ['ENCRYPTION_KEY'] = "n2TMzx4lLDV_Ok3Mac5KYuuOkQhZD05DbcqrEdRM4x0="

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("Fixing Password with App Context")
print("=" * 70)
print()

try:
    print("[INFO] Importing app...")
    from app import app, db, User
    import bcrypt
    print("[OK] App imported")
    print()

    with app.app_context():
        email = "tdaniel@botmakers.ai"
        password = "4Xkilla1@"

        # Find user
        print(f"[INFO] Looking for user: {email}")
        user = User.query.filter_by(email=email).first()

        if not user:
            print(f"[ERROR] User not found!")
            sys.exit(1)

        print(f"[OK] Found user (ID: {user.id})")
        print(f"[INFO] Current role: {user.role}")
        print()

        # Update password using the model's method
        print(f"[INFO] Setting new password...")
        user.set_password(password)

        # Make sure role is superadmin
        user.role = 'superadmin'

        db.session.commit()
        print(f"[OK] Password updated!")
        print()

        # Verify it works
        print("[INFO] Verifying password...")
        if user.check_password(password):
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
        print(f"Role: {user.role}")
        print()
        print("Try logging in now!")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
