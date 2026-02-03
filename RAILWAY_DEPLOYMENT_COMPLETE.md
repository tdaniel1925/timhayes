# Complete Railway Deployment Guide

## Problem Identified

Your current Railway deployment has **frontend and backend combined** into one service. This is why both URLs serve the React frontend.

We need **TWO separate Railway services**:
1. **Backend Service** - Python API (audiapro.com/api or backend.audiapro.com)
2. **Frontend Service** - React App (audiapro.com)

---

## Solution: Deploy Backend as Separate Service

### Step 1: Create Backend Service in Railway

1. Go to https://railway.app
2. Open your AudiaPro project
3. Click **"+ New"** button
4. Select **"Empty Service"**
5. Name it: **"Backend"** or **"API"**

### Step 2: Deploy Backend Code

#### Option A: From GitHub (Recommended)

1. In the new Backend service, click **"Settings"**
2. Under **"Source"**, click **"Connect Repo"**
3. Select your GitHub repository
4. **Important:** Set **"Root Directory"** to `/` (root)
5. Railway will detect `nixpacks.toml` and deploy Python app

#### Option B: From CLI

```bash
cd "C:\dev\1 - Tim Hayes"
railway link
railway up
```

### Step 3: Configure Environment Variables for Backend

In Railway dashboard → Backend service → **Variables** tab, add these:

#### Required Security Keys
```bash
JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
```

#### AI Services
```bash
OPENAI_API_KEY=your_openai_api_key_here
TRANSCRIPTION_ENABLED=true
SENTIMENT_ENABLED=true
```

#### Server Configuration
```bash
PORT=5000
DEBUG=false
WEBHOOK_PORT=5000
WEBHOOK_USERNAME=admin
WEBHOOK_PASSWORD=your_webhook_password
```

#### Optional (Add when ready)
```bash
# PayPal
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@audiapro.com

# Frontend URL (will get this after frontend deployment)
FRONTEND_URL=https://audiapro.com
```

### Step 4: Add PostgreSQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically links it to your backend
4. `DATABASE_URL` environment variable is auto-created

**Note:** If you want to keep using SQLite for now, skip this step. But PostgreSQL is recommended for production.

### Step 5: Get Backend URL

1. Go to Backend service → **Settings** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. You'll get a URL like: `backend-production-xxxx.up.railway.app`
5. **Copy this URL** - you'll need it!

### Step 6: Configure Custom Domain for Backend (Optional)

1. In Backend service → **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add: `api.audiapro.com`
4. Follow DNS instructions:
   - Type: `CNAME`
   - Name: `api`
   - Value: `backend-production-xxxx.up.railway.app`
5. Wait for DNS propagation (5-30 minutes)

---

## Step 7: Update Frontend Configuration

### Update Frontend Service

1. Go to your existing Frontend service (the one at audiapro.com)
2. Go to **Settings** → **Source**
3. Set **"Root Directory"** to: `/frontend`
4. This tells Railway to only deploy the frontend folder

### Set Frontend Environment Variables

In Frontend service → **Variables** tab:

```bash
VITE_API_URL=https://backend-production-xxxx.up.railway.app
```

Or if you set up custom domain:
```bash
VITE_API_URL=https://api.audiapro.com
```

---

## Step 8: Redeploy Everything

1. **Backend Service:**
   - Should auto-deploy with new config
   - Check logs for: "Starting on port 5000"
   - Check for: NO "ENCRYPTION_KEY not set" warning

2. **Frontend Service:**
   - Should auto-redeploy with new root directory
   - Will now only build React app

---

## Step 9: Verify Deployment

### Test Backend API

```bash
# Replace with your actual backend URL
curl https://backend-production-xxxx.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-03T..."}
```

### Test Super Admin Registration

```bash
BACKEND_URL="https://backend-production-xxxx.up.railway.app"

curl -X POST $BACKEND_URL/api/superadmin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "full_name": "Admin User"
  }'
```

### Test Frontend

1. Go to https://audiapro.com
2. Should see the AudiaPro login page
3. Go to https://audiapro.com/superadmin/login
4. Login with admin@test.com / Admin123!
5. Should see super admin dashboard

---

## Step 10: Test Phone Calls

Once both services are deployed:

```bash
# Test webhook
python test_phone_calls.py https://backend-production-xxxx.up.railway.app demo admin your_webhook_password
```

