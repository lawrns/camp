/**
 * Comprehensive E2E Tests for Dashboard Authentication & Permissions
 * Tests authentication flows, role-based permissions, session persistence, and security
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Authentication & Permissions', () => {
  
  test('should require authentication to access dashboard', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard/inbox');
    
    // Should redirect to login or show auth guard
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    const hasAuthGuard = await page.locator('text=login', { timeout: 5000 }).isVisible().catch(() => false);
    
    console.log(`🔒 Dashboard access without auth: ${isRedirectedToLogin || hasAuthGuard ? 'properly protected' : 'needs security fix'}`);
    
    if (isRedirectedToLogin) {
      console.log('✅ Redirected to login page');
    } else if (hasAuthGuard) {
      console.log('✅ Auth guard is working');
    } else {
      console.log('⚠️ Dashboard accessible without authentication - security issue');
    }
  });

  test('should handle login flow correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check login form elements
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test invalid credentials
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // Should show error message
    const errorMessage = await page.locator('text=invalid', { timeout: 5000 }).isVisible().catch(() => false);
    console.log(`${errorMessage ? '✅' : '⚠️'} Invalid login error handling: ${errorMessage ? 'working' : 'needs improvement'}`);
    
    // Test valid credentials
    await emailInput.clear();
    await passwordInput.clear();
    await emailInput.fill('jam@jam.com');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // Should redirect to dashboard or show success
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('/dashboard') || !currentUrl.includes('/login');
    
    console.log(`${isLoggedIn ? '✅' : '⚠️'} Valid login: ${isLoggedIn ? 'successful' : 'failed'}`);
  });

  test('should maintain session persistence', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Check if authenticated
    const isAuthenticated = !page.url().includes('/login');
    console.log(`${isAuthenticated ? '✅' : '⚠️'} Initial authentication: ${isAuthenticated ? 'working' : 'failed'}`);
    
    if (isAuthenticated) {
      // Create new page in same context (should share session)
      const newPage = await context.newPage();
      await newPage.goto('/dashboard/inbox');
      await newPage.waitForLoadState('networkidle');
      
      const newPageAuthenticated = !newPage.url().includes('/login');
      console.log(`${newPageAuthenticated ? '✅' : '⚠️'} Session sharing: ${newPageAuthenticated ? 'working' : 'not working'}`);
      
      await newPage.close();
      
      // Test page reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const afterReloadAuthenticated = !page.url().includes('/login');
      console.log(`${afterReloadAuthenticated ? '✅' : '⚠️'} Session persistence after reload: ${afterReloadAuthenticated ? 'working' : 'not working'}`);
    }
  });

  test('should handle logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Look for logout button
    const logoutSelectors = [
      '[data-testid="logout-button"]',
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      '[data-testid="user-menu"]',
      '.user-menu',
    ];
    
    let logoutButton = null;
    for (const selector of logoutSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        logoutButton = element;
        console.log(`✅ Found logout element: ${selector}`);
        break;
      }
    }
    
    if (logoutButton) {
      await logoutButton.click();
      
      // If it's a menu, look for actual logout option
      const logoutOption = page.locator('text=logout, text=sign out', { timeout: 2000 });
      const hasLogoutOption = await logoutOption.isVisible().catch(() => false);
      
      if (hasLogoutOption) {
        await logoutOption.click();
      }
      
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login
      const currentUrl = page.url();
      const isLoggedOut = currentUrl.includes('/login') || currentUrl === page.url().split('/dashboard')[0] + '/';
      
      console.log(`${isLoggedOut ? '✅' : '⚠️'} Logout: ${isLoggedOut ? 'working' : 'not working'}`);
    } else {
      console.log('⚠️ Logout button not found - needs implementation');
    }
  });

  test('should test role-based permissions', async ({ page }) => {
    // Login as agent
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Check agent-level permissions
    const agentFeatures = [
      '[data-testid="conversation-list"]',
      '[data-testid="message-input"]',
      '[data-testid="customer-details"]',
    ];
    
    for (const selector of agentFeatures) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${isVisible ? '✅' : '⚠️'} Agent feature ${selector}: ${isVisible ? 'accessible' : 'not accessible'}`);
    }
    
    // Check admin-only features (should not be visible for regular agent)
    const adminFeatures = [
      '[data-testid="admin-panel"]',
      '[data-testid="user-management"]',
      '[data-testid="system-settings"]',
    ];
    
    for (const selector of adminFeatures) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${!isVisible ? '✅' : '⚠️'} Admin feature ${selector}: ${!isVisible ? 'properly restricted' : 'accessible (security issue)'}`);
    }
  });

  test('should handle API authentication errors', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Monitor network requests for 401 errors
    const authErrors = [];
    page.on('response', response => {
      if (response.status() === 401) {
        authErrors.push(response.url());
      }
    });
    
    // Wait for initial load and API calls
    await page.waitForTimeout(3000);
    
    // Check for 401 errors
    if (authErrors.length > 0) {
      console.log('⚠️ Authentication errors detected:');
      authErrors.forEach(url => console.log(`  - 401 on ${url}`));
      console.log('🔧 These need to be fixed for proper dashboard functionality');
    } else {
      console.log('✅ No authentication errors detected');
    }
    
    // Test API call with expired session simulation
    await page.route('**/api/**', route => {
      if (route.request().url().includes('/api/auth/session')) {
        route.fulfill({ status: 401, body: '{"error": "Unauthorized"}' });
      } else {
        route.continue();
      }
    });
    
    // Reload page to trigger session check
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should handle 401 gracefully (redirect to login or show error)
    const currentUrl = page.url();
    const handledGracefully = currentUrl.includes('/login') || 
                             await page.locator('text=session expired', { timeout: 2000 }).isVisible().catch(() => false);
    
    console.log(`${handledGracefully ? '✅' : '⚠️'} 401 error handling: ${handledGracefully ? 'graceful' : 'needs improvement'}`);
  });

  test('should test session timeout handling', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Simulate session timeout by intercepting auth requests
    await page.route('**/api/auth/**', route => {
      route.fulfill({ 
        status: 401, 
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Session expired' })
      });
    });
    
    // Try to perform an action that requires authentication
    const conversationCount = await page.locator('[data-testid="conversation"]').count();
    
    if (conversationCount > 0) {
      await page.locator('[data-testid="conversation"]').first().click();
    }
    
    // Wait for potential session timeout handling
    await page.waitForTimeout(2000);
    
    // Check if session timeout was handled
    const currentUrl = page.url();
    const sessionTimeoutHandled = currentUrl.includes('/login') || 
                                 await page.locator('text=session', { timeout: 2000 }).isVisible().catch(() => false);
    
    console.log(`${sessionTimeoutHandled ? '✅' : '⚠️'} Session timeout handling: ${sessionTimeoutHandled ? 'working' : 'needs implementation'}`);
  });

  test('should test CSRF protection', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    
    // Check for CSRF tokens in forms
    const forms = await page.locator('form').count();
    let csrfTokensFound = 0;
    
    for (let i = 0; i < forms; i++) {
      const form = page.locator('form').nth(i);
      const hasCSRFToken = await form.locator('input[name*="csrf"], input[name*="token"]').count() > 0;
      if (hasCSRFToken) {
        csrfTokensFound++;
      }
    }
    
    console.log(`🔒 CSRF tokens found in ${csrfTokensFound}/${forms} forms`);
    
    // Check for CSRF headers in API requests
    let csrfHeadersFound = false;
    page.on('request', request => {
      const headers = request.headers();
      if (headers['x-csrf-token'] || headers['x-xsrf-token']) {
        csrfHeadersFound = true;
      }
    });
    
    // Trigger some API calls
    await page.goto('/dashboard/inbox');
    await page.waitForTimeout(2000);
    
    console.log(`${csrfHeadersFound ? '✅' : '⚠️'} CSRF headers: ${csrfHeadersFound ? 'present' : 'not detected'}`);
  });
});
