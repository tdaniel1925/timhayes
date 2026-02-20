import https from 'https';
import { createHash } from 'crypto';

const apiUrl = 'https://071ffb.c.myucm.cloud:8443/api';
const apiUser = 'cdrapi';
const password = 'BotMakers@2026';

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

    const challenge = challengeData.response?.challenge;
    console.log('Challenge:', challenge);

    if (!challenge) {
      console.log('ERROR: No challenge');
      return;
    }

    // Step 2: Hash challenge + password
    console.log('\nStep 2: Hashing challenge + password...');
    const token = createHash('md5').update(challenge + password).digest('hex');
    console.log('MD5 Token:', token);

    // Step 3: Login
    console.log('\nStep 3: Logging in with hashed token...');
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
      console.log('\n='.repeat(70));
      console.log('SUCCESS! Cookie obtained:', cookie);
      console.log('='.repeat(70));

      // Step 4: Test RECAPI
      console.log('\nStep 4: Testing RECAPI...');
      const recRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: { action: 'recapi', cookie: cookie, recording_file: 'test.wav' }
        }),
        // @ts-ignore
        agent: httpsAgent,
      });

      console.log('Status:', recRes.status);
      const recData = await recRes.json();
      console.log('Response:', JSON.stringify(recData, null, 2).substring(0, 300));

      console.log('\nGrandstream UCM API is WORKING!');
      console.log('Ready for Stage 4 integration!');

    } else {
      console.log('ERROR: No cookie received');
    }
  } catch (error) {
    console.log('ERROR:', error);
  }
}

test();
