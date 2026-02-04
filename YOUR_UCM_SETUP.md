# Your CloudUCM Setup Guide

## ✅ Your System Details

### CloudUCM Access
- **URL**: https://071ffb.c.myucm.cloud:8443/
- **Type**: Grandstream CloudUCM (Cloud-hosted)
- **Port**: 8443 (HTTPS)

### Your AudiaPro Details
You'll need these from your AudiaPro account. Login to get them:
- **AudiaPro URL**: https://audiapro-backend.onrender.com
- **Your Subdomain**: (check Settings → Integrations)
- **Webhook Username**: (shown in Settings → Integrations)
- **Webhook Password**: (shown in Settings → Integrations)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Login to CloudUCM

1. Open browser and go to: **https://071ffb.c.myucm.cloud:8443/**
2. Login with your CloudUCM credentials
3. You should see the CloudUCM dashboard

### Step 2: Get Your AudiaPro Webhook Details

1. Open another browser tab
2. Go to: **https://audiapro-backend.onrender.com**
3. Login with your account
4. Go to **Settings → Integrations** (or wherever webhook settings are)
5. Copy these values:
   - 📋 **Webhook URL**: `https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN`
   - 👤 **Username**: (copy this)
   - 🔑 **Password**: (copy this)

### Step 3: Configure CloudUCM CDR Webhook

#### Option A: CDR Real-Time Output (Recommended)

1. In CloudUCM, navigate to:
   ```
   Value-Added Features → API Configuration → CDR Real-Time Output Settings
   ```

2. **Enable**: ☑️ Check the box

3. **Server Address**: `audiapro-backend.onrender.com`

4. **Port**: `443`

5. **Protocol**: Select `HTTPS`

6. **Data Format**: Select `JSON`

7. **Authentication**:
   - Username: (paste from AudiaPro)
   - Password: (paste from AudiaPro)

8. **URL Path** (if field exists): `/api/webhook/cdr/YOUR-SUBDOMAIN`
   - Replace `YOUR-SUBDOMAIN` with your actual subdomain

9. Click **"Save"** or **"Apply Changes"**

#### Option B: HTTP CDR Notification (If Option A not available)

1. In CloudUCM, navigate to:
   ```
   PBX Settings → Call Features → CDR
   ```
   OR
   ```
   Settings → Call Detail Records → HTTP Notification
   ```

2. **Enable HTTP Notification**: ☑️

3. **Webhook URL**:
   ```
   https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN
   ```
   (Replace YOUR-SUBDOMAIN with your actual subdomain)

4. **Method**: `POST`

5. **Authentication Type**: `Basic Auth`

6. **Username**: (paste from AudiaPro)

7. **Password**: (paste from AudiaPro)

8. **Content-Type**: `application/json`

9. **Trigger**: `After Call Ends`

10. **CDR Fields**: Select ALL available fields (check all boxes)

11. Click **"Save and Apply"**

### Step 4: Enable Call Recording (For AI Features)

1. Navigate to:
   ```
   PBX Settings → Call Features → Call Recording
   ```

2. **Recording Mode**: Select `Record All Calls` (recommended)

3. **File Format**: Select `WAV` (best for AI transcription)

4. **Storage**: Use default cloud storage

5. **Recording Access**:
   - Enable HTTP access to recordings
   - Note: CloudUCM handles this automatically

6. Click **"Save and Apply"**

### Step 5: Test the Integration

#### Make a Test Call
1. Use any extension on your CloudUCM
2. Call another extension or external number
3. **Talk for at least 15 seconds** (say something for AI to analyze)
4. Hang up

#### Check CloudUCM Logs
1. In CloudUCM, go to:
   ```
   Status → System Logs → CDR Logs
   ```
2. Look for webhook delivery status:
   - ✅ "HTTP 200 OK" or "Success" = Working!
   - ❌ "401 Unauthorized" = Check username/password
   - ❌ "404 Not Found" = Check webhook URL
   - ❌ "Connection failed" = Check network

#### Verify in AudiaPro
1. Go to: https://audiapro-backend.onrender.com
2. Login to your account
3. Go to **Dashboard**
4. Your test call should appear within **30-60 seconds**
5. If recording is enabled:
   - Transcription may take 1-2 minutes
   - AI analysis appears shortly after

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ CloudUCM logs show "200 OK" for webhook delivery
- ✅ Call appears in AudiaPro dashboard within 1 minute
- ✅ Call details are correct (caller, duration, etc.)
- ✅ Recording is accessible (if enabled)
- ✅ AI transcription appears (if AI features enabled)

---

## 🔧 Quick Test (No Phone Call Needed)

You can test the webhook manually to verify credentials are correct:

