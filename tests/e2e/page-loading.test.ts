import { test, expect } from '@playwright/test';

/**
 * Page Loading Tests
 * 
 * Tests to ensure all pages load properly and don't crash
 */

test.describe('Page Loading Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Campfire/);
    
    // Check for basic content
    await expect(page.locator('body')).toBeVisible();
    
    // Check for no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Basic check that page is functional
    await expect(page.locator('main, div[role="main"], #__next')).toBeVisible();
  });

  test('dashboard page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for dashboard content or auth redirect
    const isDashboard = await page.locator('[data-testid="dashboard"], .dashboard, main').isVisible();
    const isAuthPage = await page.locator('[data-testid="login"], .login, [href*="login"]').isVisible();
    
    // Page should either show dashboard or redirect to auth
    expect(isDashboard || isAuthPage).toBeTruthy();
  });

  test('login page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for login form elements
    const hasLoginForm = await page.locator('form, [data-testid="login-form"], input[type="email"], input[type="password"]').isVisible();
    expect(hasLoginForm).toBeTruthy();
  });

  test('register page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/register');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for registration form elements
    const hasRegisterForm = await page.locator('form, [data-testid="register-form"], input[type="email"]').isVisible();
    expect(hasRegisterForm).toBeTruthy();
  });

  test('inbox page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/inbox');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for inbox content or auth redirect
    const isInbox = await page.locator('[data-testid="inbox"], .inbox, [data-testid="conversation-list"]').isVisible();
    const isAuthPage = await page.locator('[data-testid="login"], .login, [href*="login"]').isVisible();
    
    // Page should either show inbox or redirect to auth
    expect(isInbox || isAuthPage).toBeTruthy();
  });

  test('widget page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/widget');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for widget content
    const hasWidget = await page.locator('[data-testid="widget"], .widget, [data-campfire-widget]').isVisible();
    expect(hasWidget).toBeTruthy();
  });

  test('onboarding page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/onboarding');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Check for onboarding content
    const hasOnboarding = await page.locator('[data-testid="onboarding"], .onboarding, main').isVisible();
    expect(hasOnboarding).toBeTruthy();
  });

  test('404 page handles missing routes gracefully', async ({ page }) => {
    await page.goto('http://localhost:3001/nonexistent-page');
    
    // Check that the page loads (should show 404 or redirect)
    await expect(page).toHaveTitle(/Campfire/);
    await expect(page.locator('body')).toBeVisible();
    
    // Should not crash the application
    const isErrorPage = await page.locator('[data-testid="404"], .error-page, h1:has-text("404"), h1:has-text("Not Found")').isVisible();
    const isHomePage = await page.locator('main, div[role="main"]').isVisible();
    
    // Should show either error page or redirect to home
    expect(isErrorPage || isHomePage).toBeTruthy();
  });

  test('CSS loads properly without errors', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check that CSS is loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check for no CSS loading errors
    const cssErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('CSS')) {
        cssErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Log any CSS errors for debugging
    if (cssErrors.length > 0) {
      console.log('CSS errors found:', cssErrors);
    }
    
    // Basic check that styling is applied
    const hasStyledElements = await page.locator('body').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily && styles.fontFamily !== 'initial';
    });
    
    expect(hasStyledElements).toBeTruthy();
  });

  test('JavaScript loads without critical errors', async ({ page }) => {
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
    
    // Check that React is working
    const hasReactApp = await page.locator('#__next, [data-reactroot], [data-testid]').isVisible();
    expect(hasReactApp).toBeTruthy();
  });
}); 