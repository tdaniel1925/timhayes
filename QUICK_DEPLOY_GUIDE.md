# AudiaPro - Quick Deploy Guide

## Step 1: Run Database Migrations in Supabase

1. Go to your Supabase project: https://app.supabase.com/project/fcubjohwzfhjcwcnwost
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Run Migration 1: Initial Schema
Copy and paste the entire contents of:
- `supabase/migrations/001_initial_schema.sql`

Click **Run** (or press Ctrl+Enter)

### Run Migration 2: RLS Policies
Copy and paste the entire contents of:
- `supabase/migrations/002_rls_policies.sql`

Click **Run**

### Run Migration 3: Storage Buckets
Copy and paste the entire contents of:
- `supabase/migrations/003_storage_buckets.sql`

Click **Run**

---

## Step 2: Set Environment Variables in Render

### For Main App (audiapro-web):
Go to https://dashboard.render.com → Your Web Service → Environment

Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://fcubjohwzfhjcwcnwost.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Settings → API]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Settings → API]
DATABASE_URL=postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres
DEEPGRAM_API_KEY=[Your Deepgram key]
ANTHROPIC_API_KEY=[Your Anthropic key]
ENCRYPTION_KEY=[Generate with: openssl rand -hex 32]
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=AudiaPro
```

### For Worker (audiapro-worker):
Go to https://dashboard.render.com → Your Worker Service → Environment

Add these variables:

```
SUPABASE_URL=https://fcubjohwzfhjcwcnwost.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Same as above]
DEEPGRAM_API_KEY=[Same as above]
ANTHROPIC_API_KEY=[Same as above]
ENCRYPTION_KEY=[MUST be the same as main app]
NODE_ENV=production
PORT=3001
```

---

## Step 3: Get Your API Keys

### Supabase Keys
1. Go to https://app.supabase.com/project/fcubjohwzfhjcwcnwost/settings/api
2. Copy:
   - **URL**: `https://fcubjohwzfhjcwcnwost.supabase.co`
   - **anon public**: Your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Your `SUPABASE_SERVICE_ROLE_KEY`

### Deepgram API Key
1. Sign up at https://deepgram.com
2. Go to Dashboard → API Keys
3. Create new key
4. Copy the key

### Anthropic API Key
1. Sign up at https://console.anthropic.com
2. Go to Settings → API Keys
3. Create new key
4. Copy the key (starts with `sk-ant-`)

### Generate Encryption Key
Run in terminal:
```bash
openssl rand -hex 32
```
Copy the output (64 character hex string)

---

## Step 4: Deploy to Render

1. **Commit your code to GitHub:**
   ```bash
   cd "C:\dev\1 - Tim Hayes"
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy in Render Dashboard:**
   - Main App: Click **Manual Deploy** → **Deploy latest commit**
   - Worker: Click **Manual Deploy** → **Deploy latest commit**

3. **Watch the logs** to ensure successful deployment

---

## Step 5: Create Super Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click **Add User**
3. Email: `admin@yourdomain.com`
4. Password: [Strong password]
5. Click **Create User**

6. Go to SQL Editor and run:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_super_admin}',
  'true'::jsonb
)
WHERE email = 'admin@yourdomain.com';

-- Also add to users table
INSERT INTO users (id, email, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'),
  'admin@yourdomain.com',
  'super_admin',
  'Super Admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin';
```

---

## Step 6: Test Your Deployment

1. **Visit your Render URL**: https://audiapro-web.onrender.com
2. **Log in** with super admin credentials
3. **Create a tenant** in Admin panel
4. **Configure PBX connection** with your Grandstream UCM
5. **Make a test call** on your PBX
6. **Verify** the call appears in dashboard with AI analysis

---

## Troubleshooting

### Worker not processing jobs?
- Check worker logs in Render dashboard
- Verify `ENCRYPTION_KEY` matches between main app and worker
- Check Supabase service role key is correct

### Webhook not receiving calls?
- Verify webhook URL in Grandstream UCM settings
- Check webhook secret matches in both systems
- View logs in Render main app service

### Transcription failing?
- Verify Deepgram API key is valid
- Check Deepgram account has credits
- View worker logs for error details

### AI analysis failing?
- Verify Anthropic API key is valid
- Check Anthropic account has credits
- View worker logs for error details

---

## Success Checklist

- [ ] All 3 database migrations ran successfully
- [ ] Storage buckets created (call-recordings, call-transcripts, call-analyses)
- [ ] All environment variables set in Render
- [ ] Main app deployed and accessible
- [ ] Worker deployed and health check passing
- [ ] Super admin user created
- [ ] Test call recorded and analyzed
- [ ] Dashboard shows call with transcript and AI insights

---

**You're ready for production!** 🚀
