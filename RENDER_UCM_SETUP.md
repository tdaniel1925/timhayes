# Render Environment Variables - UCM Configuration

## Required Environment Variables for Recording Downloads

Go to Render Dashboard → audiapro-backend → Environment

Add or update these environment variables:

```
UCM_IP=071ffb.c.myucm.cloud
UCM_USERNAME=admin
UCM_PASSWORD=BotMakers@2026
UCM_PORT=8443
```

## After Setting Variables:

1. Click "Save Changes" in Render dashboard
2. Render will automatically redeploy the backend
3. Wait for deployment to complete (~2-3 minutes)
4. Test recording download using diagnostic endpoint

## Testing Recording Download:

### Method 1: Use Diagnostic Endpoint (Admin Access Required)

```bash
# Login to get token
curl -X POST https://audiapro-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testco.com","password":"Admin123!"}'

# Use the token to test download for call 17
curl -X POST https://audiapro-backend.onrender.com/api/admin/ucm-diagnostics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"call_id": 17}'
```

### Method 2: Wait for Next Call

When the next call comes in with a recording, the backend will automatically:
1. Authenticate with UCM using challenge-response
2. Download the recording via UCM API
3. Upload to Supabase Storage
4. Update database with storage path
5. Trigger AI transcription and sentiment analysis

## What Changed:

### Before (BROKEN):
- Used placeholder UCM IP: `192.168.1.100`
- Tried to download recordings as static files (no authentication)
- URLs like: `https://192.168.1.100:8089/recordings/path.wav`
- Result: **100% failure rate**

### After (FIXED):
- Using real UCM hostname: `071ffb.c.myucm.cloud:8443`
- Proper challenge-response authentication with UCM API
- API workflow:
  1. GET challenge
  2. Login with MD5(challenge + MD5(password))
  3. Receive cookie
  4. Download via `/api?action=recapi&cookie={cookie}&filedir={path}`
- Result: **Should work!**

## Verification:

After deployment, check:

1. **Backend Health**: `https://audiapro-backend.onrender.com/api/health`
2. **UCM Config**: `GET /api/admin/ucm-diagnostics` (shows current config)
3. **Test Download**: `POST /api/admin/ucm-diagnostics {"call_id": 17}`
4. **Database**: Check if `recording_downloaded` becomes `true`
5. **Storage**: Check Supabase storage bucket for new files
6. **Frontend**: Recording should be playable in dashboard

## Troubleshooting:

If recordings still don't download:

1. Check Render logs for authentication errors
2. Verify UCM credentials are correct
3. Test UCM connectivity: Can Render reach `071ffb.c.myucm.cloud:8443`?
4. Check if UCM firewall blocks Render's IP addresses
5. Look for detailed error messages in logs (emoji markers: 🔐 ✅ ❌)

## Security Note:

The UCM password `BotMakers@2026` is stored in Render's secure environment variables.
It's not in the git repository (.env is gitignored).
