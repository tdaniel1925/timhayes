# UCM API Troubleshooting - 071ffb.c.myucm.cloud

## ❌ Current Issue

**Both Node.js and Python** are getting the same error from `/api/challenge`:

```json
{
  "response": {
    "error_msg": "Invalid parameters!"
  },
  "status": -1
}
```

This response does **NOT** contain a `challenge` field, which is required for authentication.

---

## What We've Tested

✅ **Correct URL format** - `https://071ffb.c.myucm.cloud:8443/api/challenge`
✅ **SSL/HTTPS handling** - Disabled certificate verification
✅ **Multiple request formats** - GET, POST, JSON, form data
✅ **Multiple languages** - Node.js (TypeScript) AND Python
✅ **Exact code from your guide** - Python script copied verbatim

**Result:** All methods fail with same error

---

## Possible Causes

### 1. API Access Not Actually Enabled

Even though you mentioned settings are fine, please verify:

**Steps to verify:**
1. Log into UCM web UI: https://071ffb.c.myucm.cloud:8443
2. Navigate to: **System Settings → API**
3. Check these specific settings:
   - [ ] **Enable API Access** - Must be ON
   - [ ] **Enable Challenge/Response Auth** - Must be ON
   - [ ] **Allow RECAPI** - Must be ON
   - [ ] **Allow CDRAPI** - Must be ON
4. Check **API Users**:
   - [ ] Is `admin1` listed as an API user?
   - [ ] Does `admin1` have API permissions?

### 2. Cloud UCM API Restrictions

The cloud-hosted UCM (`*.c.myucm.cloud`) might have:
- Different API version than on-premise UCM
- Additional security requirements
- IP whitelist restrictions
- Different authentication method

### 3. API Version Mismatch

Your guide might be for a different UCM firmware version. Check:
- UCM firmware version (System → Status)
- Compare with API documentation for that version

### 4. Required API Key or Token

Some UCM versions require an API key in headers:
```
X-API-Key: your-api-key
Authorization: Bearer token
```

---

## Next Steps to Debug

### Step 1: Check UCM Documentation

1. Log into UCM web UI
2. Go to **System → Help** or **API Documentation**
3. Find the API reference for your specific firmware version
4. Check the challenge endpoint format

### Step 2: Contact Grandstream Support

Since our code matches your guide exactly but fails, this might be:
- A configuration issue only visible in UCM admin panel
- A cloud UCM limitation
- A firmware/version issue

**Contact Grandstream Support with:**
- UCM Model: (cloud-hosted)
- Firmware Version: (check in UCM)
- Error: "API challenge endpoint returns 'Invalid parameters!'"
- Question: "How to enable API access for cloud-hosted UCM?"

### Step 3: Alternative - Check if CDR Webhooks Work

The good news: **You don't need the API for webhooks to work!**

**Test if real-time CDR webhooks are enabled:**
1. In UCM, go to: **Call Features → CDR**
2. Look for: **CDR Real-Time Output** or **Webhook Configuration**
3. Configure webhook to point to your AudiaPro endpoint
4. Make a test call
5. Check if webhook data arrives

**If webhooks work**, you can:
- ✅ Receive call data in real-time
- ✅ Queue jobs for processing
- ⚠️ BUT need alternative download method for recordings

---

## Workarounds (Since API Failed)

### Option A: Fix the API (Recommended)

Work with Grandstream support to enable proper API access

### Option B: Use Web UI Automation (You said no)

Browser automation to download recordings (you don't want this)

### Option C: Direct File Access

If you have SSH/FTP access to the UCM:
- Recordings stored in: `/var/spool/asterisk/monitor/`
- Could use SCP/SFTP to download
- Requires server access permissions

### Option D: UCM Email/FTP Upload

Configure UCM to automatically upload recordings:
- UCM can email recordings
- UCM can FTP recordings to a server
- You retrieve from email/FTP server

---

## Questions for You

1. **Can you screenshot your UCM API settings page?**
   - System Settings → API
   - Would help us see what's actually configured

2. **What UCM firmware version are you running?**
   - System → Status → Firmware Version

3. **Is this a trial/demo cloud UCM?**
   - Some trial accounts have API restrictions

4. **Can you check UCM logs for API errors?**
   - System → Logs
   - Filter for API or authentication errors

5. **Did your guide's Python code work when it was written?**
   - Or is this a new setup that never worked?

---

## Conclusion

The API is definitely not working as documented. Since you've checked settings and say they're fine, this is likely:

- A cloud UCM limitation/restriction
- An undocumented API change
- A missing configuration step not in your guide

**Recommended Action:**
1. Screenshot your API settings page
2. Check firmware version
3. Contact Grandstream support
4. OR - verify CDR webhooks work and we'll find alternative download method

**We can still build Stage 4** with placeholder for recording download, and implement the actual download method once API access is resolved.
