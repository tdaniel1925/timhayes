# Recording Download Issue - Root Cause Analysis

**Date:** February 5, 2026
**Status:** CRITICAL - 100% Recording Download Failure Rate

---

## Executive Summary

Backend is operational and receiving webhooks successfully, but **ZERO recordings are being downloaded** from the UCM phone system. This prevents all AI features (transcription, sentiment analysis, summaries) from functioning.

---

## FACTS (Database Analysis)

### 1. Backend Status
- ✅ **Backend is RUNNING**: `https://audiapro-backend.onrender.com/api/health` returns healthy
- ✅ **Database is CONNECTED**: PostgreSQL connection successful
- ✅ **Webhooks are WORKING**: 14 CDR records received successfully

### 2. Call Records Analysis
```
Total CDR records: 14
Calls with recording paths: 5
Recordings downloaded: 0
Download success rate: 0.0%
```

### 3. Recent Calls with Recording Paths

| Call ID | Date/Time | From | To | Duration | Recording Path |
|---------|-----------|------|----|---------:|----------------|
| 16 | 2026-02-05 21:21 | 1000 | 2815058290 | 42s | `2026-02/auto-1770326441-1000-2815058290.wav@` |
| 15 | 2026-02-05 03:31 | 1000 | 2815058290 | 35s | `2026-02/auto-1770262238-1000-2815058290.wav@` |
| 14 | 2026-02-05 03:28 | 1000 | 2815058290 | 24s | `2026-02/auto-1770262056-1000-2815058290.wav@` |
| 13 | 2026-02-05 03:28 | 1000 | 2815058290 | 33s | `2026-02/auto-1770261795-1000-2815058290.wav@` |
| 10 | 2026-02-05 03:04 | 1000 | 2815058290 | 31s | `2026-02/auto-1770260660-1000-2815058290.wav@` |

### 4. AI Processing Status
```
Transcriptions: 0
Sentiment Analyses: 0
AI Summaries: 0
Storage Bucket Objects: 0
```

**Conclusion**: No recordings are being downloaded, so AI processing pipeline has no data to work with.

---

## Root Cause Analysis

### Issue 1: Recording Path Format
All recording paths from UCM end with `@` symbol:
```
2026-02/auto-1770326441-1000-2815058290.wav@
```

The `@` symbol indicates the UCM server/partition where the recording is stored. This is valid UCM CDR format, but may need special handling in download URLs.

### Issue 2: Download URLs Being Attempted
Based on `ucm_downloader.py` code, these URLs are tried:

1. `https://{UCM_IP}:8089/recordings/2026-02/auto-1770326441-1000-2815058290.wav@`
2. `https://{UCM_IP}:8089/2026-02/auto-1770326441-1000-2815058290.wav@`
3. `https://{UCM_IP}/cdrapi/recording?file=2026-02/auto-1770326441-1000-2815058290.wav@`

The `@` at the end may be causing:
- HTTP 404 (file not found)
- HTTP 400 (bad request)
- URL encoding issues

### Issue 3: Missing Environment Variables
The production backend needs these environment variables configured:
- `UCM_IP` - IP address of the UCM phone system
- `UCM_USERNAME` - UCM admin username (typically `admin`)
- `UCM_PASSWORD` - UCM admin password
- `TRANSCRIPTION_ENABLED` - Should be `true`
- `SENTIMENT_ENABLED` - Should be `true`

**Unknown**: Whether these are properly configured in Render production environment.

### Issue 4: Network Connectivity
The Render backend server must be able to reach the UCM system:
- UCM must be accessible from Render's IP addresses
- Port 8089 (HTTPS) must be open
- UCM firewall must allow Render's IPs
- If UCM is on private network, may need VPN or IP whitelisting

---

## Technical Details

### Database Schema: `cdr_records`
```
id: integer (primary key)
tenant_id: integer
uniqueid: character varying
recordfiles: text (path from UCM)
recording_downloaded: boolean (always FALSE)
recording_local_path: text (always NULL)
received_at: timestamp (webhook received time)
```

### Current Download Flow
1. ✅ UCM sends webhook to `/api/webhook/cdr/{subdomain}`
2. ✅ Backend creates CDR record with `recordfiles` path
3. ✅ Backend triggers `process_call_ai_async()` task
4. ❌ **FAILS HERE** - `download_and_upload_recording()` returns None
5. ❌ Recording not uploaded to Supabase Storage
6. ❌ Transcription skipped (no audio file)
7. ❌ Sentiment analysis skipped (no transcription)

---

## Recommended Solutions

### Solution 1: Strip @ Symbol from Recording Path
Modify `ucm_downloader.py` to clean the recording path:

```python
# In download_recording() method, before constructing URLs:
recording_path = recording_path.rstrip('@')  # Remove trailing @
```

### Solution 2: Test UCM Connectivity
Add diagnostic endpoint to test UCM connection:

```python
@app.route('/api/admin/test-ucm-connection', methods=['POST'])
def test_ucm_connection():
    # Test if backend can reach UCM and authenticate
    # Try downloading a specific recording
    # Return detailed error messages
```

### Solution 3: Verify Environment Variables
Check Render dashboard for these environment variables:
```bash
render variables -s audiapro-backend
```

Should show:
- UCM_IP: [IP address]
- UCM_USERNAME: admin (or similar)
- UCM_PASSWORD: [configured]
- TRANSCRIPTION_ENABLED: true
- SENTIMENT_ENABLED: true

### Solution 4: Enhanced Logging (Already Added)
Recent commit added detailed logging to track:
- UCM credentials being used
- Each download URL attempted
- HTTP response codes
- Content lengths
- Error messages

**Action**: Deploy the enhanced logging and test with next incoming call.

### Solution 5: Manual Test
Manually trigger download for Call ID 16:

```python
from ucm_downloader import download_and_upload_recording
from supabase_storage import SupabaseStorageManager

storage_manager = SupabaseStorageManager()
result = download_and_upload_recording(
    ucm_ip=os.getenv('UCM_IP'),
    ucm_username=os.getenv('UCM_USERNAME'),
    ucm_password=os.getenv('UCM_PASSWORD'),
    recording_path='2026-02/auto-1770326441-1000-2815058290.wav@',
    tenant_id=1,
    uniqueid='1770326441.84',
    storage_manager=storage_manager
)
print(f"Result: {result}")
```

---

## Next Steps (Priority Order)

1. **IMMEDIATE**: Check Render environment variables for UCM credentials
2. **IMMEDIATE**: Strip `@` symbol from recording paths before download
3. **HIGH**: Deploy enhanced logging and monitor next call
4. **HIGH**: Test UCM connectivity from Render (ping, HTTP request)
5. **MEDIUM**: Create admin test endpoint to manually trigger download
6. **MEDIUM**: Check UCM firewall/network rules for Render IPs

---

## Questions to Answer

1. What is the UCM IP address? (Check Render env var `UCM_IP`)
2. Can Render backend reach that IP? (Network test)
3. Are UCM credentials correct? (Authentication test)
4. Does the `@` symbol need to be stripped? (Try both ways)
5. Is port 8089 open on UCM for external access?
6. Does UCM have IP whitelist that blocks Render?

---

## Impact

**Current Impact:**
- Users see "Recording not available" error when trying to play calls
- No transcriptions being generated
- No sentiment analysis
- No AI summaries
- No quality scores
- No churn predictions
- Essentially: **ALL AI FEATURES NON-FUNCTIONAL**

**User Experience:**
- Calls show in dashboard ✅
- Call metadata visible (caller, duration, etc.) ✅
- Recording playback **BROKEN** ❌
- AI insights **MISSING** ❌
