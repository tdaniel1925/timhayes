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
GET https://071ffb.c.myucm.cloud/api/getCDRList
```

**Authentication:**
```
Username: testco_webhook
Password: TestWebhook123!
```

**Parameters:**
- `start_time`: YYYY-MM-DD HH:MM:SS
- `end_time`: YYYY-MM-DD HH:MM:SS
- `format`: json

**Example:**
```bash
curl -u "testco_webhook:TestWebhook123!" \
  "https://071ffb.c.myucm.cloud/api/getCDRList?start_time=2026-02-04%2000:00:00&end_time=2026-02-04%2023:59:59&format=json"
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
