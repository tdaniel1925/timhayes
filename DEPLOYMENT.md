# AudiaPro Deployment Guide

Complete guide to deploying AudiaPro to production.

---

## Architecture Overview

AudiaPro consists of two services:

1. **Frontend + API** → Deployed to **Vercel**
   - Next.js 15 application (App Router)
   - API routes for webhooks, tenants, calls, etc.
   - Public-facing dashboard and admin panel

2. **Background Worker** → Deployed to **Render**
   - Node.js service that processes jobs
   - Downloads recordings, transcribes, analyzes with AI
   - Runs independently from the main app

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] Deepgram API key
- [ ] Anthropic (Claude) API key
- [ ] Resend API key (optional, for emails)
- [ ] Sentry account (optional, for error tracking)
- [ ] Vercel account
- [ ] Render account
- [ ] GitHub repository with your code

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `audiapro-production`
4. Choose region closest to your users
5. Set a strong database password
6. Click "Create new project"

### 1.2 Get Supabase Credentials

From your Supabase dashboard:
- Go to **Project Settings → API**
- Copy:
  - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

- Go to **Project Settings → Database**
- Copy **Connection string** (URI mode) → `DATABASE_URL`
  - Replace `[YOUR-PASSWORD]` with your database password

### 1.3 Run Database Migrations

**Option A: Use Drizzle Kit (Recommended)**

```bash
# Install Drizzle Kit globally
npm install -g drizzle-kit

# Set environment variable
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Push schema to Supabase
npx drizzle-kit push
```

**Option B: Manual SQL Migration**

1. Go to Supabase **SQL Editor**
2. Run the SQL from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_storage_buckets.sql`
   - `004_indexes.sql`

### 1.4 Create Storage Buckets

In Supabase dashboard:
1. Go to **Storage**
2. Create three buckets:
   - `call-recordings` (Private)
   - `call-transcripts` (Private)
   - `call-analyses` (Private)

3. For each bucket, set RLS policies:

```sql
-- Allow authenticated users to read their tenant's files
CREATE POLICY "Tenant access"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to do everything
CREATE POLICY "Service role access"
ON storage.objects FOR ALL
USING (auth.role() = 'service_role');
```

### 1.5 Create Super Admin User

1. Go to **Authentication → Users**
2. Click "Add user"
3. Email: `admin@yourdomain.com`
4. Password: [Strong password]
5. After creation, go to **SQL Editor** and run:

```sql
-- Mark user as super admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_super_admin}',
  'true'::jsonb
)
WHERE email = 'admin@yourdomain.com';
```

---

## Step 2: Generate Encryption Key

The encryption key is used to encrypt PBX credentials in the database.

**IMPORTANT: This must be the same on both Vercel and Render.**

```bash
# Generate 32-byte hex string
openssl rand -hex 32
```

Save this output - you'll need it for both deployments.

Example output: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

---

## Step 3: Deploy to Vercel (Main App)

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Link Project to Vercel

```bash
cd "C:\dev\1 - Tim Hayes"
vercel login
vercel link
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? `audiapro`
- Directory? `.`
- Override settings? **No**

### 3.3 Set Environment Variables

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key

vercel env add DATABASE_URL
# Paste your database connection string

vercel env add DEEPGRAM_API_KEY
# Paste your Deepgram API key

vercel env add ANTHROPIC_API_KEY
# Paste your Anthropic API key

vercel env add ENCRYPTION_KEY
# Paste the encryption key you generated

vercel env add RESEND_API_KEY
# (Optional) Paste your Resend API key

vercel env add SENTRY_DSN
# (Optional) Paste your Sentry DSN

vercel env add NEXT_PUBLIC_APP_URL
# Your production URL, e.g., https://audiapro.vercel.app
```

**Or set via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your `audiapro` project
3. Go to **Settings → Environment Variables**
4. Add all variables from `.env.example`

### 3.4 Deploy

```bash
# Deploy to production
vercel --prod
```

Your app will be deployed to: `https://audiapro.vercel.app` (or your custom domain)

### 3.5 Add Custom Domain (Optional)

1. Go to Vercel dashboard → Project → Settings → Domains
2. Add your domain: `audiapro.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to use your custom domain

---

## Step 4: Deploy Worker to Render

### 4.1 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 4.2 Create Web Service for Worker

1. Click **New +** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `audiapro-worker`
   - **Region**: Oregon (or closest to Supabase)
   - **Branch**: `main`
   - **Root Directory**: `worker`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month) or higher

### 4.3 Set Environment Variables in Render

In Render dashboard → Environment:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPGRAM_API_KEY=dg_your_api_key
ANTHROPIC_API_KEY=sk-ant-your_api_key
ENCRYPTION_KEY=your_32_byte_hex_string (MUST match Vercel)
NODE_ENV=production
PORT=3001
```

### 4.4 Configure Health Check

In Render dashboard → Settings:
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds

### 4.5 Deploy

Click **Deploy** button. Render will:
1. Clone your repo
2. Run `npm install && npm run build` in `worker/` directory
3. Start the worker with `npm start`
4. Poll health endpoint every 30 seconds

Monitor logs in Render dashboard to ensure successful startup.

---

## Step 5: Configure Webhooks

After both services are deployed, you need to configure webhook endpoints.

### 5.1 Get Webhook URLs

Your Grandstream webhook URL format:
```
https://yourdomain.com/api/webhook/grandstream/[CONNECTION_ID]?webhook_secret=[SECRET]
```

### 5.2 In AudiaPro Admin Panel

1. Log in as super admin
2. Go to **Admin → Tenants → [Tenant] → Connections**
3. Create new PBX connection:
   - Connection type: Grandstream UCM
   - Host: Your UCM IP/hostname
   - Port: 8089 (or your HTTPS port)
   - Username: `cdrapi`
   - Password: Your API user password
   - Webhook secret: (auto-generated)

