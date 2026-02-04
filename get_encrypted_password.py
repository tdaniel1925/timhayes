#!/usr/bin/env python3
"""
Generate encrypted webhook password that matches what Render expects

Usage:
    python get_encrypted_password.py YOUR_ENCRYPTION_KEY_HERE

Run this to get the encrypted value, then manually update it in Supabase
"""
from cryptography.fernet import Fernet
import secrets
import sys

print("="*70)
print("Webhook Password Encryption Helper")
print("="*70)
print()

if len(sys.argv) < 2:
    print("[ERROR] Missing ENCRYPTION_KEY argument!")
    print()
    print("Usage:")
    print("  python get_encrypted_password.py YOUR_ENCRYPTION_KEY")
    print()
    print("STEPS:")
    print("1. Go to Render Dashboard: https://dashboard.render.com")
    print("2. Select 'audiapro-backend' service")
    print("3. Click 'Environment' tab")
    print("4. Find and COPY the value of 'ENCRYPTION_KEY'")
    print("5. Run: python get_encrypted_password.py PASTE_KEY_HERE")
    print()
    sys.exit(1)

encryption_key_input = sys.argv[1].strip()

if not encryption_key_input:
    print()
    print("[ERROR] No encryption key provided!")
    print()
    print("Alternative: Just store the password as plain text and disable encryption")
    print("(but this is less secure)")
    exit(1)

try:
    # Create cipher with the key from Render
    cipher = Fernet(encryption_key_input.encode())

    # Encrypt the webhook password
    webhook_password = "TestWebhook123!"
    encrypted = cipher.encrypt(webhook_password.encode()).decode()

    print()
    print("="*70)
    print("[SUCCESS] Encrypted password generated!")
    print("="*70)
    print()
    print("Now update the database:")
    print()
    print("SQL Command:")
    print("-"*70)
    print(f"UPDATE tenants")
    print(f"SET webhook_password = '{encrypted}'")
    print(f"WHERE subdomain = 'testcompany';")
    print("-"*70)
    print()
    print("OR use Supabase Dashboard:")
    print("1. Go to: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Click 'Table Editor' → 'tenants'")
    print("4. Find row where subdomain = 'testcompany'")
    print(f"5. Update webhook_password column to: {encrypted[:50]}...")
    print()

except Exception as e:
    print(f"[ERROR] Failed to encrypt: {e}")
    print()
    print("Make sure you copied the ENCRYPTION_KEY correctly from Render")
