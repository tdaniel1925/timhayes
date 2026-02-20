/**
 * Grandstream UCM Connection Test - Alternative API Format
 */

import { createHash } from 'crypto';
import https from 'https';

async function testConnection() {
  const host = '071ffb.c.myucm.cloud';
  const port = 8443;
  const username = 'admin1';
  const password = 'BotMakers@2026';

  console.log('🔌 Testing Grandstream UCM Connection (Alternative Format)\n');

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    // Try different challenge endpoint formats
    const challengeAttempts = [
      { url: `https://${host}:${port}/api/challenge`, method: 'GET', body: null },
      { url: `https://${host}:${port}/api/challenge`, method: 'POST', body: {} },
      { url: `https://${host}:${port}/api/challenge`, method: 'POST', body: { username } },
    ];

    let challenge = null;
    let challengeUrl = '';

    for (const attempt of challengeAttempts) {
      console.log(`\n📡 Trying: ${attempt.method} ${attempt.url}`);
      if (attempt.body) {
        console.log(`   Body: ${JSON.stringify(attempt.body)}`);
      }

      try {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: attempt.body ? JSON.stringify(attempt.body) : null,
          // @ts-ignore
          agent: httpsAgent,
        });

        console.log(`   Status: ${response.status}`);
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);

        if (data.challenge || (data.response && data.response.challenge)) {
          challenge = data.challenge || data.response.challenge;
          challengeUrl = attempt.url;
          console.log(`   ✅ Got challenge: ${challenge}`);
          break;
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error}`);
      }
    }

    if (!challenge) {
      console.log('\n❌ Could not obtain challenge token from any method');
      console.log('\n🔧 Trying direct login without challenge...\n');

      // Try direct login (some UCM versions might support this)
      const loginUrl = `https://${host}:${port}/api/login`;
      const loginAttempts = [
        {
          method: 'POST',
          body: {
            username,
            password,
          },
        },
        {
          method: 'POST',
          body: {
            user: username,
            pwd: password,
          },
        },
      ];

      for (const attempt of loginAttempts) {
        console.log(`📡 Trying login: ${JSON.stringify(attempt.body)}`);

        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attempt.body),
          // @ts-ignore
          agent: httpsAgent,
        });

        console.log(`   Status: ${response.status}`);
        const text = await response.text();
        console.log(`   Response: ${text}`);

        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          console.log(`   Set-Cookie: ${setCookie}`);
          console.log('   ✅ Got session cookie!');
          return;
        }
      }

      console.log('\n❌ All login attempts failed');
      return;
    }

    // If we got a challenge, try to login
    console.log('\n🔐 Creating password hash...');
    const hashedPassword = createHash('md5')
      .update(challenge + password)
      .digest('hex');
    console.log(`   MD5: ${hashedPassword}`);

    console.log('\n🔑 Attempting login...');
    const loginUrl = `https://${host}:${port}/api/login`;

    // Try different login formats
    const loginAttempts = [
      {
        username,
        password: hashedPassword,
      },
      {
        user: username,
        pwd: hashedPassword,
      },
      {
        username,
        pwd: hashedPassword,
      },
    ];

    for (const loginBody of loginAttempts) {
      console.log(`\n📡 Trying login body: ${JSON.stringify(loginBody)}`);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginBody),
        // @ts-ignore
        agent: httpsAgent,
      });

      console.log(`   Status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log(`   Set-Cookie: ${setCookie}`);
        const sessionMatch = setCookie.match(/session=([^;]+)/);
        if (sessionMatch) {
          console.log(`\n✅ SUCCESS! Session ID: ${sessionMatch[1]}`);
          return;
        }
      }
    }

    console.log('\n❌ All login attempts failed');

  } catch (error) {
    console.log('\n❌ ERROR:', error);
  }
}

testConnection();
