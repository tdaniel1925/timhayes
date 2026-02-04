"""
Test script to simulate a live call from your PBX
This sends a webhook to AudiaPro just like your phone system would
"""

import requests
import json
from datetime import datetime

# Your production webhook details
WEBHOOK_URL = "https://timhayes-bo-production-58c5.up.railway.app/api/webhook/cdr/demo-company"
USERNAME = "admin"
PASSWORD = "4Xkilla1@"

# Simulate a call (Grandstream CDR format)
call_data = {
    "calldate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "src": "5558675309",           # Caller number
    "dst": "5551234567",           # Called number
    "duration": "180",             # 3 minutes total
    "billsec": "175",              # 2 min 55 sec talk time
    "disposition": "ANSWERED",     # Call was answered
    "channel": "SIP/101-00000001",
    "dcontext": "default",
    "lastapp": "Dial",
    "lastdata": "SIP/102",
    "uniqueid": f"{int(datetime.now().timestamp())}.1",
    "userfield": "",
    "accountcode": ""
}

print(">> Sending test call to AudiaPro...")
print(f">> Caller: {call_data['src']}")
print(f">> Called: {call_data['dst']}")
print(f">> Duration: {call_data['duration']} seconds")
print()

try:
    response = requests.post(
        WEBHOOK_URL,
        auth=(USERNAME, PASSWORD),
        json=call_data,
        headers={"Content-Type": "application/json"}
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("\n>> SUCCESS! Call sent to AudiaPro")
        print(">> Check your dashboard at: https://audiapro.com/dashboard")
    else:
        print(f"\n>> ERROR: {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"\n>> ERROR: {e}")
