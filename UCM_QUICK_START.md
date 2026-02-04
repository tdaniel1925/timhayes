# Grandstream UCM Quick Start Guide - Finding IP & Setup

## 🎯 Goal
Connect your Grandstream UCM phone system to AudiaPro in under 10 minutes

---

## Step 1: Find Your UCM IP Address

### Method 1: Check the UCM Display Screen (Easiest)
1. Look at the front LCD screen of your UCM device
2. The IP address is displayed on the screen (example: `192.168.1.100`)
3. Write this down - you'll need it!

### Method 2: Check Your Network Router
1. Login to your router's admin page
2. Look for "Connected Devices" or "DHCP Clients"
3. Find device named "UCM" or "Grandstream"
4. Note the IP address assigned to it

### Method 3: Use Phone to Check
1. Pick up any extension phone connected to the UCM
2. Dial: `***`
3. Listen to the voice announcement - it will tell you the IP address
4. Write it down

### Method 4: Network Scan (Advanced)
If you know your network subnet (e.g., 192.168.1.x):
```bash
# Windows
arp -a | findstr "00-0b-82"

# Mac/Linux
arp -a | grep "00:0b:82"
```
Grandstream devices start with MAC address `00-0b-82`

---

## Step 2: Access UCM Web Interface

1. **Open web browser** (Chrome, Firefox, Safari)

2. **Navigate to UCM**:
   - Type in address bar: `https://YOUR_UCM_IP:8089`
   - Example: `https://192.168.1.100:8089`
   - Note: Use **https** (with 's'), and port **8089**

3. **Accept Security Warning** (normal for local devices):
   - Click "Advanced" → "Proceed to site" (or similar)

4. **Login**:
   - Default username: `admin`
   - Default password: `admin`
   - (If changed, use your custom credentials)

✅ **Success!** You should now see the UCM dashboard

---

## Step 3: Check Your Current Setup

Before configuring the webhook, gather this information:

### From AudiaPro Platform:

1. **Login to AudiaPro**:
   - URL: `https://audiapro-backend.onrender.com`
   - Your admin email and password

2. **Go to Settings → Integrations**

3. **Copy these values**:
   - 📋 **Webhook URL**: `https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN`
   - 👤 **Username**: (shown on Integrations page)
   - 🔑 **Password**: (shown on Integrations page)

---

## Step 4: Configure UCM - Two Options

Based on the official Grandstream documentation, there are **two ways** to send CDR data:

### ✅ **Option A: CDR Real-Time Output (RECOMMENDED)**

This is the **easiest** and **most reliable** method.

#### 4.1: Navigate to Settings
In UCM web interface:
```
Value-Added Features → API Configuration → CDR Real-Time Output Settings
```

#### 4.2: Configure Settings

**Enable Feature**: ☑️ Check the box to enable

**Server Address**: `audiapro-backend.onrender.com`

**Port**: `443` (HTTPS)

**Protocol**: Select `HTTPS`

**Data Format**: Select `JSON`

**Authentication**:
- Username: (paste from AudiaPro)
- Password: (paste from AudiaPro)

**Additional Settings** (if available):
- URL Path: `/api/webhook/cdr/YOUR-SUBDOMAIN`
- Method: `POST`
- Content-Type: `application/json`

#### 4.3: Save
Click **"Save"** or **"Apply Changes"**

---

### Option B: Traditional CDR HTTP Callback (Alternative)

If your UCM firmware doesn't have "CDR Real-Time Output":

#### 4.1: Navigate to Settings
```
PBX Settings → Call Features → CDR → HTTP Notification
```
(Path may vary by firmware version - look for "CDR" or "HTTP Callback")

#### 4.2: Configure Webhook

**Enable HTTP Notification**: ☑️ Check the box

**URL**: `https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN`

**Method**: `POST`

**Authentication Type**: `Basic Auth`

**Username**: (paste from AudiaPro)

**Password**: (paste from AudiaPro)

**Content-Type**: `application/json`

**Trigger**: `After Call Ends` (when to send)

#### 4.3: Select CDR Fields

Check ALL available fields (more data = better AI analysis):
- ☑️ uniqueid
- ☑️ src (caller)
- ☑️ dst (called party)
- ☑️ duration
- ☑️ billsec
- ☑️ disposition
- ☑️ recordfiles (recording path)
- ☑️ start_time
- ☑️ answer_time
- ☑️ end_time
- ☑️ All other available fields

#### 4.4: Save
Click **"Save and Apply"** or **"Apply Changes"**

---

## Step 5: Enable Call Recording (Required for AI)

If you want AI transcription, sentiment analysis, and other AI features:

### 5.1: Navigate to Recording Settings
```
PBX Settings → Call Features → Call Recording
```

### 5.2: Enable Recording

**Recording Mode**: Select one:
- **Record All Calls** ← Recommended for analytics
- Record on Demand
- Record Inbound Only
- Record Outbound Only

**File Format**:
- **WAV** ← Best for transcription
- MP3 (smaller files, slightly lower quality)

**Storage**: Local storage (default is fine)

### 5.3: Make Recordings Accessible

**Option 1: HTTP File Server (Easy)**
```
System Settings → File Share → HTTP File Server
```
- Enable HTTP File Server: ☑️
- Port: `8089` (default)
- Public Access: Enable (or set auth)

