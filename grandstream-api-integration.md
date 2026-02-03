# Grandstream UCM API Integration Guide

This document provides information about integrating with Grandstream UCM systems using their available APIs.

## Table of Contents

1. [CDR Real-Time Output Feature](#cdr-real-time-output-feature)
2. [HTTPS API - Recording API (recapi)](#https-api---recording-api-recapi)

---

## CDR Real-Time Output Feature

### Overview

The CDR Real-Time Output feature enables immediate delivery of call detail records (CDR) to a configured server, eliminating the need to rely on traditional CDR report generation methods.

### Supported Devices

- **UCM62xx / UCM6510**: Firmware version 1.0.17.16 or higher
- **UCM630xA**: Firmware version 1.0.5.4 or higher

### Key Features

- **Real-time delivery**: CDR records are pushed to the server immediately upon generation
- **Buffer support**: Up to 10,000 records can be cached locally if the destination server becomes unavailable
- **Automatic retry**: Cached records are automatically transmitted once connectivity is restored
- **Flexible protocols**: Supports TCP and HTTP/HTTPS delivery methods
- **Multiple formats**: Records can be sent in XML or JSON format

### Configuration

Navigate to: **Value-Added Features → API Configuration → CDR Real-Time Output Settings**

#### Configuration Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| Enable | Activates/deactivates the real-time CDR module | Yes |
| Server Address | IP address of the CDR receiving server | Yes |
| Port | Port number for server connection | Yes |
| Delivery Method | Protocol selection: TCP or HTTP/HTTPS | Yes |
| Format | Output format: XML or JSON | Yes |
| Username | Authentication credential | Optional |
| Password | Authentication credential | Optional |

### CDR Data Fields

The system transmits the following CDR fields with each call record:

- **accountcode** - Account code for billing
- **src** - Source/caller number
- **dst** - Destination/called number
- **dcontext** - Destination context
- **clid** - Caller ID
- **channel** - Channel identifier
- **dstchannel** - Destination channel
- **lastapp** - Last application executed
- **lastdata** - Last application data
- **start** - Call start time
- **answer** - Call answer time
- **end** - Call end time
- **duration** - Total call duration
- **billsec** - Billable seconds
- **disposition** - Call disposition/status
- **amaflags** - AMA flags
- **uniqueid** - Unique call identifier
- **caller_name** - Caller name
- **recordfiles** - Recording file paths
- **src_trunk_name** - Source trunk name
- **dst_trunk_name** - Destination trunk name
- Additional extension and service routing fields

### Step-by-Step Integration Guide

#### Step 1: Enable API on UCM

1. Log into your UCM web interface
2. Navigate to: **Value-Added Features → API Configuration → CDR Real-Time Output Settings**
3. Enable the CDR Real-Time Output feature
4. Configure the following parameters:
   - **Server Address**: IP address of your receiving server
   - **Port**: Port number your server will listen on
   - **Delivery Method**: Choose TCP or HTTP/HTTPS
   - **Format**: Choose XML or JSON
   - **Username/Password**: (Optional) Set if you need authentication

#### Step 2: Create a CDR Receiving Server

##### Option A: Python TCP Server Example

Here's a basic Python server for receiving CDR data via TCP:

```python
#!/bin/python
import socket

port = raw_input("Please enter the bind port like: 1000\n")

def test():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    address = ('192.168.124.16', int(port))  # Change to your server IP
    server.bind(address)
    server.listen(10)

    print(f"CDR Server listening on {address[0]}:{address[1]}")

    while 1:
        s, addr = server.accept()
        print(f"Connection from: {addr}")
        data = s.recv(2048)
        print("Received CDR Data:")
        print(data)
        s.close()

test()
```

**Usage**:
1. Save as `cdr_server.py`
2. Run: `python cdr_server.py`
3. Enter the port number when prompted
4. The server will print received CDR records to console

##### Option B: Production-Ready Server

For production environments, implement a server that:

1. **Listens for connections** on the configured port
2. **Accepts data** from the UCM system
3. **Parses JSON/XML** based on your format selection
4. **Validates data** before processing
5. **Stores CDR records** in a database
6. **Implements authentication** if credentials are configured
7. **Handles errors gracefully** with logging
8. **Manages the buffer** (UCM can cache up to 10,000 records)

##### Example JSON CDR Record Structure

When configured for JSON format, you'll receive data like:

```json
{
  "accountcode": "",
  "src": "1001",
  "dst": "9785551234",
  "dcontext": "from-internal",
  "clid": "John Doe <1001>",
  "channel": "SIP/1001-00000001",
  "dstchannel": "SIP/trunk-00000002",
  "lastapp": "Dial",
  "lastdata": "SIP/trunk/9785551234",
  "start": "2026-02-01 10:30:00",
  "answer": "2026-02-01 10:30:05",
  "end": "2026-02-01 10:35:10",
  "duration": "310",
  "billsec": "305",
  "disposition": "ANSWERED",
  "amaflags": "DOCUMENTATION",
  "uniqueid": "1738412400.1",
  "caller_name": "John Doe",
  "recordfiles": "/var/spool/asterisk/monitor/2026/02/01/1001-9785551234-20260201-103000.wav",
  "src_trunk_name": "",
  "dst_trunk_name": "OutboundTrunk"
}
```

#### Step 3: Test the Integration

1. Start your CDR receiving server
2. Make a test call on the UCM system
3. Verify that CDR data is received by your server
4. Check that all expected fields are present
5. Validate data format and content

#### Step 4: Handle Edge Cases

- **Server Downtime**: UCM buffers up to 10,000 records - ensure your server can handle bulk delivery when reconnecting
- **Network Issues**: Implement retry logic and monitoring
- **Data Validation**: Always validate received data before storing
- **Authentication**: If using credentials, ensure your server validates them properly

---

## HTTPS API - Recording API (recapi)

### Overview

The Recording API (recapi) is a legacy API that is included and supported by default when enabling the HTTPS API feature on Grandstream UCM systems. It provides access to call recording management functionality.

### Supported Devices

The recapi functions across all UCM6xxx series devices:

- UCM620x series
- UCM630x series
- UCM630xA series
- UCM6510

### Integration Details

#### Default Enablement

The recapi is automatically available when you enable the HTTPS API feature. It operates alongside other legacy APIs:

- **cdrapi**: Call Detail Records API
- **recapi**: Recording API
- **pmsapi**: Property Management System API
- **queueapi**: Queue Management API

#### Connection Details

- **Protocol**: HTTPS
- **Default Port**: 8089
- **Base URL**: `https://<ucm-ip-address>:8089/api`
- **Content-Type**: `application/json;charset=UTF-8`

#### API Credentials Setup

Before making API calls, enable and configure credentials:

1. Navigate to: **Integrations → API Configuration → HTTPS API Settings (New)**
2. Enable the HTTPS API feature
3. Create API username and password
4. Save configuration

#### Step-by-Step Authentication Guide

The HTTPS API uses challenge/response authentication to secure API access without transmitting passwords in plaintext.

##### Step 1: Request a Challenge

Send a POST request to request a challenge string:

**Endpoint**: `https://<UCM_IP>:8089/api`

**Request**:
```json
{
  "request": {
    "action": "challenge",
    "user": "cdrapi",
    "version": "1.0"
  }
}
```

**Response**:
The UCM returns a 16-digit random number (challenge string):
```json
{
  "response": {
    "challenge": "1234567890123456"
  }
}
```

##### Step 2: Generate MD5 Token

Combine the challenge string with your password and create an MD5 hash:

**Formula**: `MD5(challenge + password)`

**Example** (Python):
```python
import hashlib

challenge = "1234567890123456"
password = "your_api_password"
token = hashlib.md5((challenge + password).encode()).hexdigest()
# Result: "0faa24433e3c7a9bcfa8000f735305d5"
```

**Example** (JavaScript/Node.js):
```javascript
const crypto = require('crypto');

const challenge = "1234567890123456";
const password = "your_api_password";
const token = crypto.createHash('md5').update(challenge + password).digest('hex');
// Result: "0faa24433e3c7a9bcfa8000f735305d5"
```

##### Step 3: Login with Token

Send the login request with the generated token:

**Request**:
```json
{
  "request": {
    "action": "login",
    "token": "0faa24433e3c7a9bcfa8000f735305d5",
    "user": "cdrapi"
  }
}
```

**Response**:
Upon successful authentication, the UCM returns a session cookie.

##### Step 4: Use Session Cookie

Include the session cookie in all subsequent API requests to maintain authenticated access.

#### Complete Python Authentication Example

```python
import requests
import hashlib
import json

# Configuration
UCM_IP = "192.168.1.100"
API_PORT = "8089"
API_USER = "cdrapi"
API_PASS = "your_password"
BASE_URL = f"https://{UCM_IP}:{API_PORT}/api"

# Disable SSL warnings for self-signed certificates (development only)
requests.packages.urllib3.disable_warnings()

# Create session to maintain cookies
session = requests.Session()

# Step 1: Request challenge
challenge_request = {
    "request": {
        "action": "challenge",
        "user": API_USER,
        "version": "1.0"
    }
}

response = session.post(BASE_URL, json=challenge_request, verify=False)
challenge_data = response.json()
challenge = challenge_data['response']['challenge']
print(f"Received challenge: {challenge}")

# Step 2: Generate MD5 token
token = hashlib.md5((challenge + API_PASS).encode()).hexdigest()
print(f"Generated token: {token}")

# Step 3: Login
login_request = {
    "request": {
        "action": "login",
        "token": token,
        "user": API_USER
    }
}

login_response = session.post(BASE_URL, json=login_request, verify=False)
print(f"Login response: {login_response.json()}")

# Step 4: Make authenticated API calls
# Example: Use recapi or other endpoints with the authenticated session
# api_request = {
#     "request": {
#         "action": "listRecordings",
#         # ... other parameters
#     }
# }
# result = session.post(BASE_URL, json=api_request, verify=False)
```

#### Complete JavaScript/Node.js Authentication Example

```javascript
const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

// Configuration
const UCM_IP = '192.168.1.100';
const API_PORT = '8089';
const API_USER = 'cdrapi';
const API_PASS = 'your_password';
const BASE_URL = `https://${UCM_IP}:${API_PORT}/api`;

// Create axios instance with cookie jar and SSL disabled (development only)
const agent = new https.Agent({ rejectUnauthorized: false });
const client = axios.create({
  httpsAgent: agent,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
});

async function authenticate() {
  try {
    // Step 1: Request challenge
    const challengeRequest = {
      request: {
        action: 'challenge',
        user: API_USER,
        version: '1.0'
      }
    };

    const challengeResponse = await client.post(BASE_URL, challengeRequest);
    const challenge = challengeResponse.data.response.challenge;
    console.log(`Received challenge: ${challenge}`);

    // Step 2: Generate MD5 token
    const token = crypto.createHash('md5')
      .update(challenge + API_PASS)
      .digest('hex');
    console.log(`Generated token: ${token}`);

    // Step 3: Login
    const loginRequest = {
      request: {
        action: 'login',
        token: token,
        user: API_USER
      }
    };

    const loginResponse = await client.post(BASE_URL, loginRequest);
    console.log('Login successful:', loginResponse.data);

    // Extract and store cookie for future requests
    const cookies = loginResponse.headers['set-cookie'];
    client.defaults.headers.Cookie = cookies;

    return client; // Return authenticated client

  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

// Usage
authenticate()
  .then(authenticatedClient => {
    console.log('Ready to make authenticated API calls');
    // Use authenticatedClient for subsequent requests
  });
```

#### Security Considerations

- All recapi communications occur over HTTPS
- Challenge/response authentication prevents password transmission in plaintext
- Session cookies should be stored securely
- API activities are logged in the UCM operation logs with "(API)" labels for audit purposes

### Logging and Monitoring

All recapi operations are recorded in the UCM's operation logging system with "(API)" labels, allowing you to:

- Track API usage
- Monitor for unauthorized access attempts
- Audit API-based changes to the system

### Making recapi Calls

After authentication, you can make recapi calls using the authenticated session.

#### General Request Format

```json
{
  "request": {
    "action": "<action_name>",
    // Additional parameters specific to the action
  }
}
```

**Note**: The documentation doesn't provide specific recapi endpoint details. Common recording-related actions might include:
- Listing recordings
- Downloading recordings
- Deleting recordings
- Getting recording metadata

Contact Grandstream support for the complete recapi endpoint specification.

#### Example API Call Structure

```python
# Using the authenticated session from the previous example
api_request = {
    "request": {
        "action": "your_recapi_action",
        # Add required parameters here
    }
}

response = session.post(BASE_URL, json=api_request, verify=False)
result = response.json()
print(result)
```

### Troubleshooting

#### Common Authentication Issues

1. **Invalid Challenge**: Ensure you're using the challenge string immediately after receiving it
2. **Wrong Token**: Verify MD5 hash is correctly generated from `challenge + password`
3. **Session Timeout**: Re-authenticate if you receive authorization errors
4. **SSL Certificate Errors**: For production, use valid SSL certificates or import UCM's certificate

#### Testing Tips

1. Use tools like Postman or cURL to test API calls manually
2. Enable API logging on the UCM to see incoming requests
3. Check UCM operation logs with "(API)" labels for troubleshooting
4. Start with simple authentication before attempting complex operations

### Additional Notes

- The recapi is a legacy API maintained for backward compatibility
- All API activities are logged in UCM operation logs with "(API)" labels
- Session cookies have a timeout - implement re-authentication logic
- For complete recapi endpoint documentation, contact Grandstream technical support
- Test thoroughly in a development environment before production deployment
- Always use HTTPS in production to protect authentication tokens

---

## Complete Production Examples

### Production-Ready CDR Server (Python Flask)

```python
#!/usr/bin/env python3
from flask import Flask, request
import json
import logging
from datetime import datetime
import sqlite3

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cdr_server.log'),
        logging.StreamHandler()
    ]
)

# Initialize database
def init_db():
    conn = sqlite3.connect('cdr_records.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS cdr_records
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  uniqueid TEXT,
                  src TEXT,
                  dst TEXT,
                  start_time TEXT,
                  duration INTEGER,
                  billsec INTEGER,
                  disposition TEXT,
                  recordfiles TEXT,
                  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/cdr', methods=['POST'])
def receive_cdr():
    """Endpoint to receive CDR data from UCM"""
    try:
        # Get CDR data from request
        if request.is_json:
            cdr_data = request.get_json()
        else:
            cdr_data = json.loads(request.data)

        logging.info(f"Received CDR: {cdr_data['uniqueid']}")

        # Validate required fields
        required_fields = ['src', 'dst', 'uniqueid', 'disposition']
        for field in required_fields:
            if field not in cdr_data:
                logging.error(f"Missing required field: {field}")
                return {"status": "error", "message": f"Missing {field}"}, 400

        # Store in database
        save_cdr_to_db(cdr_data)

        # Process business logic
        process_cdr_business_logic(cdr_data)

        return {"status": "success", "message": "CDR received"}, 200

    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON: {e}")
        return {"status": "error", "message": "Invalid JSON"}, 400
    except Exception as e:
        logging.error(f"Error processing CDR: {e}")
        return {"status": "error", "message": str(e)}, 500

def save_cdr_to_db(cdr):
    """Save CDR record to database"""
    try:
        conn = sqlite3.connect('cdr_records.db')
        c = conn.cursor()
        c.execute('''INSERT INTO cdr_records
                     (uniqueid, src, dst, start_time, duration, billsec, disposition, recordfiles)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (cdr.get('uniqueid'),
                   cdr.get('src'),
                   cdr.get('dst'),
                   cdr.get('start'),
                   cdr.get('duration'),
                   cdr.get('billsec'),
                   cdr.get('disposition'),
                   cdr.get('recordfiles')))
        conn.commit()
        conn.close()
        logging.info(f"Saved CDR {cdr['uniqueid']} to database")
    except Exception as e:
        logging.error(f"Database error: {e}")

def process_cdr_business_logic(cdr):
    """Process CDR according to business rules"""
    # Example: Alert on long calls
    if int(cdr.get('duration', 0)) > 3600:
        logging.warning(f"Long call detected: {cdr['uniqueid']} - {cdr['duration']}s")
        # Send alert email, SMS, etc.

    # Example: Track failed calls
    if cdr.get('disposition') != 'ANSWERED':
        logging.info(f"Unanswered call: {cdr['src']} -> {cdr['dst']}")
        # Update statistics, send notification, etc.

if __name__ == '__main__':
    # For production, use a proper WSGI server like gunicorn
    app.run(host='0.0.0.0', port=5000, debug=False)
```

**Run with**:
```bash
# Development
python cdr_server.py

# Production (using gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 cdr_server:app
```

### Production-Ready HTTPS API Client Class (Python)

```python
import requests
import hashlib
import logging
from typing import Optional, Dict, Any

class GrandstreamAPI:
    """Production-ready Grandstream UCM API client"""

    def __init__(self, ucm_ip: str, username: str, password: str, port: int = 8089):
        self.base_url = f"https://{ucm_ip}:{port}/api"
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.authenticated = False

        # Disable SSL warnings (use proper certificates in production)
        requests.packages.urllib3.disable_warnings()

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def authenticate(self) -> bool:
        """Authenticate with the UCM system"""
        try:
            # Step 1: Request challenge
            challenge_request = {
                "request": {
                    "action": "challenge",
                    "user": self.username,
                    "version": "1.0"
                }
            }

            response = self.session.post(
                self.base_url,
                json=challenge_request,
                verify=False,
                timeout=10
            )
            response.raise_for_status()

            challenge = response.json()['response']['challenge']
            self.logger.info(f"Received challenge for user {self.username}")

            # Step 2: Generate token and login
            token = hashlib.md5((challenge + self.password).encode()).hexdigest()

            login_request = {
                "request": {
                    "action": "login",
                    "token": token,
                    "user": self.username
                }
            }

            login_response = self.session.post(
                self.base_url,
                json=login_request,
                verify=False,
                timeout=10
            )
            login_response.raise_for_status()

            self.authenticated = True
            self.logger.info(f"Successfully authenticated as {self.username}")
            return True

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Authentication failed: {e}")
            return False
        except KeyError as e:
            self.logger.error(f"Unexpected response format: {e}")
            return False

    def make_request(self, action: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict]:
        """Make an authenticated API request"""
        if not self.authenticated:
            if not self.authenticate():
                return None

        try:
            request_data = {
                "request": {
                    "action": action,
                    **(params or {})
                }
            }

            response = self.session.post(
                self.base_url,
                json=request_data,
                verify=False,
                timeout=30
            )
            response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            self.logger.error(f"API request failed: {e}")

            # Try re-authenticating once
            if "401" in str(e) or "authentication" in str(e).lower():
                self.logger.info("Attempting re-authentication")
                self.authenticated = False
                if self.authenticate():
                    return self.make_request(action, params)

            return None

    def logout(self):
        """Logout and clear session"""
        try:
            logout_request = {
                "request": {
                    "action": "logout"
                }
            }
            self.session.post(self.base_url, json=logout_request, verify=False)
            self.authenticated = False
            self.logger.info("Logged out successfully")
        except Exception as e:
            self.logger.error(f"Logout error: {e}")


# Usage Example
if __name__ == "__main__":
    # Initialize API client
    api = GrandstreamAPI(
        ucm_ip="192.168.1.100",
        username="cdrapi",
        password="your_password"
    )

    # Authenticate
    if api.authenticate():
        # Make API calls
        # result = api.make_request("your_action", {"param1": "value1"})
        # print(result)

        # Logout when done
        api.logout()
```

---

## Quick Reference

### CDR Real-Time Output Quick Setup

```bash
# 1. On UCM: Enable CDR Real-Time Output
#    Value-Added Features → API Configuration → CDR Real-Time Output Settings
#    - Enable: Yes
#    - Server Address: <your-server-ip>
#    - Port: 5000
#    - Delivery Method: TCP
#    - Format: JSON

# 2. Run Python receiver
python cdr_server.py
# Enter port: 5000

# 3. Make a test call
# 4. Check console for CDR data
```

### HTTPS API Quick Authentication

```python
import requests
import hashlib

UCM_IP = "192.168.1.100"
BASE_URL = f"https://{UCM_IP}:8089/api"
session = requests.Session()

# Get challenge
r = session.post(BASE_URL, json={"request": {"action": "challenge", "user": "cdrapi", "version": "1.0"}}, verify=False)
challenge = r.json()['response']['challenge']

# Login
token = hashlib.md5((challenge + "your_password").encode()).hexdigest()
session.post(BASE_URL, json={"request": {"action": "login", "token": token, "user": "cdrapi"}}, verify=False)

# Now use 'session' for authenticated requests
```

### Processing CDR JSON Data

```python
import json

def process_cdr(cdr_json):
    """Process received CDR data"""
    cdr = json.loads(cdr_json)

    print(f"Call from {cdr['src']} to {cdr['dst']}")
    print(f"Duration: {cdr['duration']} seconds")
    print(f"Status: {cdr['disposition']}")

    if cdr['recordfiles']:
        print(f"Recording: {cdr['recordfiles']}")

    # Store in database, send notifications, etc.
    save_to_database(cdr)

def save_to_database(cdr):
    """Example database storage"""
    # Your database logic here
    pass
```

### Processing CDR XML Data

```python
import xml.etree.ElementTree as ET

def process_cdr_xml(cdr_xml):
    """Process received CDR XML data"""
    root = ET.fromstring(cdr_xml)

    cdr_data = {
        'src': root.find('src').text,
        'dst': root.find('dst').text,
        'duration': root.find('duration').text,
        'disposition': root.find('disposition').text,
        'recordfiles': root.find('recordfiles').text
    }

    print(f"Call from {cdr_data['src']} to {cdr_data['dst']}")
    return cdr_data
```

---

## General Best Practices

### Error Handling

- Implement connection retry logic with exponential backoff
- Log all API errors for troubleshooting
- Handle network timeouts gracefully
- Validate all responses before processing

### Security

- Use HTTPS wherever possible
- Store credentials securely (use environment variables or secure vaults)
- Implement proper session management
- Regularly rotate API credentials
- Monitor API access logs for suspicious activity

### Performance

- Cache authentication tokens to reduce overhead
- Implement connection pooling for high-volume scenarios
- Monitor buffer usage for CDR real-time output
- Set appropriate timeout values

### Monitoring

- Track API response times
- Monitor buffer levels for real-time CDR output
- Alert on authentication failures
- Log all API interactions for audit purposes

---

## Support and Resources

For detailed API endpoint specifications, request/response formats, and advanced features:

- Contact Grandstream technical support
- Refer to the complete API documentation at: https://documentation.grandstream.com/knowledge-base/
- Check for firmware updates that may include API enhancements

---

**Document Version**: 2.0
**Last Updated**: February 2026
**Based on**: Grandstream UCM Documentation

## Change Log

**Version 2.0** - Added complete code examples and integration guides:
- Python CDR server examples (basic and production Flask server)
- Complete authentication examples in Python and JavaScript
- Step-by-step integration guides
- JSON and XML CDR processing examples
- Production-ready API client class
- Quick reference section with common code snippets
- Troubleshooting section

**Version 1.0** - Initial documentation with overview and basic configuration
