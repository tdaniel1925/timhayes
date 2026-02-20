import https from 'https';

const apiUrl = 'https://071ffb.c.myucm.cloud:8443/api';
const apiUser = 'cdrapi';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function test() {
  try {
    // Step 1: Challenge
    console.log('Step 1: Getting challenge...');
    const challengeRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request: { action: 'challenge', user: apiUser, version: '1.0' }
      }),
      // @ts-ignore
      agent: httpsAgent,
    });

    const challengeData = await challengeRes.json();
    console.log('Response:', JSON.stringify(challengeData, null, 2));

    const token = challengeData.response?.token || challengeData.response?.challenge;
    console.log('Token/Challenge:', token);

    if (!token) {
      console.log('ERROR: No token');
      return;
    }

    // Step 2: Login
    console.log('\nStep 2: Logging in with token...');
    const loginRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request: { action: 'login', token: token, url: apiUrl, user: apiUser }
      }),
      // @ts-ignore
      agent: httpsAgent,
    });

    const loginData = await loginRes.json();
    console.log('Response:', JSON.stringify(loginData, null, 2));

    const cookie = loginData.response?.cookie;
    if (cookie) {
      console.log('\nSUCCESS! Cookie obtained:', cookie);

      // Step 3: Test RECAPI
      console.log('\nStep 3: Testing RECAPI...');
      const recRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: { action: 'recapi', cookie: cookie, recording_file: 'test.wav' }
        }),
        // @ts-ignore
        agent: httpsAgent,
      });

      console.log('RECAPI Status:', recRes.status);
      const recText = await recRes.text();
      console.log('RECAPI Response:', recText.substring(0, 200));

    } else {
      console.log('ERROR: No cookie received');
      console.log('Available fields:', Object.keys(loginData.response || {}));
    }
  } catch (error) {
    console.log('ERROR:', error);
  }
}

test();
