/**
 * Grandstream UCM Connection Test Script
 *
 * This script tests the connection to a Grandstream UCM system
 * using the authentication flow: challenge → MD5 hash → login
 *
 * Usage:
 *   npx tsx test-grandstream.ts
 *
 * You can also pass credentials as arguments:
 *   npx tsx test-grandstream.ts <host> <port> <username> <password>
 */

import { testUCMConnection } from './src/lib/integrations/grandstream';

async function main() {
  // Get credentials from command line args or prompt
  const args = process.argv.slice(2);

  const host = args[0] || process.env.TEST_UCM_HOST || '';
  const port = args[1] ? parseInt(args[1]) : parseInt(process.env.TEST_UCM_PORT || '8443');
  const username = args[2] || process.env.TEST_UCM_USERNAME || '';
  const password = args[3] || process.env.TEST_UCM_PASSWORD || '';

  if (!host || !username || !password) {
    console.error('❌ Missing required credentials!');
    console.log('\nUsage:');
    console.log('  npx tsx test-grandstream.ts <host> <port> <username> <password>');
    console.log('\nExample:');
    console.log('  npx tsx test-grandstream.ts 071ffb.c.myucm.cloud 8443 admin mypassword');
    console.log('\nOr set environment variables:');
    console.log('  TEST_UCM_HOST=071ffb.c.myucm.cloud');
    console.log('  TEST_UCM_PORT=8443');
    console.log('  TEST_UCM_USERNAME=admin');
    console.log('  TEST_UCM_PASSWORD=mypassword');
    process.exit(1);
  }

  console.log('🔌 Testing Grandstream UCM Connection...\n');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${'*'.repeat(password.length)}\n`);

  console.log('⏳ Step 1: Fetching challenge token...');
  console.log('⏳ Step 2: Hashing password with challenge...');
  console.log('⏳ Step 3: Attempting login...\n');

  // Test with SSL verification disabled (common for self-signed certs)
  const result = await testUCMConnection(host, port, username, password, false);

  if (result.success) {
    console.log('✅ CONNECTION SUCCESSFUL!\n');
    console.log(`Message: ${result.message}`);
    if (result.sessionId) {
      console.log(`Session ID: ${result.sessionId.substring(0, 20)}...`);
    }
    console.log('\n🎉 Your Grandstream UCM is properly configured and accessible!');
    console.log('✅ The webhook endpoints will be able to authenticate and download recordings.');
  } else {
    console.log('❌ CONNECTION FAILED!\n');
    console.log(`Error: ${result.message}\n`);
    console.log('Common issues:');
    console.log('  1. Incorrect host or port (check your UCM URL)');
    console.log('  2. Wrong username or password');
    console.log('  3. UCM API is disabled (enable in UCM settings)');
    console.log('  4. Firewall blocking connection');
    console.log('  5. Network connectivity issues');
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
