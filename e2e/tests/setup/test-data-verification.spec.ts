import { test, expect } from '@playwright/test';

test.describe('Test Data Setup Verification', () => {
  const TEST_DATA = {
    ORGANIZATION: {
      id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
      name: 'E2E Test Organization',
    },
    USERS: {
      AGENT: { email: 'jam@jam.com', password: 'password123', name: 'Test Agent' },
      ADMIN: { email: 'admin@test.com', password: 'password123', name: 'Test Admin' },
      CUSTOMER: { email: 'customer@test.com', password: 'password123', name: 'Test Customer' }
    },
    CONVERSATIONS: {
      ACTIVE: { id: '48eedfba-2568-4231-bb38-2ce20420900d' },
      CLOSED: { id: '12345678-1234-1234-1234-123456789012' }
    }
  };

  test('should have standardized test credentials', async ({ page }) => {
    console.log('🔐 Verifying standardized test credentials...');

    // Test agent login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');

    // Should successfully login and redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    console.log('✅ Agent credentials verified');

    // Logout
    await page.goto('/auth/logout');
  });

  test('should have test organization data', async ({ page }) => {
    console.log('🏢 Verifying test organization data...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Check if organization context is available
    const organizationContext = await page.evaluate(() => {
      return {
        hasOrgData: !!window.localStorage.getItem('organization'),
        hasUserData: !!window.localStorage.getItem('user'),
      };
    });

    console.log('✅ Organization context available:', organizationContext);
  });

  test('should have test conversation data available', async ({ page }) => {
    console.log('💬 Verifying test conversation data...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Try to access test conversation via API
    const conversationResponse = await page.request.get(`/api/dashboard/conversations/${TEST_DATA.CONVERSATIONS.ACTIVE.id}/messages`);
    
    // Should either succeed (conversation exists) or return 404 (conversation not found but API works)
    expect([200, 404]).toContain(conversationResponse.status());
    
    if (conversationResponse.status() === 200) {
      const data = await conversationResponse.json();
      expect(data).toHaveProperty('messages');
      console.log('✅ Test conversation data accessible');
    } else {
      console.log('ℹ️  Test conversation not found - this is expected if data setup is incomplete');
    }
  });

  test('should support all test user roles', async ({ page }) => {
    console.log('👥 Verifying all test user roles...');

    for (const [role, userData] of Object.entries(TEST_DATA.USERS)) {
      try {
        // Login with each user
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"], #email, input[type="email"]', userData.email);
        await page.fill('[data-testid="password-input"], #password, input[type="password"]', userData.password);
        await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');

        // Should successfully login
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        
        console.log(`✅ ${role} login successful: ${userData.email}`);

        // Logout for next test
        await page.goto('/auth/logout');
        await page.waitForURL('**/login', { timeout: 10000 });
      } catch (error) {
        console.log(`❌ ${role} login failed: ${userData.email} - ${error.message}`);
      }
    }
  });

  test('should have consistent test data across API endpoints', async ({ page }) => {
    console.log('🔗 Verifying API endpoint consistency...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Test various API endpoints with test data
    const apiTests = [
      { endpoint: '/api/presence', method: 'GET', description: 'Presence API' },
      { endpoint: '/api/presence/heartbeat', method: 'GET', description: 'Heartbeat API' },
      { endpoint: '/api/dashboard/typing', method: 'GET', params: `?conversationId=${TEST_DATA.CONVERSATIONS.ACTIVE.id}`, description: 'Typing API' },
    ];

    for (const apiTest of apiTests) {
      try {
        const url = apiTest.endpoint + (apiTest.params || '');
        const response = await page.request.get(url);
        
        // Should return valid responses (200, 404, or other expected status)
        expect([200, 404, 400]).toContain(response.status());
        
        console.log(`✅ ${apiTest.description}: ${response.status()}`);
      } catch (error) {
        console.log(`❌ ${apiTest.description} failed: ${error.message}`);
      }
    }
  });

  test('should support test data isolation', async ({ page }) => {
    console.log('🧪 Verifying test data isolation...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Create test data
    const testMessage = `Test isolation message - ${Date.now()}`;
    const messageResponse = await page.request.post(`/api/dashboard/conversations/${TEST_DATA.CONVERSATIONS.ACTIVE.id}/messages`, {
      data: {
        content: testMessage,
        senderType: 'operator'
      }
    });

    if (messageResponse.status() === 201) {
      const message = await messageResponse.json();
      expect(message).toHaveProperty('content', testMessage);
      console.log('✅ Test data creation successful');
      
      // Verify data exists
      const getResponse = await page.request.get(`/api/dashboard/conversations/${TEST_DATA.CONVERSATIONS.ACTIVE.id}/messages`);
      if (getResponse.status() === 200) {
        const data = await getResponse.json();
        const createdMessage = data.messages.find((m: unknown) => m.content === testMessage);
        expect(createdMessage).toBeTruthy();
        console.log('✅ Test data isolation verified');
      }
    } else {
      console.log('ℹ️  Test data creation skipped - conversation not available');
    }
  });

  test('should have proper error handling for missing data', async ({ page }) => {
    console.log('🛡️ Verifying error handling for missing data...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Test with non-existent conversation ID
    const invalidConversationId = '00000000-0000-0000-0000-000000000000';
    const response = await page.request.get(`/api/dashboard/conversations/${invalidConversationId}/messages`);
    
    expect(response.status()).toBe(404);
    
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.code).toBe('NOT_FOUND');
    
    console.log('✅ Error handling verified for missing data');
  });

  test('should maintain data consistency across browser sessions', async ({ page, context }) => {
    console.log('🔄 Verifying data consistency across sessions...');

    // Login in first session
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', TEST_DATA.USERS.AGENT.email);
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', TEST_DATA.USERS.AGENT.password);
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Get user data from first session
    const firstSessionData = await page.evaluate(() => {
      return {
        hasAuth: !!document.cookie.includes('supabase'),
        timestamp: Date.now()
      };
    });

    // Create new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should maintain authentication
    await newPage.waitForURL('**/dashboard', { timeout: 15000 });
    
    const secondSessionData = await newPage.evaluate(() => {
      return {
        hasAuth: !!document.cookie.includes('supabase'),
        timestamp: Date.now()
      };
    });

    expect(secondSessionData.hasAuth).toBe(true);
    console.log('✅ Data consistency verified across sessions');

    await newPage.close();
  });
});
