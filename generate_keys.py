#!/usr/bin/env python3
"""
Generate secure keys for AudiaPro production deployment
Run this script to generate JWT_SECRET_KEY and ENCRYPTION_KEY
"""

import secrets
from cryptography.fernet import Fernet

print("=" * 60)
print("AudiaPro - Security Key Generator")
print("=" * 60)
print()

# Generate JWT Secret Key
jwt_secret = secrets.token_urlsafe(32)
print("JWT_SECRET_KEY (for JWT token signing):")
print(jwt_secret)
print()

# Generate Encryption Key
encryption_key = Fernet.generate_key().decode()
print("ENCRYPTION_KEY (for database encryption):")
print(encryption_key)
print()

print("=" * 60)
print("INSTRUCTIONS:")
print("=" * 60)
print("1. Copy the keys above")
print("2. Add them to your .env file:")
print()
print("   JWT_SECRET_KEY=" + jwt_secret)
print("   ENCRYPTION_KEY=" + encryption_key)
print()
print("3. IMPORTANT: Keep these keys SECRET and NEVER commit them to git!")
print("4. Restart your backend server after updating .env")
print("=" * 60)
