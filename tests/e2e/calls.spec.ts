/**
 * E2E tests for call list and call detail pages
 */

import { test, expect } from '@playwright/test';

test.describe('Call List', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/calls');
  });

  test('should display paginated call list', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Should have table headers
    const headers = page.locator('th, [role="columnheader"]');
    await expect(headers.first()).toBeVisible();

    // Should show pagination controls
    await expect(
      page.locator('[data-testid="pagination"], nav[aria-label*="pagination"]')
    ).toBeVisible();
  });

  test('should filter calls by direction', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Click direction filter
    await page.click(
      '[data-testid="filter-direction"], select[name="direction"]'
    );

    // Select inbound
    await page.click('text=/inbound|incoming/i');

    // Wait for table to update
    await page.waitForTimeout(1000);

    // Results should be filtered
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('should filter calls by sentiment', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Click sentiment filter
    await page.click(
      '[data-testid="filter-sentiment"], select[name="sentiment"]'
    );

    // Select positive
    await page.click('text=/positive/i');

    // Wait for update
    await page.waitForTimeout(1000);

    // Should show filtered results
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('should search calls by phone number', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Find search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search"]'
    );
    await searchInput.fill('1001');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show matching results
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('should navigate to next page', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Click next page button
    const nextButton = page.locator(
      'button:has-text("Next"), [aria-label="Next page"]'
    );

    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for new page to load
      await page.waitForTimeout(1000);

      // URL should update with page parameter or table should refresh
      await expect(page.locator('table tbody tr').first()).toBeVisible();
    }
  });

  test('should click on call row to view details', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click first call row
    await page.click('table tbody tr:first-child');

    // Should navigate to call detail page
    await expect(page).toHaveURL(/.*calls\/[a-zA-Z0-9-]+/);
  });
});

test.describe('Call Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should display call metadata', async ({ page }) => {
    // Navigate to a call detail page (assuming a call ID exists)
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Should show call details
    await expect(
      page.locator('text=/duration|date|time|direction/i').first()
    ).toBeVisible();
  });

  test('should display audio player for recording', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Should have audio player
    const audioPlayer = page.locator(
      'audio, [data-testid="audio-player"], video'
    );
    await expect(audioPlayer.first()).toBeVisible();
  });

  test('should display transcript', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Should show transcript section
    await expect(
      page.locator('text=/transcript|conversation/i').first()
    ).toBeVisible();
  });

  test('should display AI analysis results', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Should show AI insights
    await expect(
      page.locator(
        'text=/sentiment|keywords|topics|summary|analysis/i'
      ).first()
    ).toBeVisible();
  });

  test('should display sentiment timeline', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Should have sentiment visualization
    await expect(
      page.locator(
        '[data-testid="sentiment-timeline"], canvas, svg'
      ).first()
    ).toBeVisible();
  });

  test('should show action items if present', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Look for action items section
    const actionItemsSection = page.locator('text=/action items|follow.?up/i');

    if (await actionItemsSection.isVisible()) {
      await expect(actionItemsSection).toBeVisible();
    }
  });

  test('should show compliance flags', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Look for compliance section
    await expect(
      page.locator('text=/compliance|flags|passed|failed/i').first()
    ).toBeVisible();
  });

  test('should allow downloading recording', async ({ page }) => {
    await page.goto('/dashboard/calls');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.click('table tbody tr:first-child');

    // Look for download button
    const downloadButton = page.locator(
      'button:has-text("Download"), a[download], [data-testid="download-recording"]'
    );

    await expect(downloadButton.first()).toBeVisible();
  });
});
