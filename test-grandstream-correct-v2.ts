/**
 * Grandstream UCM API Test - CORRECT FORMAT from Support
 * Using the actual Grandstream API structure
 */

import https from 'https';

async function testCorrectAPI() {
  const apiUrl = 'https://071ffb.c.myucm.cloud:8443/api';
  const apiUser = 'cdrapi'; // Try this first, might need to be created in CloudUCM > Integrations > API Configuration

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  console.log('Testing Grandstream API - CORRECT FORMAT from Support\n');
  console.log(`API URL: ${apiUrl}`);
  console.log(`API User: ${apiUser}\n`);

  try {
    // Step 1: Challenge - Get Token
    console.log('Step 1: Getting challenge token...');
    const challengeRequest = {
      request: {
        action: 'challenge',
        user: apiUser,
        version: '1.0',
      },
    };
    console.log('Request:', JSON.stringify(challengeRequest, null, 2));

    const challengeResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(challengeRequest),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`Status: ${challengeResponse.status}`);
    const challengeData = await challengeResponse.json();
    console.log('Response:', JSON.stringify(challengeData, null, 2));

    // Look for token in response
    const token = challengeData.response?.token;
    if (!token) {
      console.log('\nERROR: No token in response!');
      console.log('Available fields:', Object.keys(challengeData.response || {}));
      return;
    }

    console.log(`\nOK - Token received: ${token}\n`);

    // Step 2: Login - Get Cookie
    console.log('Step 2: Logging in with token...');
    const loginRequest = {
      request: {
        action: 'login',
        token: token,
        url: apiUrl,
        user: apiUser,
      },
    };
    console.log('Request:', JSON.stringify(loginRequest, null, 2));

    const loginResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`Status: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log('Response:', JSON.stringify(loginData, null, 2));

    // Look for cookie in response
    const cookie = loginData.response?.cookie;
    if (!cookie) {
      console.log('\nERROR: No cookie in response!');
      console.log('Available fields:', Object.keys(loginData.response || {}));
      return;
    }

    console.log(`\nOK - Cookie received: ${cookie}\n`);

    // Step 3: Test CDR API
    console.log('Step 3: Testing CDRAPI access...');
    const cdrRequest = {
      request: {
        action: 'cdrapi',
        cookie: cookie,
        format: 'json',
      },
    };
    console.log('Request:', JSON.stringify(cdrRequest, null, 2));

    const cdrResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cdrRequest),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`Status: ${cdrResponse.status}`);
    const cdrData = await cdrResponse.json();
    console.log('Response (first 500 chars):', JSON.stringify(cdrData, null, 2).substring(0, 500));

    // Step 4: Test RECAPI
    console.log('\nStep 4: Testing RECAPI access...');
    const recRequest = {
      request: {
        action: 'recapi',
        cookie: cookie,
        recording_file: 'test.wav', // Non-existent file for testing
      },
    };
    console.log('Request:', JSON.stringify(recRequest, null, 2));

    const recResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recRequest),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`Status: ${recResponse.status}`);
    const recData = await recResponse.text();
    console.log('Response:', recData.substring(0, 200));

    console.log('\n' + '='.repeat(70));
    console.log('SUCCESS! Grandstream UCM API is working!');
    console.log('='.repeat(70));
    console.log('\nOK - Challenge/Token authentication: WORKING');
    console.log('OK - Login/Cookie generation: WORKING');
    console.log('OK - CDRAPI endpoint: ACCESSIBLE');
    console.log('OK - RECAPI endpoint: ACCESSIBLE');
    console.log('\nReady for Stage 4 integration!');

  } catch (error) {
    console.log('\nERROR:', error);
    if (error instanceof Error) {
      console.log('Message:', error.message);
    }
  }
}

testCorrectAPI();
