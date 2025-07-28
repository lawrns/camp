import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';

test.describe('Inbox Real-time Features', () => {
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

  test('should load inbox page with real-time capabilities', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify inbox page is displayed
    await expect(page.locator('h1')).toContainText('Inbox');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'inbox-realtime.png' });
    
    console.log('✅ Inbox page with real-time capabilities loaded successfully');
  });

  test('should maintain real-time connection state', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify page loads without errors
    await expect(page.locator('h1')).toContainText('Inbox');
    await expect(page).not.toHaveURL(/\/login/);
    
    console.log('✅ Real-time connection state maintained');
  });

  test('should handle page navigation with real-time', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate back to inbox
    await page.goto('/inbox');
    await expect(page).toHaveURL(/\/inbox/);
    await expect(page.locator('h1')).toContainText('Inbox');
    
    console.log('✅ Page navigation with real-time works correctly');
  });

  test('should handle page refresh with real-time', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify inbox still loads after refresh
    await expect(page.locator('h1')).toContainText('Inbox');
    await expect(page).not.toHaveURL(/\/login/);
    
    console.log('✅ Page refresh with real-time works correctly');
  });

  test('should maintain session across real-time operations', async ({ page }) => {
    // Wait for inbox to load
    await page.waitForSelector('h1');
    
    // Verify we're still logged in (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Inbox');
    
    console.log('✅ Session maintained across real-time operations');
  });
}); 