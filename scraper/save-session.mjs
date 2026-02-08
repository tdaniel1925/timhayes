#!/usr/bin/env node
/**
 * Save UCM Session to Supabase
 * Run this locally on your computer to capture login session
 *
 * Usage:
 *   1. Set environment variables in .env file
 *   2. Run: node save-session.mjs
 *   3. Browser will open - login manually and solve CAPTCHA
 *   4. Press Enter when you see the dashboard
 *   5. Session saved to Supabase - scraper can now use it
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const UCM_URL = process.env.UCM_URL || 'https://071ffb.c.myucm.cloud:8443';
const TENANT_ID = parseInt(process.env.TENANT_ID || '1');

// Validate environment
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing environment variables!');
  console.error('Required: SUPABASE_URL, SUPABASE_KEY (or SUPABASE_SERVICE_KEY)');
  console.error('Optional: UCM_URL, TENANT_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('='.repeat(70));
console.log('UCM Session Capture');
console.log('='.repeat(70));
console.log('');
console.log('This will open a browser window for you to login manually.');
console.log('');
console.log('Steps:');
console.log('  1. Browser window will open');
console.log('  2. Login to UCM and solve the CAPTCHA');
console.log('  3. Once you see the dashboard, come back here');
console.log('  4. Press ENTER to save the session');
console.log('  5. Session will be saved to Supabase');
console.log('');
console.log(`UCM URL: ${UCM_URL}`);
console.log(`Tenant ID: ${TENANT_ID}`);
console.log('');
console.log('='.repeat(70));
console.log('');

// Launch visible browser
console.log('Opening browser...');
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  acceptDownloads: true,
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 }
});

const page = await context.newPage();

// Navigate to UCM
console.log('Navigating to UCM login page...');
await page.goto(UCM_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

console.log('');
console.log('>>> Browser is open. Please login manually now. <<<');
console.log('>>> After you see the dashboard, press ENTER here. <<<');
console.log('');

// Wait for user to press Enter
await new Promise((resolve) => {
  process.stdin.once('data', resolve);
});

// Save the session
console.log('');
console.log('Saving session to Supabase...');
const storageState = await context.storageState();

try {
  // Check if session already exists
  const { data: existing } = await supabase
    .from('ucm_sessions')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .limit(1)
    .single();

  if (existing) {
    // Update existing session
    const { error } = await supabase
      .from('ucm_sessions')
      .update({
        session_data: storageState,
        updated_at: new Date().toISOString(),
        is_valid: true
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating session:', error.message);
      process.exit(1);
    }

    console.log('Session updated successfully!');
  } else {
    // Create new session
    const { error } = await supabase
      .from('ucm_sessions')
      .insert({
        tenant_id: TENANT_ID,
        ucm_url: UCM_URL,
        session_data: storageState,
        is_valid: true
      });

    if (error) {
      console.error('Error creating session:', error.message);
      process.exit(1);
    }

    console.log('Session created successfully!');
  }
} catch (e) {
  console.error('Exception saving session:', e.message);
  process.exit(1);
}

// Test: Navigate to recordings page
console.log('');
console.log('Testing navigation to recordings page...');
await page.goto(UCM_URL + '/cdr/recordingFile', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Check for table rows
const rows = await page.locator('table tbody tr').count();
console.log(`Found ${rows} recordings on page`);

// Check for Download All button
const downloadAllBtn = await page.locator('button:has-text("Download All"), span:has-text("Download All")').count();
if (downloadAllBtn > 0) {
  console.log('✓ "Download All" button found');
} else {
  console.log('✗ "Download All" button NOT found - check page manually');
}

console.log('');
console.log('Browser will stay open for 10 seconds for you to inspect...');
await page.waitForTimeout(10000);

await browser.close();

console.log('');
console.log('='.repeat(70));
console.log('SUCCESS!');
console.log('='.repeat(70));
console.log('');
console.log('Session saved to Supabase database.');
console.log('The scraper can now use this session to download recordings automatically.');
console.log('');
console.log('Next steps:');
console.log('  1. Deploy the scraper to Render');
console.log('  2. It will run every 15 minutes automatically');
console.log('  3. If session expires, run this script again');
console.log('');

process.exit(0);
