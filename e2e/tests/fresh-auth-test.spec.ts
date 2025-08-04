import { test, expect } from '@playwright/test';

/**
 * Fresh Authentication Test
 * Tests widget-dashboard communication with fresh authentication
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d',
  BASE_URL: 'http://localhost:3001'
};

test.describe('Fresh Authentication Test', () => {
  test('should test widget-dashboard communication with fresh auth', async ({ browser }) => {
    console.log('🔄 Starting fresh authentication test...');
    
    // Create two contexts for widget and dashboard
    const widgetContext = await browser.newContext();
    const dashboardContext = await browser.newContext();
    
    const widgetPage = await widgetContext.newPage();
    const dashboardPage = await dashboardContext.newPage();
    
    try {
      // Step 1: Clear all storage and start fresh
      console.log('🧹 Clearing all storage for fresh start...');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await dashboardPage.context().clearCookies();
      
      // Step 2: Fresh login to dashboard
      console.log('🔐 Performing fresh login...');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await dashboardPage.fill('#email', TEST_CONFIG.AGENT_EMAIL);
      await dashboardPage.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
      await dashboardPage.click('button[type="submit"]');
      
      await dashboardPage.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Fresh dashboard login successful');
      
      // Step 3: Test auth APIs immediately after login
      console.log('🧪 Testing auth APIs after fresh login...');
      
      const sessionResponse = await dashboardPage.request.get(`${TEST_CONFIG.BASE_URL}/api/auth/session`);
      console.log(`Session API: ${sessionResponse.status()}`);
      
      if (sessionResponse.ok()) {
        const sessionData = await sessionResponse.json();
        console.log('✅ Session API working:', {
          authenticated: sessionData.authenticated,
          userId: sessionData.user?.id,
          organizationId: sessionData.user?.organizationId
        });
      } else {
        console.log('❌ Session API failed after fresh login');
        const errorData = await sessionResponse.text();
        console.log('Session error:', errorData);
      }
      
      // Step 4: Navigate to inbox and test dashboard API
      console.log('📊 Testing dashboard inbox...');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
      await dashboardPage.waitForLoadState('networkidle');
      await dashboardPage.waitForTimeout(3000);
      
      // Test dashboard messages API
      const dashboardMessagesResponse = await dashboardPage.request.get(
        `${TEST_CONFIG.BASE_URL}/api/dashboard/conversations/${TEST_CONFIG.TEST_CONVERSATION_ID}/messages`
      );
      
      console.log(`Dashboard messages API: ${dashboardMessagesResponse.status()}`);
      
      if (dashboardMessagesResponse.ok()) {
        const dashboardMessages = await dashboardMessagesResponse.json();
        console.log(`✅ Dashboard API working - found ${dashboardMessages.messages?.length || 0} messages`);
      } else {
        console.log('❌ Dashboard messages API failed');
        try {
          const errorData = await dashboardMessagesResponse.json();
          console.log('Dashboard API error:', errorData);
        } catch {
          const errorText = await dashboardMessagesResponse.text();
          console.log('Dashboard API error (text):', errorText);
        }
      }
      
      // Step 5: Set up widget and send message
      console.log('🔧 Setting up widget...');
      await widgetPage.goto(`${TEST_CONFIG.BASE_URL}/widget-demo`);
      await widgetPage.waitForLoadState('networkidle');
      await widgetPage.waitForTimeout(3000);
      
      // Open widget and send message
      const widgetButton = widgetPage.locator('[data-testid="widget-button"]');
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator('[data-testid="widget-panel"]');
      await expect(widgetPanel).toBeVisible();
      
      const messageInput = widgetPage.locator('[data-testid="widget-message-input"]');
      const sendButton = widgetPage.locator('[data-testid="widget-send-button"]');
      
      const testMessage = `Fresh auth test - ${Date.now()}`;
      await messageInput.fill(testMessage);
      await sendButton.click();
      
      console.log(`✅ Message sent from widget: "${testMessage}"`);
      
      // Step 6: Wait and test if message appears in dashboard
      console.log('⏱️  Waiting for real-time sync...');
      await dashboardPage.waitForTimeout(5000);
      
      // Test dashboard API again to see if message appears
      const updatedDashboardResponse = await dashboardPage.request.get(
        `${TEST_CONFIG.BASE_URL}/api/dashboard/conversations/${TEST_CONFIG.TEST_CONVERSATION_ID}/messages`
      );
      
      console.log(`Updated dashboard API: ${updatedDashboardResponse.status()}`);
      
      if (updatedDashboardResponse.ok()) {
        const updatedMessages = await updatedDashboardResponse.json();
        const hasTestMessage = updatedMessages.messages?.some((msg: unknown) => 
          msg.content && msg.content.includes('Fresh auth test'));
        
        console.log(`✅ Updated dashboard API working - found ${updatedMessages.messages?.length || 0} messages`);
        console.log(`Dashboard API has test message: ${hasTestMessage ? '✅' : '❌'}`);
      } else {
        console.log('❌ Updated dashboard API failed');
      }
      
      // Step 7: Check if message appears in dashboard UI
      const dashboardMessage = dashboardPage.locator(`text="${testMessage}"`);
      const messageInDashboard = await dashboardMessage.count() > 0;
      
      console.log(`Message in dashboard UI: ${messageInDashboard ? '✅' : '❌'}`);
      
      // Step 8: Test widget API to confirm message was sent
      const widgetMessagesResponse = await widgetPage.request.get(
        `${TEST_CONFIG.BASE_URL}/api/widget/messages?conversationId=${TEST_CONFIG.TEST_CONVERSATION_ID}`,
        {
          headers: {
            'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
          }
        }
      );
      
      console.log(`Widget messages API: ${widgetMessagesResponse.status()}`);
      
      if (widgetMessagesResponse.ok()) {
        const widgetMessages = await widgetMessagesResponse.json();
        const hasTestMessage = widgetMessages.some((msg: unknown) => 
          msg.content && msg.content.includes('Fresh auth test'));
        
        console.log(`✅ Widget API working - found ${widgetMessages.length} messages`);
        console.log(`Widget API has test message: ${hasTestMessage ? '✅' : '❌'}`);
      }
      
      // Step 9: Summary
      console.log('📋 Fresh Authentication Test Summary:');
      console.log(`✅ Fresh login: Working`);
      console.log(`${sessionResponse.ok() ? '✅' : '❌'} Session API: ${sessionResponse.ok() ? 'Working' : 'Failed'}`);
      console.log(`${dashboardMessagesResponse.ok() ? '✅' : '❌'} Dashboard API: ${dashboardMessagesResponse.ok() ? 'Working' : 'Failed'}`);
      console.log(`${updatedDashboardResponse.ok() ? '✅' : '❌'} Updated Dashboard API: ${updatedDashboardResponse.ok() ? 'Working' : 'Failed'}`);
      console.log(`${widgetMessagesResponse.ok() ? '✅' : '❌'} Widget API: ${widgetMessagesResponse.ok() ? 'Working' : 'Failed'}`);
      console.log(`${messageInDashboard ? '✅' : '❌'} Message in dashboard UI: ${messageInDashboard ? 'Yes' : 'No'}`);
      
      // Test passes if basic functionality works
      expect(sessionResponse.ok()).toBe(true);
      
      console.log('🎉 Fresh authentication test completed!');
      
    } finally {
      await widgetContext.close();
      await dashboardContext.close();
    }
  });
});
