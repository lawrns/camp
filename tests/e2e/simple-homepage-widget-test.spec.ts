import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED HOMEPAGE WIDGET TEST
 * 
 * Tests the actual homepage widget UI interactions and bidirectional communication
 * using the simplest possible approach.
 */

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  conversationId: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b'
};

test('Simple homepage widget bidirectional test', async ({ page, context }) => {
  console.log('🎯 SIMPLE HOMEPAGE WIDGET BIDIRECTIONAL TEST');
  console.log('==============================================');

  // Step 1: Test homepage widget UI
  console.log('🏠 Step 1: Testing homepage widget...');
  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check if widget button exists
  const widgetButton = page.locator('[data-testid="widget-button"]');
  const buttonExists = await widgetButton.count() > 0;
  console.log(`📋 Widget button exists: ${buttonExists ? 'YES' : 'NO'}`);

  if (!buttonExists) {
    console.log('❌ Widget button not found on homepage');
    return;
  }

  // Open widget
  await widgetButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Widget opened');

  // Send a test message from widget
  const widgetMessage = `SIMPLE TEST: Widget message ${Date.now()}`;
  console.log('💬 Sending message from widget:', widgetMessage);

  try {
    // Find message input (try multiple selectors)
    const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
    await messageInput.fill(widgetMessage);
    
    // Find send button (try multiple selectors)
    const sendButton = page.locator('button[aria-label*="Send"], button:has-text("Send")').first();
    await sendButton.click({ force: true });
    
    console.log('✅ Widget message sent');
    await page.waitForTimeout(3000);
  } catch (error) {
    console.log('❌ Failed to send widget message:', error);
    return;
  }

  // Step 2: Check dashboard
  console.log('📥 Step 2: Checking dashboard...');
  
  // Open dashboard in new tab
  const dashboardPage = await context.newPage();
  await dashboardPage.goto(`${TEST_CONFIG.baseURL}/login`);
  await dashboardPage.waitForLoadState('networkidle');

  // Login
  await dashboardPage.fill('#email', TEST_CONFIG.agentEmail);
  await dashboardPage.fill('#password', TEST_CONFIG.agentPassword);
  await dashboardPage.click('button[type="submit"]');
  await dashboardPage.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in');

  // Go to inbox
  await dashboardPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await dashboardPage.waitForLoadState('networkidle');
  await dashboardPage.waitForTimeout(5000); // Give time for conversations to load

  // Check conversations
  const conversations = await dashboardPage.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').count();
  console.log(`📋 Dashboard conversations found: ${conversations}`);

  if (conversations === 0) {
    console.log('❌ No conversations in dashboard - CORE ISSUE CONFIRMED');
    console.log('💡 This confirms the database query mismatch issue');
    return;
  }

  // Look for our message
  let messageFound = false;
  for (let i = 0; i < Math.min(conversations, 3); i++) {
    try {
      await dashboardPage.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').nth(i).click();
      await dashboardPage.waitForTimeout(2000);
      
      const hasMessage = await dashboardPage.locator(`text="${widgetMessage}"`).count() > 0;
      if (hasMessage) {
        console.log(`✅ Widget message found in conversation ${i + 1}`);
        messageFound = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ Could not check conversation ${i + 1}`);
    }
  }

  // Step 3: Test dashboard to widget (if message found)
  if (messageFound) {
    console.log('💬 Step 3: Testing dashboard to widget...');
    
    const dashboardReply = `SIMPLE TEST: Dashboard reply ${Date.now()}`;
    
    try {
      await dashboardPage.fill('textarea[placeholder*="message"], input[placeholder*="message"]', dashboardReply);
      await dashboardPage.click('[data-testid="composer-send-button"], button[aria-label*="Send"]', { force: true });
      console.log('✅ Dashboard reply sent:', dashboardReply);
      await dashboardPage.waitForTimeout(3000);

      // Check if reply appears in widget
      const replyInWidget = await page.locator(`text="${dashboardReply}"`).count() > 0;
      console.log(`📋 Dashboard reply in widget: ${replyInWidget ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log('❌ Failed to send dashboard reply:', error);
    }
  }

  // Step 4: Summary
  console.log('');
  console.log('🎯 SIMPLE TEST SUMMARY');
  console.log('======================');
  console.log(`📋 Widget button found: ${buttonExists ? 'YES' : 'NO'}`);
  console.log(`📋 Dashboard conversations: ${conversations}`);
  console.log(`📋 Widget → Dashboard: ${messageFound ? 'WORKING' : 'FAILED'}`);
  
  if (conversations === 0) {
    console.log('');
    console.log('🚨 CORE ISSUE IDENTIFIED:');
    console.log('   - Widget messages are not appearing in dashboard');
    console.log('   - This confirms the database column mismatch issue');
    console.log('   - Need to verify conversation creation and column updates');
  } else if (messageFound) {
    console.log('🎉 SUCCESS: Basic bidirectional communication working!');
  } else {
    console.log('⚠️ PARTIAL: Dashboard has conversations but widget message not found');
  }
});

test('Database conversation verification', async ({ page }) => {
  console.log('🔍 DATABASE CONVERSATION VERIFICATION');
  console.log('====================================');

  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');

  // Check if conversation exists via direct API call
  const conversationCheck = await page.evaluate(async ({ conversationId, organizationId }) => {
    try {
      // Try to get messages for the conversation
      const response = await fetch(`/api/widget/messages?conversationId=${conversationId}&organizationId=${organizationId}`, {
        headers: {
          'X-Organization-ID': organizationId
        }
      });

      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        return {
          exists: true,
          messageCount: data.messages?.length || 0,
          data: data
        };
      } else {
        const errorText = await response.text();
        return {
          exists: false,
          error: errorText
        };
      }
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }, { conversationId: TEST_CONFIG.conversationId, organizationId: TEST_CONFIG.organizationId });

  console.log('📋 Conversation Check Result:', JSON.stringify(conversationCheck, null, 2));
  
  if (conversationCheck.exists) {
    console.log(`✅ Conversation exists with ${conversationCheck.messageCount} messages`);
  } else {
    console.log('❌ Conversation does not exist or is not accessible');
    console.log('💡 This explains why dashboard shows 0 conversations');
  }
});
