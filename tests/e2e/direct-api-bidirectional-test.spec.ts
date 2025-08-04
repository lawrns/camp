import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
};

test('Direct API bidirectional communication test', async ({ page, context }) => {
  console.log('🔍 Starting direct API bidirectional test...');

  // Step 1: Login as agent to get auth token
  console.log('🔐 Logging in as agent...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Get auth token from browser
  const authToken = await page.evaluate(() => {
    return localStorage.getItem('supabase.auth.token') || 
           sessionStorage.getItem('supabase.auth.token') ||
           document.cookie.match(/supabase-auth-token=([^;]+)/)?.[1];
  });
  console.log('🔑 Auth token found:', !!authToken);

  // Step 3: Open widget in new page
  const widgetPage = await context.newPage();
  await widgetPage.goto(`${TEST_CONFIG.baseURL}/widget/test`);
  await widgetPage.waitForLoadState('networkidle');
  await widgetPage.waitForTimeout(3000);
  console.log('✅ Widget loaded');

  // Step 4: Send message from widget
  const widgetMessage = `DIRECT API TEST: Widget message ${Date.now()}`;
  
  await widgetPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', widgetMessage);
  await widgetPage.click('button[aria-label*="Send"], button:has-text("Send")');
  console.log(`✅ Widget message sent: ${widgetMessage}`);

  // Wait for widget message to be processed
  await widgetPage.waitForTimeout(3000);

  // Step 5: Get conversation ID from widget
  const conversationId = await widgetPage.evaluate(() => {
    return (window as unknown).widgetConversationId || 
           (window as unknown).conversationId ||
           '8ddf595b-b75d-42f2-98e5-9efd3513ea4b'; // fallback to known conversation
  });
  console.log('📋 Using conversation ID:', conversationId);

  // Step 6: Send reply via direct API call
  const replyMessage = `DIRECT API TEST: Agent reply ${Date.now()}`;
  
  console.log('🚀 Sending agent reply via direct API...');
  
  const apiResponse = await page.evaluate(async ({ conversationId, replyMessage, baseURL }) => {
    try {
      const response = await fetch(`${baseURL}/api/dashboard/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use session from authenticated page
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({
          content: replyMessage,
          senderType: 'agent',
          senderName: 'Test Agent'
        }),
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }, { conversationId, replyMessage, baseURL: TEST_CONFIG.baseURL });

  console.log('📡 API Response:', apiResponse);

  if (apiResponse.ok) {
    console.log('✅ Agent reply sent via API successfully');
    
    // Step 7: Check if reply appears in widget
    console.log('⏳ Waiting for reply to appear in widget...');
    
    try {
      await widgetPage.waitForSelector(`text="${replyMessage}"`, { timeout: 15000 });
      console.log('🎉 SUCCESS! Reply appeared in widget - BIDIRECTIONAL COMMUNICATION WORKING!');
      
      // Take success screenshot
      await widgetPage.screenshot({ path: 'test-results/direct-api-success.png' });
      
    } catch (error) {
      console.log('❌ Reply not found in widget after API call');
      
      // Take failure screenshot
      await widgetPage.screenshot({ path: 'test-results/direct-api-failure.png' });
      
      // Check widget logs
      const widgetLogs = await widgetPage.evaluate(() => {
        return (window as unknown).widgetBroadcastLogs || [];
      });
      console.log('🔍 Widget broadcast logs:', JSON.stringify(widgetLogs, null, 2));
      
      throw new Error('Direct API bidirectional test failed: Reply not found in widget');
    }
  } else {
    console.log('❌ API call failed:', apiResponse);
    throw new Error(`API call failed: ${apiResponse.status} - ${apiResponse.error || apiResponse.statusText}`);
  }

  console.log('🎉 Direct API bidirectional test completed successfully!');
});