**Option 2: External Storage**
Configure FTP/SFTP if you prefer external storage

### 5.4: Save
Click **"Save and Apply"**

---

## Step 6: Test the Connection

### 6.1: Make a Test Call
1. Use any extension on your UCM
2. Call another extension or external number
3. **Talk for at least 10 seconds** (for AI to have data)
4. Hang up

### 6.2: Check UCM Status
In UCM web interface:
```
Status → System Logs → CDR Logs
```
Look for:
- ✅ "HTTP delivery successful" or "200 OK"
- ❌ "Failed to deliver" = troubleshooting needed

### 6.3: Check AudiaPro
1. Login to AudiaPro: `https://audiapro-backend.onrender.com`
2. Go to **Dashboard**
3. Your call should appear within **30-60 seconds**
4. If you enabled recording + AI features:
   - Transcription may take 1-2 minutes
   - AI analysis appears shortly after

---

## 🎉 Success Checklist

- ✅ Found UCM IP address
- ✅ Logged into UCM web interface
- ✅ Configured CDR webhook
- ✅ Enabled call recording (for AI)
- ✅ Made test call
- ✅ Call appears in AudiaPro dashboard

---

## 🚨 Troubleshooting

### Issue: Can't find UCM IP address
**Solution**:
- Check physical display on UCM device
- Check router's connected devices list
- Ask your IT department

### Issue: Can't access UCM web interface
**Solution**:
- Make sure you're on the same network as UCM
- Try `http://` instead of `https://`
- Try port `8089` or `443`
- Reset UCM to factory defaults (last resort)

### Issue: Calls not appearing in AudiaPro
**Check 1**: Test webhook manually
```bash
curl -X POST "https://audiapro-backend.onrender.com/api/webhook/cdr/YOUR-SUBDOMAIN" \
  -u "YOUR_USERNAME:YOUR_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"uniqueid":"test","src":"1001","dst":"1002","duration":60,"billsec":55,"disposition":"ANSWERED"}'
```
Should return: `{"status":"success"}`

**Check 2**: Review UCM logs
- Go to: Status → System Logs
- Look for HTTP errors:
  - `401` = Wrong username/password
  - `404` = Wrong URL
  - `500` = Server error (contact support)

**Check 3**: Network connectivity
```bash
# From UCM console/SSH:
ping audiapro-backend.onrender.com
```

**Check 4**: Firewall
- Ensure UCM can make **outbound HTTPS** connections (port 443)
- Check corporate firewall isn't blocking

### Issue: Calls appear but no transcription
**Solution**:
- Verify call recording is enabled
- Check recording format (WAV or MP3 only)
- Verify recording URL is accessible
- Check OpenAI API key is configured (contact admin)
- Enable AI features in AudiaPro settings

### Issue: Webhook authentication fails
**Solution**:
- Double-check username/password (no extra spaces)
- Username/password are case-sensitive
- Update credentials in AudiaPro Settings → Integrations
- Generate new webhook credentials if needed

---

## 📚 Quick Reference

### UCM Firmware Requirements
- **UCM62xx/UCM6510**: Firmware 1.0.17.16+
- **UCM630xA**: Firmware 1.0.5.4+
- Older firmware: Use "HTTP Callback" method instead

### Common UCM Ports
- **8089**: HTTPS web interface (default)
- **443**: Alternative HTTPS port
- **80**: HTTP web interface (not secure)

### Webhook URL Format
```
https://audiapro-backend.onrender.com/api/webhook/cdr/{your-subdomain}
```
Replace `{your-subdomain}` with your company's subdomain

### Authentication
- Type: **HTTP Basic Auth**
- Format: `username:password`
- Encoding: Base64 (handled automatically)

---

## 🔐 Security Best Practices

1. **Change default UCM password** from `admin`
2. **Use HTTPS** for webhook (never HTTP)
3. **Keep webhook credentials secret**
4. **Restrict UCM web access** to trusted networks
5. **Update UCM firmware** regularly
6. **Monitor webhook logs** for unauthorized attempts

---

## 📞 Need Help?

### UCM Questions
- Grandstream Support: http://www.grandstream.com/support
- UCM Documentation: Check your specific model's manual
- Community Forums: Grandstream community

### AudiaPro Questions
- Login to dashboard and check Settings
- Review AI Features documentation
- Contact your account administrator

---

## 🎓 Understanding the Setup

### What's Happening?
1. **Call happens** on your UCM phone system
2. **UCM creates CDR** (call detail record) with call info
3. **UCM sends webhook** to AudiaPro with CDR data
4. **AudiaPro receives call** and saves to database
5. **If recording exists**, AudiaPro downloads it
6. **AI processes recording** (transcription, sentiment, etc.)
7. **Results appear** in your dashboard

### Data Flow
```
UCM Phone Call → CDR Generated → Webhook Sent (HTTPS)
                                       ↓
                               AudiaPro Backend
                                       ↓
                   Database (Call Info) + AI Processing
                                       ↓
                               Dashboard (You)
```

### Why HTTPS?
- Encrypts data in transit
- Protects call information
- Industry standard for security
- Required for compliance (HIPAA, PCI, etc.)

---

**Document Version**: 2.0
**Last Updated**: February 4, 2026
**Based on**: Grandstream Official API Documentation
**Compatible with**: All UCM models (6200, 6300, 6500 series)
