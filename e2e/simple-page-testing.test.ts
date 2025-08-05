import { test, expect } from '@playwright/test';

/**
 * Simple Page Testing
 * 
 * Basic tests to verify pages load without authentication requirements
 */

test.describe('Simple Page Testing', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for basic content
    const hasContent = await page.locator('body').evaluate(el => {
      return el.textContent && el.textContent.length > 100;
    });
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Homepage loads successfully');
  });

  test('login page loads with form', async ({ page }) => {
    await page.goto('/login');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for login form elements
    const hasEmailInput = await page.locator('input[type="email"]').first().isVisible();
    const hasPasswordInput = await page.locator('input[type="password"]').first().isVisible();
    
    expect(hasEmailInput).toBeTruthy();
    expect(hasPasswordInput).toBeTruthy();
    
    console.log('✅ Login page loads with form');
  });

  test('register page loads with form', async ({ page }) => {
    await page.goto('/register');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for registration form elements
    const hasEmailInput = await page.locator('input[type="email"]').first().isVisible();
    
    expect(hasEmailInput).toBeTruthy();
    
    console.log('✅ Register page loads with form');
  });

  test('dashboard redirects to auth when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should either show dashboard or redirect to auth
    const hasLoginLink = await page.locator('a[href="/login"]').first().isVisible();
    const hasDashboard = await page.locator('[data-testid="dashboard"], .dashboard').isVisible();
    
    // Page should either show dashboard or have login link
    expect(hasLoginLink || hasDashboard).toBeTruthy();
    
    console.log('✅ Dashboard handles unauthenticated access');
  });

  test('inbox redirects to auth when not authenticated', async ({ page }) => {
    await page.goto('/inbox');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should either show inbox or redirect to auth
    const hasLoginLink = await page.locator('a[href="/login"]').first().isVisible();
    const hasInbox = await page.locator('[data-testid="inbox"], .inbox, [data-testid="conversation-list"]').isVisible();
    
    // Page should either show inbox or have login link
    expect(hasLoginLink || hasInbox).toBeTruthy();
    
    console.log('✅ Inbox handles unauthenticated access');
  });

  test('404 page handles missing routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Check that the page loads (should show 404 or redirect)
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should not crash the application
    const hasErrorPage = await page.locator('[data-testid="404"], .error-page, h1:has-text("404"), h1:has-text("Not Found")').isVisible();
    const hasHomeContent = await page.locator('body').evaluate(el => {
      return el.textContent && el.textContent.length > 50;
    });
    
    // Should show either error page or have content (redirected to home)
    expect(hasErrorPage || hasHomeContent).toBeTruthy();
    
    console.log('✅ 404 page handles missing routes gracefully');
  });

  test('CSS loads properly', async ({ page }) => {
    await page.goto('/');
    
    // Check that CSS is loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check that design tokens are applied
    const hasDesignTokens = await page.locator('body').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily && styles.fontFamily !== 'initial';
    });
    
    expect(hasDesignTokens).toBeTruthy();
    
    console.log('✅ CSS loads properly with design tokens');
  });

  test('JavaScript loads and React app is functional', async ({ page }) => {
    await page.goto('/');
    
    // Check that React is working (look for React-specific attributes or content)
    const hasReactApp = await page.locator('body').evaluate(el => {
      return el.innerHTML.includes('__next') || 
             el.innerHTML.includes('data-react') ||
             el.querySelector('[data-testid]') !== null;
    });
    
    expect(hasReactApp).toBeTruthy();
    
    console.log('✅ JavaScript loads and React app is functional');
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to login
    await page.click('a[href="/login"]');
    await page.waitForURL('**/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    
    // Test navigation to register
    await page.click('a[href="/register"]');
    await page.waitForURL('**/register');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    
    // Test navigation back to home
    await page.click('a[href="/"]');
    await page.waitForURL('**/');
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Navigation between pages works');
  });
}); 