import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('should login with jam@jam.com', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Verify we're on login page
    await expect(page).toHaveTitle(/Campfire/i);
    
    // Fill in credentials
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-success.png' });
    
    console.log('✅ Login successful!');
  });

  test('should access inbox after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to inbox
    await page.goto('/inbox');
    
    // Verify we can access inbox
    await expect(page).toHaveURL(/\/inbox/);
    await expect(page.locator('h1:has-text("Good")')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'inbox-access.png' });
    
    console.log('✅ Inbox access successful!');
  });

  test('should access widget after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to widget
    await page.goto('/widget');
    
    // Verify we can access widget
    await expect(page).toHaveURL(/\/widget/);
    await expect(page.locator('h1')).toContainText('Widget');
    
    // Take a screenshot
    await page.screenshot({ path: 'widget-access.png' });
    
    console.log('✅ Widget access successful!');
  });
}); 