"""
Set webhook credentials for demo-company tenant on production
"""

import requests
import bcrypt

# Production API
API_URL = "https://timhayes-bo-production-58c5.up.railway.app/api"

# Login as admin
print("Logging in as admin...")
login_response = requests.post(
    f"{API_URL}/auth/login",
    json={
        "email": "admin@demo.com",
        "password": "Admin123!"
    }
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print("Logged in successfully!")

# Set webhook credentials
print("\nSetting webhook credentials...")
webhook_username = "admin"
webhook_password = "4Xkilla1@"

# Try to update tenant settings with webhook credentials
response = requests.put(
    f"{API_URL}/settings",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "webhook_username": webhook_username,
        "webhook_password": webhook_password
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("\n>> SUCCESS! Webhook credentials set")
    print(f">> Username: {webhook_username}")
    print(f">> Password: {webhook_password}")
    print("\nYou can now run: python test_live_call.py")
else:
    print("\n>> Note: You may need to set credentials via the Integrations panel in the UI")
    print(">> Go to: https://audiapro.com/integrations")
