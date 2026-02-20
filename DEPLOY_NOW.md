# Deploy AudiaPro to Production - Step by Step

Follow these steps exactly to deploy AudiaPro to your Render services.

---

## Prerequisites Checklist

✅ Database migrations completed in Supabase
✅ AI integration switched from Claude to OpenAI
✅ All API keys collected
✅ Environment variable configuration ready

---

## Step 1: Configure Environment Variables in Render

### For audiapro-web service:

1. Go to: https://dashboard.render.com
2. Find your **audiapro-web** service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable** or use bulk paste
5. Copy and paste ALL variables from `RENDER_ENV_SETUP.md` → **For audiapro-web** section
6. **IMPORTANT**: Replace `https://your-render-url.onrender.com` in `NEXT_PUBLIC_APP_URL` with your actual Render URL (you can get this from the service dashboard)
7. Click **Save Changes**

### For audiapro-worker service:

1. Find your **audiapro-worker** service
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable** or use bulk paste
4. Copy and paste ALL variables from `RENDER_ENV_SETUP.md` → **For audiapro-worker** section
5. Click **Save Changes**

### Verify Settings:

For **audiapro-worker**, also check:
- **Root Directory**: Should be set to `worker`
- **Build Command**: Should be `npm install && npm run build`
- **Start Command**: Should be `npm start`

---

## Step 2: Commit and Push Code Changes

Since you have existing Render services set up, they're likely connected to a Git repository. Let's commit the recent changes:

```bash
# Check what needs to be committed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "DEPLOY: Switch to OpenAI, update config for production

- Replace Anthropic Claude with OpenAI GPT-4o
- Update render.yaml for all-Render deployment
- Add RENDER_ENV_SETUP.md for environment configuration
- Database migrations completed in Supabase
- Ready for production deployment"

# Push to your main branch
git push origin main
```

---

## Step 3: Deploy Services

### Option A: Auto-deploy (if enabled)

If you have auto-deploy enabled in Render:
1. The push to `main` will automatically trigger deployment
2. Monitor the deployment logs in Render dashboard
3. Both services should deploy automatically

### Option B: Manual deploy

If auto-deploy is not enabled:

1. **Deploy audiapro-web:**
   - Go to Render Dashboard → audiapro-web
   - Click **Manual Deploy** → **Deploy latest commit**
   - Monitor the build logs

2. **Deploy audiapro-worker:**
   - Go to Render Dashboard → audiapro-worker
   - Click **Manual Deploy** → **Deploy latest commit**
   - Monitor the build logs

---

## Step 4: Monitor Deployment

### Check audiapro-web deployment:

Look for these in the build logs:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

Then in runtime logs:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
✓ Ready in XXXms
```

### Check audiapro-worker deployment:

Look for these in the build logs:
```
npm install
npm run build
tsc (compiling TypeScript)
```

Then in runtime logs:
```
Worker started successfully
Polling for jobs every 5000ms
Health endpoint available at http://localhost:3001/health
```

---

## Step 5: Verify Health Endpoints

Once both services are deployed:

1. **Web service health:**
   - Visit: `https://your-audiapro-web-url.onrender.com/api/health`
   - Should return: `{"status":"ok"}`

2. **Worker service health:**
   - Render will automatically ping `/health` endpoint
   - Check service status shows "Live" (green dot)

---

## Step 6: Create Super Admin User

Now that the application is deployed, create your super admin account:

1. **Option A: Use Supabase SQL Editor**

   Run this SQL query in Supabase SQL Editor:
   ```sql
   -- Create super admin user
   INSERT INTO auth.users (
     id,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin,
     role,
     aud,
     confirmation_token
   ) VALUES (
     gen_random_uuid(),
     'admin@audiapro.com',
     crypt('YourSecurePassword123!', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"name":"Super Admin"}',
     'authenticated',
     ''
   );

   -- Link to public.users table
   INSERT INTO public.users (
     id,
     email,
     full_name,
     role,
     is_active,
     created_at,
     updated_at
   )
   SELECT
     id,
     email,
     'Super Admin',
     'super_admin',
     true,
     created_at,
     updated_at
   FROM auth.users
   WHERE email = 'admin@audiapro.com';
   ```

   **Change these values:**
   - `admin@audiapro.com` → Your email
   - `YourSecurePassword123!` → Your secure password

