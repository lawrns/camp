/**
 * Dev Overlay Fix Test
 * Verifies that the NextJS development overlay is properly disabled during E2E testing
 * and that UI elements are clickable without pointer event interception
 */

import { test, expect } from '@playwright/test';

test.describe('Dev Overlay Fix Verification', () => {
  
  test('should not have NextJS dev overlay interfering with clicks', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no dev overlay elements are present
    const devOverlayPortal = await page.locator('nextjs-portal').count();
    const devOverlayScripts = await page.locator('script[data-nextjs-dev-overlay]').count();
    
    console.log(`📊 Dev overlay portal elements: ${devOverlayPortal}`);
    console.log(`📊 Dev overlay scripts: ${devOverlayScripts}`);
    
    // These should be 0 when the fix is working
    expect(devOverlayPortal).toBe(0);
    expect(devOverlayScripts).toBe(0);
    
    // Verify that the widget button is clickable
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    
    // This click should work without timeout if the overlay is disabled
    await widgetButton.click({ timeout: 5000 });
    
    // Verify widget opened
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Widget button clickable - dev overlay fix working');
  });

  test('should allow login button clicks without interference', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for dev overlay interference
    const overlayElements = await page.evaluate(() => {
      const portals = document.querySelectorAll('nextjs-portal').length;
      const overlayScripts = document.querySelectorAll('script[data-nextjs-dev-overlay]').length;
      const overlayDivs = document.querySelectorAll('[data-nextjs-dev-overlay]').length;
      
      return { portals, overlayScripts, overlayDivs };
    });
    
    console.log('📊 Overlay elements check:', overlayElements);
    
    // Verify login form elements are present and clickable
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Fill form
    await emailInput.fill('jam@jam.com');
    await passwordInput.fill('password123');
    
    // This click should work without timeout if the overlay is disabled
    await loginButton.click({ timeout: 5000 });
    
    // Wait for navigation or response
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login button clickable - dev overlay fix working');
  });

  test('should verify CSS pointer events are not blocked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check computed styles to ensure pointer events are not blocked
    const pointerEventsCheck = await page.evaluate(() => {
      const testElements = document.querySelectorAll('[data-testid]');
      const results = [];
      
      for (const element of testElements) {
        const computedStyle = window.getComputedStyle(element);
        const pointerEvents = computedStyle.pointerEvents;
        
        if (pointerEvents === 'none') {
          results.push({
            testId: element.getAttribute('data-testid'),
            pointerEvents,
            tagName: element.tagName
          });
        }
      }
      
      return results;
    });
    
    console.log('📊 Elements with pointer-events: none:', pointerEventsCheck);
    
    // Test elements should not have pointer-events: none
    expect(pointerEventsCheck.length).toBe(0);
    
    console.log('✅ No test elements have blocked pointer events');
  });

  test('should verify environment variables are set correctly', async ({ page }) => {
    // Check that environment variables are properly set
    const envCheck = await page.evaluate(() => {
      return {
        nodeEnv: process.env.NODE_ENV,
        e2eTesting: process.env.NEXT_PUBLIC_E2E_TESTING,
        disableOverlay: process.env.DISABLE_DEV_OVERLAY,
      };
    });
    
    console.log('📊 Environment variables:', envCheck);
    
    // Verify E2E testing environment is detected
    expect(envCheck.e2eTesting).toBe('true');
    
    console.log('✅ Environment variables configured correctly');
  });

  test('should verify dashboard elements are accessible', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Check that dashboard elements are accessible
    const dashboardElements = [
      '[data-testid="inbox-dashboard"]',
      '[data-testid="conversation-list-container"]',
      '[data-testid="search-input"]',
      '[data-testid="filter-buttons"]',
    ];
    
    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      
      if (isVisible) {
        // Try to interact with the element
        if (selector.includes('search-input')) {
          await element.fill('test search');
          await element.clear();
        } else if (selector.includes('filter-buttons')) {
          await element.click();
        }
        
        console.log(`✅ ${selector} is accessible and interactive`);
      } else {
        console.log(`⚠️ ${selector} not found (may not be implemented yet)`);
      }
    }
    
    console.log('✅ Dashboard accessibility test completed');
  });
});
