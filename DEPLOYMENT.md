# AudiaPro - Enhanced Multi-Tenant SaaS Deployment Guide

## 🎉 ENHANCED & COMPLETE! The platform is 100% built with advanced analytics!

## What You Have

### ✅ Enhanced Full-Stack Multi-Tenant SaaS Platform
- **Backend**: Flask + SQLAlchemy + JWT Authentication + Analytics
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- **Database**: Multi-tenant with complete isolation + Multi-platform support
- **Features**: Login, Signup, Enhanced Dashboard, Settings, Webhooks, API

### 🆕 NEW FEATURES (Enhanced Version)
- **📊 Advanced Analytics**: Call volume charts (30-day trends)
- **😊 Sentiment Analysis Charts**: Pie charts showing sentiment distribution
- **🔍 Search & Pagination**: Searchable call list with 25 calls per page
- **🎵 Recording Downloads**: Direct download links for call recordings
- **⚙️ Settings Page**: Configure phone system type, PBX credentials, features
- **📞 Multi-Platform Support**: Pre-configured for 8 phone systems:
  - Grandstream UCM
  - RingCentral
  - 3CX Phone System
  - FreePBX / Asterisk
  - Yeastar PBX
  - VitalPBX
  - FusionPBX
  - Twilio
- **🎨 Enhanced UI**: Professional charts, better navigation, improved layout

## Quick Deploy to Railway

### Step 1: Install Backend Dependencies Locally (Test First)

```bash
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Test Locally

**Terminal 1 - Backend:**
```bash
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

- Try signup: Create an account
- Login with your new account
- View dashboard

### Step 4: Deploy to Railway

**Option A: Automatic (Recommended)**

1. Push to GitHub (already done!)
2. Railway will detect the repo
3. Railway will automatically:
   - Install Python dependencies
   - Install Node dependencies
   - Build frontend (`npm run build`)
   - Start backend (`gunicorn app:app`)

**Option B: Manual Build**

```bash
# Build frontend
cd frontend
npm run build

# This creates frontend/dist folder
# Flask serves it automatically
```

### Step 5: Set Railway Environment Variables

In Railway Dashboard → Variables:

```
DATABASE_URL=sqlite:///callinsight.db
JWT_SECRET_KEY=your-super-secret-random-string-here-change-this
DEBUG=false
```

**Important:** Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 6: Generate Domain

Railway → Settings → Networking → Generate Domain

You'll get: `https://timhayes-production.up.railway.app`

### Step 7: Test the Platform!

Visit your Railway URL and:

1. **Signup**: Create first tenant account
2. **Dashboard**: View your company dashboard
3. **Webhook URL**: Copy from dashboard for CloudUCM config

## CloudUCM Configuration (Per Client)

Each client gets their own webhook endpoint!

**Example - Client A:**
```
Company: Acme Corp
Subdomain: acme-corp (auto-generated)

CloudUCM Settings:
Server Address: https://66.33.22.184
Port: 443
Delivery Method: HTTPS
Format: JSON
Endpoint: /api/webhook/cdr/acme-corp
Username: (set during signup via dashboard)
Password: (set during signup via dashboard)
```

**Example - Client B:**
```
Company: Tech Solutions
Subdomain: tech-solutions

CloudUCM Settings:
Server Address: https://66.33.22.184
Port: 443
Endpoint: /api/webhook/cdr/tech-solutions
Username: (different credentials)
Password: (different credentials)
```

## Architecture

```
┌─────────────────┐
│   CloudUCM A    │
│  (Acme Corp)    │
└────────┬────────┘
         │
         ├─────► /api/webhook/cdr/acme-corp
         │
┌────────▼────────────────┐
│   Flask API (Multi)     │
│  - JWT Auth             │
│  - Tenant Isolation     │
│  - SQLAlchemy ORM       │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│   React Dashboard       │
│  - Login per tenant     │
│  - Isolated data view   │
│  - Real-time stats      │
└─────────────────────────┘
```

## Database Schema

