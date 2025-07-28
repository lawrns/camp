import { test, expect } from '@playwright/test';

test.describe('API Authentication Debug', () => {
  test('should debug API authentication issues', async ({ page }) => {
    console.log('🔍 Starting API authentication debug...');

    // 1. First test without authentication
    console.log('\n📡 Testing APIs without authentication...');
    
    const unauthenticatedEndpoints = [
      '/api/auth/user',
      '/api/dashboard/metrics',
      '/api/conversations',
      '/api/tickets'
    ];

    for (const endpoint of unauthenticatedEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        console.log(`${endpoint}: ${response.status()} (Expected: 401)`);
        expect(response.status()).toBe(401);
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error}`);
      }
    }

    // 2. Login and test with authentication
    console.log('\n🔐 Logging in...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 15000 });
    console.log('✅ Login successful');

    // 3. Test APIs with authentication
    console.log('\n📡 Testing APIs with authentication...');
    
    for (const endpoint of unauthenticatedEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        console.log(`${endpoint}: ${response.status()} (Expected: 200)`);
        
        if (response.status() === 200) {
          console.log(`✅ ${endpoint} - SUCCESS`);
        } else if (response.status() === 401) {
          console.log(`❌ ${endpoint} - STILL UNAUTHORIZED (This is the problem!)`);
          
          // Try to get more details about the response
          const responseText = await response.text();
          console.log(`Response body: ${responseText.substring(0, 200)}...`);
        } else {
          console.log(`⚠️ ${endpoint} - ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR: ${error}`);
      }
    }

    // 4. Test session cookies
    console.log('\n🍪 Testing session cookies...');
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-')
    );
    
    console.log(`Found ${authCookies.length} auth-related cookies:`);
    authCookies.forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    // 5. Test with explicit headers
    console.log('\n📋 Testing with explicit headers...');
    
    // Get the session token
    const sessionCookie = authCookies.find(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    );

    if (sessionCookie) {
      console.log(`Using session cookie: ${sessionCookie.name}`);
      
      for (const endpoint of unauthenticatedEndpoints) {
        try {
          const response = await page.request.get(endpoint, {
            headers: {
              'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
              'Authorization': `Bearer ${sessionCookie.value}`
            }
          });
          console.log(`${endpoint} (with headers): ${response.status()}`);
        } catch (error) {
          console.log(`${endpoint} (with headers): ERROR - ${error}`);
        }
      }
    } else {
      console.log('❌ No session cookie found!');
    }

    // 6. Test the auth/user endpoint specifically
    console.log('\n👤 Testing /api/auth/user specifically...');
    
    try {
      const userResponse = await page.request.get('/api/auth/user');
      console.log(`/api/auth/user status: ${userResponse.status()}`);
      
      if (userResponse.status() === 200) {
        const userData = await userResponse.json();
        console.log('User data:', JSON.stringify(userData, null, 2));
      } else {
        const errorText = await userResponse.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.log('Error testing /api/auth/user:', error);
    }

    console.log('\n🔍 API authentication debug complete');
  });

  test('should test authentication flow step by step', async ({ page }) => {
    console.log('🔍 Testing authentication flow step by step...');

    // 1. Start at login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // 2. Fill credentials
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    console.log('✅ Credentials filled');

    // 3. Submit form and watch network
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/auth') || 
      response.url().includes('/api/auth')
    );

    await page.click('button[type="submit"]');
    console.log('✅ Form submitted');

    // 4. Wait for response
    const response = await responsePromise;
    console.log(`Auth response status: ${response.status()}`);
    console.log(`Auth response URL: ${response.url()}`);

    // 5. Wait for redirect
    await page.waitForURL('/dashboard', { timeout: 15000 });
    console.log('✅ Redirected to dashboard');

    // 6. Check cookies after login
    const cookiesAfterLogin = await page.context().cookies();
    const authCookiesAfter = cookiesAfterLogin.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-')
    );
    
    console.log(`Cookies after login: ${authCookiesAfter.length}`);
    authCookiesAfter.forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value.length} chars`);
    });

    // 7. Test API immediately after login
    console.log('\n📡 Testing API immediately after login...');
    
    try {
      const userResponse = await page.request.get('/api/auth/user');
      console.log(`Immediate /api/auth/user: ${userResponse.status()}`);
      
      if (userResponse.status() === 200) {
        console.log('✅ API working immediately after login');
      } else {
        console.log('❌ API still not working after login');
        const errorText = await userResponse.text();
        console.log('Error:', errorText);
      }
    } catch (error) {
      console.log('Error testing immediate API:', error);
    }

    console.log('✅ Authentication flow test complete');
  });
}); 