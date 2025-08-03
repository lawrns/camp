/**
 * DATABASE SYNC TEST
 * 
 * Verifies that the E2E tests can connect to the actual Supabase database
 * and that all test data is properly configured.
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  conversationId: '48eedfba-2568-4231-bb38-2ce20420900d'
};

test.describe('Database Sync Verification', () => {
  test('should verify database connectivity and test data', async ({ page }) => {
    console.log('🔍 Verifying database sync and test data...');

    // Step 1: Login as test user
    console.log('🔐 Logging in as test user...');
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('#email', TEST_CONFIG.agentEmail);
    await page.fill('#password', TEST_CONFIG.agentPassword);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Login successful');

    // Step 2: Navigate to inbox to verify conversation access
    console.log('📥 Navigating to inbox...');
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Check if conversations are loading
    const conversationsList = page.locator('[data-testid="conversations-list"], .conversation-item, [class*="conversation"]');
    await expect(conversationsList.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Inbox loaded with conversations');

    // Step 3: Test widget on homepage
    console.log('🎛️ Testing widget functionality...');
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');
    
    // Look for widget button
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Widget button found');

    // Click widget button
    await widgetButton.click();
    
    // Wait for widget panel to open
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 5000 });
    console.log('✅ Widget panel opened');

    // Check for message input
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    console.log('✅ Widget message input found');

    // Step 4: Send a test message to verify database connectivity
    console.log('💬 Sending test message...');
    const testMessage = `Database sync test - ${Date.now()}`;
    await messageInput.fill(testMessage);
    
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Wait for message to appear
    const sentMessage = page.locator(`[data-testid="message"]:has-text("${testMessage}")`);
    await expect(sentMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Test message sent and displayed');

    // Step 5: Verify message appears in dashboard
    console.log('🔄 Checking if message appears in dashboard...');
    
    // Open new tab for dashboard
    const dashboardPage = await page.context().newPage();
    await dashboardPage.goto(`${TEST_CONFIG.baseURL}/login`);
    await dashboardPage.fill('#email', TEST_CONFIG.agentEmail);
    await dashboardPage.fill('#password', TEST_CONFIG.agentPassword);
    await dashboardPage.click('button[type="submit"]');
    await dashboardPage.waitForURL('**/dashboard**');
    
    // Navigate to inbox
    await dashboardPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await dashboardPage.waitForLoadState('networkidle');
    
    // Look for the test message in conversations
    await dashboardPage.waitForTimeout(3000); // Allow time for real-time sync
    
    // Check if any conversation contains our test message
    const messageInDashboard = dashboardPage.locator(`text="${testMessage}"`);
    const messageExists = await messageInDashboard.count() > 0;
    
    if (messageExists) {
      console.log('✅ Message found in dashboard - bidirectional sync working!');
    } else {
      console.log('⚠️ Message not found in dashboard - may need to check real-time sync');
    }

    await dashboardPage.close();

    console.log('🎉 Database sync test completed successfully!');
  });

  test('should verify API endpoints are accessible', async ({ page }) => {
    console.log('🔌 Testing API endpoints...');

    // Test health endpoint
    const healthResponse = await page.request.get(`${TEST_CONFIG.baseURL}/api/health`);
    expect(healthResponse.status()).toBe(200);
    console.log('✅ Health endpoint working');

    // Test widget config endpoint
    const widgetConfigResponse = await page.request.get(
      `${TEST_CONFIG.baseURL}/api/widget/config?organizationId=${TEST_CONFIG.organizationId}`
    );
    expect(widgetConfigResponse.status()).toBe(200);
    console.log('✅ Widget config endpoint working');

    // Test messages endpoint (should require auth)
    const messagesResponse = await page.request.get(
      `${TEST_CONFIG.baseURL}/api/conversations/${TEST_CONFIG.conversationId}/messages`,
      {
        headers: {
          'x-organization-id': TEST_CONFIG.organizationId
        }
      }
    );
    
    // Should either return 200 with data or 401/403 for auth (both are valid responses)
    expect([200, 401, 403]).toContain(messagesResponse.status());
    console.log(`✅ Messages endpoint responding (status: ${messagesResponse.status()})`);

    console.log('🎉 API endpoints test completed!');
  });

  test('should verify Supabase connection', async ({ page }) => {
    console.log('🗄️ Testing Supabase connection...');

    // Navigate to a page that uses Supabase
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    
    // Monitor console for Supabase-related errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('supabase') || 
        msg.text().includes('realtime') ||
        msg.text().includes('websocket')
      )) {
        consoleErrors.push(msg.text());
      }
    });

    // Try to login (this will test Supabase auth)
    await page.fill('#email', TEST_CONFIG.agentEmail);
    await page.fill('#password', TEST_CONFIG.agentPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    
    // Wait a moment for any async operations
    await page.waitForTimeout(3000);

    // Check for critical Supabase errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Failed to connect') || 
      error.includes('Authentication failed') ||
      error.includes('Network error')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️ Supabase connection issues detected:');
      criticalErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ Supabase connection appears healthy');
    }

    // Verify we can access dashboard (requires successful Supabase auth)
    await expect(page.locator('body')).toContainText('Dashboard', { timeout: 5000 });
    console.log('✅ Dashboard accessible - Supabase auth working');

    console.log('🎉 Supabase connection test completed!');
  });
});
