# Grandstream UCM Setup Guide for AudiaPro

## Overview
This guide walks you through configuring your Grandstream UCM phone system to send call records to AudiaPro for AI-powered analysis.

## Prerequisites
- Grandstream UCM system (any model: UCM6200, UCM6300, etc.)
- Admin access to UCM web interface
- Network connectivity between UCM and internet
- AudiaPro tenant account created

## Your Configuration Details

### Test Company Tenant
- **Company**: Test Company
- **Subdomain**: test-company
- **Login Email**: admin@testco.com
- **Login Password**: TestPass123!

### Webhook Configuration
- **Webhook URL**: `https://timhayes-bo-production-58c5.up.railway.app/api/webhook/cdr/test-company`
- **Authentication**: HTTP Basic Auth
- **Username**: `testco_webhook`
- **Password**: `TestWebhook123!`
- **Method**: POST
- **Content-Type**: application/json

## Step-by-Step Configuration

### Step 1: Access UCM Web Interface

1. Open web browser
2. Navigate to your UCM's IP address (example: https://192.168.1.1:8089)
3. Login with admin credentials
4. Default credentials (if not changed):
   - Username: `admin`
   - Password: `admin`

### Step 2: Enable Call Recording

**Why**: AI features require audio recordings to analyze calls

1. Navigate to: **PBX Settings → Call Features → Call Recording**
2. Enable **Call Recording** globally or per-extension
3. Recording Mode options:
   - **Record All Calls** (recommended for analytics)
   - **Record on Demand**
   - **Record Inbound Only**
   - **Record Outbound Only**
4. File Format: **WAV** or **MP3** (WAV recommended for better transcription)
5. Storage Location: Set to local storage or network share
6. Click **Save and Apply**

### Step 3: Configure HTTP File Server (for recordings)

**Why**: Recordings need to be accessible via HTTP URL

1. Navigate to: **System Settings → File Share**
2. Enable **HTTP File Server**
3. Set Port (default: 8089)
4. Enable **Public Access** or configure authentication
5. Note the base URL (e.g., `http://192.168.1.1:8089/recordings/`)
6. Click **Save and Apply**

**Alternative**: Configure FTP/SFTP access if you prefer

### Step 4: Configure CDR Webhook

1. Navigate to: **PBX Settings → Call Detail Records** or **Settings → CDR**
2. Look for **HTTP Notification** or **Webhook** settings
3. Enable the webhook feature
4. Configure the following:

   **Webhook URL**:
   ```
   https://timhayes-bo-production-58c5.up.railway.app/api/webhook/cdr/test-company
   ```

   **HTTP Method**: POST

   **Authentication**:
   - Type: Basic Authentication
   - Username: `testco_webhook`
   - Password: `TestWebhook123!`

   **Content Type**: application/json (or application/x-www-form-urlencoded)

   **When to Send**:
   - [x] After Call Ends
   - [ ] Real-time during call (optional, for future real-time features)

   **Fields to Include** (select all available):
   - [x] uniqueid (Call ID)
   - [x] src (Source/Caller Number)
   - [x] dst (Destination/Called Number)
   - [x] duration (Total Duration)
   - [x] billsec (Billing Duration)
   - [x] disposition (Call Status)
   - [x] recordfiles (Recording File Path)
   - [x] start_time (Call Start Time)
   - [x] answer_time (Answer Time)
   - [x] end_time (Call End Time)
   - [x] caller_name (Caller ID Name)
   - [x] All other available fields

5. Click **Save and Apply**

### Step 5: Test the Integration

1. **Make a Test Call**:
   - Use any extension configured for recording
   - Call another extension or external number
   - Have a short conversation (at least 10 seconds)
   - Hang up

2. **Check UCM Logs**:
   - Navigate to: **Status → System Logs**
   - Look for webhook delivery attempts
   - Check for any error messages

3. **Verify in AudiaPro**:
   - Login to AudiaPro at: https://timhayes-bo-production-58c5.up.railway.app
   - Email: admin@testco.com
   - Password: TestPass123!
   - Go to Dashboard
   - Your test call should appear within 1-2 minutes

4. **Check via API** (optional):
   ```bash
   curl -X POST "https://timhayes-bo-production-58c5.up.railway.app/api/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@testco.com","password":"TestPass123!"}'

   # Use the access_token from response:
   curl -X GET "https://timhayes-bo-production-58c5.up.railway.app/api/calls?limit=10" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Common UCM Models & Webhook Locations

### UCM6200 Series
- **Path**: PBX Settings → Call Detail Records → HTTP CDR Notification
- **Firmware**: v1.0.20.20 or higher recommended

### UCM6300 Series
- **Path**: Settings → PBX → CDR → Webhook Configuration
- **Firmware**: v1.0.22.20 or higher recommended

### UCM630x Series
- **Path**: Call Features → CDR Settings → HTTP Notification
- **Firmware**: Latest recommended

## Troubleshooting

### Calls Not Appearing in AudiaPro

**Check 1: Network Connectivity**
```bash
# From UCM's SSH/console, test connection:
ping timhayes-bo-production-58c5.up.railway.app
curl -I https://timhayes-bo-production-58c5.up.railway.app
```

**Check 2: Firewall Rules**
- Ensure UCM can make outbound HTTPS connections (port 443)
- Check corporate firewall for blocking
- Whitelist: timhayes-bo-production-58c5.up.railway.app

**Check 3: Webhook Credentials**
Test webhook manually:
```bash
curl -X POST "https://timhayes-bo-production-58c5.up.railway.app/api/webhook/cdr/test-company" \
  --user "testco_webhook:TestWebhook123!" \
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

