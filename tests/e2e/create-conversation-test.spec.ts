import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Create conversation and test bidirectional flow', async ({ page, context }) => {
  console.log('🎯 CREATE CONVERSATION AND TEST BIDIRECTIONAL FLOW');
  console.log('=================================================');

  // Step 0: Load homepage first to establish context
  console.log('🔧 Step 0: Loading homepage...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('✅ Homepage loaded');

  // Step 1: Create conversation via API
  console.log('🔧 Step 1: Creating conversation via API...');
  
  const testConversationId = TEST_CONFIG.TEST_CONVERSATION_ID;
  const testOrganizationId = TEST_CONFIG.TEST_ORG_ID;

  const conversationResult = await page.evaluate(async ({ conversationId, organizationId }) => {
    try {
      console.log('🚀 Creating conversation via dashboard API');
      
      // First, try to create the conversation
      const response = await fetch('/api/dashboard/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: conversationId, // Use specific ID
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          subject: 'Test Conversation for Bidirectional Communication',
          status: 'open',
          priority: 'medium',
          channel: 'widget',
          organization_id: organizationId
        })
      });

      console.log('📡 Conversation API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Conversation API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const result = await response.json();
      console.log('✅ Conversation API Success:', result);
      return {
        success: true,
        data: result,
        status: response.status
      };

    } catch (error) {
      console.error('❌ Conversation API Call failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        status: 0
      };
    }
  }, { conversationId: testConversationId, organizationId: testOrganizationId });

  console.log('📋 Conversation Creation Result:', JSON.stringify(conversationResult, null, 2));

  // Step 2: Send message via widget API
  console.log('💬 Step 2: Sending message via widget API...');
  
  const testMessage = `BIDIRECTIONAL TEST: Widget message ${Date.now()}`;

  const messageResult = await page.evaluate(async ({ message, conversationId, organizationId }) => {
    try {
      console.log('🚀 Sending message via widget API');
      
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          conversationId,
          content: message,
          senderType: 'visitor',
          senderName: 'Test Visitor',
          visitorId: `test-visitor-${Date.now()}`
        }),
      });

      console.log('📡 Message API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Message API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const result = await response.json();
      console.log('✅ Message API Success:', result);
      return {
        success: true,
        data: result,
        status: response.status
      };

    } catch (error) {
      console.error('❌ Message API Call failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        status: 0
      };
    }
  }, { 
    message: testMessage, 
    conversationId: testConversationId, 
    organizationId: testOrganizationId 
  });

  console.log('📋 Message Send Result:', JSON.stringify(messageResult, null, 2));

  // Step 3: Login to dashboard and check
  console.log('🔐 Step 3: Logging into dashboard...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_EMAIL, TEST_CONFIG.AGENT_EMAIL);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_PASSWORD, TEST_CONFIG.AGENT_PASSWORD);
  await page.click(TEST_CONFIG.SELECTORS.LOGIN_SUBMIT);
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in');

  // Step 4: Check dashboard for conversation
  console.log('📥 Step 4: Checking dashboard for conversation...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const conversations = await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).count();
  console.log(`📋 Found ${conversations} conversations in dashboard`);

  let foundTestMessage = false;
  if (conversations > 0) {
    // Check first conversation for our test message
    await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).first().click();
    await page.waitForTimeout(2000);
    
    foundTestMessage = await page.locator(`text="${testMessage}"`).count() > 0;
    console.log(`📋 Test message found in dashboard: ${foundTestMessage ? 'YES' : 'NO'}`);
  }

  // Step 5: Send reply from dashboard if message found
  if (foundTestMessage) {
    console.log('💬 Step 5: Sending reply from dashboard...');
    
    const dashboardReply = `BIDIRECTIONAL TEST: Dashboard reply ${Date.now()}`;
    
    try {
      await page.fill(TEST_CONFIG.SELECTORS.MESSAGE_INPUT, dashboardReply);
      await page.click(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON, { force: true });
      console.log('✅ Dashboard reply sent:', dashboardReply);
      await page.waitForTimeout(3000);
      
      // Check if reply appears in dashboard
      const replyInDashboard = await page.locator(`text="${dashboardReply}"`).count() > 0;
      console.log(`📋 Dashboard reply appeared: ${replyInDashboard ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log('❌ Failed to send dashboard reply:', error);
    }
  }

  // Step 6: Summary
  console.log('');
  console.log('🎯 BIDIRECTIONAL TEST SUMMARY');
  console.log('=============================');
  console.log(`📋 Conversation Creation: ${conversationResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📋 Widget Message Send: ${messageResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📋 Dashboard Conversations: ${conversations}`);
  console.log(`📋 Widget → Dashboard: ${foundTestMessage ? 'WORKING' : 'FAILED'}`);
  
  if (conversationResult.success && messageResult.success && foundTestMessage) {
    console.log('🎉 SUCCESS: Widget → Dashboard communication is working!');
  } else {
    console.log('❌ ISSUE: Widget → Dashboard communication failed');
    
    if (!conversationResult.success) {
      console.log(`   - Conversation creation failed: ${conversationResult.error}`);
    }
    if (!messageResult.success) {
      console.log(`   - Message send failed: ${messageResult.error}`);
    }
    if (conversations === 0) {
      console.log('   - No conversations visible in dashboard');
    }
  }
});
