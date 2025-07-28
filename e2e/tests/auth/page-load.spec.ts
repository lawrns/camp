import { test, expect } from '@playwright/test';

test.describe('Page Load Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page has content
    await expect(page.locator('body')).toBeVisible();
    
    // Check if login form exists
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-page.png' });
    
    console.log('✅ Login page loaded successfully');
  });

  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page has content
    await expect(page.locator('body')).toBeVisible();
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'homepage.png' });
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should load dashboard after login', async ({ page }) => {
    // Login first - use correct auth URL
    await page.goto('/app/auth/login');
    await page.waitForLoadState('networkidle');

    // Fill login form with correct selectors
    await page.fill('input[type="email"]', 'jam@jam.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });

    // Check if dashboard loaded
    await expect(page.locator('body')).toBeVisible();

    // Take screenshot for debugging
    await page.screenshot({ path: 'dashboard.png' });

    console.log('✅ Dashboard loaded successfully after login');
  });
}); 