import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth-test');
  });

  test('should display auth test page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Campfire - Customer Support Platform/);
    await expect(page.locator('h1')).toContainText('Authentication Test');
  });

  test('should show user status when not authenticated', async ({ page }) => {
    await expect(page.locator('[data-testid="user-status"]')).toContainText('Not authenticated');
  });

  test('should handle sign in button click', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign In"):not(:has-text("Test"))');
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Should show loading state or redirect
    await expect(page).toHaveURL(/.*auth.*/);
  });

  test('should handle test sign in', async ({ page }) => {
    const testSignInButton = page.locator('button:has-text("Test Sign In")');
    await expect(testSignInButton).toBeVisible();
    await testSignInButton.click();
    
    // Should show error for invalid credentials
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should display error messages correctly', async ({ page }) => {
    // Trigger an error by clicking test sign in
    await page.click('button:has-text("Test Sign In")');
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Test login failed');
  });
});
