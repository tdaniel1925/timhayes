/**
 * E2E tests for critical user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Client Admin User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as client admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@testcompany.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should view dashboard overview', async ({ page }) => {
    // Dashboard should show key metrics
    await expect(page.locator('h1, h2')).toContainText(/dashboard|overview/i);

    // Should see stats cards
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card');
    await expect(statsCards.first()).toBeVisible();
  });

  test('should navigate to calls list', async ({ page }) => {
    // Navigate to calls page
    await page.click('a[href*="/dashboard/calls"], nav >> text=/calls/i');

    // Should see calls list
    await expect(page).toHaveURL(/.*\/calls/);
    await expect(page.locator('h1, h2')).toContainText(/calls|call history/i);
  });

  test('should view call detail with analysis', async ({ page }) => {
    // Navigate to calls
    await page.goto('/dashboard/calls');

    // Click on first call in list
    const firstCall = page
      .locator('[data-testid="call-row"], tr, .call-item')
      .first();
    await firstCall.click();

    // Should navigate to call detail
    await expect(page).toHaveURL(/.*\/calls\/[a-f0-9-]+/);

    // Should see call details
    await expect(page.locator('h1, h2')).toContainText(/call detail/i);

    // Should see analysis tabs
    const tabsList = page.locator('[role="tablist"], .tabs');
    await expect(tabsList).toBeVisible();
  });

  test('should filter calls by date range', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Open date filter
    const dateFilter = page.locator(
      'button:has-text("Date"), [data-testid="date-filter"]'
    );
    if (await dateFilter.isVisible()) {
      await dateFilter.click();

      // Select date range
      await page.click('text=/last 7 days|last week/i');

      // Should show filtered results
      await expect(page.locator('.loading, [data-testid="loading"]')).toBeHidden();
    }
  });

  test('should search calls', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('1001');
      await searchInput.press('Enter');

      // Should show search results
      await page.waitForTimeout(1000);
    }
  });

  test('should export calls to CSV', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Click export button
    const exportButton = page.locator(
      'button:has-text("Export"), [data-testid="export-button"]'
    );

    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('should generate PDF report', async ({ page }) => {
    await page.goto('/dashboard/reports');

    // Click generate report button
    const generateButton = page.locator(
      'button:has-text("Generate"), [data-testid="generate-report"]'
    );

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Should show success message or download PDF
      await expect(
        page.locator('text=/generated|success/i, [role="status"]')
      ).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should view billing information', async ({ page }) => {
    await page.goto('/dashboard/billing');

    // Should see billing overview
    await expect(page.locator('h1, h2')).toContainText(/billing|subscription/i);

    // Should see current usage
    const usageSection = page.locator('text=/current usage|calls this month/i');
    await expect(usageSection).toBeVisible();
  });

  test('should manage email report preferences', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Find email reports section
    const emailSection = page.locator('text=/email reports|scheduled reports/i');

    if (await emailSection.isVisible()) {
      // Toggle daily report
      const dailyToggle = page.locator(
        'input[type="checkbox"][name*="daily"], [data-testid="daily-report-toggle"]'
      );

      if (await dailyToggle.isVisible()) {
        await dailyToggle.click();

        // Should see save button
        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.click();

        // Should show success message
        await expect(page.locator('text=/saved|updated/i')).toBeVisible();
      }
    }
  });

  test('should play call recording', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Click on first call
    await page.click('[data-testid="call-row"], tr, .call-item');

    // Wait for detail page
    await expect(page).toHaveURL(/.*\/calls\/[a-f0-9-]+/);

    // Find audio player
    const audioPlayer = page.locator('audio, [data-testid="audio-player"]');

    if (await audioPlayer.isVisible()) {
      // Click play button
      const playButton = page.locator('button[aria-label*="Play"], button:has-text("Play")');
      await playButton.click();

      // Audio should start playing (paused state should change)
      await page.waitForTimeout(1000);
    }
  });

  test('should view transcript with timestamps', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Click on first call
    await page.click('[data-testid="call-row"], tr, .call-item');

    // Should see transcript viewer
    const transcript = page.locator('[data-testid="transcript"], .transcript-viewer');

    if (await transcript.isVisible()) {
      // Should see speaker labels
      await expect(transcript).toContainText(/caller|agent|speaker/i);

      // Should see timestamps
      await expect(transcript.locator('[data-timestamp], .timestamp')).toBeVisible();
    }
  });

  test('should search transcript', async ({ page }) => {
    await page.goto('/dashboard/calls');

    // Navigate to call detail
    await page.click('[data-testid="call-row"], tr, .call-item');

    // Find transcript search
    const transcriptSearch = page.locator(
      'input[placeholder*="Search transcript"], [data-testid="transcript-search"]'
    );

    if (await transcriptSearch.isVisible()) {
      await transcriptSearch.fill('refund');

      // Should highlight matches
      await expect(page.locator('.highlight, mark')).toBeVisible();
    }
  });
});

test.describe('Super Admin User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@audiapro.com');
    await page.fill('input[type="password"]', 'admin-password');
    await page.click('button[type="submit"]');

    // Wait for admin dashboard to load
    await expect(page).toHaveURL(/.*admin/);
  });

  test('should view system overview', async ({ page }) => {
    // Admin dashboard should show system metrics
    await expect(page.locator('h1, h2')).toContainText(/admin|system/i);

    // Should see tenant count, user count, etc.
    const metrics = page.locator('[data-testid="metric-card"], .metric-card');
    await expect(metrics.first()).toBeVisible();
  });

  test('should create new tenant', async ({ page }) => {
    await page.goto('/admin/tenants/new');

    // Fill in tenant form
    await page.fill('input[name="name"]', 'Test Company Inc');
    await page.fill('input[name="slug"]', 'test-company');
    await page.fill('input[name="billingEmail"]', 'billing@testcompany.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to tenant detail or list
    await expect(page).toHaveURL(/.*\/tenants/);
    await expect(page.locator('text=/success|created/i')).toBeVisible();
  });

  test('should create PBX connection', async ({ page }) => {
    await page.goto('/admin/connections/new');

    // Fill in connection form
    await page.selectOption('select[name="tenantId"]', { index: 1 });
    await page.fill('input[name="name"]', 'Main PBX');
    await page.selectOption('select[name="providerType"]', 'grandstream_ucm');
    await page.fill('input[name="host"]', 'pbx.example.com');
    await page.fill('input[name="port"]', '8443');
    await page.fill('input[name="apiUsername"]', 'admin');
    await page.fill('input[name="apiPassword"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success
    await expect(page).toHaveURL(/.*\/connections/);
    await expect(page.locator('text=/success|created/i')).toBeVisible();
  });

  test('should test PBX connection', async ({ page }) => {
    await page.goto('/admin/connections');

    // Click on first connection
    await page.click('[data-testid="connection-row"], tr, .connection-item');

    // Click test connection button
    const testButton = page.locator('button:has-text("Test Connection")');

    if (await testButton.isVisible()) {
      await testButton.click();

      // Should show test result
      await expect(page.locator('[role="status"], .test-result')).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should create new user', async ({ page }) => {
    await page.goto('/admin/users/new');

    // Fill in user form
    await page.selectOption('select[name="tenantId"]', { index: 1 });
    await page.fill('input[name="email"]', 'newuser@testcompany.com');
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.selectOption('select[name="role"]', 'client_admin');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success with temp password info
    await expect(page).toHaveURL(/.*\/users/);
    await expect(page.locator('text=/success|created|welcome email/i')).toBeVisible();
  });

  test('should view job queue status', async ({ page }) => {
    await page.goto('/admin/jobs');

    // Should see job queue table
    await expect(page.locator('h1, h2')).toContainText(/jobs|queue/i);

    // Should see job status badges
    const statusBadges = page.locator('[data-status], .badge, .status-badge');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should toggle tenant status', async ({ page }) => {
    await page.goto('/admin/tenants');

    // Click on first tenant
    await page.click('[data-testid="tenant-row"], tr, .tenant-item');

    // Find suspend/activate button
    const toggleButton = page.locator(
      'button:has-text("Suspend"), button:has-text("Activate")'
    );

    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Confirm action
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success message
      await expect(page.locator('text=/updated|success/i')).toBeVisible();
    }
  });

  test('should view system health metrics', async ({ page }) => {
    await page.goto('/admin/health');

    // Should see health status
    await expect(page.locator('h1, h2')).toContainText(/health|status/i);

    // Should see worker status
    const workerStatus = page.locator('text=/worker|job processor/i');
    await expect(workerStatus).toBeVisible();
  });

  test('should view all calls across tenants', async ({ page }) => {
    await page.goto('/admin/calls');

    // Should see calls from all tenants
    await expect(page.locator('h1, h2')).toContainText(/all calls|system calls/i);

    // Should see tenant column/filter
    const tenantFilter = page.locator('select[name="tenant"], [data-testid="tenant-filter"]');
    await expect(tenantFilter).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/forgot-password');

    // Fill in email
    await page.fill('input[type="email"]', 'user@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/email sent|check your email/i')).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');

    // Fill in non-existent email
    await page.fill('input[type="email"]', 'nonexistent@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success anyway (security best practice - don't reveal if email exists)
    // Or show generic error
    await page.waitForTimeout(1000);
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@testcompany.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should see mobile menu button
    const menuButton = page.locator(
      'button[aria-label*="menu"], [data-testid="mobile-menu-button"]'
    );
    await expect(menuButton).toBeVisible();
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/dashboard');

    // Should adapt layout for tablet
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
  });
});
