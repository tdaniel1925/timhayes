/**
 * E2E tests for dashboard and analytics
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display dashboard overview with stats', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show key metrics
    await expect(
      page.locator('text=/total calls|calls today|average duration/i')
    ).toBeVisible();

    // Should show charts or data visualizations
    await expect(
      page.locator('[data-testid="call-volume-chart"], canvas, svg')
    ).toBeVisible();
  });

  test('should show recent calls list', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for calls to load
    await page.waitForSelector(
      '[data-testid="recent-calls"], table, [role="table"]',
      { timeout: 10000 }
    );

    // Should have table headers
    await expect(page.locator('th, [role="columnheader"]').first()).toBeVisible();
  });

  test('should navigate to calls page', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on calls navigation link
    await page.click('a[href*="/calls"], [data-testid="nav-calls"]');

    // Should navigate to calls page
    await expect(page).toHaveURL(/.*calls/);
  });

  test('should show sentiment overview', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for sentiment indicators
    await expect(
      page.locator(
        'text=/positive|negative|neutral|sentiment/i'
      ).first()
    ).toBeVisible();
  });

  test('should display date range picker', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for date range selector
    const dateRangePicker = page.locator(
      '[data-testid="date-range-picker"], input[type="date"], button:has-text("Last 7 days")'
    );

    await expect(dateRangePicker.first()).toBeVisible();
  });
});

test.describe('Dashboard Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard');
  });

  test('should filter by date range', async ({ page }) => {
    // Click date range picker
    await page.click(
      '[data-testid="date-range-picker"], button:has-text("Last")'
    );

    // Select a predefined range
    await page.click('text=/last 30 days|this month/i');

    // Wait for data to reload
    await page.waitForTimeout(1000);

    // Dashboard should update (check for loading state or new data)
    await expect(page.locator('[data-testid="call-volume-chart"]')).toBeVisible();
  });
});
