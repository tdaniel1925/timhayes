#!/usr/bin/env python3
"""Create a demo tenant for testing"""

from app import app, db, Tenant, User
import bcrypt

with app.app_context():
    # Check if demo tenant exists
    tenant = Tenant.query.filter_by(subdomain='demo').first()

    if tenant:
        print(f"[OK] Demo tenant already exists: {tenant.company_name}")
        print(f"   Tenant ID: {tenant.id}")
        print(f"   Subdomain: {tenant.subdomain}")
        print(f"   Status: {tenant.status}")
    else:
        print("[INFO] Creating demo tenant...")

        # Create tenant
        tenant = Tenant(
            subdomain='demo',
            company_name='Demo Company',
            plan='professional',
            status='active',
            max_users=10,
            max_calls_per_month=1000
        )
        db.session.add(tenant)
        db.session.flush()  # Get tenant.id

        print(f"[OK] Created tenant: {tenant.company_name}")
        print(f"   Tenant ID: {tenant.id}")
        print(f"   Subdomain: {tenant.subdomain}")

        # Create admin user for the tenant
        hashed_password = bcrypt.hashpw('User123!'.encode('utf-8'), bcrypt.gensalt())

        user = User(
            tenant_id=tenant.id,
            email='user@demo.com',
            password=hashed_password.decode('utf-8'),
            full_name='Demo User',
            role='admin',
            is_active=True
        )
        db.session.add(user)

        print(f"[OK] Created user: {user.email}")
        print(f"   Password: User123!")
        print(f"   Role: {user.role}")

        db.session.commit()
        print("[SUCCESS] Demo tenant setup complete!")

    print()
    print("=" * 60)
    print("You can now test phone calls:")
    print("=" * 60)
    print("python test_phone_calls.py http://localhost:5000 demo admin your_webhook_password")
    print()
