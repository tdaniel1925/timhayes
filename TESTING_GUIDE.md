# AudiaPro Testing Guide

## Overview

This guide will help you test your AudiaPro application systematically before adding payments.

---

## Phase 1: Verify Railway Deployment

### Step 1: Check Railway Deployment Status

1. Go to https://railway.app
2. Select your AudiaPro project
3. Click on your **backend service**
4. Go to **Deployments** tab
5. Check the latest deployment:
   - ✅ Status should be "Success" (green)
   - ✅ Click on the deployment to view logs

### Step 2: Verify Environment Variables Loaded

In the deployment logs, you should see:
```
✅ Database initialized
✅ Starting on port 5000
✅ Supported Phone Systems: 15
✅ NO warning about "ENCRYPTION_KEY not set!"
```

**If you see the ENCRYPTION_KEY warning:**
- The keys weren't saved properly
- Go back to Variables tab and re-add them

### Step 3: Get Your Backend URL

1. In Railway dashboard → Backend service
2. Go to **Settings** tab
3. Scroll to **Networking** section
4. You should see a URL like:
   ```
   https://yourapp-production.up.railway.app
   ```
5. **Copy this URL** - you'll need it for testing

---

## Phase 2: Test Backend API

### Health Check

Test if your backend is running:

```bash
# Replace with your Railway URL
curl https://your-backend-url.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T..."
}
```

### Test Super Admin Registration

Create your first super admin account:

```bash
curl -X POST https://your-backend-url.railway.app/api/superadmin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "full_name": "Your Name"
  }'
```

Expected response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "email": "admin@yourdomain.com",
    "full_name": "Your Name",
    "role": "superadmin"
  }
}
```

**Save your access_token!** You'll need it for authenticated requests.

### Test Login

```bash
curl -X POST https://your-backend-url.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!"
  }'
```

---

## Phase 3: Test Frontend Locally

### Step 1: Update Frontend API URL

Update your frontend to point to Railway backend:

**File:** `frontend/src/lib/api.js`

Find this line near the top:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Create a `.env` file in the `frontend` folder:

**File:** `frontend/.env`
```bash
VITE_API_URL=https://your-backend-url.railway.app
```

### Step 2: Start Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Frontend should start on `http://localhost:5173`

### Step 3: Test Frontend Features

1. **Super Admin Login**
   - Go to http://localhost:5173/superadmin/login
   - Login with your super admin credentials
   - Should see super admin dashboard

2. **Create a Tenant**
   - Click "Tenants" in sidebar
   - Click "Add Tenant"
   - Fill in:
     - Subdomain: `demo`
     - Company Name: `Demo Company`
     - Plan: `Professional`
     - Status: `Active`
   - Click "Create"

3. **Configure Tenant PBX**
   - Click on the tenant you just created
   - Go to "PBX Configuration" tab
   - Select a phone system (e.g., "3CX")
   - Enter test credentials (can be dummy for now)
   - Save

4. **Create Tenant User**
   - Stay in super admin panel
   - Go to tenant details
   - Click "Users" tab
   - Add a user with email/password

5. **Test Tenant Login**
   - Open a new incognito window
   - Go to http://demo.localhost:5173 (or your subdomain)
   - Login with the tenant user credentials
   - Should see tenant dashboard

---

## Phase 4: Test Core Features (Without Phone System)

### Test 1: Manual Call Record Creation

You can manually insert test call data to verify the analytics work:

**Create test script:** `test_data.py`

