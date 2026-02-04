# Supabase Storage Setup Guide

## Environment Variables Needed in Render

Add these three environment variables to your Render service:

### 1. SUPABASE_URL
```
https://fcubjohwzfhjcwcnwost.supabase.co
```

### 2. SUPABASE_KEY
To get this:
1. Go to https://supabase.com/dashboard
2. Select your project (`fcubjohwzfhjcwcnwost`)
3. Click **Settings** (gear icon) in the sidebar
4. Click **API**
5. Copy the **anon** `public` key (or use **service_role** key for full access)
   - For production, use the **service_role** key since we need to upload recordings

### 3. SUPABASE_BUCKET
```
call-recordings
```
(This is the default bucket name - we'll create it next)

---

## Create Storage Bucket in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the sidebar
4. Click **New bucket**
5. Name it: `call-recordings`
6. Set it as **Private** (not public)
7. Click **Create bucket**

---

## Add to Render

1. Go to https://dashboard.render.com
2. Select your **audiapro-backend** service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable** for each:
   - Key: `SUPABASE_URL`, Value: `https://fcubjohwzfhjcwcnwost.supabase.co`
   - Key: `SUPABASE_KEY`, Value: `[paste your service_role key here]`
   - Key: `SUPABASE_BUCKET`, Value: `call-recordings`
5. Click **Save Changes**

The service will automatically redeploy with the new environment variables.

---

## Verification

After adding the environment variables and redeploying, check the Render logs for:
```
✅ Supabase Storage initialized successfully
```

If you see an error instead, the keys may be incorrect.

---

## CloudUCM Recording Download Configuration

While you're adding environment variables, also add these for CloudUCM recording downloads:

```
UCM_IP=071ffb.c.myucm.cloud
UCM_USERNAME=[your UCM admin username]
UCM_PASSWORD=[your UCM admin password]
UCM_HTTPS_PORT=8443
```

These allow the backend to download call recordings from your CloudUCM system after a webhook is received.
