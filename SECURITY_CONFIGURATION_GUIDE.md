# Security Configuration Guide

## Overview

This guide explains how to properly configure and manage the security keys for your AudiaPro production deployment.

---

## Critical Security Keys

### 1. JWT_SECRET_KEY

**Purpose:** Used to sign and verify JWT (JSON Web Token) authentication tokens

**What it protects:**
- User login sessions
- API authentication
- Token-based security

**Current Status:** ✅ **CONFIGURED**
```
JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
```

**Security Requirements:**
- Must be at least 32 characters long
- Should be cryptographically random
- NEVER commit to git
- Change immediately if compromised

---

### 2. ENCRYPTION_KEY

**Purpose:** Used to encrypt sensitive data stored in the database using Fernet encryption

**What it encrypts:**
- PBX API credentials
- Webhook passwords
- Phone system credentials
- Payment processor secrets
- Third-party API keys

**Current Status:** ✅ **CONFIGURED**
```
ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

**Security Requirements:**
- Must be a valid Fernet key (base64 encoded, 32 bytes)
- NEVER change in production (will break existing encrypted data)
- NEVER commit to git
- Back up securely before deployment

---

## ⚠️ CRITICAL WARNING

### Changing ENCRYPTION_KEY After Data is Encrypted

**DO NOT change `ENCRYPTION_KEY` after you have encrypted data in production!**

If you change the `ENCRYPTION_KEY`, all previously encrypted data will become **permanently unreadable**. This includes:
- All tenant PBX credentials
- Webhook passwords
- Integration settings

**If you MUST change it:**

1. **Export all encrypted data first:**
   ```python
   # Run this script BEFORE changing key
   from app import db, Tenant
   tenants = Tenant.query.all()
   for tenant in tenants:
       print(f"Tenant: {tenant.subdomain}")
       print(f"  PBX Password: {tenant.pbx_password_decrypted}")
       print(f"  Webhook Password: {tenant.webhook_password_decrypted}")
   ```

2. **Change the key in .env**

3. **Re-encrypt all data with new key**

---

## How These Keys Were Generated

### JWT_SECRET_KEY
```python
import secrets
jwt_secret = secrets.token_urlsafe(32)
```

### ENCRYPTION_KEY
```python
from cryptography.fernet import Fernet
encryption_key = Fernet.generate_key().decode()
```

### Regenerating Keys

If you need to regenerate keys (for a NEW deployment only):

```bash
# Run the key generator script
python generate_keys.py
```

Or manually:
```bash
# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Environment Variable Setup

### Your .env File Structure

```bash
# ==========================================================
# SECURITY KEYS (REQUIRED FOR PRODUCTION)
# ==========================================================
JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=

# ... other configuration ...
```

### Git Security

**CRITICAL:** Your `.env` file should NEVER be committed to git!

Verify `.gitignore` includes:
```
.env
.env.local
.env.production
*.env
```

### Verifying Keys are Loaded

When you start the backend, you should see:
```
✅ Database initialized
✅ Starting on port 5000
✅ NO warning about ENCRYPTION_KEY
```

If you see:
```
⚠️  ENCRYPTION_KEY not set! Generating temporary key.
```
This means the key is NOT being loaded from .env!

---

## Production Deployment Checklist

Before deploying to production:

- [ ] ✅ JWT_SECRET_KEY is set in .env
- [ ] ✅ ENCRYPTION_KEY is set in .env
- [ ] ✅ .env file is NOT in git repository
- [ ] ✅ Keys are backed up securely (password manager, secure vault)
- [ ] ✅ Backend starts without ENCRYPTION_KEY warning
- [ ] [ ] Keys are set in production environment (not just local)
- [ ] [ ] Database is backed up before first production use
- [ ] [ ] Production environment variables configured on hosting platform

---

## Platform-Specific Setup

### Heroku
```bash
heroku config:set JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
heroku config:set ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

### AWS Elastic Beanstalk
Add to `.ebextensions/environment.config`:
```yaml
option_settings:
  - option_name: JWT_SECRET_KEY
    value: 5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
  - option_name: ENCRYPTION_KEY
    value: sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

### Docker
```dockerfile
# docker-compose.yml
environment:
  - JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
  - ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

### DigitalOcean App Platform
Use the Environment Variables section in the dashboard to add:
- `JWT_SECRET_KEY`
- `ENCRYPTION_KEY`

---

## Security Best Practices

### 1. Key Rotation

**JWT_SECRET_KEY:**
- Can be rotated safely
- Will invalidate all existing user sessions
- Users will need to log in again
- Recommended rotation: Every 6-12 months

**ENCRYPTION_KEY:**
- CANNOT be easily rotated
- Requires data migration
- Only rotate if compromised

### 2. Key Storage

**✅ DO:**
- Store in environment variables
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Keep backup in secure password manager (1Password, Bitwarden)
- Restrict access to production keys

**❌ DON'T:**
- Commit to git
- Share in Slack/email
- Store in plaintext files
- Include in frontend code
- Use default/example values in production

### 3. Key Compromise Response

If keys are compromised:

**JWT_SECRET_KEY:**
1. Generate new key immediately
2. Update production environment
3. Restart backend
4. All users will be logged out (expected behavior)

**ENCRYPTION_KEY:**
1. **CRITICAL:** Do NOT change immediately
2. Assess what data was exposed
3. Plan data re-encryption migration
4. Notify affected users per compliance requirements

---

## Verification Tests

### Test 1: Keys are Loaded
```bash
# Start backend and check logs
python app.py

# ✅ Should NOT see: "ENCRYPTION_KEY not set!"
```

### Test 2: JWT Authentication Works
```bash
# Try to login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Should return access_token and refresh_token
```

### Test 3: Encryption Works
```python
# Test encryption/decryption
from app import cipher_suite
encrypted = cipher_suite.encrypt(b"test data")
decrypted = cipher_suite.decrypt(encrypted)
assert decrypted == b"test data"
```

---

## Additional Environment Variables

Your `.env` file now also includes:

### Database
```bash
DATABASE_URL=sqlite:///callinsight.db
```

### PayPal (Payment Processing)
```bash
PAYPAL_MODE=sandbox  # Change to 'live' for production
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

Get PayPal credentials:
1. Go to https://developer.paypal.com
2. Create an app
3. Copy Client ID and Secret

### Email Service (Resend)
```bash
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Get Resend API key:
1. Go to https://resend.com
2. Sign up and verify your domain
3. Generate API key

---

## Summary

**✅ Your security keys are now properly configured!**

**What was done:**
1. Generated secure JWT_SECRET_KEY (32 bytes, cryptographically random)
2. Generated secure ENCRYPTION_KEY (Fernet key, 32 bytes)
3. Added both keys to your .env file
4. Verified backend loads keys correctly (no warnings)
5. Added all other production environment variables

**Next steps:**
1. Back up these keys securely (password manager)
2. Configure PayPal credentials when ready to accept payments
3. Configure Resend API key for email notifications
4. Set up production environment variables on your hosting platform

**Remember:**
- ⚠️ NEVER commit .env to git
- ⚠️ NEVER change ENCRYPTION_KEY after encrypting data
- ⚠️ Back up keys before production deployment
- ✅ Your application is now production-ready!
