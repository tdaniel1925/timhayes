#!/usr/bin/env node
/**
 * AudiaPro UCM Recording Scraper
 * Downloads all recordings using "Download All" button → tar extraction
 * Based on solution.md approach - session-based, no CAPTCHA issues
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { extract as tarExtract } from 'tar';
import { Solver } from '2captcha';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const UCM_URL = process.env.UCM_URL || 'https://071ffb.c.myucm.cloud:8443';
const TENANT_ID = parseInt(process.env.TENANT_ID || '1');
const SCRAPER_INTERVAL = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY; // 2Captcha API key
const UCM_USERNAME = process.env.UCM_USERNAME || 'admin';
const UCM_PASSWORD = process.env.UCM_PASSWORD || 'BotMakers@2026';

// Directories
const DOWNLOAD_DIR = '/tmp/ucm_recordings';
const TAR_DIR = '/tmp/ucm_tar';

// Ensure directories exist
[DOWNLOAD_DIR, TAR_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('='.repeat(70));
console.log('AudiaPro UCM Recording Scraper');
console.log('='.repeat(70));
console.log(`UCM URL: ${UCM_URL}`);
console.log(`Tenant ID: ${TENANT_ID}`);
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Interval: ${SCRAPER_INTERVAL / 60000} minutes`);
console.log('='.repeat(70));

/**
 * Get saved UCM session from Supabase
 */
async function getSession(tenantId) {
  try {
    const { data, error } = await supabase
      .from('ucm_sessions')
      .select('session_data, is_valid')
      .eq('tenant_id', tenantId)
      .eq('is_valid', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('[Session] No valid session found');
      return null;
    }

    console.log('[Session] Found valid session');
    return data.session_data;
  } catch (e) {
    console.log('[Session] Error getting session:', e.message);
    return null;
  }
}

/**
 * Save/update session in Supabase
 */
async function saveSession(tenantId, sessionData) {
  try {
    // Try to update existing session
    const { data: existing } = await supabase
      .from('ucm_sessions')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('ucm_sessions')
        .update({
          session_data: sessionData,
          updated_at: new Date().toISOString(),
          is_valid: true
        })
        .eq('id', existing.id);
      console.log('[Session] Updated existing session');
    } else {
      await supabase
        .from('ucm_sessions')
        .insert({
          tenant_id: tenantId,
          ucm_url: UCM_URL,
          session_data: sessionData,
          is_valid: true
        });
      console.log('[Session] Created new session');
    }
  } catch (e) {
    console.error('[Session] Error saving session:', e.message);
  }
}

/**
 * Mark session as invalid
 */
async function invalidateSession(tenantId) {
  await supabase
    .from('ucm_sessions')
    .update({ is_valid: false })
    .eq('tenant_id', tenantId);
  console.log('[Session] Marked session as invalid');
}

/**
 * Automatically login to UCM and save session (with CAPTCHA solving)
 */
