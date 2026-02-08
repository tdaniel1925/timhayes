# AudiaPro UCM Recording Scraper

Automated recording downloader for Grandstream CloudUCM using the "Download All" button approach.

## How It Works

1. **Session-based authentication** - Bypasses reCAPTCHA by reusing saved login sessions
2. **Download All button** - Downloads all recordings at once as a tar archive
3. **Tar extraction** - Extracts WAV files from the archive
4. **Smart duplicate detection** - Only uploads recordings not already in database
5. **Supabase Storage** - Uploads WAV files and updates `cdr_records` table
6. **Auto-refresh sessions** - Keeps session alive by refreshing cookies after each run

## Setup

### 1. Run Database Migration

Run the migration to create the `ucm_sessions` table in Supabase:

```bash
# In Supabase SQL Editor, run:
scraper/migrations/001_create_ucm_sessions.sql
```

### 2. Install Dependencies Locally

```bash
cd scraper
npm install
npx playwright install chromium
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://fcubjohwzfhjcwcnwost.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
UCM_URL=https://071ffb.c.myucm.cloud:8443
TENANT_ID=1
```

### 4. Save Initial Session (Run Locally)

This step must be done on your computer (not on Render) because it requires manual login:

```bash
npm run save-session
```

**What happens:**
1. Browser window opens
2. Navigate to UCM and login manually
3. Solve the reCAPTCHA
4. When you see the dashboard, come back to terminal
5. Press ENTER
6. Session saved to Supabase `ucm_sessions` table

**This only needs to be done once** (or when session expires).

### 5. Test Locally (Optional)

```bash
npm run test
```

This runs the scraper once in headless mode and shows results.

### 6. Deploy to Render

Create a new **Background Worker** service on Render:

- **Name**: `audiapro-scraper`
- **Environment**: `Docker`
- **Build Command**: (automatic from Dockerfile)
- **Start Command**: (automatic from Dockerfile)
- **Environment Variables**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `UCM_URL`
  - `TENANT_ID`

The scraper will run automatically every 15 minutes.

## Files

- **`ucm-scraper.mjs`** - Main scraper (runs in loop on Render)
- **`save-session.mjs`** - Session capture script (run locally once)
- **`package.json`** - Dependencies
- **`Dockerfile`** - Render deployment configuration
- **`migrations/001_create_ucm_sessions.sql`** - Database schema

## How Scraper Works

### Every 15 minutes:

1. **Load session** from Supabase `ucm_sessions` table
2. **Launch browser** with saved cookies (no login needed!)
3. **Navigate** to `/cdr/recordingFile`
4. **Check if session expired** - if login page appears, mark session invalid and alert
5. **Click "Download All"** button
6. **Confirm download** in modal
7. **Wait for tar file** to download (up to 3 minutes)
8. **Extract tar** to `/tmp/ucm_recordings`
9. **Find WAV files** (including nested subdirectories)
10. **Compare against database** - get list of already-downloaded filenames
11. **Upload new recordings** to Supabase Storage
12. **Update `cdr_records`** - set `recording_local_path` and `recording_downloaded = true`
13. **Refresh session cookies** - save updated session to keep it alive
14. **Clean up** - delete tar file and extracted directories

### Session Expiry Handling

If the scraper detects the session has expired (login page appears):
- Sets `is_valid = false` in database
- Logs error with clear message
- You need to run `save-session.mjs` locally again to capture a new session

### Duplicate Detection

The scraper compares filenames against the database:
```sql
SELECT recordfiles FROM cdr_records
WHERE tenant_id = 1
AND recording_local_path IS NOT NULL
```

Extracts filename from `recordfiles` field (e.g., `"2026-02/auto-1770406580-1000-2815058290.wav@"` → `"auto-1770406580-1000-2815058290.wav"`)

If filename already exists, skip download and log `[SKIP]`.

## Troubleshooting

### Session expired

**Error**: `[Scraper] SESSION EXPIRED - re-login required`

**Fix**: Run `npm run save-session` locally to capture a new session.

### No session found

**Error**: `[Scraper] ERROR: No session found`

**Fix**: You need to run `save-session.mjs` at least once before deploying.

### Download button not found

**Error**: `"Download All" button not found on page`

**Fix**: UCM UI may have changed. Check if button text changed or if you're on the wrong page.

### Tar extraction fails

**Error**: `Error extracting tar file`

**Fix**: Check that the tar file downloaded correctly (not an HTML error page). May need to increase download timeout.

### Recordings don't match CDR

**Error**: `[DB] No matching CDR found for: auto-xxx.wav`

**Fix**: This is normal for historical recordings. The CDR poller only captures new calls. Recording still uploaded to storage.

## Monitoring

Check Render logs to monitor scraper:

```
[Scraper] Starting run at 2026-02-08T14:30:00.000Z
[Scraper] Found valid session
[Scraper] Already have 45 recordings in database
[Scraper] Launching browser...
[Scraper] Opening recordings page...
[Scraper] Clicking "Download All" button...
[Scraper] Waiting for tar file download...
[Scraper] Downloading: recordings_20260208_143005.tar
[Scraper] Downloaded: 12.45 MB
[Scraper] Session refreshed
[Scraper] Extracting tar file...
[Scraper] Found 58 WAV files
[Scraper] [SKIP] auto-1770123456-1000-2815058290.wav (already in database)
...
[Scraper] [NEW] auto-1770406580-1000-2815058290.wav (234.5 KB)
[Upload] Success: tenant_1/1770406580.133_auto-1770406580-1000-2815058290.wav
[DB] Updated CDR record: 123
[Scraper]   Uploaded and linked to CDR 123
...
[Scraper] COMPLETE in 45.2s
[Scraper]  New files: 13
[Scraper]  Total files: 58
[Scraper]  Uploaded: 13
[Scraper]  Errors: 0
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  save-session.mjs (run locally once)                │
│  • Opens browser for manual login                   │
│  • Saves session to Supabase                        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Supabase: ucm_sessions table                       │
│  • Stores Playwright cookies & localStorage         │
│  • One session per tenant                           │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  ucm-scraper.mjs (runs on Render every 15 min)     │
│  • Loads session from database                      │
│  • Clicks "Download All" button                     │
│  • Downloads tar file                               │
│  • Extracts WAV files                               │
│  • Uploads to Supabase Storage                      │
│  • Updates cdr_records table                        │
│  • Refreshes session cookies                        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Supabase: recordings bucket + cdr_records table    │
│  • WAV files stored in: tenant_1/uniqueid_file.wav  │
│  • cdr_records.recording_local_path points to file  │
│  • AI processing triggers on recording upload       │
└─────────────────────────────────────────────────────┘
```

## Differences from Python Scraper

### Old Python Scraper (ucm_recording_scraper.py)
- Downloaded recordings **one by one** (slow)
- Required 15-second delay between each download to avoid rate limiting
- Timed out frequently on download button clicks
- Max 10-20 recordings per run

### New JavaScript Scraper (ucm-scraper.mjs)
- Downloads **all recordings at once** via "Download All" button (fast)
- No rate limiting issues (single download)
- More reliable (tar extraction vs. individual clicks)
- Processes unlimited recordings per run
- Session-based authentication prevents reCAPTCHA issues

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (needed for storage uploads) |
| `SUPABASE_KEY` | Alternative | Can use anon key if service key not available |
| `UCM_URL` | Yes | UCM web interface URL (e.g., `https://071ffb.c.myucm.cloud:8443`) |
| `TENANT_ID` | Yes | Tenant ID to process recordings for (default: 1) |

## License

Proprietary - AudiaPro Internal Use Only
