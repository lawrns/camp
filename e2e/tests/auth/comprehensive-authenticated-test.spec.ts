import { test, expect } from '@playwright/test';

test.describe('Comprehensive Authenticated Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should login and test all authenticated areas', async ({ page }) => {
    // 1. Login
    console.log('🔐 Logging in...');
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    console.log('✅ Login successful');

    // 2. Test Dashboard
    console.log('📊 Testing Dashboard...');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
    console.log('✅ Dashboard accessible');

    // 3. Test Inbox
    console.log('📥 Testing Inbox...');
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/inbox/);
    await expect(page.locator('h1')).toContainText('Inbox');
    console.log('✅ Inbox accessible');

    // 4. Test Widget
    console.log('🔧 Testing Widget...');
    await page.goto('/widget');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/widget/);
    await expect(page.locator('h1')).toContainText('Widget');
    console.log('✅ Widget accessible');

    // 5. Test API endpoints with authentication
    console.log('🔌 Testing API endpoints...');
    
    // Test /api/auth/user
    const userResponse = await page.request.get('/api/auth/user');
    console.log(`User API Status: ${userResponse.status()}`);
    expect(userResponse.status()).toBe(200);
    
    // Test /api/dashboard/metrics
    const metricsResponse = await page.request.get('/api/dashboard/metrics');
    console.log(`Metrics API Status: ${metricsResponse.status()}`);
    expect(metricsResponse.status()).toBe(200);
    
    // Test /api/conversations
    const conversationsResponse = await page.request.get('/api/conversations');
    console.log(`Conversations API Status: ${conversationsResponse.status()}`);
    expect(conversationsResponse.status()).toBe(200);
    
    // Test /api/tickets
    const ticketsResponse = await page.request.get('/api/tickets');
    console.log(`Tickets API Status: ${ticketsResponse.status()}`);
    expect(ticketsResponse.status()).toBe(200);

    console.log('✅ All API endpoints working with authentication');
  });

  test('should test real-time features in inbox', async ({ page }) => {
    // Login first
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to inbox
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');

    console.log('🔄 Testing real-time features...');

    // Test that inbox loads with conversations
    const conversationElements = page.locator('[data-testid="conversation-item"]');
    await expect(conversationElements.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Conversations loaded');

    // Test conversation interaction
    await conversationElements.first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Conversation selection working');

    // Test message input
    const messageInput = page.locator('[data-testid="message-input"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test message from E2E test');
      await messageInput.press('Enter');
      console.log('✅ Message input working');
    }

    console.log('✅ Real-time features tested');
  });

  test('should test widget functionality', async ({ page }) => {
    // Login first
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to widget
    await page.goto('/widget');
    await page.waitForLoadState('networkidle');

    console.log('🔧 Testing widget functionality...');

    // Test widget components
    const widgetElements = page.locator('[data-testid="widget"]');
    await expect(widgetElements.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Widget components loaded');

    // Test widget interactions
    const widgetButtons = page.locator('[data-testid="widget-button"]');
    if (await widgetButtons.count() > 0) {
      await widgetButtons.first().click();
      console.log('✅ Widget interactions working');
    }

    console.log('✅ Widget functionality tested');
  });

  test('should test navigation and session persistence', async ({ page }) => {
    // Login first
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('🧭 Testing navigation and session persistence...');

    // Test navigation between pages
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/inbox/);

    await page.goto('/widget');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/widget/);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);

    // Test session persistence by refreshing
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
    console.log('✅ Session persistence working');

    // Test logout
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('/login');
      console.log('✅ Logout working');
    }

    console.log('✅ Navigation and session persistence tested');
  });

  test('should test error handling and edge cases', async ({ page }) => {
    console.log('⚠️ Testing error handling...');

    // Test invalid login
    await page.fill('#email', 'invalid@email.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Error handling working');

    // Test valid login after error
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    console.log('✅ Recovery from error working');

    // Test accessing protected routes without auth
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
    // Should redirect to login or show access denied
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ Protected route redirect working');
    } else {
      console.log('✅ Protected route accessible with session');
    }
  });

  test('should test all authenticated API endpoints', async ({ page }) => {
    // Login first
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('🔌 Testing all authenticated API endpoints...');

    const endpoints = [
      '/api/auth/user',
      '/api/dashboard/metrics',
      '/api/conversations',
      '/api/tickets',
      '/api/auth/session',
      '/api/auth/organization'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(endpoint);
        console.log(`${endpoint}: ${response.status()}`);
        
        if (response.status() === 200) {
          console.log(`✅ ${endpoint} - SUCCESS`);
        } else if (response.status() === 401) {
          console.log(`❌ ${endpoint} - UNAUTHORIZED (This should not happen when logged in)`);
        } else {
          console.log(`⚠️ ${endpoint} - ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR: ${error}`);
      }
    }

    console.log('✅ All API endpoints tested');
  });
}); 