---

## Configuration Files Created

✅ **`railway.toml`** - Backend Railway configuration
✅ **`Procfile`** - Alternative start command
✅ **`nixpacks.toml`** - Backend-only build config (updated)
✅ **`frontend/nixpacks.toml`** - Frontend-only build config (NEW)
✅ **`frontend/package.json`** - Added `serve` dependency

---

## Architecture After Deployment

```
┌─────────────────────────────────────┐
│         audiapro.com                │
│      (Frontend - React)             │
│                                     │
│  Routes:                            │
│  - /                                │
│  - /login                           │
│  - /superadmin/login                │
│  - /dashboard                       │
└─────────────┬───────────────────────┘
              │
              │ API Calls
              ↓
┌─────────────────────────────────────┐
│   api.audiapro.com (or Railway URL) │
│      (Backend - Python/Flask)       │
│                                     │
│  Endpoints:                         │
│  - /api/health                      │
│  - /api/login                       │
│  - /api/superadmin/register         │
│  - /api/webhook/cdr/:subdomain      │
│  - /api/calls                       │
│  - ... all other API endpoints      │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│     PostgreSQL Database             │
│     (Railway Plugin)                │
└─────────────────────────────────────┘
```

---

## Quick Commands Reference

### Check Backend Deployment
```bash
# Health check
curl https://your-backend-url/api/health

# View logs
railway logs --service backend
```

### Check Frontend Deployment
```bash
# View site
open https://audiapro.com

# View logs
railway logs --service frontend
```

### Redeploy Backend
```bash
cd "C:\dev\1 - Tim Hayes"
git add .
git commit -m "Update backend config"
git push
# Railway auto-deploys on push
```

### Redeploy Frontend
```bash
cd "C:\dev\1 - Tim Hayes"
git add frontend/
git commit -m "Update frontend"
git push
# Railway auto-deploys on push
```

---

## Troubleshooting

### "404 Not Found" on /api/health

**Problem:** Backend not deployed or wrong URL

**Solution:**
- Check Railway backend service is running
- Verify you're using backend URL, not frontend URL
- Check deployment logs for errors

### "ENCRYPTION_KEY not set" in Backend Logs

**Problem:** Environment variables not loaded

**Solution:**
- Go to Backend service → Variables
- Add ENCRYPTION_KEY and JWT_SECRET_KEY
- Click "Redeploy"

### Frontend Shows "Cannot connect to API"

**Problem:** VITE_API_URL not set or incorrect

**Solution:**
- Go to Frontend service → Variables
- Set VITE_API_URL to backend URL
- Must start with https://
- Must NOT have trailing slash

### Backend Crashes on Startup

**Problem:** Database connection error or missing dependencies

**Solution:**
- Check DATABASE_URL is set
- For PostgreSQL: Make sure PostgreSQL plugin is added
- For SQLite: It's included, but not recommended for production
- Check logs for specific error

---

## Current Status

### What You Have Now ❌
- One Railway service serving frontend at both URLs
- Backend API not accessible
- Cannot test phone calls

### What You'll Have After This Guide ✅
- Separate backend service with API endpoints
- Separate frontend service with React app
- Backend accessible at api.audiapro.com
- Frontend at audiapro.com
- Phone calls can be tested
- Multi-tenant system fully functional

---

## Next Steps After Deployment

1. ✅ Create super admin account
2. ✅ Create demo tenant
3. ✅ Test phone call webhooks
4. ✅ Verify dashboard displays calls
5. ⏳ Add PayPal for payments
6. ⏳ Set up email notifications
7. ⏳ Configure real PBX systems

---

## Summary

**Files modified/created:**
- `railway.toml` - Backend config ✅
- `Procfile` - Backend start command ✅
- `nixpacks.toml` - Backend-only build ✅
- `frontend/nixpacks.toml` - Frontend build (NEW) ✅
- `frontend/package.json` - Added serve dependency ✅

**What you need to do:**
1. Create new "Backend" service in Railway
2. Deploy backend code to it
3. Add environment variables
4. Update frontend service root directory to `/frontend`
5. Set VITE_API_URL in frontend variables
6. Test both services

**Time estimate:** 15-20 minutes

Ready to deploy! Follow the steps above and let me know if you hit any issues.
