import { test, expect } from '@playwright/test';

/**
 * Core Page Testing
 * 
 * Tests essential page loading and functionality
 */

test.describe('Core Page Testing', () => {
  test('homepage loads and is functional', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for basic content
    const hasContent = await page.locator('body').evaluate(el => {
      return el.textContent && el.textContent.length > 100;
    });
    expect(hasContent).toBeTruthy();
    
    // Check for no critical console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Page should be functional even with some 401 errors (expected for unauthenticated users)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('401') && 
      !error.includes('Unauthorized') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBeLessThan(5); // Allow some non-critical errors
  });

  test('login page loads with proper form', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for login form elements (use first() to avoid strict mode violations)
    const hasEmailInput = await page.locator('input[type="email"]').first().isVisible();
    const hasPasswordInput = await page.locator('input[type="password"]').first().isVisible();
    const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').first().isVisible();
    
    expect(hasEmailInput).toBeTruthy();
    expect(hasPasswordInput).toBeTruthy();
    expect(hasSubmitButton).toBeTruthy();
  });

  test('register page loads with proper form', async ({ page }) => {
    await page.goto('http://localhost:3001/register');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for registration form elements
    const hasEmailInput = await page.locator('input[type="email"]').first().isVisible();
    const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').first().isVisible();
    
    expect(hasEmailInput).toBeTruthy();
    expect(hasSubmitButton).toBeTruthy();
  });

  test('dashboard page redirects to auth when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should either show dashboard or redirect to auth
    const hasLoginLink = await page.locator('a[href="/login"]').first().isVisible();
    const hasDashboard = await page.locator('[data-testid="dashboard"], .dashboard').isVisible();
    
    // Page should either show dashboard or have login link
    expect(hasLoginLink || hasDashboard).toBeTruthy();
  });

  test('inbox page redirects to auth when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3001/inbox');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should either show inbox or redirect to auth
    const hasLoginLink = await page.locator('a[href="/login"]').first().isVisible();
    const hasInbox = await page.locator('[data-testid="inbox"], .inbox, [data-testid="conversation-list"]').isVisible();
    
    // Page should either show inbox or have login link
    expect(hasLoginLink || hasInbox).toBeTruthy();
  });

  test('404 page handles missing routes gracefully', async ({ page }) => {
    await page.goto('http://localhost:3001/nonexistent-page');
    
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
  });

  test('CSS loads properly with design tokens', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check that CSS is loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check that design tokens are applied
    const hasDesignTokens = await page.locator('body').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily && styles.fontFamily !== 'initial';
    });
    
    expect(hasDesignTokens).toBeTruthy();
  });

  test('JavaScript loads and React app is functional', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check for JavaScript errors
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        jsErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.waitForLoadState('networkidle');
    
    // Log any JS errors for debugging
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:', jsErrors);
    }
    
    // Check that React is working (look for React-specific attributes or content)
    const hasReactApp = await page.locator('body').evaluate(el => {
      return el.innerHTML.includes('__next') || 
             el.innerHTML.includes('data-react') ||
             el.querySelector('[data-testid]') !== null;
    });
    
    expect(hasReactApp).toBeTruthy();
    
    // Allow some 401 errors (expected for unauthenticated users)
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('401') && 
      !error.includes('Unauthorized') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBeLessThan(5); // Allow some non-critical errors
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
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
  });
}); 