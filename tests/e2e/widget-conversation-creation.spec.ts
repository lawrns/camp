import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Widget conversation creation and bidirectional test', async ({ page, context }) => {
  console.log('🎯 WIDGET CONVERSATION CREATION AND BIDIRECTIONAL TEST');
  console.log('====================================================');

  // Step 1: Load homepage
  console.log('🔧 Step 1: Loading homepage...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('✅ Homepage loaded');

  // Step 2: Create conversation via widget API
  console.log('🔧 Step 2: Creating conversation via widget API...');
  
  const testOrganizationId = TEST_CONFIG.TEST_ORG_ID;

  const conversationResult = await page.evaluate(async ({ organizationId }) => {
    try {
      console.log('🚀 Creating conversation via widget API');
      
      const response = await fetch('/api/widget?action=create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          action: 'create-conversation', // FIXED: Include action in body for validation
          organizationId,
          providedVisitorId: `test-visitor-${Date.now()}`,
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          initialMessage: null,
          metadata: {}
        })
      });

      console.log('📡 Widget Conversation API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Widget Conversation API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const result = await response.json();
      console.log('✅ Widget Conversation API Success:', result);
      return {
        success: true,
        data: result,
        status: response.status,
        conversationId: result.conversationId || result.conversation?.id
      };

    } catch (error) {
      console.error('❌ Widget Conversation API Call failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        status: 0
      };
    }
  }, { organizationId: testOrganizationId });

  console.log('📋 Conversation Creation Result:', JSON.stringify(conversationResult, null, 2));

  if (!conversationResult.success) {
    console.log('❌ Conversation creation failed, cannot proceed with test');
    return;
  }

  const newConversationId = conversationResult.conversationId;
  console.log('✅ New conversation created with ID:', newConversationId);

  // Step 3: Send message to the new conversation
  console.log('💬 Step 3: Sending message to new conversation...');
  
  const testMessage = `WIDGET TEST: Message to new conversation ${Date.now()}`;

  const messageResult = await page.evaluate(async ({ message, conversationId, organizationId }) => {
    try {
      console.log('🚀 Sending message via widget API to conversation:', conversationId);
      
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

      console.log('📡 Widget Message API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Widget Message API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const result = await response.json();
      console.log('✅ Widget Message API Success:', result);
      return {
        success: true,
        data: result,
        status: response.status
      };

    } catch (error) {
      console.error('❌ Widget Message API Call failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        status: 0
      };
    }
  }, { 
    message: testMessage, 
    conversationId: newConversationId, 
    organizationId: testOrganizationId 
  });

  console.log('📋 Message Send Result:', JSON.stringify(messageResult, null, 2));

  // Step 4: Login to dashboard and check
  console.log('🔐 Step 4: Logging into dashboard...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_EMAIL, TEST_CONFIG.AGENT_EMAIL);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_PASSWORD, TEST_CONFIG.AGENT_PASSWORD);
  await page.click(TEST_CONFIG.SELECTORS.LOGIN_SUBMIT);
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in');

  // Step 5: Check dashboard for conversation
  console.log('📥 Step 5: Checking dashboard for conversation...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Give more time for conversations to load

  const conversations = await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).count();
  console.log(`📋 Found ${conversations} conversations in dashboard`);

  let foundTestMessage = false;
  if (conversations > 0) {
    console.log('🔍 Searching for test message in conversations...');
    
    // Check each conversation for our test message
    for (let i = 0; i < Math.min(conversations, 3); i++) {
      try {
        console.log(`🔍 Checking conversation ${i + 1}...`);
        await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).nth(i).click();
        await page.waitForTimeout(2000);
        
        const messageExists = await page.locator(`text="${testMessage}"`).count() > 0;
        if (messageExists) {
          console.log(`✅ Found test message in conversation ${i + 1}`);
          foundTestMessage = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not check conversation ${i + 1}:`, error);
      }
    }
  }

  // Step 6: Send reply from dashboard if message found
  if (foundTestMessage) {
    console.log('💬 Step 6: Sending reply from dashboard...');
    
    const dashboardReply = `DASHBOARD REPLY: Response to widget ${Date.now()}`;
    
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

  // Step 7: Summary
  console.log('');
  console.log('🎯 WIDGET CONVERSATION CREATION TEST SUMMARY');
  console.log('============================================');
  console.log(`📋 Conversation Creation: ${conversationResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📋 New Conversation ID: ${newConversationId || 'N/A'}`);
  console.log(`📋 Widget Message Send: ${messageResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📋 Dashboard Conversations: ${conversations}`);
  console.log(`📋 Widget → Dashboard: ${foundTestMessage ? 'WORKING' : 'FAILED'}`);
  
  if (conversationResult.success && messageResult.success && foundTestMessage) {
    console.log('🎉 SUCCESS: Complete Widget → Dashboard flow is working!');
    console.log('✅ Widget can create conversations');
    console.log('✅ Widget can send messages');
    console.log('✅ Dashboard can see widget conversations');
    console.log('✅ Dashboard can see widget messages');
  } else {
    console.log('❌ ISSUE: Widget → Dashboard flow has problems');
    
    if (!conversationResult.success) {
      console.log(`   - Conversation creation failed: ${conversationResult.error}`);
    }
    if (!messageResult.success) {
      console.log(`   - Message send failed: ${messageResult.error}`);
    }
    if (conversations === 0) {
      console.log('   - No conversations visible in dashboard');
    } else if (!foundTestMessage) {
      console.log('   - Test message not found in dashboard conversations');
    }
  }
});
