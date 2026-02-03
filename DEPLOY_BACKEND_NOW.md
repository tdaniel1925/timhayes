# Deploy Backend to Railway - Quick Start

## The Problem

Both `audiapro.com` and `timhayes-production.up.railway.app` are serving your **frontend** (React app), not the backend API.

This happened because your `nixpacks.toml` was building both frontend and backend together.

## The Fix

I've created separate configurations. Now you need to:

1. **Create a NEW Railway service for backend** (5 min)
2. **Update your EXISTING frontend service** (2 min)
3. **Test everything** (3 min)

Total time: **10 minutes**

---

## Quick Steps

### 1. Create Backend Service (5 min)

1. Go to https://railway.app → Your project
2. Click **"+ New"** → **"Empty Service"**
3. Name it: **"Backend"**
4. Click **"Settings"** → **"Source"** → **"Connect Repo"**
5. Select your GitHub repo
6. **Important:** Root Directory = `/` (root)
7. Go to **"Variables"** tab and add:
   ```
   JWT_SECRET_KEY=5OK7xUNPhKub8w1hKDB9RnX2AMbflkEKoBgG4robNa0
   ENCRYPTION_KEY=sW7IDYTFIB0tqy5NUMbHG5q7AYokVAoEtAP1tZuQDMI=
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   DEBUG=false
   WEBHOOK_USERNAME=admin
   WEBHOOK_PASSWORD=your_webhook_password
   ```
8. Go to **"Settings"** → **"Networking"** → **"Generate Domain"**
9. **Copy the URL** you get (something like: `backend-production-xxxx.up.railway.app`)

### 2. Update Frontend Service (2 min)

1. Go to your existing frontend service (the one at audiapro.com)
2. Click **"Settings"** → **"Source"**
3. Set **"Root Directory"** to: `/frontend`
4. Go to **"Variables"** tab and add:
   ```
   VITE_API_URL=https://backend-production-xxxx.up.railway.app
   ```
   (Replace with YOUR backend URL from step 1)

### 3. Commit and Push Changes (1 min)

The configuration files are ready. Just commit and push:

```bash
cd "C:\dev\1 - Tim Hayes"
git add .
git commit -m "Separate backend and frontend Railway configs"
git push
```

Railway will auto-deploy both services!

### 4. Test Backend (2 min)

Wait 2-3 minutes for deployment, then test:

```bash
# Replace with YOUR backend URL
curl https://backend-production-xxxx.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

If it works, **YOU'RE DONE!** 🎉

---

## Test Phone Calls

Once backend is deployed:

```bash
# Create super admin
curl -X POST https://backend-production-xxxx.up.railway.app/api/superadmin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!","full_name":"Admin"}'

# Then test phone calls
python test_phone_calls.py https://backend-production-xxxx.up.railway.app demo admin your_webhook_password
```

---

## What Changed

✅ **`nixpacks.toml`** - Now backend-only (removed frontend build)
✅ **`frontend/nixpacks.toml`** - NEW file for frontend deployment
✅ **`railway.toml`** - Updated with proper start command
✅ **`Procfile`** - Updated for gunicorn
✅ **`frontend/package.json`** - Added `serve` dependency

---

## Need Help?

See `RAILWAY_DEPLOYMENT_COMPLETE.md` for detailed guide with troubleshooting.

---

## Summary

**Before:**
- One service serving frontend at both URLs
- Backend API not accessible ❌

**After:**
- Backend service with API at backend-production-xxxx.up.railway.app ✅
- Frontend service with React app at audiapro.com ✅
- Phone calls can be tested ✅

**Your next step:** Go to Railway dashboard and create the backend service!
