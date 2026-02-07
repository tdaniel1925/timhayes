# Render Background Worker Deployment Guide

## Overview
This guide walks you through deploying the CloudUCM recording scraper as a background worker on Render.com.

## Cost
- **Backend (existing)**: Free tier
- **Recording Scraper Worker**: $7/month (Starter plan - required for background workers)

## Prerequisites
1. Render.com account connected to your GitHub repository
2. CloudUCM credentials (admin1 / BotMakers@2026)
3. Supabase project with storage bucket configured

## Step 1: Commit and Push Changes

The following files have been created/updated:
- `ucm_recording_scraper.py` - Main scraper script
- `render.yaml` - Worker configuration added
- `requirements.txt` - Playwright dependency added

Commit and push to GitHub:

```bash
git add ucm_recording_scraper.py render.yaml requirements.txt
git commit -m "Add CloudUCM recording scraper worker"
git push origin main
```

## Step 2: Configure Environment Variables in Render

Go to your Render dashboard and add these environment variables to **BOTH** services (web + worker):

### Required Variables (if not already set):
```
DATABASE_URL=postgresql://postgres.fcubjohwzfhjcwcnwost:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres
SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_supabase_key>
SUPABASE_BUCKET=<your_bucket_name>
OPENAI_API_KEY=<your_openai_key>
```

### Worker-Specific Variables (already in render.yaml):
```
UCM_URL=https://071ffb.c.myucm.cloud:8443
UCM_USERNAME=admin1
UCM_PASSWORD=BotMakers@2026
SCRAPER_INTERVAL=300
DOWNLOAD_DIR=/tmp/ucm_recordings
```

## Step 3: Deploy the Worker

After pushing to GitHub:

1. Render will detect the changes in `render.yaml`
2. It will create a new service: `recording-scraper`
3. Automatically start building:
   - Install Python dependencies
   - Install Playwright Chromium browser
   - Install system dependencies for headless Chrome

**Build time**: 3-5 minutes (Playwright browser installation)

## Step 4: Monitor the Worker

### View Logs
1. Go to Render dashboard
2. Select `recording-scraper` service
3. Click "Logs" tab

You should see:
```
UCM RECORDING SCRAPER STARTED
Interval: 300 seconds
==========================================
ITERATION #1 - 2026-02-06 12:00:00
==========================================
Starting CloudUCM recording scraper
Launching browser...
Navigating to CloudUCM login...
```

### Expected First Run
The scraper will run but will likely fail because the CSS selectors are placeholders. You'll see:
```
Could not find CDR menu - saving screenshot for debugging
```

This is EXPECTED! See Step 5 below.

## Step 5: Find Correct CloudUCM UI Selectors

The scraper needs actual CSS selectors from your CloudUCM web interface. Run the helper script to inspect:

```bash
python inspect_clouducm_ui.py
```

This will:
1. Login to CloudUCM
2. Take screenshots of each page
3. Save HTML structure to files
4. Help you identify the correct selectors

Look for:
- Login form field names/IDs
- CDR menu link text or CSS selector
- Recording table structure
- Download button selectors

## Step 6: Update Scraper with Real Selectors

Once you have the selectors, update `ucm_recording_scraper.py`:

### Example selector updates:
```python
# Lines 82-83 (Login fields)
page.fill('input[name="actual_username_field"]', self.username)
page.fill('input[name="actual_password_field"]', self.password)

# Line 87 (Login button)
page.click('button[id="actual_login_button"]')

# Line 103 (CDR menu)
page.click('a[href="/cdr"]')  # or whatever the actual link is
```

Commit and push the updated file - Render will auto-redeploy.

## Step 7: Verify End-to-End Flow

Once the scraper is working, verify:

1. **Check logs**: Worker successfully downloads recordings
2. **Check Supabase**: Files appear in storage bucket
3. **Check database**: `supabase_path` column populated on CDR records
4. **Check transcriptions**: AI processing triggered automatically

## Troubleshooting

### Worker won't start
- Check environment variables are set correctly
- Verify DATABASE_URL is accessible from Render

### Login fails
- Verify UCM_PASSWORD is correct
- Check UCM_URL is accessible (not blocked by firewall)
- Inspect screenshot saved to `/tmp/ucm_recordings/debug_dashboard.png`

### Can't find recordings page
- Update CSS selectors based on actual CloudUCM interface
- Check screenshots for menu structure

### Downloads fail
- Verify CloudUCM recordings exist for the calls
- Check download directory permissions
- Look for JavaScript errors in logs

### Supabase upload fails
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check bucket exists and has proper permissions
- Verify file size limits

## Monitoring & Maintenance

### Log Rotation
Render automatically manages log rotation.

### Scraper Interval
Default: 300 seconds (5 minutes)
To change: Update `SCRAPER_INTERVAL` environment variable in Render dashboard

### Stopping the Worker
To pause scraping temporarily:
1. Go to Render dashboard
2. Select `recording-scraper`
3. Click "Suspend"

To restart: Click "Resume"

### Scaling
If you need faster processing:
- Reduce SCRAPER_INTERVAL (minimum: 60 seconds recommended)
- Upgrade to higher Render plan for more CPU/memory

## Cost Management

If you want to reduce costs:
- Run scraper only during business hours (requires code changes)
- Increase SCRAPER_INTERVAL to reduce CPU usage
- Suspend worker when not needed

## Next Steps After Deployment

1. Run the UI inspector script (Step 5)
2. Update selectors in scraper (Step 6)
3. Monitor first successful run (Step 7)
4. Verify recordings flow through to AI processing
5. Check your AudiaPro dashboard shows transcriptions and summaries

## Support

If you encounter issues:
1. Check Render logs first
2. Look for error screenshots in `/tmp/ucm_recordings/`
3. Verify all environment variables are set
4. Test CloudUCM login manually in browser