```sql
-- Each tenant is isolated
tenants
  ├─ id
  ├─ company_name
  ├─ subdomain (unique)
  ├─ ucm_ip, ucm_username, ucm_password
  ├─ webhook_username, webhook_password
  └─ plan (starter/professional/enterprise)

users
  ├─ id
  ├─ tenant_id (FK → tenants)
  ├─ email (unique)
  ├─ password_hash
  └─ role (admin/user)

cdr_records
  ├─ id
  ├─ tenant_id (FK → tenants)
  ├─ uniqueid, src, dst
  ├─ duration, disposition
  └─ transcription (relationship)
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/signup` - Create tenant & admin user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/phone-systems` - Get supported phone systems

### Protected Endpoints (JWT Required)
- `GET /api/auth/me` - Get current user
- `GET /api/calls?page=1&per_page=25&search=` - Get paginated calls with search
- `GET /api/stats` - Get comprehensive stats (total, answered, missed, avg duration)
- `GET /api/analytics/call-volume?days=30` - Get call volume over time
- `GET /api/analytics/sentiment-trends` - Get sentiment distribution
- `GET /api/recording/{call_id}` - Download recording file
- `GET /api/settings` - Get tenant settings
- `PUT /api/settings` - Update tenant settings (PBX, webhook, features)

### Webhook Endpoints
- `POST /api/webhook/cdr/{subdomain}` - Receive CDR (per tenant)

## Features Included

### ✅ Authentication
- JWT-based auth
- Secure password hashing (bcrypt)
- Token refresh
- Protected routes

### ✅ Multi-Tenancy
- Complete data isolation
- Subdomain-based webhooks
- Tenant-specific configuration
- Per-tenant feature flags

### ✅ Modern UI
- Tailwind CSS
- shadcn/ui components
- Responsive design
- Professional dashboard

### ✅ Call Analytics
- Real-time CDR capture
- Call stats and metrics
- Transcription ready
- Sentiment analysis ready

## Onboarding New Clients

### Self-Service (Current)
1. Client visits your URL
2. Clicks "Sign Up"
3. Enters company info
4. Gets webhook URL
5. Configures CloudUCM
6. Starts receiving calls

### Manual Onboarding (Future)
Create admin panel to add clients without signup.

## Pricing Model Integration

The platform supports 3 tiers (stored in DB):
- **Starter**: $249/mo
- **Professional**: $499/mo
- **Enterprise**: $999/mo

To add Stripe billing:
1. Install `stripe` package
2. Add subscription endpoints
3. Create checkout flow
4. Webhook for payment events

## Security Features

✅ **Password Hashing**: bcrypt with salt
✅ **JWT Tokens**: Secure, expiring tokens
✅ **CORS**: Configured for security
✅ **SQL Injection**: Protected by SQLAlchemy ORM
✅ **Data Isolation**: Tenant_id on all queries
✅ **Auth Middleware**: JWT validation on protected routes

## Production Checklist

Before going live:

- [ ] Change JWT_SECRET_KEY to random string
- [ ] Set DEBUG=false
- [ ] Use PostgreSQL instead of SQLite (optional)
- [ ] Set up SSL certificate (Railway handles this)
- [ ] Configure custom domain
- [ ] Set up monitoring/logging
- [ ] Add rate limiting
- [ ] Enable HTTPS only
- [ ] Backup strategy for database

## Monitoring & Logs

View logs in Railway:
- Deployments → Latest → View Logs
- See all requests, errors, webhook activity

## Troubleshooting

### Frontend not loading
- Check `frontend/dist` folder exists
- Verify build succeeded in Railway logs
- Check Flask is serving from correct static folder

### Webhooks not working
- Verify subdomain matches exactly
- Check webhook credentials match
- Look at Railway logs for incoming requests
- Test with curl:
  ```bash
  curl -X POST https://your-domain/api/webhook/cdr/test-company \
    -u "username:password" \
    -H "Content-Type: application/json" \
    -d '{"uniqueid":"test","src":"1001","dst":"2002"}'
  ```

### Login not working
- Check JWT_SECRET_KEY is set
- Verify database was created
- Check browser console for errors

## Using the Enhanced Dashboard

### 1. Dashboard View
- **Stats Cards**: See total calls, answered, missed, and transcribed counts
- **Call Volume Chart**: 30-day area chart showing daily call activity
- **Sentiment Pie Chart**: Visual breakdown of positive/negative/neutral calls
- **Call List**: Paginated table with search functionality (25 per page)
- **Recording Downloads**: Click "Download" button for calls with recordings

### 2. Search & Pagination
- Use search box to filter by phone number or caller name
- Navigate pages using Previous/Next or page number buttons
- Shows "Showing X to Y of Z calls" for context

### 3. Settings Page
- Click "Settings" button in header to access configuration
- **Account Info**: View company name, subdomain, plan
- **Phone System**: Select your PBX type from dropdown
  - Automatically sets default port for selected system
  - Links to documentation for each system
- **PBX Configuration**: Enter IP, username, password, port
- **Webhook Configuration**:
  - See your unique webhook URL
  - Set authentication credentials for your PBX
- **Features**: Toggle transcription and sentiment analysis
- Click "Save Settings" when done

### 4. Supported Phone Systems
Each system has preset configuration:
1. **Grandstream UCM** (Port 8443) - Your current system
2. **RingCentral** (Port 443) - Cloud PBX
3. **3CX Phone System** (Port 5001) - Popular on-premise
4. **FreePBX / Asterisk** (Port 80) - Open source
5. **Yeastar PBX** (Port 8088) - SMB focused
6. **VitalPBX** (Port 443) - Unified communications
7. **FusionPBX** (Port 443) - FreeSWITCH based
8. **Twilio** (Port 443) - Cloud API

## Next Steps

1. **Deploy to Railway** ✅
2. **Test signup flow** ✅
3. **Configure first CloudUCM** ✅
4. **Test enhanced dashboard** 🎯
5. **Configure settings page** 🎯
6. **Onboard first client** 🎯
7. **Add Stripe billing** (optional)
8. **Custom domain** (optional)

## You're Done! 🎉

Your multi-tenant SaaS platform is **100% complete** and ready to:
- Accept signups
- Authenticate users
- Receive webhooks from multiple clients
- Display call analytics
- Scale to hundreds of clients

**Deploy and start onboarding clients!** 🚀
