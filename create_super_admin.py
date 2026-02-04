#!/usr/bin/env python3
"""
Create Super Admin Account
Run this once to create the initial super admin user
"""

import os
import sys
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable not set")
    print("Set it with: export DATABASE_URL='your-database-url'")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"🔗 Connecting to database...")
engine = create_engine(DATABASE_URL)

def create_super_admin():
    """Create super admin account"""

    email = "superadmin@audia.com"
    password = "SuperAdmin123!"  # Change this after first login!
    full_name = "Super Administrator"

    print(f"\n👤 Creating super admin account...")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"   ⚠️  IMPORTANT: Change this password after first login!\n")

    with engine.connect() as conn:
        # Check if super admin already exists
        result = conn.execute(text("""
            SELECT id, email FROM managers WHERE email = :email
        """), {"email": email})

        existing = result.fetchone()

        if existing:
            print(f"✅ Super admin already exists (ID: {existing[0]})")
            return existing[0]

        # Create super admin
        password_hash = generate_password_hash(password)

        result = conn.execute(text("""
            INSERT INTO managers (email, password, full_name, is_super_admin, created_at)
            VALUES (:email, :password, :full_name, TRUE, NOW())
            RETURNING id
        """), {
            "email": email,
            "password": password_hash,
            "full_name": full_name
        })

        manager_id = result.fetchone()[0]
        conn.commit()

        print(f"✅ Super admin created successfully (ID: {manager_id})")
        return manager_id

if __name__ == '__main__':
    try:
        manager_id = create_super_admin()

        print(f"\n🎉 Setup complete!")
        print(f"\n📝 Super Admin Login Credentials:")
        print(f"   URL: https://timhayes-bo-production-58c5.up.railway.app/super-admin")
        print(f"   Email: superadmin@audia.com")
        print(f"   Password: SuperAdmin123!")
        print(f"\n⚠️  SECURITY: Change the password immediately after first login!")
        print(f"\n📚 Next steps:")
        print(f"   1. Login to super admin panel")
        print(f"   2. Seed AI features via API or database")
        print(f"   3. Change your password\n")

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
