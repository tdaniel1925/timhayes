# Quick Start Testing Guide

Get your AudiaPro system tested in 15 minutes! ⚡

---

## 🎯 Quick Overview

You've deployed to Railway with secure keys. Now let's test everything works!

**What you'll do:**
1. Get your Railway backend URL (1 min)
2. Create super admin account (2 min)
3. Start frontend locally (3 min)
4. Create test tenant (2 min)
5. Generate test data (2 min)
6. Verify everything works (5 min)

---

## Step 1: Get Your Railway Backend URL (1 min)

1. Go to https://railway.app
2. Open your AudiaPro project
3. Click on your **backend service**
4. Go to **Settings** tab
5. Scroll to **Networking** section
6. Look for your public URL:
   ```
   https://yourapp-production-xxxx.up.railway.app
   ```
7. **Copy this URL** and save it

**Test it's working:**
```bash
# Replace with YOUR URL
curl https://yourapp-production-xxxx.up.railway.app/api/health
```

Should return: `{"status":"ok",...}`

✅ If you got a response, continue!
❌ If not, check Railway deployment logs

---

## Step 2: Create Super Admin Account (2 min)

Open PowerShell or Command Prompt and run:

```powershell
# Replace YOUR_RAILWAY_URL with your actual URL
$RAILWAY_URL = "https://yourapp-production-xxxx.up.railway.app"

# Create super admin
$body = @{
    email = "admin@test.com"
    password = "Admin123!"
    full_name = "Admin User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$RAILWAY_URL/api/superadmin/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Save the response!** You'll get an `access_token` - copy it.

Alternative (using curl if you have Git Bash):
```bash
RAILWAY_URL="https://yourapp-production-xxxx.up.railway.app"

curl -X POST $RAILWAY_URL/api/superadmin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "full_name": "Admin User"
  }'
```

**Credentials to remember:**
- Email: `admin@test.com`
- Password: `Admin123!`

---

## Step 3: Start Frontend Locally (3 min)

### Create Frontend .env File

```bash
cd frontend
```

Create a new file: `frontend/.env`

```bash
VITE_API_URL=https://yourapp-production-xxxx.up.railway.app
```

**Replace with YOUR Railway URL!**

### Install and Start

```bash
npm install
npm run dev
```

Frontend should start at: `http://localhost:5173`

✅ Open your browser and go to `http://localhost:5173`

---

## Step 4: Create Test Tenant (2 min)

1. **Login to Super Admin Panel**
   - Go to: `http://localhost:5173/superadmin/login`
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Click "Login"

2. **Create a Tenant**
   - You should see the Super Admin dashboard
   - Click "Tenants" in the sidebar
   - Click "+ Add Tenant" button
   - Fill in:
     ```
     Subdomain: demo
     Company Name: Demo Company
     Plan: professional
     Status: active
     Max Users: 10
     Max Calls per Month: 1000
     ```
   - Click "Create Tenant"

3. **Create a User for the Tenant**
   - Click on the tenant you just created
   - Scroll to "Users" section
   - Click "+ Add User"
   - Fill in:
     ```
     Email: user@demo.com
     Password: User123!
     Full Name: Demo User
     Role: admin
     ```
   - Click "Create User"

✅ Tenant created!

---

## Step 5: Generate Test Data (2 min)

Back in your terminal (stop the frontend if needed):

```bash
cd "C:\dev\1 - Tim Hayes"
python test_data.py demo 50
```

This creates 50 test call records with:
- Variety of phone numbers
- Different call outcomes (answered, no-answer, busy, failed)
- Call durations
- Sentiment analysis
- Spread across last 60 days

You should see:
```
✅ SUCCESS!
   Created 50 call records
   Created 35 sentiment analyses
```

---

## Step 6: Verify Everything Works (5 min)

### Test Tenant Dashboard

1. **Open Tenant Portal**
   - **Important:** You need to access via subdomain
   - **Option A (Local Testing):** Edit your hosts file
     - Windows: `C:\Windows\System32\drivers\etc\hosts`
     - Add line: `127.0.0.1 demo.localhost`
     - Then go to: `http://demo.localhost:5173`

   - **Option B (Easier for testing):** Login directly
     - Go to: `http://localhost:5173`
     - Login with: `user@demo.com` / `User123!`

2. **Check Dashboard Analytics**
   - ✅ Total Calls: Should show ~50
   - ✅ Call Duration Chart: Should show data
   - ✅ Sentiment Analysis: Should show positive/neutral/negative
   - ✅ Call Outcomes: Pie chart with answered/no-answer/etc
   - ✅ Timeline: Calls over last 60 days

3. **Check Calls List**
   - Click "Calls" in sidebar
   - ✅ Should see list of 50 calls
   - ✅ Search works (try searching a phone number)
   - ✅ Filters work (try filtering by "answered")
   - ✅ Pagination works

4. **Test Export**
   - Click "Export CSV" button
   - ✅ CSV file should download
   - ✅ Open it - should contain all call data