async function autoLogin(tenantId) {
  console.log('[AutoLogin] Starting automatic login...');

  if (!CAPTCHA_API_KEY) {
    console.log('[AutoLogin] ERROR: CAPTCHA_API_KEY not set - cannot auto-login');
    console.log('[AutoLogin] Please run save-session.mjs locally to capture session manually');
    return false;
  }

  const solver = new Solver(CAPTCHA_API_KEY);

  try {
    // Launch browser
    console.log('[AutoLogin] Launching browser...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
      // Navigate to login page
      console.log('[AutoLogin] Navigating to UCM login page...');
      await page.goto(UCM_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Fill in username and password
      console.log('[AutoLogin] Entering credentials...');
      await page.fill('input[name="username"], input#username, input[type="text"]', UCM_USERNAME);
      await page.fill('input[name="password"], input#password, input[type="password"]', UCM_PASSWORD);
      await page.waitForTimeout(1000);

      // Find reCAPTCHA sitekey
      console.log('[AutoLogin] Detecting reCAPTCHA...');
      const sitekey = await page.evaluate(() => {
        const recaptchaDiv = document.querySelector('.g-recaptcha');
        return recaptchaDiv ? recaptchaDiv.getAttribute('data-sitekey') : null;
      });

      if (!sitekey) {
        console.log('[AutoLogin] WARNING: Could not find reCAPTCHA sitekey');
        await browser.close();
        return false;
      }

      console.log('[AutoLogin] Found reCAPTCHA sitekey:', sitekey);
      console.log('[AutoLogin] Sending to 2Captcha for solving (may take 15-60 seconds)...');

      // Solve CAPTCHA using 2Captcha
      const solution = await solver.recaptcha({
        pageurl: UCM_URL,
        googlekey: sitekey
      });

      console.log('[AutoLogin] CAPTCHA solved! Submitting login form...');

      // Inject CAPTCHA solution into page
      await page.evaluate((token) => {
        const textarea = document.getElementById('g-recaptcha-response');
        if (textarea) {
          textarea.value = token;
          textarea.style.display = 'block';
        }
        // Also try to set it in the callback
        if (window.___grecaptcha_cfg && window.___grecaptcha_cfg.clients) {
          Object.values(window.___grecaptcha_cfg.clients).forEach(client => {
            if (client && client.D && client.D.D) {
              client.D.D.callback(token);
            }
          });
        }
      }, solution.data);

      // Submit the form
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await page.waitForTimeout(5000);

      // Check if login succeeded
      const currentUrl = page.url();
      const content = await page.content();

      if (currentUrl.includes('login') || content.includes('type="password"')) {
        console.log('[AutoLogin] Login failed - still on login page');
        await browser.close();
        return false;
      }

      console.log('[AutoLogin] Login successful! Saving session...');

      // Save the new session
      const storageState = await context.storageState();
      await saveSession(tenantId, storageState);

      console.log('[AutoLogin] Session saved successfully!');
      await browser.close();
      return true;

    } finally {
      await browser.close();
    }

  } catch (err) {
    console.error('[AutoLogin] Error:', err.message);
    return false;
  }
}

/**
 * Get list of already-downloaded recording filenames
 */
async function getDownloadedFilenames(tenantId) {
  const { data } = await supabase
    .from('cdr_records')
    .select('recordfiles')
    .eq('tenant_id', tenantId)
    .not('recording_local_path', 'is', null);

  const filenames = new Set();
  if (data) {
    data.forEach(record => {
      if (record.recordfiles) {
        // Extract filename from path like "2026-02/auto-xxx.wav@"
        const filename = record.recordfiles.split('/').pop().replace('@', '');
        if (filename) filenames.add(filename);
      }
    });
  }

  return filenames;
}

/**
 * Parse recording filename to extract call metadata
 * Format: auto-{timestamp}-{caller}-{callee}.wav
 * Or: auto-{timestamp}RG{ringgroup}-{caller}-{callee}.wav
 */
function parseFilename(filename) {
  const match = filename.match(/auto-(\d+)(?:RG\d+)?-(.+?)-(\d+)\.wav/);
  if (!match) return null;

  const timestamp = parseInt(match[1]);
  const caller = match[2];
  const callee = match[3];
  const callTime = new Date(timestamp * 1000);

  return { caller, callee, callTime, timestamp };
}

/**
 * Upload WAV file to Supabase Storage
 */
async function uploadToStorage(filePath, tenantId, uniqueid, filename) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `tenant_${tenantId}/${uniqueid}_${filename}`;

    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (error) {
      console.error('[Upload] Error:', error.message);
      return null;
    }

    console.log('[Upload] Success:', storagePath);
    return storagePath;
  } catch (e) {
    console.error('[Upload] Exception:', e.message);
    return null;
  }
}

/**
 * Find CDR record by filename and update with recording info
 */
