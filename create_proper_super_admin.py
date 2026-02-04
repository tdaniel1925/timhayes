#!/usr/bin/env python3
"""Create super admin in the CORRECT table (super_admins)"""
import sys
import os

# Set environment
os.environ['DATABASE_URL'] = "postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ['ENCRYPTION_KEY'] = "n2TMzx4lLDV_Ok3Mac5KYuuOkQhZD05DbcqrEdRM4x0="

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("Creating Super Admin in super_admins Table")
print("=" * 70)
print()

try:
    print("[INFO] Importing app...")
    from app import app, db, SuperAdmin
    print("[OK] App imported")
    print()

    with app.app_context():
        email = "tdaniel@botmakers.ai"
        password = "4Xkilla1@"

        # Check if super admin already exists
        print(f"[INFO] Checking for existing super admin: {email}")
        existing = SuperAdmin.query.filter_by(email=email).first()

        if existing:
            print(f"[OK] Super admin already exists (ID: {existing.id})")
            print(f"[INFO] Updating password...")
            existing.set_password(password)
            existing.is_active = True
            db.session.commit()
            print(f"[OK] Password updated!")
            super_admin = existing
        else:
            # Create new super admin
            print(f"[INFO] Creating new super admin...")
            super_admin = SuperAdmin(
                email=email,
                full_name="Tim Daniel",
                role="super_admin",
                is_active=True
            )
            super_admin.set_password(password)

            db.session.add(super_admin)
            db.session.commit()
            print(f"[OK] Super admin created (ID: {super_admin.id})")

        print()

        # Verify password works
        print("[INFO] Verifying password...")
        if super_admin.check_password(password):
            print("[OK] Password verification successful!")
        else:
            print("[ERROR] Password verification failed!")
        print()

        print("=" * 70)
        print("Super Admin Login Credentials")
        print("=" * 70)
        print(f"URL: https://audiapro-backend.onrender.com/superadmin/login")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print()
        print("[IMPORTANT] Use the /superadmin/login URL, NOT the regular /login!")
        print()
        print("Super Admin Features:")
        print("  - View ALL tenants and calls")
        print("  - Create/manage tenants")
        print("  - Revenue dashboard")
        print("  - System-wide administration")
        print()

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
