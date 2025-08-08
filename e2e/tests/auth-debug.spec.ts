import { test, expect } from '@playwright/test';

/**
 * Authentication Debug Test
 * Tests the authentication flow and identifies 401 errors
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  BASE_URL: 'http://localhost:3001'
};

test.describe('Authentication Debug', () => {
  test('should debug authentication flow and identify 401 errors', async ({ page, context }) => {
    console.log('🔍 Starting authentication debug...');
    
    // Listen for all network requests to catch 401 errors
    const networkRequests: Array<{ url: string; status: number; method: string }> = [];
    const authErrors: Array<{ url: string; status: number; response?: unknown }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();
      
      networkRequests.push({ url, status, method });
      
      // Track auth-related requests
      if (url.includes('/api/auth/')) {
        console.log(`📡 Auth API: ${method} ${url} - ${status}`);
        
        if (status === 401) {
          try {
            const responseBody = await response.json();
            authErrors.push({ url, status, response: responseBody });
            console.log(`❌ 401 Error: ${url}`, responseBody);
          } catch {
            authErrors.push({ url, status });
            console.log(`❌ 401 Error: ${url} (no response body)`);
          }
        }
      }
    });
    
    // Step 1: Ensure authenticated session (prefer API login to avoid overlay)
    console.log('🔐 Ensuring authenticated session...');
    const preSession = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/auth/session`);
    let authenticated = false;
    if (preSession.ok()) {
      try {
        const body = await preSession.json();
        authenticated = !!body?.authenticated;
      } catch {}
    }

    if (!authenticated) {
      // Try API-based login first to set cookies in this browser context
      const apiLogin = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/login`, {
        data: { email: TEST_CONFIG.AGENT_EMAIL, password: TEST_CONFIG.AGENT_PASSWORD },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!apiLogin.ok()) {
        // Fallback to UI login with overlay suppression
        await page.goto(`${TEST_CONFIG.BASE_URL}/login`, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: 'nextjs-portal,[data-nextjs-portal],#nextjs__container,[data-nextjs-error-overlay]{display:none!important;pointer-events:none!important;}' });
        await page.fill('#email', TEST_CONFIG.AGENT_EMAIL);
        await page.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
        await page.click('button[type="submit"]', { force: true });
        try {
          await page.waitForURL('**/dashboard', { timeout: 20000 });
          authenticated = true;
        } catch {}
      } else {
        // Navigate to dashboard to materialize session in page
        await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`, { waitUntil: 'load' });
        authenticated = true;
      }
    }

    if (!authenticated) {
      console.log('❌ Unable to authenticate via API or UI');
    } else {
      console.log('✅ Authenticated; proceeding to dashboard checks');
    }

    // Step 2: Test dashboard authentication
    console.log('📊 Testing dashboard authentication...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    // Wait for auth requests to complete
    await page.waitForTimeout(3000);

    // Step 3: Test auth API endpoints directly
    console.log('🧪 Testing auth API endpoints...');
    
    // Test session endpoint
    const sessionResponse = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/auth/session`);
    console.log(`Session API: ${sessionResponse.status()}`);
    
    if (sessionResponse.ok()) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session API working:', {
        authenticated: sessionData.authenticated,
        userId: sessionData.user?.id,
        organizationId: sessionData.user?.organizationId
      });
    } else {
      console.log('❌ Session API failed');
      try {
        const errorData = await sessionResponse.json();
        console.log('Session error:', errorData);
      } catch {
        console.log('Session error: No response body');
      }
    }
    
    // Test user endpoint
    const userResponse = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/auth/user`);
    console.log(`User API: ${userResponse.status()}`);
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('✅ User API working:', {
        userId: userData.user?.id,
        email: userData.user?.email,
        organizationId: userData.user?.organizationId
      });
    } else {
      console.log('❌ User API failed');
      try {
        const errorData = await userResponse.json();
        console.log('User error:', errorData);
      } catch {
        console.log('User error: No response body');
      }
    }
    
    // Test set-organization endpoint
    const setOrgResponse = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/set-organization`, {
      data: { organizationId: TEST_CONFIG.TEST_ORG_ID }
    });
    console.log(`Set Organization API: ${setOrgResponse.status()}`);
    
    if (setOrgResponse.ok()) {
      const setOrgData = await setOrgResponse.json();
      console.log('✅ Set Organization API working:', setOrgData);
    } else {
      console.log('❌ Set Organization API failed');
      try {
        const errorData = await setOrgResponse.json();
        console.log('Set Organization error:', errorData);
      } catch {
        console.log('Set Organization error: No response body');
      }
    }
    
    // Step 4: Check browser storage
    console.log('💾 Checking browser storage...');
    
    const localStorage = await page.evaluate(() => {
      const storage: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          try {
            const value = window.localStorage.getItem(key);
            storage[key] = value ? JSON.parse(value) : value;
          } catch {
            storage[key] = window.localStorage.getItem(key);
          }
        }
      }
      return storage;
    });
    
    console.log('LocalStorage keys:', Object.keys(localStorage));
    
    // Look for auth-related storage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('supabase') || key.includes('session')
    );
    
    if (authKeys.length > 0) {
      console.log('Auth-related storage:', authKeys);
      authKeys.forEach(key => {
        console.log(`  ${key}:`, typeof localStorage[key] === 'string' ? 
          localStorage[key].substring(0, 100) + '...' : localStorage[key]);
      });
    } else {
      console.log('⚠️  No auth-related storage found');
    }
    
    // Step 5: Check cookies
    console.log('🍪 Checking cookies...');
    
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') || 
      cookie.name.includes('session')
    );
    
    if (authCookies.length > 0) {
      console.log('Auth-related cookies:', authCookies.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite
      })));
    } else {
      console.log('⚠️  No auth-related cookies found');
    }
    
    // Step 6: Summary
    console.log('📋 Authentication Debug Summary:');
    console.log(`Total network requests: ${networkRequests.length}`);
    console.log(`Auth API requests: ${networkRequests.filter(r => r.url.includes('/api/auth/')).length}`);
    console.log(`401 errors: ${authErrors.length}`);
    
    if (authErrors.length > 0) {
      console.log('❌ Authentication errors found:');
      authErrors.forEach(error => {
        console.log(`  - ${error.url}: ${error.status}`);
      });
    } else {
      console.log('✅ No authentication errors found');
    }
    
    // The test should pass even if there are auth errors, so we can see the debug output
    expect(networkRequests.length).toBeGreaterThan(0);
  });
});
