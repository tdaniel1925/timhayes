/**
 * UCM API Discovery - Find which endpoints are available
 */

import https from 'https';

async function discoverAPI() {
  const host = '071ffb.c.myucm.cloud';
  const port = 8443;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  console.log('🔍 UCM API Discovery\n');
  console.log(`Host: ${host}:${port}\n`);

  // Try various common API endpoints
  const endpoints = [
    '/api',
    '/api/version',
    '/api/info',
    '/api/status',
    '/api/challenge',
    '/api/get_challenge',
    '/api/auth/challenge',
    '/cgi-bin/api/challenge',
  ];

  for (const endpoint of endpoints) {
    const url = `https://${host}:${port}${endpoint}`;
    console.log(`Testing: ${endpoint}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        // @ts-ignore
        agent: httpsAgent,
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`  ✅ JSON Response: ${JSON.stringify(data).substring(0, 200)}`);
        } else {
          const text = await response.text();
          console.log(`  Response (${contentType}): ${text.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    console.log('');
  }

  // Try POST to challenge with different payloads
  console.log('\n' + '='.repeat(70));
  console.log('Testing POST /api/challenge with various payloads');
  console.log('='.repeat(70) + '\n');

  const challengePayloads = [
    { name: 'Empty body', body: null },
    { name: 'Empty JSON', body: '{}' },
    { name: 'With user field', body: JSON.stringify({ user: 'admin1' }) },
    { name: 'With username field', body: JSON.stringify({ username: 'admin1' }) },
    { name: 'Form data with user', body: new URLSearchParams({ user: 'admin1' }).toString(), contentType: 'application/x-www-form-urlencoded' },
    { name: 'Form data with username', body: new URLSearchParams({ username: 'admin1' }).toString(), contentType: 'application/x-www-form-urlencoded' },
  ];

  for (const payload of challengePayloads) {
    console.log(`Trying: ${payload.name}`);
    const url = `https://${host}:${port}/api/challenge`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': payload.contentType || 'application/json',
        },
        body: payload.body || undefined,
        // @ts-ignore
        agent: httpsAgent,
      });

      console.log(`  Status: ${response.status}`);

      try {
        const data = await response.json();
        console.log(`  Response: ${JSON.stringify(data)}`);

        if (data.challenge || (data.response && data.response.challenge)) {
          console.log(`  ✅✅✅ FOUND CHALLENGE! ${data.challenge || data.response.challenge}`);
        }
      } catch (e) {
        const text = await response.text();
        console.log(`  Response (text): ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    console.log('');
  }
}

discoverAPI();
