# Railway Deployment Guide

## Adding Environment Variables to Railway

### Step 1: Access Your Project

1. Go to https://railway.app
2. Log in to your account
3. Select your AudiaPro project

### Step 2: Add Environment Variables

1. Click on your backend service
2. Go to the **Variables** tab
3. Click **+ New Variable**
4. Add each variable one by one:

---

## Required Environment Variables

Copy and paste these into Railway:

### 🔐 Security Keys (CRITICAL)

```
JWT_SECRET_KEY
5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
```

```
ENCRYPTION_KEY
sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

### 🗄️ Database

Railway will automatically provide `DATABASE_URL` if you add a PostgreSQL plugin.
If using Railway's PostgreSQL, you don't need to set this manually.

If you want to use your own database:
```
DATABASE_URL
postgresql://user:password@host:port/dbname
```

### 🤖 AI Services

```
OPENAI_API_KEY
your_openai_api_key_here
```

```
TRANSCRIPTION_ENABLED
true
```

```
SENTIMENT_ENABLED
true
```

### 💳 PayPal (Payment Processing)

```
PAYPAL_MODE
sandbox
```
(Change to `live` when ready for production)

```
PAYPAL_CLIENT_ID
your_paypal_client_id
```

```
PAYPAL_CLIENT_SECRET
your_paypal_client_secret
```

Get PayPal credentials from: https://developer.paypal.com

### 📧 Email Service (Resend)

```
RESEND_API_KEY
re_your_resend_api_key_here
```

```
RESEND_FROM_EMAIL
noreply@yourdomain.com
```

Get Resend API key from: https://resend.com

### 🌐 Frontend Configuration

```
FRONTEND_URL
https://your-frontend-url.railway.app
```
(Update with your actual Railway frontend URL)

### 📞 Webhook Configuration

```
WEBHOOK_PORT
5000
```

```
WEBHOOK_USERNAME
admin
```

```
WEBHOOK_PASSWORD
your_webhook_password
```

### 📞 Grandstream UCM (Optional - if you use Grandstream)

```
UCM_IP
192.168.1.100
```

```
UCM_USERNAME
admin
```

```
UCM_PASSWORD
your_ucm_password
```

```
UCM_HTTPS_PORT
8089
```

### 🎯 Server Configuration

```
PORT
5000
```

```
DEBUG
false
```

---

## Alternative: Railway CLI Method

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

### Step 3: Link Project

```bash
cd "C:\dev\1 - Tim Hayes"
railway link
```

### Step 4: Add Variables

```bash
# Security Keys
railway variables set JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
railway variables set ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=

# AI Services
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set TRANSCRIPTION_ENABLED=true
railway variables set SENTIMENT_ENABLED=true

# PayPal
railway variables set PAYPAL_MODE=sandbox
railway variables set PAYPAL_CLIENT_ID=your_paypal_client_id
railway variables set PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email
railway variables set RESEND_API_KEY=re_your_resend_api_key_here
railway variables set RESEND_FROM_EMAIL=noreply@yourdomain.com

# Frontend
railway variables set FRONTEND_URL=https://your-frontend-url.railway.app

# Webhook
railway variables set WEBHOOK_PORT=5000
railway variables set WEBHOOK_USERNAME=admin
railway variables set WEBHOOK_PASSWORD=your_webhook_password

# Server
railway variables set PORT=5000
railway variables set DEBUG=false
```

---

## Database Setup on Railway

### Option 1: Add PostgreSQL Plugin (Recommended)

1. In Railway dashboard, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically:
   - Create the database
   - Set the `DATABASE_URL` environment variable
   - Link it to your service

### Option 2: External Database

If using an external PostgreSQL database, add manually:
```bash
railway variables set DATABASE_URL=postgresql://user:password@host:port/dbname
```

---

## Deployment Checklist

Before deploying to Railway:

- [ ] ✅ JWT_SECRET_KEY added to Railway
- [ ] ✅ ENCRYPTION_KEY added to Railway
- [ ] ✅ OPENAI_API_KEY added to Railway
- [ ] ✅ PostgreSQL database added (Railway plugin or external)
- [ ] ✅ FRONTEND_URL updated with actual Railway URL
- [ ] [ ] PayPal credentials added (when ready for payments)
- [ ] [ ] Resend API key added (when ready for emails)
- [ ] [ ] Custom domain configured (optional)
- [ ] [ ] Environment set to production (DEBUG=false)

---

## Verifying Deployment

### Check Environment Variables

In Railway dashboard:
1. Go to your service
2. Click **Variables** tab
3. Verify all keys are present (values will be hidden for security)

### Check Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. Check logs for:
   ```
   ✅ Database initialized
   ✅ Starting on port 5000
   ✅ NO "ENCRYPTION_KEY not set!" warning
   ```

### Test the API

```bash
# Replace with your Railway URL
curl https://your-app.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Important Notes

### 🔐 Security

- Railway encrypts all environment variables
- Never commit .env file to git (already in .gitignore)
- Railway dashboard shows variable names but hides values
- Use Railway's built-in secrets management

### 🔄 Updating Variables

When you update a variable in Railway:
1. Change is immediate
2. Service will automatically redeploy
3. Check logs to verify new value is loaded

### 🚨 If Deployment Fails

Common issues:

1. **"ENCRYPTION_KEY not set"**
   - Variable not added to Railway
   - Typo in variable name (must be exact)

2. **Database connection error**
   - DATABASE_URL not set
   - PostgreSQL plugin not added
   - Database credentials incorrect

3. **Module not found errors**
   - Make sure `requirements.txt` is in root directory
   - Railway auto-detects Python and installs dependencies

---

## Railway Configuration Files

Railway auto-detects your Python app, but you can customize with `railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "python app.py"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

---

## Database Migration

If you have existing data in SQLite that needs to move to PostgreSQL:

### Step 1: Export from SQLite

```bash
sqlite3 callinsight.db .dump > database_dump.sql
```

### Step 2: Import to PostgreSQL

```bash
psql $DATABASE_URL < database_dump.sql
```

Or use a migration tool like `pgloader`.

---

## Production Readiness

### Before Going Live

1. ✅ All environment variables set
2. ✅ Database connected and tested
3. ✅ PayPal in production mode (`PAYPAL_MODE=live`)
4. ✅ Real PayPal credentials (not sandbox)
5. ✅ Email service configured and tested
6. ✅ Custom domain configured
7. ✅ SSL certificate active (automatic on Railway)
8. ✅ Monitoring/alerting configured
9. ✅ Backup strategy in place
10. ✅ Error tracking configured (optional: Sentry)

---

## Cost Optimization

Railway charges based on usage:

- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

**Tips:**
- Use Railway's PostgreSQL (included in plan)
- Set up auto-scaling limits
- Monitor resource usage in dashboard
- Use sleep/wake for development environments

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Status Page: https://status.railway.app

---

## Quick Reference

### Essential Railway Commands

```bash
# Login
railway login

# Link project
railway link

# View logs
railway logs

# Open dashboard
railway open

# Run commands in Railway environment
railway run python app.py

# Deploy manually
railway up
```

---

## Summary

**What you need to do:**

1. **Go to Railway dashboard** → Your project → Backend service → **Variables** tab
2. **Add the environment variables** listed above (especially the security keys)
3. **Add PostgreSQL database** plugin
4. **Deploy** and check logs

**The keys you MUST add:**
- `JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0`
- `ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=`

Railway will automatically redeploy when you add variables. Check the logs to verify everything loaded correctly!
