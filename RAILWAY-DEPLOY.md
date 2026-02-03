# Deploy to Railway - Step by Step Guide

## Step 1: Login to Railway

1. Go to https://railway.app
2. Click **Login** and sign in with your GitHub account

## Step 2: Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository: **tdaniel1925/timhayes**
4. Railway will automatically detect it's a Python app

## Step 3: Add Environment Variables

Once deployed, you need to add your environment variables:

1. Click on your project
2. Go to **Variables** tab
3. Add the following variables:

### Required Variables:

```
UCM_IP=YOUR_CLOUDUCM_IP_ADDRESS
UCM_USERNAME=admin
UCM_PASSWORD=your_ucm_admin_password
UCM_HTTPS_PORT=8089
WEBHOOK_USERNAME=admin
WEBHOOK_PASSWORD=your_webhook_password
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE
TRANSCRIPTION_ENABLED=true
SENTIMENT_ENABLED=true
```

**Important**: Replace the values with your actual information!

### Optional Variables (defaults are fine):

```
RECORDING_DIR=/app/recordings
DB_PATH=/app/call_analytics.db
```

## Step 4: Get Your Railway URL

1. After deployment completes, go to **Settings** tab
2. Scroll down to **Domains**
3. Click **Generate Domain**
4. You'll get a URL like: `https://your-app-name.up.railway.app`

**Copy this URL** - you'll need it for CloudUCM configuration!

## Step 5: Configure CloudUCM

Now update your CloudUCM to send webhooks to Railway:

1. Login to your CloudUCM web interface
2. Go to: **Integrations → API Configuration → CDR Real-Time Output Settings**
3. Update the following:
   - **Enable**: ✓
   - **Server Address**: `your-app-name.up.railway.app` (without https://)
   - **Port**: `443` (for HTTPS)
   - **Delivery Method**: `HTTPS` (important!)
   - **Format**: `JSON`
   - **Username**: `admin` (must match WEBHOOK_USERNAME)
   - **Password**: Your webhook password (must match WEBHOOK_PASSWORD)
4. Click **Save**

## Step 6: Test Your Deployment

1. Open your Railway URL in browser: `https://your-app-name.up.railway.app`
2. You should see the Call Analytics Dashboard
3. Make a test call on your UCM system
4. Check Railway logs to see if CDR was received
5. Refresh dashboard to see the call

## Viewing Logs

To see what's happening:

1. In Railway dashboard, click on your project
2. Click on **Deployments**
3. Click on the latest deployment
4. You'll see live logs showing:
   - Server starting
   - CDR webhooks received
   - Recording downloads
   - Transcriptions
   - Errors (if any)

## Important Notes

### Environment Variables Changed from Local Setup:

**WEBHOOK_PORT** is NOT needed on Railway - Railway automatically provides a `PORT` variable

**CloudUCM Configuration Changes:**
- **Server Address**: Your Railway domain (e.g., `your-app.up.railway.app`)
- **Port**: `443` (HTTPS) instead of `5000`
- **Delivery Method**: Must be `HTTPS` (not HTTP)

### Database Persistence

Railway provides persistent storage, so your SQLite database will survive restarts.

### Recording Storage

Recordings are stored on Railway's persistent disk. Each deployment gets:
- Free tier: 1 GB storage
- Pro tier: More storage available

Monitor your disk usage in Railway dashboard.

### Costs

**Railway Pricing:**
- **Free Trial**: $5 of free credit per month
- **Pay as you go**: ~$5-10/month for light usage
- Based on: CPU time, memory, bandwidth

**OpenAI Pricing:**
- Whisper API: ~$0.006 per minute of audio
- Example: 100 calls/day @ 5 min = ~$3/day

## Troubleshooting

### Deployment Failed

Check the build logs:
1. Go to **Deployments** tab
2. Click on failed deployment
3. Review error messages
4. Common issues:
   - Missing dependencies in requirements.txt
   - Python version mismatch

### Webhooks Not Received

1. **Check Railway logs** - See if any requests are coming in
2. **Check CloudUCM config**:
   - Correct domain?
   - Port 443 for HTTPS?
   - Delivery method set to HTTPS?
3. **Check credentials** - Username/password must match exactly
4. **Test endpoint**: Visit `https://your-app.up.railway.app/health`

### Transcription Not Working

1. Check **Variables** tab - is OPENAI_API_KEY set?
2. Check OpenAI billing - do you have credits?
3. Check logs for specific errors
4. Set `TRANSCRIPTION_ENABLED=true`

### Database Issues

1. Railway provides persistent storage automatically
2. Database location: `/app/call_analytics.db`
3. Check logs for SQLite errors

### Out of Memory

If your app crashes with memory errors:
1. Railway free tier has memory limits
2. Upgrade to paid plan for more resources
3. Or disable sentiment analysis (uses ~500MB)

## Updating Your App

When you make code changes:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. Railway automatically detects the push and redeploys!

3. Watch the deployment in Railway dashboard

## Advanced Configuration

### Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Custom Domain**
3. Add your domain (e.g., `calls.yourdomain.com`)
4. Update DNS records as instructed
5. Update CloudUCM with new domain

### Scaling

Railway can scale your app:
1. Go to **Settings**
2. Adjust **Replicas** (paid feature)
3. Increase memory/CPU limits

### Environment-Specific Settings

For different environments:
- **Production**: Use Railway variables
- **Development**: Use local `.env` file

## Health Check

Test your deployment:

```bash
curl https://your-app-name.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "transcription": "openai",
  "sentiment": "enabled"
}
```

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Your App Logs**: Railway dashboard → Deployments

## Summary Checklist

- [ ] Created Railway project from GitHub
- [ ] Added all environment variables
- [ ] Generated Railway domain
- [ ] Updated CloudUCM server address to Railway domain
- [ ] Changed CloudUCM port to 443
- [ ] Changed CloudUCM delivery method to HTTPS
- [ ] Tested health endpoint
- [ ] Made test call
- [ ] Verified call appears in dashboard
- [ ] Checked logs for errors

Once all checked, you're live! 🚀
