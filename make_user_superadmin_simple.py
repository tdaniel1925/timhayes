#!/usr/bin/env python3
"""
Convert tdaniel@botmakers.ai to superadmin role in USERS table
This allows seeing all calls from the regular dashboard
"""
import sys
import os

os.environ['DATABASE_URL'] = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ['ENCRYPTION_KEY'] = "n2TMzx4lLDV_Ok3Mac5KYuuOkQhZD05DbcqrEdRM4x0="

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("Making User a Superadmin (for regular dashboard)")
print("=" * 70)
print()

try:
    from app import app, db, User

    with app.app_context():
        email = "tdaniel@botmakers.ai"
        password = "4Xkilla1@"

        # Find or create user
        user = User.query.filter_by(email=email).first()

        if user:
            print(f"[OK] Found existing user (ID: {user.id})")
        else:
            # Create new user in tenant 1
            print("[INFO] Creating new user...")
            user = User(
                tenant_id=1,  # testcompany
                email=email,
                full_name="Tim Daniel",
                role="superadmin",
                is_active=True
            )
            user.set_password(password)
            db.session.add(user)

        # Make them superadmin
        user.role = "superadmin"
        user.set_password(password)
        user.is_active = True

        db.session.commit()

        print(f"[OK] User is now superadmin!")
        print()
        print("=" * 70)
        print("Login Credentials (Regular Dashboard)")
        print("=" * 70)
        print(f"URL: https://audiapro-backend.onrender.com/")
        print(f"     (then navigate to /login)")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: {user.role}")
        print()
        print("[INFO] As superadmin, you can:")
        print("  - View ALL calls from ALL tenants")
        print("  - Manage all users")
        print("  - Access all admin features")
        print("  - Configure system settings")
        print()

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