Expected response: `{"status":"success",...}`

**Check 4: UCM Webhook Logs**
- Navigate to: Status → System Logs → CDR Logs
- Look for HTTP delivery failures
- Common errors:
  - 401 Unauthorized = Wrong credentials
  - 404 Not Found = Wrong URL
  - 500 Internal Error = Contact support

**Check 5: Recording Access**
- Verify recording URL is publicly accessible
- Test recording URL in browser
- Check file permissions on UCM

### Recordings Not Processing

**Issue**: Calls appear but no transcription/AI analysis

**Solutions**:
1. Verify recording URL is accessible:
   ```bash
   curl -I "YOUR_RECORDING_URL"
   # Should return HTTP 200 OK
   ```

2. Check recording format: WAV or MP3 only

3. Verify OpenAI API key is configured (for AI processing):
   - Contact your AudiaPro administrator
   - AI processing requires OpenAI integration

4. Check AI features are enabled for your tenant:
   - Login to AudiaPro
   - Go to Settings → AI Features
   - Ensure desired features are enabled

### Webhook Delivery Delays

- CDR webhooks typically fire 5-10 seconds after call ends
- Large recordings may take longer to upload
- Check UCM system load (CPU/memory)

## Field Mappings

AudiaPro expects the following JSON format:

```json
{
  "uniqueid": "1738650431.123",          // Required: Unique call ID
  "src": "1001",                          // Required: Source number
  "dst": "18005551234",                   // Required: Destination number
  "duration": 300,                        // Required: Total duration (seconds)
  "billsec": 295,                         // Required: Billable duration (seconds)
  "disposition": "ANSWERED",              // Required: ANSWERED, NO ANSWER, BUSY, FAILED
  "recordfiles": "http://...",            // Optional: Recording URL
  "start_time": "2026-02-04 10:20:00",   // Optional: Call start time
  "answer_time": "2026-02-04 10:20:05",  // Optional: Answer time
  "end_time": "2026-02-04 10:25:00",     // Optional: Call end time
  "caller_name": "John Doe"              // Optional: Caller ID name
}
```

### UCM Field Name Variations

Different UCM models may use different field names. The backend handles these automatically:

| Standard Field | UCM Variations |
|----------------|----------------|
| `uniqueid` | `callid`, `call_id`, `linkedid` |
| `src` | `clid`, `caller`, `from` |
| `dst` | `dnid`, `called`, `to`, `extension` |
| `recordfiles` | `recordingfile`, `recording`, `record_file` |

## Next Steps

### 1. Enable AI Features

1. Login to AudiaPro web interface
2. Navigate to: Settings or Dashboard
3. Enable desired AI features:
   - ✅ AI Call Summaries
   - ✅ Sentiment Analysis
   - ✅ Action Item Extraction
   - ✅ Call Quality Scoring
   - ✅ Emotion Detection
   - And 19 more features...

### 2. Configure OpenAI (Required for AI)

Contact your system administrator to add OpenAI API key to the backend.

### 3. Set Up Users

1. Navigate to: Settings → Users
2. Invite team members
3. Assign roles (Admin, Manager, Agent)

### 4. Configure Notifications

1. Navigate to: Settings → Notifications
2. Set up email alerts for:
   - Compliance violations
   - Low call quality scores
   - Negative sentiment calls
   - Churn risk predictions

## Production Checklist

Before going live with all your calls:

- [ ] Test with 5-10 calls to verify accuracy
- [ ] Verify recording URLs are accessible
- [ ] Check transcription quality
- [ ] Review AI analysis results
- [ ] Configure user permissions
- [ ] Set up email notifications
- [ ] Train staff on dashboard usage
- [ ] Document any custom configurations
- [ ] Set up regular data backups
- [ ] Review and adjust AI feature selections

## Support

### Technical Issues
- Check Railway logs: https://railway.app/project/your-project
- Review backend logs for errors
- Check UCM system logs

### UCM-Specific Questions
- Grandstream UCM Documentation: http://www.grandstream.com/support
- UCM Admin Guide for your specific model
- Grandstream Support Portal

### AudiaPro Questions
- Login to web interface
- Review feature documentation
- Contact your account administrator

## Security Notes

1. **Webhook Credentials**: Change default webhook password
   - Update in UCM webhook config
   - Update in AudiaPro Settings → Webhook Settings

2. **HTTPS Only**: Never use HTTP for webhooks (data in transit encryption)

3. **Firewall**: Only allow outbound HTTPS from UCM to AudiaPro

4. **Recording Access**: Ensure recordings are not publicly accessible without auth

5. **API Keys**: Keep OpenAI API keys secure (server-side only)

## Advanced Configuration

### Custom Webhook Format

If your UCM sends a different JSON format, you can create a mapping configuration.

### Multiple Tenants

Each tenant gets unique webhook URL and credentials:
- Tenant 1: `.../api/webhook/cdr/test-company` (testco_webhook:pass1)
- Tenant 2: `.../api/webhook/cdr/acme-corp` (acme_webhook:pass2)

### High Call Volume

For systems with >1000 calls/day:
- Consider batching CDR sends
- Enable webhook queuing in UCM
- Monitor API rate limits
- Scale Railway backend if needed

---

**Document Version**: 1.0
**Last Updated**: February 4, 2026
**Platform**: Grandstream UCM → AudiaPro SaaS