```bash
# Replace YOUR-SUBDOMAIN, YOUR-USERNAME, and YOUR-PASSWORD with your actual values

curl -X POST "https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN" \
  -u "YOUR-USERNAME:YOUR-PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueid": "manual-test-123",
    "src": "1001",
    "dst": "1002",
    "duration": 60,
    "billsec": 55,
    "disposition": "ANSWERED"
  }'
```

**Expected Response**:
```json
{"status":"success"}
```

**Error Responses**:
- `401 Unauthorized` = Wrong username or password
- `404 Not Found` = Wrong subdomain in URL
- `400 Bad Request` = Invalid JSON format

---

## 🚨 Troubleshooting

### Issue: Webhook Returns 401 Unauthorized

**Solution**:
1. Login to AudiaPro
2. Go to Settings → Integrations
3. Verify webhook username and password
4. Copy and paste carefully (no extra spaces!)
5. Usernames and passwords are **case-sensitive**

### Issue: Webhook Returns 404 Not Found

**Solution**:
1. Check your subdomain in AudiaPro
2. Webhook URL format must be:
   ```
   https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN
   ```
3. Make sure subdomain matches exactly (no spaces, correct spelling)

### Issue: Calls Not Appearing in AudiaPro

**Check 1**: Verify webhook is configured
- Review CloudUCM webhook settings
- Ensure it's enabled

**Check 2**: Check CloudUCM logs
- Go to Status → System Logs
- Look for HTTP delivery errors

**Check 3**: Test webhook manually (use curl command above)

**Check 4**: Network connectivity
- CloudUCM should have internet access (it's cloud-hosted, so this should be fine)

### Issue: Recordings Not Processing

**Solution**:
1. Verify call recording is enabled in CloudUCM
2. Check recording format (WAV or MP3)
3. Verify OpenAI API key is configured (ask your AudiaPro admin)
4. Enable AI features in AudiaPro Settings

### Issue: Can't Access CloudUCM

**Solution**:
- Verify URL: https://071ffb.c.myucm.cloud:8443/
- Check your internet connection
- Try different browser
- Contact Grandstream support if CloudUCM service is down

---

## 📊 CloudUCM Advantages

Your CloudUCM setup has several benefits:
- ✅ **No local network config** - already internet-accessible
- ✅ **No firewall issues** - cloud-to-cloud communication
- ✅ **Automatic updates** - Grandstream manages firmware
- ✅ **Built-in redundancy** - cloud infrastructure
- ✅ **Easy recording access** - cloud storage included

---

## 🔐 Security Notes

1. **HTTPS Only**: Your CloudUCM uses HTTPS by default ✅
2. **Strong Credentials**: Use complex webhook passwords
3. **Monitor Logs**: Regularly check for unauthorized webhook attempts
4. **Access Control**: Limit who can access CloudUCM admin panel
5. **Regular Audits**: Review user permissions periodically

---

## 📞 Support Contacts

### CloudUCM Issues
- **Grandstream CloudUCM Support**: https://www.grandstream.com/support
- **CloudUCM Portal**: https://myucm.cloud
- **Your Instance**: https://071ffb.c.myucm.cloud:8443/

### AudiaPro Issues
- **Dashboard**: https://audiapro-backend.onrender.com
- **Super Admin Access**: https://audiapro-backend.onrender.com/super-admin
- Check Settings → Help or Documentation

---

## ✅ Configuration Checklist

Use this checklist to ensure everything is set up:

- [ ] Can access CloudUCM at https://071ffb.c.myucm.cloud:8443/
- [ ] Can access AudiaPro at https://audiapro-backend.onrender.com
- [ ] Retrieved webhook URL, username, and password from AudiaPro
- [ ] Configured CDR webhook in CloudUCM
- [ ] Enabled call recording (for AI features)
- [ ] Made test call and it appears in CloudUCM logs
- [ ] Test call appears in AudiaPro dashboard
- [ ] Recording is accessible (if applicable)
- [ ] AI transcription works (if AI features enabled)
- [ ] Tested with 3-5 more calls to verify reliability

---

## 🎓 Next Steps After Setup

Once your webhook is working:

1. **Enable AI Features**:
   - Login to AudiaPro
   - Go to Settings or Dashboard
   - Enable desired AI features (transcription, sentiment, etc.)

2. **Add Team Members**:
   - Go to Settings → Users
   - Invite team members
   - Assign appropriate roles

3. **Configure Notifications**:
   - Set up email alerts
   - Configure thresholds for alerts

4. **Review Analytics**:
   - Explore dashboard metrics
   - Review call quality trends
   - Analyze sentiment patterns

5. **Train Your Team**:
   - Show team how to access dashboard
   - Explain AI insights
   - Set up regular review processes

---

**Document Created**: February 4, 2026
**Your CloudUCM**: https://071ffb.c.myucm.cloud:8443/
**Your AudiaPro**: https://audiapro-backend.onrender.com
**Support**: Available via dashboard
