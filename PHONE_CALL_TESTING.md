# Phone Call Testing Guide

Quick guide to test phone call tracking in AudiaPro.

---

## Option 1: Test with Simulated Calls (Easiest - No Real PBX Needed)

### Step 1: Test Against Local Backend First

Make sure your local backend is running:
```bash
cd "C:\dev\1 - Tim Hayes"
python app.py
```

### Step 2: Run Test Script

```bash
python test_phone_calls.py http://localhost:5000 demo admin your_webhook_password
```

**Expected Output:**
```
📞 Test Call 1/3
   From: +15551234567
   To: +15559876543
   Type: inbound
   Outcome: answered
   Duration: 245s
   ✅ SUCCESS - Call logged!

📞 Test Call 2/3
   ...
   ✅ SUCCESS - Call logged!

📞 Test Call 3/3
   ...
   ✅ SUCCESS - Call logged!

🎉 Calls were logged successfully!
```

### Step 3: Check Dashboard

1. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser to: `http://localhost:5173`

3. Login with your tenant user

4. You should see:
   - ✅ 3 new calls in the dashboard
   - ✅ Call details (from, to, duration)
   - ✅ Updated analytics

### Step 4: Test Against Railway Backend

Once local testing works, test Railway:

```bash
python test_phone_calls.py https://your-railway-url.railway.app demo admin your_webhook_password
```

---

## Option 2: Test with Real PBX System

If you have a real phone system (3CX, FreePBX, GoTo Connect, etc.):

### Step 1: Create Tenant First

1. Go to super admin panel
2. Create a tenant (e.g., subdomain: "demo")
3. Note the subdomain

### Step 2: Configure Webhook in Your PBX

**Webhook URL Format:**
```
https://your-railway-url.railway.app/api/webhook/cdr/SUBDOMAIN
```

**Example:**
```
https://audiapro-production.railway.app/api/webhook/cdr/demo
```

**Authentication:**
- Type: Basic Auth
- Username: `admin`
- Password: `your_webhook_password`

**Method:** POST

**Content-Type:** application/json

### Step 3: Make a Test Call

1. Make a call through your PBX
2. PBX should send CDR to webhook
3. Check Railway logs for:
   ```
   ✅ Received CDR webhook for tenant: demo
   ✅ CDR processed successfully
   ```
4. Check dashboard - call should appear

---

## Supported Phone Systems

Your AudiaPro installation supports **15 phone systems**:

### Enterprise PBX
- 3CX (most popular)
- Avaya
- Cisco Unified Communications Manager
- Mitel

### Open Source PBX
- FreePBX
- Asterisk
- FusionPBX

### Cloud PBX
- GoTo Connect
- RingCentral
- Vonage Business
- 8x8

### Legacy Systems
- Grandstream UCM
- Yeastar
- Sangoma
- Elastix

---

## Webhook Payload Format

Your backend accepts flexible CDR formats. Minimum required fields:

```json
{
  "call_id": "unique-call-id",
  "caller_number": "+15551234567",
  "called_number": "+15559876543",
  "call_type": "inbound",
  "call_outcome": "answered",
  "call_duration": 245
}
```

**Optional fields:**
- `start_time` - ISO 8601 timestamp
- `end_time` - ISO 8601 timestamp
- `recording_url` - URL to call recording
- `transcription` - Call transcription text
- Any custom fields your PBX provides

---

## Troubleshooting

### "401 Unauthorized"

**Problem:** Webhook authentication failed

**Solutions:**
1. Check webhook username is: `admin`
2. Check webhook password matches your .env: `your_webhook_password`
3. Check your PBX has Basic Auth configured correctly

### "404 Not Found - Tenant not found"

**Problem:** Tenant with that subdomain doesn't exist

**Solutions:**
1. Go to super admin panel
2. Create tenant with correct subdomain
3. Make sure subdomain in webhook URL matches exactly

### Calls Not Appearing in Dashboard

**Problem:** Webhook received but data not showing

**Solutions:**
1. Check Railway logs for errors
2. Verify tenant is "active" status
3. Check call_id is unique (duplicates are ignored)
4. Verify timestamp is recent (check date filters)

### "Connection Refused"

**Problem:** Cannot reach backend

**Solutions:**
1. Check Railway deployment is running
2. Verify Railway URL is correct
3. Check Railway service is not sleeping

---

## Testing Checklist

- [ ] Test script works against local backend
- [ ] Calls appear in local dashboard
- [ ] Test script works against Railway backend
- [ ] Calls appear in Railway dashboard
- [ ] Real PBX webhook configured (if applicable)
- [ ] Real call logged successfully (if applicable)
- [ ] Dashboard updates in real-time
- [ ] Analytics reflect new call data
- [ ] Export includes new calls

---

## Next Steps

Once phone call tracking works:

1. **Test Call Recording URLs**
   - Add `recording_url` to webhook payload
   - Verify recordings show in dashboard

2. **Test Transcription** (requires OpenAI API key)
   - Backend will auto-transcribe if recording_url provided
   - Check transcription appears in call details

3. **Test Sentiment Analysis** (requires OpenAI API key)
   - Backend will auto-analyze sentiment from transcription
   - Check sentiment badges appear in dashboard

4. **Test Real-Time Updates**
   - Make multiple calls in succession
   - Verify dashboard updates without refresh

---

## Your Current Configuration

**Webhook Credentials:**
- Username: `admin`
- Password: `your_webhook_password`

**Webhook URL Format:**
```
https://your-railway-url.railway.app/api/webhook/cdr/SUBDOMAIN
```

**Test Command:**
```bash
python test_phone_calls.py http://localhost:5000 demo admin your_webhook_password
```

---

## Quick Test (30 seconds)

```bash
# 1. Start backend (if not running)
python app.py

# 2. Run test in new terminal
python test_phone_calls.py http://localhost:5000

# 3. Check dashboard
# Open browser to http://localhost:5173
# Login and check for 3 new test calls
```

That's it! 🎉
