#!/usr/bin/env python3
"""
Update tenant webhook credentials to match CloudUCM configuration
"""
import os
os.environ['DATABASE_URL'] = 'postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
os.environ['ENCRYPTION_KEY'] = 'n2TMzx4lLDV_Ok3Mac5KYuuOkQhZD05DbcqrEdRM4x0='

from app import app, db, Tenant

with app.app_context():
    # Find testcompany tenant
    tenant = Tenant.query.filter_by(subdomain='testcompany').first()

    if not tenant:
        print("[ERROR] Tenant 'testcompany' not found!")
    else:
        print(f"Found tenant: {tenant.company_name} (ID: {tenant.id})")
        print(f"Current webhook username: {tenant.webhook_username}")

        # Update webhook credentials
        tenant.webhook_username = 'admin'
        tenant._webhook_password = 'gAAAAABpg_2Otv2mgd7ZibnGoZkYfpnfyiA6ARVs64fcoMjaxvYU31hc5mpxIHCTEbbYRrGi4D2bKcKQc8RSHd3WHvQ6EfVgzA=='

        db.session.commit()

        print("[SUCCESS] Updated webhook credentials:")
        print(f"   Username: {tenant.webhook_username}")
        print(f"   Password: {tenant.webhook_password}")  # This will decrypt and show the actual password
        print(f"\nWebhook URL: https://audiapro-backend.onrender.com/api/webhook/cdr/testcompany")