4. Copy the webhook URL displayed

### 5.3 Configure Grandstream UCM

1. Log in to UCM web interface
2. Go to **System Settings → API Settings**
3. Enable CDR API
4. Set webhook URL to the one from AudiaPro
5. Enable webhook authentication
6. Save settings

---

## Step 6: Test End-to-End

### 6.1 Make a Test Call

1. Make a call on your PBX system
2. Ensure it's recorded
3. Call should complete and end

### 6.2 Verify Webhook Received

1. Check Vercel logs:
   ```bash
   vercel logs --follow
   ```

2. Look for:
   ```
   POST /api/webhook/grandstream/[id] 200
   ```

### 6.3 Verify Job Created

1. Log in to AudiaPro admin panel
2. Go to **Admin → Jobs**
3. You should see a new job with status `pending` or `processing`

### 6.4 Verify Worker Processing

1. Check Render logs for worker
2. You should see:
   ```
   [Worker] Claimed job [job-id]
   [Pipeline] Starting job [job-id]
   [Pipeline] Step 1/4: Download
   [Pipeline] Step 2/4: Transcribe
   [Pipeline] Step 3/4: AI Analysis
   [Pipeline] Step 4/4: Finalize
   [Pipeline] Job [job-id] completed
   ```

### 6.5 Verify Call in Dashboard

1. Log in as tenant admin
2. Go to **Dashboard → Calls**
3. Your test call should appear with:
   - ✅ Recording playback
   - ✅ Transcript with speakers
   - ✅ AI sentiment analysis
   - ✅ Keywords and topics
   - ✅ Compliance flags

---

## Step 7: Monitoring & Maintenance

### 7.1 Monitor Vercel

- **Logs**: https://vercel.com/your-project/logs
- **Analytics**: https://vercel.com/your-project/analytics
- **Performance**: Check Web Vitals

### 7.2 Monitor Render Worker

- **Logs**: Real-time in Render dashboard
- **Metrics**: CPU, memory usage
- **Health**: Check `/health` endpoint

### 7.3 Monitor Supabase

- **Database**: https://app.supabase.com/project/_/database/tables
- **Storage**: Check bucket sizes
- **Auth**: Monitor user activity

### 7.4 Set Up Alerts

**Sentry (Error Tracking)**:
- Errors in Next.js app
- Worker processing failures
- API route exceptions

**Render Alerts**:
- Worker health check failures
- High memory usage
- Deployment failures

**Supabase**:
- Database connection issues
- Storage quota warnings

---

## Troubleshooting

### Worker Not Processing Jobs

**Check:**
1. Worker health endpoint: `https://audiapro-worker.onrender.com/health`
2. Render logs for errors
3. Environment variables are set correctly
4. ENCRYPTION_KEY matches between Vercel and Render

**Fix:**
```bash
# Restart worker in Render dashboard
# Or redeploy:
git commit --allow-empty -m "Restart worker"
git push origin main
```

### Webhook Not Receiving CDRs

**Check:**
1. UCM webhook configuration
2. Webhook secret matches
3. Connection is active (not suspended)
4. Vercel logs for incoming requests

**Fix:**
- Test webhook with curl:
```bash
curl -X POST "https://yourdomain.com/api/webhook/grandstream/[id]?webhook_secret=[secret]" \
  -H "Content-Type: application/json" \
  -d @test_cdr.json
```

### Transcription Failing

**Check:**
1. Deepgram API key is valid
2. Worker logs show audio file download success
3. Audio file format is supported (WAV recommended)

**Fix:**
- Verify Deepgram quota: https://console.deepgram.com
- Check audio file in Supabase Storage

### AI Analysis Failing

**Check:**
1. Anthropic API key is valid
2. Claude API quotas
3. Worker logs for timeout errors

**Fix:**
- Verify Anthropic account: https://console.anthropic.com
- Increase worker timeout if needed

---

## Scaling

### Horizontal Scaling (Render Worker)

To process more calls concurrently:

1. Go to Render dashboard → Worker → Settings
2. Increase instance count to 2+ workers
3. Each worker processes up to 3 jobs simultaneously
4. Jobs are claimed atomically (no duplicates)

### Vertical Scaling

For large audio files or high complexity:

1. Upgrade Render plan (more RAM)
2. Increase `WORKER_JOB_TIMEOUT_MS`
3. Monitor Render metrics dashboard

---

## Security Checklist

- [ ] All environment variables set
- [ ] ENCRYPTION_KEY is strong and secret
- [ ] SUPABASE_SERVICE_ROLE_KEY only in backend (never client)
- [ ] RLS policies enabled on all Supabase tables
- [ ] Storage buckets are private
- [ ] Webhook secrets are strong (32+ characters)
- [ ] HTTPS enforced on all endpoints
- [ ] Super admin password is strong
- [ ] Sentry error tracking enabled
- [ ] Regular database backups enabled in Supabase

---

## Support

If you encounter issues:

1. Check Vercel logs
2. Check Render logs
3. Check Supabase logs
4. Check Sentry errors (if enabled)
5. Review this deployment guide
6. Contact support: support@audiapro.com

---

## Next Steps After Deployment

1. ✅ Create tenant accounts for customers
2. ✅ Configure PBX connections
3. ✅ Set up custom keywords for AI analysis
4. ✅ Configure email reports (optional)
5. ✅ Set up custom domain
6. ✅ Enable Sentry monitoring
7. ✅ Test with real phone calls
8. ✅ Train team on using the dashboard

---

**Congratulations! AudiaPro is now deployed to production.** 🎉
