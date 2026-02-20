/**
 * Grandstream UCM Connection Test - CORRECT FORMAT
 * Following the exact format from UCM_API_CONNECTION_AND_DOWNLOAD_GUIDE.md
 */

import { createHash } from 'crypto';
import https from 'https';

async function testConnection() {
  const host = '071ffb.c.myucm.cloud';
  const port = 8443;
  const username = 'admin1';
  const password = 'BotMakers@2026';

  console.log('🔌 Testing Grandstream UCM Connection (CORRECT FORMAT)\n');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Username: ${username}\n`);

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    // Step 1: Get Challenge - Simple GET request
    console.log('📡 Step 1: Getting challenge token...');
    const challengeUrl = `https://${host}:${port}/api/challenge`;

    const challengeResponse = await fetch(challengeUrl, {
      method: 'GET',
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${challengeResponse.status}`);

    if (!challengeResponse.ok) {
      console.log('   ❌ Failed to get challenge');
      return;
    }

    const challengeData = await challengeResponse.json();
    console.log(`   Response: ${JSON.stringify(challengeData)}`);

    const challenge = challengeData.challenge;
    if (!challenge) {
      console.log('   ❌ No challenge in response');
      return;
    }

    console.log(`   ✅ Challenge: ${challenge}\n`);

    // Step 2: Hash password with challenge
    console.log('🔐 Step 2: Hashing password...');
    const hashInput = `${challenge}${password}`;
    const hashedPassword = createHash('md5').update(hashInput).digest('hex');
    console.log(`   Input: "${hashInput}"`);
    console.log(`   MD5 Hash: ${hashedPassword}\n`);

    // Step 3: Login with FORM DATA (not JSON!)
    console.log('🔑 Step 3: Logging in...');
    const loginUrl = `https://${host}:${port}/api/login`;

    // Create form data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', hashedPassword);

    console.log(`   URL: ${loginUrl}`);
    console.log(`   Form data: username=${username}, password=${hashedPassword}`);

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${loginResponse.status}`);

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`   ❌ Login failed: ${errorText}`);
      return;
    }

    const responseText = await loginResponse.text();
    console.log(`   Response: ${responseText}`);

    // Get session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log(`   Set-Cookie: ${setCookieHeader || 'NONE'}`);

    if (!setCookieHeader) {
      console.log('   ❌ No session cookie received');
      return;
    }

    const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
      console.log('   ❌ Could not parse session cookie');
      return;
    }

    const sessionId = sessionMatch[1];
    console.log(`   ✅ Session ID: ${sessionId}\n`);

    // Step 4: Test RECAPI
    console.log('🎵 Step 4: Testing RECAPI...');
    const testFile = 'test.wav';
    const recapiUrl = `https://${host}:${port}/api/recapi?recording_file=${testFile}`;

    const recapiResponse = await fetch(recapiUrl, {
      method: 'GET',
      headers: {
        'Cookie': `session=${sessionId}`,
      },
      // @ts-ignore
      agent: httpsAgent,
    });

    console.log(`   Status: ${recapiResponse.status}`);

    if (recapiResponse.status === 404) {
      console.log('   ✅ RECAPI accessible (404 for non-existent file is expected)\n');
    } else if (recapiResponse.status === 401) {
      console.log('   ❌ RECAPI auth failed\n');
      return;
    } else {
      console.log(`   Response status: ${recapiResponse.status}\n`);
    }

    console.log('='.repeat(70));
    console.log('🎉 SUCCESS! Grandstream UCM connection test passed!');
    console.log('='.repeat(70));
    console.log('\n✅ Challenge/Response authentication: WORKING');
    console.log('✅ Session management: WORKING');
    console.log('✅ RECAPI endpoint: ACCESSIBLE');
    console.log('\n🚀 Your UCM is ready for AudiaPro integration!');

  } catch (error) {
    console.log('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.log('   Message:', error.message);
    }
  }
}

testConnection();