async function updateCDRWithRecording(tenantId, filename, storagePath, fileSize) {
  try {
    // Find CDR record that matches this recording
    const { data: records } = await supabase
      .from('cdr_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .like('recordfiles', `%${filename}%`)
      .limit(1);

    if (records && records.length > 0) {
      const record = records[0];

      // Update with storage path
      const { error } = await supabase
        .from('cdr_records')
        .update({
          recording_local_path: storagePath,
          recording_downloaded: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (!error) {
        console.log('[DB] Updated CDR record:', record.id);
        return record.id;
      } else {
        console.error('[DB] Error updating CDR:', error.message);
      }
    } else {
      console.log('[DB] No matching CDR found for:', filename);
    }

    return null;
  } catch (e) {
    console.error('[DB] Exception:', e.message);
    return null;
  }
}

/**
 * MAIN SCRAPER FUNCTION
 * Downloads all recordings using "Download All" button
 */
async function scrapeRecordings(tenantId) {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(70));
  console.log(`[Scraper] Starting run at ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  let stats = {
    newFiles: 0,
    totalFiles: 0,
    uploaded: 0,
    errors: 0,
    sessionExpired: false
  };

  try {
    // 1. Get saved session
    let sessionData = await getSession(tenantId);
    if (!sessionData) {
      console.log('[Scraper] No session found - attempting automatic login...');

      // Attempt automatic login with CAPTCHA solving
      const loginSuccess = await autoLogin(tenantId);

      if (!loginSuccess) {
        console.log('[Scraper] Auto-login failed - manual session capture required');
        console.log('[Scraper] Run save-session.mjs locally to create initial session');
        return { ...stats, error: 'no_session_manual_required' };
      }

      console.log('[Scraper] Auto-login successful! Loading new session...');
      sessionData = await getSession(tenantId);

      if (!sessionData) {
        console.log('[Scraper] ERROR: Session still not found after auto-login');
        return { ...stats, error: 'no_session_after_login' };
      }
    }

    // 2. Get already-downloaded files
    const existingFiles = await getDownloadedFilenames(tenantId);
    console.log(`[Scraper] Already have ${existingFiles.size} recordings in database`);

    // 3. Launch browser with saved session
    console.log('[Scraper] Launching browser...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
      storageState: sessionData
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
      // 4. Navigate to recordings page
      console.log('[Scraper] Opening recordings page...');
      await page.goto(UCM_URL + '/cdr/recordingFile', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // 5. Check if session expired
      const content = await page.content();
      if (page.url().includes('login') || content.includes('type="password"')) {
        console.log('[Scraper] SESSION EXPIRED - attempting automatic login...');
        await invalidateSession(tenantId);
        await browser.close();

        // Attempt automatic login with CAPTCHA solving
        const loginSuccess = await autoLogin(tenantId);

        if (!loginSuccess) {
          console.log('[Scraper] Auto-login failed - manual session capture required');
          stats.sessionExpired = true;
          return { ...stats, error: 'session_expired_manual_required' };
        }

        console.log('[Scraper] Auto-login successful! Retrying scraper run...');
        // Retry the entire scraper function with new session
        return await scrapeRecordings(tenantId);
      }

      // 6. Click "Download All" button
      console.log('[Scraper] Clicking "Download All" button...');
      const downloadAllBtn = page.locator('button:has-text("Download All"), span:has-text("Download All")').first();

      if (await downloadAllBtn.count() === 0) {
        throw new Error('"Download All" button not found on page');
      }

      await downloadAllBtn.click();
      await page.waitForTimeout(2000);

      // 7. Click "Download" in confirmation modal
      console.log('[Scraper] Confirming download in modal...');
      const confirmBtn = page.locator(
        '.ant-modal button:has-text("Download"), ' +
        'button.ant-btn-primary:has-text("Download")'
      ).first();

      if (await confirmBtn.count() === 0) {
        throw new Error('Confirmation modal "Download" button not found');
      }

      // Wait for download to start (tar file)
      console.log('[Scraper] Waiting for tar file download (up to 3 minutes)...');
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 180000 }), // 3 min timeout
        confirmBtn.click()
      ]);

      // 8. Save tar file
      const tarFilename = download.suggestedFilename();
      const tarPath = path.join(TAR_DIR, tarFilename);
      console.log(`[Scraper] Downloading: ${tarFilename}`);
      await download.saveAs(tarPath);

      const tarStats = fs.statSync(tarPath);
      console.log(`[Scraper] Downloaded: ${(tarStats.size / 1024 / 1024).toFixed(2)} MB`);

      // 9. Refresh session cookies (keeps session alive)
      const newSession = await context.storageState();
      await saveSession(tenantId, newSession);
      console.log('[Scraper] Session refreshed');

      // 10. Extract tar file
      console.log('[Scraper] Extracting tar file...');
      await tarExtract({
        file: tarPath,
        cwd: DOWNLOAD_DIR
      });

      // 11. Find all WAV files (may be nested in subdirectories)
      console.log('[Scraper] Scanning for WAV files...');
      const wavFiles = [];

      function findWavs(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            findWavs(fullPath);
          } else if (item.endsWith('.wav') && stat.size > 5000) {
            // Move to flat recordings dir if nested
            const destPath = path.join(DOWNLOAD_DIR, item);
            if (fullPath !== destPath && !fs.existsSync(destPath)) {
              fs.copyFileSync(fullPath, destPath);
            }
            wavFiles.push({
              name: item,
              path: destPath,
              size: stat.size
            });
          }
        }
      }

      findWavs(DOWNLOAD_DIR);
      stats.totalFiles = wavFiles.length;
      console.log(`[Scraper] Found ${wavFiles.length} WAV files`);

      // 12. Process new recordings
      for (const wav of wavFiles) {
        if (existingFiles.has(wav.name)) {
          console.log(`[Scraper] [SKIP] ${wav.name} (already in database)`);
          continue;
        }

        console.log(`[Scraper] [NEW] ${wav.name} (${(wav.size / 1024).toFixed(1)} KB)`);

        // Parse filename to get metadata
        const meta = parseFilename(wav.name);
        if (!meta) {
          console.log(`[Scraper]   Could not parse filename format`);
          stats.errors++;
          continue;
        }

        // Generate uniqueid (matches CDR format)
        const uniqueid = `${meta.timestamp}.${meta.caller.slice(-3)}`;

        // Upload to Supabase Storage
        const storagePath = await uploadToStorage(wav.path, tenantId, uniqueid, wav.name);

        if (storagePath) {
          // Update CDR record
          const cdrId = await updateCDRWithRecording(tenantId, wav.name, storagePath, wav.size);

          if (cdrId) {
            stats.newFiles++;
            stats.uploaded++;
            console.log(`[Scraper]   Uploaded and linked to CDR ${cdrId}`);
          } else {
            stats.errors++;
            console.log(`[Scraper]   Uploaded but no matching CDR found`);
          }
        } else {
          stats.errors++;
          console.log(`[Scraper]   Upload failed`);
        }

        // Delete local file
        try {
          fs.unlinkSync(wav.path);
        } catch (e) {}
      }

      // 13. Clean up
      console.log('[Scraper] Cleaning up...');

      // Delete tar file
      try {
        fs.unlinkSync(tarPath);
      } catch (e) {}

      // Delete extracted subdirectories
      try {
        const items = fs.readdirSync(DOWNLOAD_DIR);
        for (const item of items) {
          const fullPath = path.join(DOWNLOAD_DIR, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true });
          }
        }
      } catch (e) {}

      console.log('[Scraper] Cleanup complete');

    } finally {
      await browser.close();
    }

  } catch (err) {
    console.error('[Scraper] Error:', err.message);
    console.error(err.stack);
    stats.error = err.message;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log(`[Scraper] COMPLETE in ${elapsed}s`);
  console.log(`[Scraper]  New files: ${stats.newFiles}`);
  console.log(`[Scraper]  Total files: ${stats.totalFiles}`);
  console.log(`[Scraper]  Uploaded: ${stats.uploaded}`);
  console.log(`[Scraper]  Errors: ${stats.errors}`);
  console.log('='.repeat(70));

  return stats;
}

/**
 * Run scraper in loop mode (scheduled every 15 minutes)
 */
async function runScheduled() {
  console.log('[Scheduler] Starting scheduled scraper');
  console.log(`[Scheduler] Will run every ${SCRAPER_INTERVAL / 60000} minutes`);

  // Initial run after 30 seconds
  setTimeout(async () => {
    await scrapeRecordings(TENANT_ID);
  }, 30000);

  // Then every 15 minutes
  setInterval(async () => {
    await scrapeRecordings(TENANT_ID);
  }, SCRAPER_INTERVAL);

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('[Scheduler] Received SIGTERM, shutting down...');
    process.exit(0);
  });
}

/**
 * Run scraper once (for testing)
 */
async function runOnce() {
  const result = await scrapeRecordings(TENANT_ID);
  console.log('\n[Result]', JSON.stringify(result, null, 2));
  process.exit(result.error ? 1 : 0);
}

// Main entry point
const mode = process.argv[2] || 'once';

if (mode === 'loop') {
  runScheduled().catch(console.error);
} else {
  runOnce().catch(console.error);
}
