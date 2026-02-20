/**
 * E2E tests for super admin pages
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Job Queue', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as super admin
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@audiapro.com');
    await page.fill('input[name="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    await page.goto('/admin/jobs');
  });

  test('should display job queue with stats', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h1, h2', { timeout: 10000 });

    // Should show job stats
    await expect(
      page.locator('text=/pending|processing|completed|failed/i').first()
    ).toBeVisible();
  });

  test('should display job table', async ({ page }) => {
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Should have table headers
    const headers = page.locator('th, [role="columnheader"]');
    await expect(headers.first()).toBeVisible();

    // Should show job rows
    const rows = page.locator('tbody tr, [role="row"]');
    await expect(rows.first()).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Click failed filter
    await page.click('button:has-text("Failed"), [data-filter="failed"]');

    // Wait for table to update
    await page.waitForTimeout(1000);

    // Should show only failed jobs or empty state
    const tableRows = page.locator('tbody tr');
    const count = await tableRows.count();

    if (count > 0) {
      // Verify jobs are failed status
      await expect(tableRows.first()).toContainText(/failed/i);
    } else {
      // Should show empty state
      await expect(page.locator('text=/no.*failed.*jobs/i')).toBeVisible();
    }
  });

  test('should retry a failed job', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Filter to show failed jobs
    await page.click('button:has-text("Failed"), [data-filter="failed"]');
    await page.waitForTimeout(500);

    const failedJobRow = page.locator('tbody tr:has-text("failed")').first();

    if (await failedJobRow.isVisible()) {
      // Click retry button
      await failedJobRow
        .locator('button:has-text("Retry"), [data-action="retry"]')
        .click();

      // Should show success message or status change
      await expect(
        page.locator('[role="alert"], .toast, .notification')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should perform bulk retry', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Filter to show failed jobs
    await page.click('button:has-text("Failed"), [data-filter="failed"]');
    await page.waitForTimeout(500);

    const failedJobsCount = await page.locator('tbody tr').count();

    if (failedJobsCount > 0) {
      // Click bulk retry button
      const bulkRetryButton = page.locator(
        'button:has-text("Retry All"), [data-action="bulk-retry"]'
      );

      if (await bulkRetryButton.isVisible()) {
        await bulkRetryButton.click();

        // Should show confirmation or success
        await expect(
          page.locator('[role="alert"], .toast, .notification')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show job details when clicking row', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first job row
    await page.click('tbody tr:first-child');

    // Should show job details (modal or expanded row)
    await expect(
      page.locator(
        '[role="dialog"], .modal, [data-testid="job-details"]'
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display job metadata', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first job
    await page.click('tbody tr:first-child');

    // Should show job details
    await expect(
      page.locator('text=/job.*id|tenant|created|attempts/i').first()
    ).toBeVisible();
  });

  test('should show error messages for failed jobs', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Filter failed jobs
    await page.click('button:has-text("Failed"), [data-filter="failed"]');
    await page.waitForTimeout(500);

    const failedJobRow = page.locator('tbody tr:has-text("failed")').first();

    if (await failedJobRow.isVisible()) {
      // Click to view details
      await failedJobRow.click();

      // Should show error message
      await expect(page.locator('text=/error|failed/i').first()).toBeVisible();
    }
  });

  test('should refresh job queue', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Click refresh button
    const refreshButton = page.locator(
      'button:has-text("Refresh"), [data-action="refresh"]'
    );

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for refresh
      await page.waitForTimeout(1000);

      // Table should still be visible
      await expect(page.locator('table')).toBeVisible();
    }
  });
});

test.describe('Admin Tenant Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as super admin
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@audiapro.com');
    await page.fill('input[name="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    await page.goto('/admin/tenants');
  });

  test('should display tenant list', async ({ page }) => {
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Should show tenant table
    await expect(page.locator('th, [role="columnheader"]').first()).toBeVisible();
  });

  test('should navigate to create tenant page', async ({ page }) => {
    // Click create tenant button
    await page.click(
      'a[href*="/new"], button:has-text("Create"), button:has-text("Add Tenant")'
    );

    // Should navigate to create form
    await expect(page).toHaveURL(/.*\/new|create/);
  });

  test('should view tenant details', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first tenant
    await page.click('tbody tr:first-child');

    // Should show tenant details
    await expect(page).toHaveURL(/.*tenants\/[a-zA-Z0-9-]+/);
  });
});

test.describe('Admin System Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as super admin
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@audiapro.com');
    await page.fill('input[name="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
  });

  test('should display system overview', async ({ page }) => {
    await page.goto('/admin');

    // Should show system metrics
    await expect(
      page.locator('text=/total.*tenants|active.*users|system.*health/i').first()
    ).toBeVisible();
  });

  test('should show recent activity', async ({ page }) => {
    await page.goto('/admin');

    // Should display activity log or recent events
    await expect(
      page.locator('text=/recent|activity|events/i').first()
    ).toBeVisible();
  });
});