2. **Option B: Use Supabase Dashboard**

   - Go to: Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Email: your@email.com
   - Password: YourSecurePassword
   - Confirm password
   - Then run this SQL to upgrade to super admin:
   ```sql
   UPDATE public.users
   SET role = 'super_admin'
   WHERE email = 'your@email.com';
   ```

---

## Step 7: Test the Deployment

### 1. Login Test
- Visit: `https://your-audiapro-web-url.onrender.com`
- You should see the AudiaPro landing page
- Click "Login" → Go to `/admin/login`
- Login with your super admin credentials
- Should redirect to Super Admin Dashboard

### 2. Database Connection Test
- On the Super Admin Dashboard, you should see:
  - Total tenants (0 initially)
  - Total users (1 - you)
  - System health indicators

### 3. Worker Test (will test in Step 8)

---

## Step 8: Create Test Tenant and Test Complete Flow

### Create a test tenant:

1. Login as super admin
2. Go to: Admin Dashboard → Tenants → Create New Tenant
3. Fill in:
   - Tenant Name: "Demo Company"
   - Subdomain: "demo"
   - Admin Email: "demo@test.com"
   - Admin Password: "Demo123!"
4. Click "Create Tenant"

### Add PBX Connection:

1. Still as super admin, go to: Admin Dashboard → Connections
2. Click "Add Connection"
3. Fill in Grandstream UCM details (use test credentials)
4. Click "Test Connection" to verify
5. Save the connection

### Test webhook flow:

1. In your Grandstream UCM:
   - Go to: Extension Settings → CDR Settings
   - Add webhook URL: `https://your-audiapro-web-url.onrender.com/api/webhook/grandstream/[connectionId]`
   - Set webhook secret (from connection config)

2. Make a test call in your PBX

3. Monitor the flow:
   - Check: Admin Dashboard → Jobs Queue
   - Should see a new job appear
   - Worker should pick it up within 5 seconds
   - Job status should change: pending → processing → completed
   - Check: Admin Dashboard → Calls
   - Should see the processed call with AI analysis

---

## Troubleshooting

### Build fails with "Module not found"
- Check that all dependencies are in package.json
- Ensure worker has its own package.json in worker/ directory
- Try clearing build cache in Render

### Worker not processing jobs
- Check worker logs for errors
- Verify environment variables are set correctly
- Ensure SUPABASE_SERVICE_ROLE_KEY is set (not ANON key)
- Check database connection in worker logs

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check if Supabase allows connections from Render IPs
- Ensure connection pooler is used (.pooler.supabase.com)

### OpenAI API errors
- Verify OPENAI_API_KEY is valid
- Check if you have credits in OpenAI account
- Ensure key has proper permissions

### Deepgram API errors
- Verify DEEPGRAM_API_KEY is valid
- Check if you have credits in Deepgram account
- Ensure API key is not expired

---

## Success Criteria

You know deployment is successful when:

✅ audiapro-web service shows "Live" status in Render
✅ audiapro-worker service shows "Live" status in Render
✅ Health endpoints return `{"status":"ok"}`
✅ Super admin can login successfully
✅ Super Admin Dashboard loads with system stats
✅ Can create tenants and users
✅ Worker processes test jobs successfully
✅ AI analysis appears for test calls

---

## What's Next?

After successful deployment:

1. **Security hardening:**
   - Set up Sentry for error tracking
   - Configure proper CORS policies
   - Enable rate limiting
   - Set up SSL certificates (Render does this automatically)

2. **Email setup:**
   - Sign up for Resend account
   - Get API key
   - Add RESEND_API_KEY to environment
   - Test email notifications

3. **Production data:**
   - Connect real PBX systems
   - Set up real tenant accounts
   - Configure webhook URLs
   - Test with real call recordings

4. **Monitoring:**
   - Set up Render alerts
   - Configure Supabase monitoring
   - Monitor API usage (OpenAI, Deepgram)
   - Track storage usage

---

## Emergency Rollback

If something goes wrong:

1. In Render Dashboard → Service → Manual Deploy
2. Click on a previous successful deployment
3. Click "Redeploy"
4. This will roll back to the previous version

---

## Support

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Deepgram Docs**: https://developers.deepgram.com

---

**Ready to deploy? Start with Step 1!**
