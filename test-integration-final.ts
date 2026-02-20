import { testUCMConnection } from './src/lib/integrations/grandstream';

async function test() {
  console.log('Testing updated Grandstream integration...\n');

  const result = await testUCMConnection(
    '071ffb.c.myucm.cloud',
    8443,
    'cdrapi',
    'BotMakers@2026',
    false
  );

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n='.repeat(70));
    console.log('SUCCESS! Grandstream UCM API integration is working!');
    console.log('='.repeat(70));
    console.log('\nCookie:', result.cookie);
    console.log('\nReady to proceed with Stage 4!');
  } else {
    console.log('\nFAILED:', result.message);
  }
}

test().catch(console.error);
