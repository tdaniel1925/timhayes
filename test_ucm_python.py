"""
Test UCM connection using the EXACT code from UCM_API_CONNECTION_AND_DOWNLOAD_GUIDE.md
"""
import requests
import hashlib
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration from guide
UCM_HOST = "071ffb.c.myucm.cloud"
UCM_PORT = 8443
USERNAME = "admin1"
PASSWORD = "BotMakers@2026"

print("Testing UCM Connection with Python (exact code from guide)\n")
print(f"Host: {UCM_HOST}:{UCM_PORT}")
print(f"Username: {USERNAME}\n")

try:
    # Step 1: Get challenge
    print("Step 1: Getting challenge...")
    challenge_url = f"https://{UCM_HOST}:{UCM_PORT}/api/challenge"
    print(f"   URL: {challenge_url}")

    response = requests.get(challenge_url, verify=False)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")

    challenge_data = response.json()
    print(f"   JSON: {challenge_data}")

    if 'challenge' in challenge_data:
        challenge = challenge_data['challenge']
        print(f"   OK Challenge: {challenge}\n")
    else:
        print(f"   ERROR No 'challenge' field in response")
        print(f"   Available fields: {list(challenge_data.keys())}")
        exit(1)

    # Step 2: Hash password
    print("Step 2: Hashing password...")
    hash_input = f"{challenge}{PASSWORD}"
    hashed_password = hashlib.md5(hash_input.encode()).hexdigest()
    print(f"   Input: '{hash_input}'")
    print(f"   MD5: {hashed_password}\n")

    # Step 3: Login
    print("Step 3: Logging in...")
    login_url = f"https://{UCM_HOST}:{UCM_PORT}/api/login"
    login_data = {
        'username': USERNAME,
        'password': hashed_password
    }
    print(f"   URL: {login_url}")
    print(f"   Data: {login_data}")

    response = requests.post(login_url, data=login_data, verify=False)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")

    session_cookie = response.cookies.get('session')
    print(f"   Cookies: {dict(response.cookies)}")

    if session_cookie:
        print(f"   OK Session: {session_cookie}\n")

        # Step 4: Test RECAPI
        print("Step 4: Testing RECAPI...")
        session = requests.Session()
        session.cookies.set('session', session_cookie)

        recapi_url = f"https://{UCM_HOST}:{UCM_PORT}/api/recapi"
        params = {'recording_file': 'test.wav'}

        response = session.get(recapi_url, params=params, verify=False)
        print(f"   Status: {response.status_code}")

        if response.status_code == 404:
            print(f"   OK RECAPI accessible (404 expected for non-existent file)")
        elif response.status_code == 401:
            print(f"   ERROR RECAPI auth failed")
        else:
            print(f"   Response: {response.text[:100]}")

        print("\n" + "="*70)
        print("SUCCESS! UCM connection working!")
        print("="*70)
    else:
        print(f"   ERROR No session cookie received")

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
