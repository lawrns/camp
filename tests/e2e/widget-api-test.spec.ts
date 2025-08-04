import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Widget API direct test', async ({ page }) => {
  console.log('🧪 WIDGET API DIRECT TEST');
  console.log('========================');

  // Step 1: Go to homepage
  console.log('🔧 Step 1: Loading homepage...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Homepage loaded');

  // Step 2: Test widget API directly
  console.log('🔧 Step 2: Testing widget API directly...');
  
  const testMessage = `API TEST: Direct widget API call ${Date.now()}`;
  const testConversationId = TEST_CONFIG.TEST_CONVERSATION_ID;
  const testOrganizationId = TEST_CONFIG.TEST_ORG_ID;

  const apiResult = await page.evaluate(async ({ message, conversationId, organizationId }) => {
    try {
      console.log('🚀 Making direct API call to /api/widget/messages');
      console.log('📋 Payload:', { conversationId, content: message, organizationId });

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

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      const result = await response.json();
      console.log('✅ API Success:', result);
      return {
        success: true,
        data: result,
        status: response.status
      };

    } catch (error) {
      console.error('❌ API Call failed:', error);
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

  console.log('📋 API Test Result:', JSON.stringify(apiResult, null, 2));

  if (apiResult.success) {
    console.log('✅ Widget API call successful!');
    console.log('📋 Message created:', apiResult.data?.message?.content);
    console.log('📡 Channel:', apiResult.data?.channel);
  } else {
    console.log('❌ Widget API call failed:', apiResult.error);
    console.log('📋 Status:', apiResult.status);
  }

  // Step 3: Test conversation creation if message failed
  if (!apiResult.success && apiResult.status === 500) {
    console.log('🔧 Step 3: Testing conversation creation...');
    
    const conversationResult = await page.evaluate(async ({ organizationId }) => {
      try {
        console.log('🚀 Creating conversation via widget API');
        
        const response = await fetch('/api/widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': organizationId,
          },
          body: JSON.stringify({
            action: 'create-conversation',
            organizationId,
            visitorId: `test-visitor-${Date.now()}`,
            initialMessage: null
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
    }, { organizationId: testOrganizationId });

    console.log('📋 Conversation Creation Result:', JSON.stringify(conversationResult, null, 2));

    if (conversationResult.success) {
      console.log('✅ Conversation created successfully!');
      console.log('📋 New conversation ID:', conversationResult.data?.conversationId);
      
      // Try sending message to new conversation
      const newConversationId = conversationResult.data?.conversationId;
      if (newConversationId) {
        console.log('🔧 Retrying message send with new conversation...');
        
        const retryResult = await page.evaluate(async ({ message, conversationId, organizationId }) => {
          try {
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

            if (!response.ok) {
              const errorText = await response.text();
              return { success: false, error: `HTTP ${response.status}: ${errorText}` };
            }

            const result = await response.json();
            return { success: true, data: result };

          } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
          }
        }, { 
          message: testMessage, 
          conversationId: newConversationId, 
          organizationId: testOrganizationId 
        });

        console.log('📋 Retry Result:', JSON.stringify(retryResult, null, 2));
      }
    }
  }

  // Step 4: Summary
  console.log('');
  console.log('🎯 WIDGET API TEST SUMMARY');
  console.log('==========================');
  console.log(`📋 Test Conversation ID: ${testConversationId}`);
  console.log(`📋 Organization ID: ${testOrganizationId}`);
  console.log(`✅ API Call: ${apiResult.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!apiResult.success) {
    console.log(`❌ Error: ${apiResult.error}`);
    console.log(`📋 Status: ${apiResult.status}`);
  }
});