5. **Test Settings**
   - Click "Settings" in sidebar
   - ✅ Can see company info
   - ✅ Can see plan details
   - ✅ Can configure PBX settings (don't need real PBX yet)

---

## ✅ Testing Checklist

Copy this checklist and check off as you test:

### Backend
- [ ] Railway backend is deployed and running
- [ ] Health check endpoint responds
- [ ] Super admin registration works
- [ ] Super admin login works
- [ ] No ENCRYPTION_KEY warnings in logs

### Frontend
- [ ] Frontend starts locally
- [ ] Can access super admin login
- [ ] Super admin dashboard loads
- [ ] Can create tenants
- [ ] Can create users

### Tenant Features
- [ ] Tenant dashboard loads
- [ ] Dashboard shows test data
- [ ] Charts render correctly
- [ ] Calls list displays
- [ ] Search functionality works
- [ ] Filters work
- [ ] Export CSV works
- [ ] Settings page loads

### Data & Analytics
- [ ] Test data generation works
- [ ] Call records appear in database
- [ ] Sentiment analysis data present
- [ ] Analytics calculations correct
- [ ] Date filtering works

---

## 🎉 Success Criteria

If you can check ALL of these, you're ready for the next phase:

✅ Backend deployed on Railway without errors
✅ Super admin can login
✅ Can create and manage tenants
✅ Can create tenant users
✅ Test data appears in dashboard
✅ All charts render properly
✅ Search and filters functional
✅ Export works

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Problem:** Frontend can't reach Railway backend

**Solutions:**
1. Check `frontend/.env` has correct `VITE_API_URL`
2. Verify Railway backend is running (check deployment status)
3. Check browser console for CORS errors
4. Try the health check endpoint manually

### "ENCRYPTION_KEY not set" in Railway logs

**Problem:** Environment variable not loaded

**Solutions:**
1. Go to Railway → Backend service → Variables
2. Verify `ENCRYPTION_KEY` is present
3. Click "Redeploy" button
4. Wait for deployment to complete

### "Unauthorized" when creating super admin

**Problem:** Backend has existing super admin

**Solutions:**
- Use login endpoint instead: `POST /api/login`
- Or use different email address

### Frontend shows blank page

**Problem:** JavaScript error or Error Boundary triggered

**Solutions:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify frontend/.env is correct

### Test data script fails

**Problem:** Database connection issue

**Solutions:**
1. Make sure backend is running: `python app.py`
2. Check database file exists: `callinsight.db`
3. Verify tenant was created with subdomain 'demo'

---

## 📝 Save Your Test Credentials

Keep these handy for testing:

**Super Admin:**
- URL: `http://localhost:5173/superadmin/login`
- Email: `admin@test.com`
- Password: `Admin123!`

**Tenant User:**
- URL: `http://localhost:5173` (or `http://demo.localhost:5173`)
- Email: `user@demo.com`
- Password: `User123!`
- Tenant: `demo`

**Backend:**
- Railway URL: `https://yourapp-production-xxxx.up.railway.app`
- Health Check: `https://yourapp-production-xxxx.up.railway.app/api/health`

---

## 🚀 What's Next?

Once you've verified everything works:

### Immediate Next Steps:
1. **Test with Real Phone System** (optional)
   - Configure your PBX webhook
   - Point to: `https://your-railway-url/api/webhook/cdr/demo`
   - Make test calls

2. **Deploy Frontend to Railway**
   - Create new service for frontend
   - Configure environment variables
   - Get frontend URL

3. **Test Full Flow**
   - Super admin creates tenant
   - Tenant receives webhook
   - Dashboard updates in real-time

### Future Enhancements:
- Add PayPal for payments
- Configure custom domain
- Set up email notifications (Resend)
- Add more phone system integrations
- Enable transcription (already has OpenAI key)

---

## 💡 Pro Tips

1. **Keep Railway Logs Open**
   - Railway dashboard → Backend service → Deployments
   - Watch logs in real-time while testing
   - Helps catch errors immediately

2. **Use Browser DevTools**
   - F12 to open DevTools
   - Network tab shows all API calls
   - Console shows JavaScript errors
   - Very helpful for debugging

3. **Test in Incognito**
   - Use incognito window for tenant portal
   - Regular window for super admin
   - Prevents session/cookie conflicts

4. **Generate More Data**
   - `python test_data.py demo 200` for more calls
   - Helps test pagination
   - Better visualization of charts

---

## 📞 Need Help?

Common commands for reference:

```bash
# Check Railway deployment status
railway status

# View Railway logs
railway logs

# Restart local backend
cd "C:\dev\1 - Tim Hayes"
python app.py

# Restart frontend
cd frontend
npm run dev

# Generate more test data
python test_data.py demo 100

# Check database
sqlite3 callinsight.db "SELECT COUNT(*) FROM call_record;"
```

---

## ✅ Current Status

**What's Working:**
- ✅ Backend deployed on Railway with secure keys
- ✅ Error handling and crash prevention active
- ✅ Database ready for data
- ✅ All 15 phone systems supported
- ✅ Analytics and reporting functional

**What's Pending:**
- ⏳ PayPal integration (waiting for testing to complete)
- ⏳ Frontend deployment to Railway
- ⏳ Custom domain configuration
- ⏳ Email service setup (Resend)

**You're in great shape! Start testing now!** 🚀
