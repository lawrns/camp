import { test, expect } from '@playwright/test';

test.describe('Inbox Bidirectional Communication', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and navigate to inbox
    await page.waitForURL('/dashboard');
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
  });

  test('should display inbox page', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify inbox page is displayed
    await expect(page.locator('h1')).toContainText('Inbox');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'inbox-page.png' });
    
    console.log('✅ Inbox page loaded successfully');
  });

  test('should show inbox interface elements', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify basic inbox elements are present
    await expect(page.locator('h1')).toContainText('Inbox');
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Inbox interface elements are present');
  });

  test('should handle inbox navigation', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate back to inbox
    await page.goto('/inbox');
    await expect(page).toHaveURL(/\/inbox/);
    await expect(page.locator('h1')).toContainText('Inbox');
    
    console.log('✅ Inbox navigation works correctly');
  });

  test('should maintain session in inbox', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify we're still logged in (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Inbox');
    
    console.log('✅ Session maintained in inbox');
  });

  test('should handle inbox page refresh', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify inbox still loads after refresh
    await expect(page.locator('h1')).toContainText('Inbox');
    await expect(page).not.toHaveURL(/\/login/);
    
    console.log('✅ Inbox page refresh works correctly');
  });
}); 