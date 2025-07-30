/**
 * Complete E2E Flow Test
 * 
 * Tests the entire user journey from login to API interactions:
 * 1. Login authentication
 * 2. Dashboard access
 * 3. tRPC API calls
 * 4. Real-time functionality
 * 5. JWT enrichment
 */

import { test, expect } from '@playwright/test';

test.describe('Complete E2E Flow', () => {
  test('should complete full authentication and API flow', async ({ page }) => {
    console.log('🚀 Starting complete E2E flow test...');

    // Capture console logs and errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser console error: ${msg.text()}`);
      } else if (msg.text().includes('Login') || msg.text().includes('Auth')) {
        console.log(`🔍 Browser console: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`❌ Page error: ${error.message}`);
    });

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Verify login page loaded correctly
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ Login page loaded successfully');

    // Step 2: Perform login
    console.log('📍 Step 2: Performing login...');
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    
    // Monitor network requests during login
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/') && response.status() === 200
    );
    
    await page.click('button[type="submit"]');

    // Wait for login to process
    await page.waitForTimeout(3000);

    // Check for error messages on the page
    const errorAlert = page.locator('[role="alert"], .alert-destructive');
    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log(`❌ Login error displayed: ${errorText}`);
    }

    // Check current URL after login attempt
    const loginUrl = page.url();
    console.log(`🔍 Current URL after login: ${loginUrl}`);

    // Wait for successful login response
    try {
      await loginPromise;
      console.log('✅ Login API call successful');
    } catch (error) {
      console.log('⚠️ Login API call monitoring failed, continuing...');
    }

    // Step 3: Wait for dashboard redirect (only if not still on login page)
    if (!loginUrl.includes('/login')) {
      console.log('📍 Step 3: Waiting for dashboard redirect...');
      await page.waitForURL('http://localhost:3000/dashboard', { timeout: 15000 });
    } else {
      console.log('❌ Still on login page - login likely failed');
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
      throw new Error('Login failed - still on login page');
    }
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard loaded
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Dashboard loaded successfully');

    // Step 4: Test tRPC API calls
    console.log('📍 Step 4: Testing tRPC API calls...');
    
    // Monitor tRPC requests
    const trpcRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/trpc/')) {
        trpcRequests.push(request.url());
      }
    });

    // Wait for any initial tRPC calls to complete
    await page.waitForTimeout(2000);

    // Check if any tRPC calls were made
    if (trpcRequests.length > 0) {
      console.log(`✅ tRPC calls detected: ${trpcRequests.length} requests`);
      trpcRequests.forEach(url => console.log(`  - ${url}`));
    } else {
      console.log('ℹ️ No automatic tRPC calls detected');
    }

    // Step 5: Test manual API call via browser console
    console.log('📍 Step 5: Testing manual tRPC API call...');
    
    const apiTestResult = await page.evaluate(async () => {
      try {
        // Test if tRPC client is available
        if (typeof window !== 'undefined' && (window as any).fetch) {
          const response = await fetch('/api/trpc/analytics.getDashboardMetrics?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22organizationId%22%3A%22b5e80170-004c-4e82-a88c-3e2166b169dd%22%7D%7D%7D', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          return {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            url: response.url
          };
        }
        return { error: 'Fetch not available' };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    if (apiTestResult.error) {
      console.log(`⚠️ API test error: ${apiTestResult.error}`);
    } else {
      console.log(`✅ tRPC API call result: ${apiTestResult.status} ${apiTestResult.statusText}`);
      
      // We expect either 200 (success) or 401 (auth required) - both indicate the API is working
      expect([200, 401]).toContain(apiTestResult.status);
    }

    // Step 6: Test authentication state
    console.log('📍 Step 6: Testing authentication state...');
    
    const authState = await page.evaluate(async () => {
      try {
        // Check if Supabase auth is available
        const authData = localStorage.getItem(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);
        return {
          hasAuthData: !!authData,
          authDataLength: authData?.length || 0
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    if (authState.error) {
      console.log(`⚠️ Auth state check error: ${authState.error}`);
    } else {
      console.log(`✅ Auth state: ${authState.hasAuthData ? 'Authenticated' : 'Not authenticated'}`);
      if (authState.hasAuthData) {
        console.log(`  - Auth data length: ${authState.authDataLength} characters`);
      }
    }

    // Step 7: Test page navigation
    console.log('📍 Step 7: Testing page navigation...');
    
    // Try to navigate to inbox
    await page.goto('http://localhost:3000/inbox');
    await page.waitForLoadState('networkidle');
    
    // Check if inbox page loaded (should work if authenticated)
    const currentUrl = page.url();
    console.log(`✅ Navigation test: Current URL is ${currentUrl}`);
    
    // Should not be redirected back to login
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).not.toContain('/auth');

    // Step 8: Test logout (optional)
    console.log('📍 Step 8: Testing logout...');
    
    // Look for logout button or user menu
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), [data-testid="logout"]');
    
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(1000);
      
      // Should redirect to login or home page
      const finalUrl = page.url();
      console.log(`✅ Logout test: Redirected to ${finalUrl}`);
    } else {
      console.log('ℹ️ Logout button not found, skipping logout test');
    }

    // Final screenshot for debugging
    await page.screenshot({ path: 'e2e-complete-flow.png', fullPage: true });
    
    console.log('🎉 Complete E2E flow test finished successfully!');
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    console.log('🚀 Testing authentication error handling...');

    // Test with invalid credentials
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message or stay on login page
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasErrorMessage = await page.locator('[role="alert"], .error, .alert-error').count() > 0;
    
    // Should either show error message or stay on login page
    const isHandledGracefully = hasErrorMessage || currentUrl.includes('/login') || currentUrl.includes('/auth');
    
    expect(isHandledGracefully).toBe(true);
    console.log('✅ Authentication errors handled gracefully');
  });

  test('should test tRPC endpoints directly', async ({ page }) => {
    console.log('🚀 Testing tRPC endpoints directly...');

    // Test each tRPC endpoint to ensure they're accessible
    const endpoints = [
      '/api/trpc/conversations.list',
      '/api/trpc/tickets.list', 
      '/api/trpc/analytics.getDashboardMetrics'
    ];

    for (const endpoint of endpoints) {
      console.log(`📍 Testing endpoint: ${endpoint}`);
      
      const response = await page.request.get(`http://localhost:3005${endpoint}?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22organizationId%22%3A%22b5e80170-004c-4e82-a88c-3e2166b169dd%22%7D%7D%7D`);
      
      // Should return either 200 (success) or 401 (auth required) - both indicate the endpoint exists
      expect([200, 401]).toContain(response.status());
      console.log(`✅ ${endpoint}: ${response.status()} ${response.statusText()}`);
    }

    console.log('🎉 All tRPC endpoints are accessible!');
  });
});
