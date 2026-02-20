/**
 * E2E tests for authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText(/sign in|login/i);
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/dashboard|overview/i);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('[role="alert"], .error, .alert-error')
    ).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid email
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'password123');

    // Try to submit
    await page.click('button[type="submit"]');

    // HTML5 validation or custom error should appear
    const emailInput = page.locator('input[name="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    expect(validationMessage).toBeTruthy();
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/login');

    // Fill in only email
    await page.fill('input[name="email"]', 'test@example.com');

    // Try to submit without password
    await page.click('button[type="submit"]');

    // Password field should be required
    const passwordInput = page.locator('input[name="password"]');
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    expect(validationMessage).toBeTruthy();
  });

  test('should log out successfully', async ({ page, context }) => {
    // First, log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Find and click logout button
    await page.click('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")');

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login)?$/);

    // Try to access dashboard again
    await page.goto('/dashboard');

    // Should redirect back to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Super Admin Authentication', () => {
  test('should access super admin dashboard with admin credentials', async ({
    page,
  }) => {
    await page.goto('/admin/login');

    // Fill in super admin credentials
    await page.fill('input[name="email"]', 'admin@audiapro.com');
    await page.fill('input[name="password"]', 'adminpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*admin/);
    await expect(
      page.locator('h1, h2')
    ).toContainText(/admin|system overview/i);
  });

  test('should not allow regular users to access admin area', async ({
    page,
  }) => {
    // Log in as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Try to access admin area
    await page.goto('/admin');

    // Should be redirected to unauthorized page or back to dashboard
    await expect(page).toHaveURL(/\/(unauthorized|dashboard)/);
  });
});