```python
#!/usr/bin/env python3
"""Create test call data for testing analytics"""

from app import app, db, Tenant, CallRecord, SentimentAnalysis
from datetime import datetime, timedelta
import random

with app.app_context():
    # Get your demo tenant
    tenant = Tenant.query.filter_by(subdomain='demo').first()

    if not tenant:
        print("❌ No 'demo' tenant found. Create one first!")
        exit(1)

    print(f"✅ Found tenant: {tenant.company_name}")

    # Create 20 test calls
    call_outcomes = ['answered', 'no-answer', 'busy', 'failed']
    sentiments = ['positive', 'neutral', 'negative']

    for i in range(20):
        # Random date in last 30 days
        days_ago = random.randint(0, 30)
        call_date = datetime.utcnow() - timedelta(days=days_ago)

        call = CallRecord(
            tenant_id=tenant.id,
            call_id=f"test-call-{i}-{random.randint(1000, 9999)}",
            caller_number=f"+1555{random.randint(1000000, 9999999)}",
            called_number=f"+1555{random.randint(1000000, 9999999)}",
            call_type='inbound' if i % 2 == 0 else 'outbound',
            call_outcome=random.choice(call_outcomes),
            call_duration=random.randint(30, 600) if random.random() > 0.3 else 0,
            timestamp=call_date
        )
        db.session.add(call)

        # Add sentiment for some calls
        if random.random() > 0.5:
            sentiment = SentimentAnalysis(
                call_record=call,
                sentiment=random.choice(sentiments),
                confidence=random.uniform(0.6, 0.95),
                positive_score=random.uniform(0, 1),
                negative_score=random.uniform(0, 1),
                neutral_score=random.uniform(0, 1)
            )
            db.session.add(sentiment)

    db.session.commit()
    print("✅ Created 20 test call records!")
    print("🔍 Check your dashboard for analytics")
```

Run it:
```bash
python test_data.py
```

### Test 2: Verify Dashboard Analytics

