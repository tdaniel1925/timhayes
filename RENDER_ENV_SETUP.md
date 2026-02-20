# Render Environment Variables Setup

This guide provides the exact environment variables you need to configure in your Render dashboard for both services.

---

## Service 1: audiapro-web (Main Next.js Application)

Navigate to: **Render Dashboard → audiapro-web → Environment**

Add these environment variables:

### Database & Auth
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=AudiaPro
NEXT_PUBLIC_APP_URL=https://your-render-url.onrender.com
DATABASE_URL=your_supabase_database_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### AI Services
```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Security
```bash
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here
```

### Optional (Email - add when ready)
```bash
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=notifications@audiapro.com
```

### Optional (Error Tracking - add when ready)
```bash
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

---

## Service 2: audiapro-worker (Background Worker)

Navigate to: **Render Dashboard → audiapro-worker → Environment**

Add these environment variables:

### Database & Auth
```bash
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### AI Services
```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Security
```bash
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here
```

### Worker Configuration
```bash
WORKER_POLL_INTERVAL_MS=5000
WORKER_MAX_CONCURRENT_JOBS=3
WORKER_JOB_TIMEOUT_MS=300000
```

---

## Quick Copy-Paste Format for Render

Render allows bulk paste of environment variables. Use this format:

### For audiapro-web:
```
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=AudiaPro
NEXT_PUBLIC_APP_URL=https://your-render-url.onrender.com
DATABASE_URL=your_supabase_database_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here
```

### For audiapro-worker:
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DEEPGRAM_API_KEY=your_deepgram_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here
WORKER_POLL_INTERVAL_MS=5000
WORKER_MAX_CONCURRENT_JOBS=3
WORKER_JOB_TIMEOUT_MS=300000
```

---

## Important Notes

1. **NEXT_PUBLIC_APP_URL**: Replace `https://your-render-url.onrender.com` with your actual Render web service URL after deployment

2. **Worker rootDir**: Ensure your audiapro-worker service has `Root Directory` set to `worker` in Render settings

3. **Build Commands**: Verify these are set correctly:
   - **audiapro-web**: `npm install && npm run build`
   - **audiapro-worker**: `cd worker && npm install && npm run build`

4. **Start Commands**: Verify these are set correctly:
   - **audiapro-web**: `npm start`
   - **audiapro-worker**: `cd worker && npm start`

5. **Health Checks**: Verify these are configured:
   - **audiapro-web**: `/api/health`
   - **audiapro-worker**: `/health`

---

## Next Steps After Configuration

1. Save all environment variables in both services
2. Trigger manual deploy for both services
3. Monitor deployment logs for any errors
4. Once deployed, create a super admin user
5. Test the complete workflow

---

## Troubleshooting

If deployment fails, check:
- All environment variables are present (no typos)
- Build commands are correct
- Worker service has correct root directory
- Database migrations were successfully run in Supabase
- OpenAI API key is valid and has credits
- Deepgram API key is valid and active
