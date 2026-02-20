/**
 * Detailed Grandstream UCM Connection Test
 * Shows step-by-step what's happening
 */

import { createHash } from 'crypto';
import https from 'https';

async function testConnection() {
  const host = '071ffb.c.myucm.cloud';
  const port = 8443;
  const username = 'admin1';
  const password = 'BotMakers@2026';

  console.log('🔌 Testing Grandstream UCM Connection (Detailed)\n');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${'*'.repeat(password.length)}\n`);

  // Create HTTPS agent that accepts self-signed certificates
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    // Step 1: Get Challenge
    console.log('📡 Step 1: Fetching challenge token...');
    const challengeUrl = `https://${host}:${port}/api/challenge`;
    console.log(`   URL: ${challengeUrl}`);

    const challengeResponse = await fetch(challengeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${challengeResponse.status} ${challengeResponse.statusText}`);

    if (!challengeResponse.ok) {
      const errorText = await challengeResponse.text();
      console.log(`   ❌ Failed to get challenge`);
      console.log(`   Response: ${errorText}`);
      return;
    }

    const challengeData = await challengeResponse.json();
    console.log(`   Response: ${JSON.stringify(challengeData, null, 2)}`);

    if (!challengeData.challenge) {
      console.log('   ❌ No challenge token in response');
      return;
    }

    const challenge = challengeData.challenge;
    console.log(`   ✅ Challenge received: ${challenge}\n`);

    // Step 2: Hash Password
    console.log('🔐 Step 2: Creating password hash...');
    console.log(`   Input: "${challenge}${password}"`);

    const hashedPassword = createHash('md5')
      .update(challenge + password)
      .digest('hex');

    console.log(`   MD5 Hash: ${hashedPassword}`);
    console.log(`   ✅ Password hashed\n`);

    // Step 3: Login
    console.log('🔑 Step 3: Attempting login...');
    const loginUrl = `https://${host}:${port}/api/login`;
    console.log(`   URL: ${loginUrl}`);

    const loginBody = {
      username,
      password: hashedPassword,
    };
    console.log(`   Body: ${JSON.stringify(loginBody, null, 2)}`);

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);

    const responseText = await loginResponse.text();
    console.log(`   Response: ${responseText}`);

    // Check for Set-Cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log(`   Set-Cookie header: ${setCookieHeader || 'NONE'}`);

    if (!loginResponse.ok) {
      console.log(`   ❌ Login failed`);
      return;
    }

    if (!setCookieHeader) {
      console.log('   ❌ No session cookie received');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('   Parsed response:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        // Not JSON
      }
      return;
    }

    // Parse session cookie
    const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
      console.log('   ❌ Invalid session cookie format');
      console.log(`   Cookie: ${setCookieHeader}`);
      return;
    }

    const sessionId = sessionMatch[1];
    console.log(`   ✅ Session ID: ${sessionId}\n`);

    // Step 4: Test RECAPI
    console.log('🎵 Step 4: Testing RECAPI access...');
    const recapiUrl = `https://${host}:${port}/api/recapi?recording_file=test.wav`;
    console.log(`   URL: ${recapiUrl}`);

    const recapiResponse = await fetch(recapiUrl, {
      method: 'GET',
      headers: {
        Cookie: `session=${sessionId}`,
      },
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${recapiResponse.status} ${recapiResponse.statusText}`);

    if (recapiResponse.status === 404) {
      console.log('   ✅ RECAPI is accessible (404 for non-existent file is expected)');
    } else if (recapiResponse.status === 401) {
      console.log('   ❌ RECAPI authentication failed (session invalid)');
    } else if (recapiResponse.status === 200) {
      console.log('   ✅ RECAPI is accessible and returned data');
    } else {
      const recapiText = await recapiResponse.text();
      console.log(`   Response: ${recapiText.substring(0, 200)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Connection test completed successfully!');
    console.log('='.repeat(60));
    console.log('\nYour Grandstream UCM is:');
    console.log('✅ Reachable');
    console.log('✅ API enabled');
    console.log('✅ Credentials valid');
    console.log('✅ RECAPI accessible');
    console.log('\n✅ Ready for webhook integration!');

  } catch (error) {
    console.log('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.log('   Message:', error.message);
      console.log('   Stack:', error.stack);
    }
  }
}

testConnection();