1. Login to tenant dashboard (http://demo.localhost:5173)
2. Check:
   - ✅ Total calls count shows 20
   - ✅ Call duration chart displays data
   - ✅ Sentiment analysis shows distribution
   - ✅ Call outcome pie chart
   - ✅ Timeline chart shows calls over time

### Test 3: Export Feature

1. Go to "Calls" page in tenant dashboard
2. Click "Export CSV"
3. Verify CSV downloads with all call data

### Test 4: Search and Filters

1. Go to "Calls" page
2. Test search by phone number
3. Test filters:
   - Call type (inbound/outbound)
   - Call outcome (answered/no-answer/etc)
   - Date range
4. Verify results update correctly

---

## Phase 5: Test Phone System Integration (Optional)

### Prerequisites

You need access to a real PBX system for this. Supported systems:
- 3CX
- FreePBX
- Asterisk
- GoTo Connect
- RingCentral
- And 10 more...

### Setup Webhook

1. In your PBX system, configure CDR webhook:
   ```
   URL: https://your-backend-url.railway.app/api/webhook/cdr/demo
   Method: POST
   Auth: Basic (username: admin, password: your_webhook_password)
   ```

2. Make a test call through your PBX

3. Check Railway logs:
   ```
   ✅ Received CDR webhook for tenant: demo
   ✅ CDR processed successfully
   ```

4. Check tenant dashboard - new call should appear

---

## Phase 6: Test Error Handling

These tests verify the crash prevention system is working:

### Test 1: Invalid Login

```bash
curl -X POST https://your-backend-url.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@email.com",
    "password": "wrongpassword"
  }'
```

Expected: Should return 401 error (not crash)

### Test 2: Invalid CDR Webhook

```bash
curl -X POST https://your-backend-url.railway.app/api/webhook/cdr/demo \
  -H "Content-Type: application/json" \
  -u "admin:your_webhook_password" \
  -d '{"invalid": "data"}'
```

Expected: Should return error message (not crash)

### Test 3: Missing Authentication

```bash
curl https://your-backend-url.railway.app/api/admin/tenants
```

Expected: Should return 401 Unauthorized (not crash)

### Test 4: Frontend Error Boundary

1. Open browser console
2. Force a React error by modifying a component temporarily
3. Verify Error Boundary shows recovery screen (not white screen)

---

## Phase 7: Performance Testing

### Load Test (Optional)

Use a tool like `k6` or `artillery` to simulate load:

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let response = http.get('https://your-backend-url.railway.app/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Run: `k6 run load-test.js`

---

## Checklist: Core Features to Test

### Authentication ✅
- [ ] Super admin registration
- [ ] Super admin login
- [ ] Tenant user login
- [ ] Token refresh
- [ ] Logout
- [ ] Invalid credentials handled properly

### Tenant Management ✅
- [ ] Create tenant
- [ ] Edit tenant details
- [ ] Configure PBX settings
- [ ] Encryption of PBX credentials
- [ ] Delete tenant

### User Management ✅
- [ ] Create tenant users
- [ ] Edit user details
- [ ] Change passwords
- [ ] Delete users
- [ ] Role-based access control

### Call Analytics ✅
- [ ] Dashboard displays correctly
- [ ] Call records appear
- [ ] Charts render properly
- [ ] Sentiment analysis works
- [ ] Export to CSV functions
- [ ] Search and filters work

### Integrations ✅
- [ ] PBX configuration saves
- [ ] Webhook authentication works
- [ ] CDR data ingestion (if PBX available)
- [ ] Multiple phone systems supported

### Error Handling ✅
- [ ] Invalid API requests handled
- [ ] Database errors don't crash system
- [ ] Frontend errors show Error Boundary
- [ ] Webhook errors logged properly

---

## Common Issues and Solutions

### Issue 1: Can't Login - "Invalid credentials"

**Cause:** Backend not connecting to database

**Solution:**
1. Check Railway logs for database errors
2. Verify DATABASE_URL is set
3. Restart Railway service

### Issue 2: CORS Errors in Browser Console

**Cause:** Frontend and backend on different domains

**Solution:**
In `app.py`, CORS is already configured. Verify Railway URL is correct.

### Issue 3: "ENCRYPTION_KEY not set" Warning

**Cause:** Environment variable not loaded

**Solution:**
1. Go to Railway → Variables tab
2. Verify ENCRYPTION_KEY is present
3. Redeploy service

### Issue 4: Frontend Shows Blank Page

**Cause:** Error Boundary caught an error

**Solution:**
1. Open browser console (F12)
2. Check for error messages
3. Review React component errors

### Issue 5: Calls Not Appearing

**Cause:** Multiple possibilities

**Solutions:**
- Webhook not configured correctly in PBX
- Authentication failing (check webhook credentials)
- Wrong subdomain in webhook URL
- Check Railway logs for webhook errors

---

## Testing Tools

### Postman Collection (Optional)

Create a Postman collection for API testing:

1. Import this collection structure:
   - Authentication
     - POST /api/superadmin/register
     - POST /api/login
     - POST /api/refresh
   - Tenants
     - GET /api/admin/tenants
     - POST /api/admin/tenants
     - PUT /api/admin/tenants/:id
   - Calls
     - GET /api/calls
     - POST /api/webhook/cdr/:subdomain

2. Set environment variables:
   - `base_url`: Your Railway URL
   - `access_token`: From login response

### Browser DevTools

Use browser DevTools to monitor:
- **Network tab**: API requests/responses
- **Console tab**: JavaScript errors
- **Application tab**: LocalStorage (tokens)

---

## Next Steps After Testing

Once you've verified everything works:

1. **Deploy Frontend to Railway**
   - Create new service in Railway
   - Deploy frontend
   - Update environment variables

2. **Configure Custom Domain** (Optional)
   - Point your domain to Railway
   - Set up SSL (automatic on Railway)
   - Configure subdomain wildcards for multi-tenancy

3. **Set Up Database Backups**
   - Configure Railway PostgreSQL backups
   - Or use external backup service

4. **Add PayPal Integration**
   - When ready to monetize
   - Follow PayPal setup in .env.example

5. **Set Up Monitoring**
   - Railway provides basic metrics
   - Optional: Add Sentry for error tracking
   - Optional: Add application performance monitoring

---

## Testing Summary

**Before considering payments:**

- ✅ Backend deployed and running on Railway
- ✅ Environment variables loaded correctly
- ✅ Super admin can login
- ✅ Can create and manage tenants
- ✅ Dashboard analytics work
- ✅ Call data displays correctly
- ✅ Export feature functions
- ✅ Error handling prevents crashes
- ✅ PBX integration configured (if testing with real PBX)

**When all above are checked, you're ready for:**
- PayPal integration
- Production deployment
- Real users

---

## Get Help

If you encounter issues during testing:

1. **Check Railway Logs**
   - Most issues show up in deployment logs
   - Look for stack traces and error messages

2. **Check Browser Console**
   - Frontend errors appear here
   - Network tab shows API request/response details

3. **Review Error Reports**
   - Check COMPREHENSIVE_ERROR_AUDIT_REPORT.md
   - Check ERROR_FIXES_APPLIED.md

---

## Current Status

✅ **Backend**: Production-ready, deployed on Railway
✅ **Security**: JWT and Encryption keys configured
✅ **Error Handling**: Comprehensive crash prevention active
✅ **Database**: Ready (add PostgreSQL plugin if needed)
⏳ **Payments**: Waiting (test first, add PayPal later)
⏳ **Frontend**: Needs deployment to Railway
⏳ **Domain**: Can configure after testing

**You're ready to start testing!** 🚀
