# Technical Support Request - UCM API Challenge Endpoint Failure

---

**To:** Grandstream Technical Support
**From:** BotMakers Inc.
**Date:** February 15, 2026
**Subject:** UCM Cloud API `/api/challenge` Endpoint Returns "Invalid parameters!" Error
**UCM Host:** 071ffb.c.myucm.cloud:8443
**Priority:** High

---

## Issue Summary

We are unable to authenticate with our cloud-hosted Grandstream UCM via the API. The `/api/challenge` endpoint consistently returns an "Invalid parameters!" error, preventing us from obtaining the challenge token required for authentication.

---

## System Information

- **UCM Host:** 071ffb.c.myucm.cloud
- **Port:** 8443 (HTTPS)
- **UCM Type:** Cloud-hosted (*.c.myucm.cloud)
- **API Username Attempted:** admin1, cdrapi
- **Password:** (available upon request)
- **Expected API Flow:** Challenge → MD5 Hash → Login → Session Cookie

---

## Problem Description

### Expected Behavior

According to Grandstream UCM API documentation, the authentication flow should be:

1. **GET** `/api/challenge` → Returns `{"challenge": "1234567890123456"}`
2. Hash password: `MD5(challenge + password)`
3. **POST** `/api/login` with username and hashed password
4. Receive session cookie for authenticated API requests

### Actual Behavior

**Step 1 fails immediately:**

**Request:**
```
GET https://071ffb.c.myucm.cloud:8443/api/challenge
```

**Response:**
```json
{
  "response": {
    "error_msg": "Invalid parameters!"
  },
  "status": -1
}
```

**Problem:** The response does not contain a `challenge` field, only an error message.

---

## Testing Performed

We have extensively tested the API with multiple methods to rule out implementation errors:

### 1. HTTP Methods Tested
- ✅ GET `/api/challenge`
- ✅ POST `/api/challenge`
- ✅ POST `/api/challenge` with `{"username": "admin1"}`
- ✅ POST `/api/challenge` with `{"user": "admin1"}`
- ✅ POST `/api/challenge` with form data

**Result:** All methods return the same "Invalid parameters!" error

### 2. Programming Languages Tested
- ✅ Python with `requests` library (matching official documentation examples)
- ✅ Node.js with `fetch` API
- ✅ Both with SSL verification disabled (`verify=False`)

**Result:** Both languages produce identical errors

### 3. Request Variations Tested
- Different usernames: `admin1`, `cdrapi`, `admin`, `api`
- Different headers: `Content-Type: application/json`, `application/x-www-form-urlencoded`
- Query parameters: `?user=admin1`, `?username=admin1`
- Request body formats: JSON, form data, empty body

**Result:** All variations fail with "Invalid parameters!"

### 4. Alternative Endpoints Tested
- `/api/challenge`
- `/api/get_challenge`
- `/api/auth/challenge`
- `/cgi-bin/api/challenge`

**Result:** All return the same error or 404

---

## Code Sample (Python - Following Official Documentation)

```python
import requests
import hashlib
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Step 1: Get challenge
response = requests.get(
    "https://071ffb.c.myucm.cloud:8443/api/challenge",
    verify=False
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Expected: {"challenge": "1234567890123456"}
# Actual: {"response": {"error_msg": "Invalid parameters!"}, "status": -1}
```

---

## Questions for Technical Support

### 1. API Configuration Verification

Could you please help us verify the following settings are correctly configured in our UCM?

**Path: System Settings → API**

Please confirm these settings:
- [ ] **Enable API Access** - Should be enabled/ON
- [ ] **Enable Challenge/Response Authentication** - Should be enabled/ON
- [ ] **Allow RECAPI (Recording API)** - Should be enabled/ON
- [ ] **Allow CDRAPI (CDR API)** - Should be enabled/ON

**Path: System Settings → API Users**

Please confirm:
- [ ] Is there a user configured for API access?
- [ ] Which username should we use? (`admin1`, `cdrapi`, or other?)
- [ ] Does this user have the correct API permissions?
- [ ] Is there an API key or token required in addition to username/password?

### 2. Cloud UCM API Differences

Does the cloud-hosted UCM (`*.c.myucm.cloud`) have different API requirements than on-premise UCM systems?

- Are there additional authentication headers required? (API key, token, etc.)
- Is the challenge/response flow different for cloud UCM?
- Are there IP whitelist restrictions we need to configure?
- Is there a different API endpoint format for cloud-hosted systems?

### 3. Firmware and Documentation

- What firmware version is our UCM running?
- Where can we find the API documentation specific to our firmware version?
- Is the challenge/response authentication method still supported?
- Are there any known issues with the `/api/challenge` endpoint?

### 4. Alternative Authentication

If challenge/response authentication is not available:

- What is the correct authentication method for our UCM?
- Can you provide code examples for cloud UCM API authentication?
- Are there alternative API endpoints we should use?

---

## Our Use Case

We are building an AI-powered call analytics system (AudiaPro) that integrates with Grandstream UCM systems. Our application needs to:

1. **Receive real-time CDR data** via webhook (CDR Real-Time Output)
2. **Download call recordings** via RECAPI endpoint
3. **Process recordings** with AI transcription and analysis
4. **Display analytics** to business users

**Current Status:**
- ✅ Webhook configuration ready
- ✅ Database and job queue implemented
- ❌ **BLOCKED:** Cannot authenticate to download recordings via API

---

## Requested Assistance

We need help with one or more of the following:

1. **Verify API configuration** - Confirm all required settings are enabled in our UCM
2. **Provide correct authentication method** - Documentation for cloud UCM API authentication
3. **Troubleshoot the error** - Why `/api/challenge` returns "Invalid parameters!"
4. **Alternative download method** - If API is unavailable, suggest alternative approaches

---

## Additional Information

### Network Connectivity
- We can successfully reach the UCM web UI at `https://071ffb.c.myucm.cloud:8443`
- HTTPS connectivity is working (port 8443 accessible)
- API endpoints respond (HTTP 200 status), but return error messages

### UCM Access
- We have admin credentials for the web interface
- We can log into the UCM web UI successfully
- We are willing to provide remote access if needed for troubleshooting

### Urgency
This is blocking our production deployment. We have completed all development work except for the recording download functionality, which requires working API access.

---

## Contact Information

**Company:** BotMakers Inc.
**Product:** AudiaPro (AI-Powered Call Analytics)
**Technical Contact:** [Your Name]
**Email:** [Your Email]
**Phone:** [Your Phone]
**Preferred Response Time:** Within 24-48 hours

---

## Attachments

We can provide upon request:
- Complete API request/response logs
- Network packet captures (Wireshark)
- Screenshots of UCM settings pages
- Video demonstration of the issue

---

## Summary

Despite following official API documentation exactly and testing with multiple programming languages and methods, we cannot get past the initial challenge request. The `/api/challenge` endpoint returns "Invalid parameters!" error for all request formats.

We believe this is either:
1. A configuration issue in our UCM that we cannot see or access
2. A cloud UCM limitation or different API format
3. A firmware version incompatibility

We need your assistance to resolve this issue so we can complete our integration.

Thank you for your prompt attention to this matter.

---

**BotMakers Inc.**
*Building the future of AI-powered business communications*
