import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  testConversationId: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b', // FIXED: Matches dashboard conversation
};

test('Direct API bidirectional communication test', async ({ page, context }) => {
  console.log('🔍 Starting direct API bidirectional communication test...');

  // Step 1: Login as agent
  console.log('🔐 Logging in as agent...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Navigate to inbox to load the store
  await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Inbox loaded');

  // Step 3: Open widget in new page for receiving messages
  const widgetPage = await context.newPage();
  await widgetPage.goto(`${TEST_CONFIG.baseURL}/widget-demo`);
  await widgetPage.waitForLoadState('networkidle');
  await widgetPage.waitForTimeout(3000);
  console.log('✅ Widget loaded');

  // Step 4: Test direct API call for bidirectional communication
  console.log('🔍 Testing direct API call for bidirectional communication...');
  
  const testMessage = `DIRECT API TEST: Dashboard to Widget ${Date.now()}`;
  
  const result = await page.evaluate(async ({ conversationId, message }) => {
    try {
      console.log('🚨 [BROWSER] Starting direct API test...');

      // Instead of accessing the store, make a direct API call
      const response = await fetch(`/api/dashboard/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: message,
          senderType: 'agent',
          senderName: 'Test Agent'
        }),
      });

      console.log('🚨 [BROWSER] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🚨 [BROWSER] API error:', errorText);
        return {
          success: false,
          error: `API call failed: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();
      console.log('🚨 [BROWSER] API call successful:', result);
      return { success: true, data: result };

    } catch (error) {
      console.error('🚨 [BROWSER] Error in direct API test:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack
      };
    }
  }, { conversationId: TEST_CONFIG.testConversationId, message: testMessage });

  console.log('📡 Store function result:', result);

  if (result.success) {
    console.log('✅ Direct API call successful');
    
    // Step 5: Check if message appears in widget
    console.log('⏳ Waiting for message to appear in widget...');
    
    try {
      await widgetPage.waitForSelector(`text="${testMessage}"`, { timeout: 15000 });
      console.log('🎉 SUCCESS! Dashboard API message appeared in widget - BIDIRECTIONAL COMMUNICATION WORKING!');
      
      // Take success screenshots
      await page.screenshot({ path: 'test-results/store-test-success-dashboard.png' });
      await widgetPage.screenshot({ path: 'test-results/store-test-success-widget.png' });
      
    } catch (error) {
      console.log('❌ Store message not found in widget');
      
      // Take failure screenshots
      await page.screenshot({ path: 'test-results/store-test-failure-dashboard.png' });
      await widgetPage.screenshot({ path: 'test-results/store-test-failure-widget.png' });
      
      throw new Error('Direct API bidirectional test failed: Message not found in widget');
    }
  } else {
    console.log('❌ Direct API call failed:', result.error);
    throw new Error(`Direct API call failed: ${result.error}`);
  }

  console.log('🎉 Direct API bidirectional communication test completed successfully!');
});
