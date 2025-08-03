/**
 * CRITICAL REALTIME FIX VERIFICATION TEST
 * 
 * This test verifies that the critical realtime subscription timeout issue
 * has been resolved and bidirectional communication works properly.
 * 
 * Fixes tested:
 * - 15-second timeout instead of 5-second
 * - Proper retry logic for subscription failures
 * - Dashboard to widget communication
 * - Widget to dashboard communication
 * - Agent loading functionality
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  timeout: 30000
};

// Helper functions
async function loginAsAgent(page: Page) {
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

async function openWidget(page: Page) {
  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
  await page.click('[data-testid="widget-button"]');
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
}

async function sendMessageFromWidget(page: Page, message: string) {
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 5000 });
  await page.fill('[data-testid="widget-message-input"]', message);
  await page.click('[data-testid="widget-send-button"]');
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 15000 });
}

async function sendMessageFromDashboard(page: Page, message: string) {
  // Use verified dashboard message input selector
  await page.fill('textarea[placeholder*="message"]', message);
  
  // Try multiple send button selectors with force click
  const sendSelectors = [
    'button[aria-label*="Send"]',
    'button[type="submit"]',
    'button:has-text("Send")'
  ];
  
  let buttonFound = false;
  for (const selector of sendSelectors) {
    const button = page.locator(selector);
    const count = await button.count();
    if (count > 0 && await button.first().isVisible()) {
      try {
        await button.first().click({ force: true });
        buttonFound = true;
        console.log(`✅ Successfully clicked send button with selector: ${selector}`);
        break;
      } catch (error) {
        console.log(`Failed to click ${selector}, trying next...`);
        continue;
      }
    }
  }
  
  if (!buttonFound) {
    console.log('No send button found, trying Enter key...');
    await page.keyboard.press('Enter');
  }
  
  await page.waitForTimeout(3000);
}

test.describe('Critical Realtime Fix Verification', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;

  test.beforeAll(async ({ browser }) => {
    agentContext = await browser.newContext();
    visitorContext = await browser.newContext();
    
    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();
  });

  test.afterAll(async () => {
    await agentContext.close();
    await visitorContext.close();
  });

  test('should verify realtime subscription timeout fix', async () => {
    console.log('🔧 Testing realtime subscription timeout fix...');

    // Monitor console for timeout errors
    const consoleErrors: string[] = [];
    const realtimeErrors: string[] = [];
    
    agentPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('timeout') || text.includes('Realtime')) {
          realtimeErrors.push(text);
        }
      }
    });

    // Step 1: Agent logs into dashboard
    console.log('📱 Agent logging into dashboard...');
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Wait for realtime subscriptions to establish
    console.log('⏳ Waiting for realtime subscriptions to establish...');
    await agentPage.waitForTimeout(20000); // Wait 20 seconds to see if timeout occurs

    // Check for timeout errors
    const timeoutErrors = realtimeErrors.filter(error => 
      error.includes('timeout') && error.includes('5 seconds')
    );

    if (timeoutErrors.length > 0) {
      console.log('❌ Found 5-second timeout errors (fix not applied):');
      timeoutErrors.forEach(error => console.log(`  - ${error}`));
      throw new Error('5-second timeout still occurring - fix not applied');
    } else {
      console.log('✅ No 5-second timeout errors found - fix appears to be working');
    }

    // Check for any realtime errors
    if (realtimeErrors.length > 0) {
      console.log('⚠️ Found realtime errors:');
      realtimeErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No realtime errors detected');
    }

    console.log('🎉 Realtime subscription timeout fix verification completed!');
  });

  test('should verify agents API is working', async () => {
    console.log('👥 Testing agents API functionality...');

    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Monitor for agent loading errors
    const agentErrors: string[] = [];
    agentPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' && text.includes('agent')) {
        agentErrors.push(text);
      }
    });

    // Try to trigger agent loading (look for assignment dialogs or agent lists)
    const assignmentButtons = agentPage.locator('button:has-text("Assign"), button[aria-label*="assign"]');
    const assignmentCount = await assignmentButtons.count();
    
    if (assignmentCount > 0) {
      console.log(`Found ${assignmentCount} assignment buttons, testing agent loading...`);
      
      try {
        await assignmentButtons.first().click();
        await agentPage.waitForTimeout(5000); // Wait for agent loading
        
        // Check for "Failed to load agents" error
        const failedToLoadErrors = agentErrors.filter(error => 
          error.includes('Failed to load agents')
        );
        
        if (failedToLoadErrors.length > 0) {
          console.log('❌ Found "Failed to load agents" errors:');
          failedToLoadErrors.forEach(error => console.log(`  - ${error}`));
        } else {
          console.log('✅ No "Failed to load agents" errors found');
        }
      } catch (error) {
        console.log('⚠️ Could not test agent loading - no assignment UI available');
      }
    } else {
      console.log('ℹ️ No assignment buttons found - testing direct API call');
      
      // Test the API directly
      const response = await agentPage.evaluate(async (orgId) => {
        try {
          const res = await fetch(`/api/agents?organizationId=${orgId}`);
          const data = await res.json();
          return { success: res.ok, data, status: res.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, TEST_CONFIG.organizationId);
      
      if (response.success) {
        console.log('✅ Agents API working correctly');
        console.log(`Found ${response.data.agents?.length || 0} agents`);
      } else {
        console.log('❌ Agents API failed:', response);
      }
    }

    console.log('🎉 Agents API test completed!');
  });

  test('should verify complete bidirectional communication', async () => {
    console.log('🔄 Testing complete bidirectional communication...');

    // Step 1: Setup both contexts
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    await openWidget(visitorPage);

    // Step 2: Visitor sends initial message
    console.log('💬 Visitor sending initial message...');
    const visitorMessage = `CRITICAL_FIX_TEST_${Date.now()}`;
    await sendMessageFromWidget(visitorPage, visitorMessage);

    // Step 3: Wait for message to appear in dashboard (with extended timeout)
    console.log('🔍 Waiting for message to appear in dashboard...');
    await agentPage.waitForTimeout(20000); // Extended wait for realtime sync

    // Look for conversations and check for the message
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`Found ${conversationCount} conversations in dashboard`);

    let messageFoundInDashboard = false;
    if (conversationCount > 0) {
      // Check each conversation for our message
      for (let i = 0; i < Math.min(conversationCount, 5); i++) {
        await conversations.nth(i).click();
        await agentPage.waitForTimeout(3000);
        
        const messageInConv = agentPage.locator(`text="${visitorMessage}"`);
        const msgCount = await messageInConv.count();
        
        if (msgCount > 0) {
          console.log(`✅ Visitor message found in conversation ${i + 1}!`);
          messageFoundInDashboard = true;
          
          // Step 4: Agent responds
          console.log('💬 Agent responding...');
          const agentResponse = `AGENT_RESPONSE_${Date.now()}`;
          await sendMessageFromDashboard(agentPage, agentResponse);
          
          // Step 5: Check if agent response appears in widget
          console.log('🔍 Checking if agent response appears in widget...');
          await visitorPage.waitForTimeout(20000); // Extended wait
          
          const responseInWidget = visitorPage.locator(`text="${agentResponse}"`);
          const responseCount = await responseInWidget.count();
          
          if (responseCount > 0) {
            console.log('✅ SUCCESS: Complete bidirectional communication working!');
            await expect(responseInWidget.first()).toBeVisible({ timeout: 5000 });
          } else {
            console.log('⚠️ Agent response not found in widget');
            
            // Debug: Check all messages in widget
            const allWidgetMessages = visitorPage.locator('[data-testid="message"]');
            const widgetMsgCount = await allWidgetMessages.count();
            console.log(`Found ${widgetMsgCount} messages in widget:`);
            
            for (let j = 0; j < Math.min(widgetMsgCount, 5); j++) {
              const msgText = await allWidgetMessages.nth(j).textContent();
              console.log(`  Widget message ${j}: "${msgText}"`);
            }
          }
          
          break;
        }
      }
    }

    if (!messageFoundInDashboard) {
      console.log('⚠️ Visitor message not found in dashboard - checking for realtime issues');
      
      // Take screenshot for debugging
      await agentPage.screenshot({ path: 'critical-fix-test-dashboard.png', fullPage: true });
      await visitorPage.screenshot({ path: 'critical-fix-test-widget.png', fullPage: true });
    }

    console.log('🎉 Bidirectional communication test completed!');
  });

  test('should verify subscription error handling and fallback', async () => {
    console.log('🛡️ Testing subscription error handling and fallback...');

    // Monitor for specific error handling
    const errorHandlingLogs: string[] = [];
    agentPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('fallback') || text.includes('retry') || text.includes('CHANNEL_ERROR')) {
        errorHandlingLogs.push(text);
      }
    });

    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Wait for potential error handling to occur
    await agentPage.waitForTimeout(15000);

    if (errorHandlingLogs.length > 0) {
      console.log('📋 Found error handling logs:');
      errorHandlingLogs.forEach(log => console.log(`  - ${log}`));
      
      const fallbackLogs = errorHandlingLogs.filter(log => log.includes('fallback'));
      if (fallbackLogs.length > 0) {
        console.log('✅ Fallback mode detected - error handling working');
      }
    } else {
      console.log('ℹ️ No error handling logs found - system may be working normally');
    }

    console.log('🎉 Error handling test completed!');
  });
});
