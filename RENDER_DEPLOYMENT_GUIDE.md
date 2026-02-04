# Deploy AudiaPro to Supabase + Render

Complete guide to deploy your call analytics platform using Supabase (database + storage) and Render (hosting).

## ✅ Prerequisites

You should already have:
- ✅ Supabase project created
- ✅ Supabase database URL
- ✅ Supabase Storage bucket (`call-recordings`)
- ✅ Render account

---

## Part 1: Push Code to GitHub

### 1. Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Prepare for Supabase + Render deployment"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `audiapro-backend`)
3. **Important**: Make it **Private** (contains sensitive configuration)
4. Don't initialize with README (you already have one)

### 3. Push to GitHub

```bash
git remote add origin https://github.com/YOUR-USERNAME/audiapro-backend.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy to Render

### 1. Create New Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository you just created

### 2. Configure Service

Fill in the following:

| Setting | Value |
|---------|-------|
| **Name** | `audiapro-backend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| **Instance Type** | `Free` (or upgrade later) |

### 3. Add Environment Variables

Click **"Advanced"** and add these environment variables:

#### Required Variables (Add Now)

```bash
# Database (from Supabase)
DATABASE_URL = postgresql://postgres:ttandSellaBella1234@db.fcubjohwzfhjcwcnwost.supabase.co:5432/postgres

# Supabase Storage
SUPABASE_URL = https://fcubjohwzfhjcwcnwost.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdWJqb2h3emZoamN3Y253b3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMzMTAsImV4cCI6MjA4NTc2OTMxMH0.WQCFYX1CODvDDisCxD4qEAGXyZR5_A8DdeSDPgceqGM
SUPABASE_BUCKET = call-recordings

# JWT Secret (generate a random string)
JWT_SECRET_KEY = [Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"]

# Encryption Key (generate with command below)
ENCRYPTION_KEY = [Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"]

# UCM Settings (your Grandstream UCM)
UCM_IP = [Your UCM IP address]
UCM_USERNAME = admin
UCM_PASSWORD = [Your UCM password]
UCM_PORT = 8089

# Webhook Authentication
WEBHOOK_USERNAME = admin
WEBHOOK_PASSWORD = [Choose a strong password]
```

#### Optional Variables (Add Later)

```bash
# OpenAI (for transcription)
OPENAI_API_KEY = sk-your-openai-key
TRANSCRIPTION_ENABLED = true
SENTIMENT_ENABLED = true

# Email (Resend)
RESEND_API_KEY = re_your_key
RESEND_FROM_EMAIL = noreply@yourdomain.com

# PayPal (for payments)
PAYPAL_MODE = sandbox
PAYPAL_CLIENT_ID = your_client_id
PAYPAL_CLIENT_SECRET = your_secret
```

### 4. Generate Required Keys

On your local machine, run these commands:

#### Generate JWT Secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Generate Encryption Key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the outputs and paste into Render environment variables.

### 5. Deploy!

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your app
   - Give you a URL like: `https://audiapro-backend.onrender.com`

This takes about 5-10 minutes.

---

## Part 3: Initialize Database

### 1. Wait for Deployment

Wait until Render shows **"Live"** status (green).

### 2. Run Database Setup

Open a new terminal and run:

```bash
# Set your Supabase DATABASE_URL
$env:DATABASE_URL="postgresql://postgres:ttandSellaBella1234@db.fcubjohwzfhjcwcnwost.supabase.co:5432/postgres"

# Run setup script
python setup_features_simple.py
```

This will:
- ✅ Create all database tables
- ✅ Create super admin account
- ✅ Seed 24 AI features

### 3. Verify Database

Check your Supabase dashboard:
1. Go to **Table Editor**
2. You should see tables: `tenants`, `users`, `cdr_records`, `ai_features`, etc.

---

## Part 4: Configure CloudUCM Webhook

### 1. Get Your Render URL

From Render dashboard, copy your app URL:
```
https://audiapro-backend.onrender.com
```

### 2. Update CloudUCM Settings

1. Log into your CloudUCM web interface
2. Go to: **Integrations → API Configuration → CDR Real-Time Output Settings**
3. Configure:

