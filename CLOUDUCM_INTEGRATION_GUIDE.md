# CloudUCM Integration Guide

## Overview
CloudUCM (cloud version) doesn't support real-time PUSH webhooks like on-premise UCM6xxx. This guide covers multiple integration methods.

---

## ✅ Method 1: Automated CDR Polling (IMPLEMENTED)

**Status:** Active and running

**How it works:**
- Background service polls CloudUCM API every 2 minutes
- Fetches new CDR records automatically
- Processes through AI pipeline
- **Delay:** 2-5 minutes (near real-time)

**No additional configuration needed** - this is now running automatically!

### Manual Sync Trigger
You can also trigger an immediate sync:

```bash
POST /api/admin/sync-cdrs
Authorization: Bearer <your_token>
```

Or in the Dashboard (coming soon):
- Admin Settings → "Sync CDRs Now" button

---

## 🔄 Method 2: CloudUCM API Direct Access

**Use Case:** On-demand queries, historical data

**Endpoint:**
```
POST https://071ffb.c.myucm.cloud:8443/api
```

**Authentication:** Challenge/Response Protocol
```
Username: testco_webhook
Password: TestWebhook123!
```

**Authentication Flow:**
1. Request challenge: `POST {"action": "challenge", "user": "testco_webhook"}`
2. Create MD5 token: `md5(challenge + password)`
3. Login: `POST {"action": "login", "user": "testco_webhook", "token": "<md5_hash>"}`
4. Use session cookie for subsequent requests

**CDR Query Parameters:**
- `action`: "cdrapi"
- `format`: "json"
- `startdate`: YYYY-MM-DD HH:MM:SS
- `enddate`: YYYY-MM-DD HH:MM:SS

**Example:**
```bash
# Step 1: Get challenge
CHALLENGE=$(curl -s -k -X POST https://071ffb.c.myucm.cloud:8443/api \
  -H "Content-Type: application/json" \
  -d '{"action":"challenge","user":"testco_webhook"}' | jq -r '.response.challenge')

# Step 2: Create MD5 token
TOKEN=$(echo -n "${CHALLENGE}TestWebhook123!" | md5sum | cut -d' ' -f1)

# Step 3: Login and get session cookie
curl -s -k -X POST https://071ffb.c.myucm.cloud:8443/api \
  -H "Content-Type: application/json" \
  -d '{"action":"login","user":"testco_webhook","token":"'$TOKEN'"}' \
  -c cookies.txt

# Step 4: Query CDRs
curl -s -k -X POST https://071ffb.c.myucm.cloud:8443/api \
  -H "Content-Type: application/json" \
  -d '{"action":"cdrapi","format":"json","startdate":"2026-02-04 00:00:00","enddate":"2026-02-04 23:59:59"}' \
  -b cookies.txt
```

---

## 📥 Method 3: Manual CDR Download & Import

**Steps:**
1. In CloudUCM: **CDR** → Select date range
2. Click **"Download All Records"**
3. Save CSV/JSON file
4. Import via AudiaPro dashboard (coming soon)

**Future Feature:**
- Drag & drop CDR file upload
- Bulk import with AI processing
- Historical data backfill

---

## 📧 Method 4: Email-Based CDR Delivery

**If CloudUCM supports:**
1. Configure CloudUCM to email CDR reports
2. Set up email forwarding to: cdr@yourdomain.com
3. AudiaPro processes incoming emails (requires email integration)

**Status:** Not yet implemented

---

## 🔌 Method 5: FTP/SFTP File Transfer

**If CloudUCM supports:**
1. Configure CloudUCM to write CDR files to SFTP server
2. Point to AudiaPro SFTP endpoint
3. Automatic file pickup and processing

**Status:** Not yet implemented

---

## 📊 Method 6: GDMS Integration

**For Grandstream GDMS users:**
- GDMS (Grandstream Device Management System) can aggregate CDRs from multiple CloudUCM instances
- If you're using GDMS, we can integrate at that level

**Status:** Available on request

---

## 🎯 Recommended Setup (Current)

**Primary:** Automated Polling (Method 1) ✅ **ACTIVE**
- Runs every 2 minutes
- No manual intervention needed
- Handles all calls automatically

**Backup:** Manual Sync Button
- For immediate sync on-demand
- Useful after system maintenance

**Future:** Real-time webhook when CloudUCM adds support

---

## 🛠️ Troubleshooting

### Check Polling Status
```bash
GET /api/health
```
Look for: `"cdr_poller": "active"`

### View Last Sync Time
Check Render logs for:
```
✅ Processed X new CDRs for tenant...
```

### Force Immediate Sync
```bash
POST /api/admin/sync-cdrs
Authorization: Bearer <admin_token>
```

---

## 📞 Support

If you need a different integration method or have issues:
1. Check Render logs for polling errors
2. Verify CloudUCM API credentials are correct
3. Ensure CloudUCM API is enabled in Integrations

---

## 🔐 Security Notes

- All API calls use HTTPS
- Credentials encrypted in database
- Polling runs in secure background thread
- No CDR data stored in logs (except uniqueid)
