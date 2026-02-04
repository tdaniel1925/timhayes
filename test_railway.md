# Quick Test - Use Railway Backend

The local database has schema issues. Let's test against your Railway deployment instead!

## Step 1: Get Your Railway URL

Run this command:
```bash
railway login
cd "C:\dev\1 - Tim Hayes"
railway link
railway open
```

This will open your Railway dashboard. Look for your backend URL in the Settings → Networking section.

It will look like: `https://your-app-production-xxxx.up.railway.app`

## Step 2: Create Super Admin (via Railway API)

Replace `YOUR_RAILWAY_URL` with your actual URL:

```powershell
$RAILWAY_URL = "https://your-app-production-xxxx.up.railway.app"

# Create super admin
$body = @{
    email = "admin@test.com"
    password = "Admin123!"
    full_name = "Admin User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$RAILWAY_URL/api/superadmin/register" -Method POST -ContentType "application/json" -Body $body
```

## Step 3: Test Phone Calls Against Railway

```bash
python test_phone_calls.py https://your-railway-url.railway.app demo admin your_webhook_password
```

**But first you need to create the 'demo' tenant via the super admin panel!**

## Or... Quick Manual Fix

If you just want to test locally, here's the simplest fix:

1. Delete Python cache:
```bash
cd "C:\dev\1 - Tim Hayes"
Remove-Item -Recurse -Force __pycache__
```

2. Start fresh backend:
```bash
python app.py
```

3. In another terminal, create tenant via API (not Python scripts):
```powershell
# Login as super admin first
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -ContentType "application/json" -Body (@{email="admin@test.com"; password="Admin123!"} | ConvertTo-Json)

$token = $loginResponse.access_token

# Create tenant
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tenants" -Method POST -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body (@{subdomain="demo"; company_name="Demo Company"; plan="professional"; status="active"} | ConvertTo-Json)
```

**Which method do you prefer?**
1. Test against Railway (easier, already works)
2. Fix local database (requires manual steps above)