| Setting | Value |
|---------|-------|
| **Enable** | ✓ |
| **Server Address** | `audiapro-backend.onrender.com` |
| **Port** | `443` |
| **Delivery Method** | `HTTPS` |
| **Format** | `JSON` |
| **URL Path** | `/api/cdr` |
| **Username** | `admin` (or your WEBHOOK_USERNAME) |
| **Password** | [Your WEBHOOK_PASSWORD from Render] |

4. Click **Save**

---

## Part 5: Test the System

### 1. Test Webhook Endpoint

```bash
curl https://audiapro-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "storage": "connected"
}
```

### 2. Login to Admin Panel

1. Go to: `https://audiapro-backend.onrender.com/super-admin`
2. Login with:
   - Email: `superadmin@audia.com`
   - Password: `SuperAdmin123!`
3. ⚠️ **Change password immediately!**

### 3. Make a Test Call

1. Make a phone call through your UCM
2. Wait for it to end
3. Check Render logs: `Render Dashboard → Logs`
4. You should see:
   ```
   Received CDR webhook from tenant X
   Downloading recording from UCM for call Y
   ✅ Recording stored in Supabase: tenant_1/uniqueid_file.wav
   ```

### 4. Verify Recording in Supabase

1. Go to Supabase → **Storage**
2. Open `call-recordings` bucket
3. You should see: `tenant_1/[uniqueid]_[filename].wav`

---

## 🎉 Success!

Your system is now fully deployed:

- ✅ **Database**: Supabase PostgreSQL
- ✅ **Storage**: Supabase Storage (call recordings)
- ✅ **Backend**: Render (Python Flask app)
- ✅ **Webhook**: Receiving calls from CloudUCM
- ✅ **AI**: Ready for transcription (when OpenAI key added)

---

## Next Steps

### 1. Add OpenAI for Transcription

1. Get API key: https://platform.openai.com/api-keys
2. Add to Render environment variables:
   ```
   OPENAI_API_KEY = sk-your-key
   TRANSCRIPTION_ENABLED = true
   SENTIMENT_ENABLED = true
   ```
3. Restart your Render service

### 2. Deploy Frontend (Optional)

If you have a React/Vue frontend:
1. Deploy to Vercel or Render Static Site
2. Update `FRONTEND_URL` in environment variables

### 3. Custom Domain (Optional)

In Render:
1. Go to **Settings → Custom Domain**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow DNS instructions

### 4. Enable AI Features

1. Login to Super Admin panel
2. Click on your tenant
3. Enable AI features you want
4. Set pricing (if applicable)

---

## Troubleshooting

### Deployment Failed

Check Render logs for errors:
- Missing dependencies? Check `requirements.txt`
- Database connection failed? Verify `DATABASE_URL`

### Webhook Not Working

1. Check CloudUCM webhook logs
2. Verify HTTPS (not HTTP)
3. Test with curl:
   ```bash
   curl -X POST https://audiapro-backend.onrender.com/api/cdr \
     -u admin:your-webhook-password \
     -H "Content-Type: application/json" \
     -d '{"uniqueid":"test123","src":"1001","dst":"2002"}'
   ```

### Recordings Not Uploading

1. Check Supabase Storage bucket exists: `call-recordings`
2. Verify bucket is **private** (not public)
3. Check Render logs for upload errors
4. Verify `SUPABASE_KEY` is the **anon** key (not service role)

### Database Connection Errors

1. Verify `DATABASE_URL` uses `postgresql://` (not `postgres://`)
2. Check Supabase is not paused (happens on free tier after inactivity)
3. Restart Render service

---

## Cost Estimate

### Free Tier Coverage:

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| **Supabase** | 500 MB DB, 1 GB storage | Database + ~100-200 calls |
| **Render** | 750 hrs/month | 24/7 uptime |
| **OpenAI** | Pay-as-you-go | ~$3/day for 100 calls @ 5 min |

### When to Upgrade:

- **Supabase**: Upgrade to Pro ($25/mo) at ~500+ calls/month
- **Render**: Upgrade to Starter ($7/mo) for always-on + better performance
- **OpenAI**: Just pay for usage (~$0.006/minute)

---

## Support

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Your Setup**: See `SETUP_INSTRUCTIONS.md`
