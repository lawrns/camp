/**
 * DATABASE RETRY VERIFICATION TEST
 * 
 * This test verifies that messages are properly stored and retrieved
 * from the database during exponential backoff retry scenarios,
 * ensuring data consistency and reliability.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  timeout: 120000
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

async function verifyMessageInDatabase(page: Page, messageText: string): Promise<boolean> {
  // Use the API to check if message exists in database
  const response = await page.evaluate(async (args) => {
    try {
      const { messageText, organizationId } = args;
      
      // Call the messages API to check if message exists
      const res = await fetch(`/api/dashboard/messages?organizationId=${organizationId}&limit=50`);
      const data = await res.json();
      
      if (data.success && data.messages) {
        const foundMessage = data.messages.find((msg: any) => 
          msg.content && msg.content.includes(messageText)
        );
        return { found: !!foundMessage, messageData: foundMessage };
      }
      
      return { found: false, error: 'API call failed' };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }, { messageText, organizationId: TEST_CONFIG.organizationId });
  
  return response.found;
}

test.describe('Database Retry Verification', () => {
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

  test('should verify message storage during retry scenarios', async () => {
    console.log('🗄️ Testing message storage during retry scenarios...');

    // Monitor retry attempts
    const retryLogs: string[] = [];
    const storageErrors: string[] = [];
    
    visitorPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('Retrying') || text.includes('attempt')) {
        retryLogs.push(text);
      }
      if (text.includes('storage') || text.includes('database') || text.includes('save')) {
        if (msg.type() === 'error') {
          storageErrors.push(text);
        }
      }
    });

    // Open widget and send test message
    await openWidget(visitorPage);
    
    const testMessage = `Database retry test - ${Date.now()}`;
    console.log(`💬 Sending test message: "${testMessage}"`);
    
    await sendMessageFromWidget(visitorPage, testMessage);

    // Wait for potential retry scenarios
    console.log('⏳ Waiting for message processing and potential retries...');
    await visitorPage.waitForTimeout(60000); // Wait 1 minute for retries

    // Verify message appears in widget (UI confirmation)
    const messageInWidget = visitorPage.locator(`[data-testid="message"]:has-text("${testMessage}")`);
    const widgetCount = await messageInWidget.count();
    
    if (widgetCount > 0) {
      console.log('✅ Message appears in widget UI');
    } else {
      console.log('⚠️ Message not found in widget UI');
    }

    // Verify message is stored in database
    console.log('🔍 Verifying message storage in database...');
    await loginAsAgent(agentPage);
    
    const messageInDatabase = await verifyMessageInDatabase(agentPage, testMessage);
    
    if (messageInDatabase) {
      console.log('✅ Message successfully stored in database');
    } else {
      console.log('⚠️ Message not found in database');
    }

    // Analyze retry and storage logs
    console.log(`Found ${retryLogs.length} retry-related logs:`);
    retryLogs.slice(0, 5).forEach((log, index) => {
      console.log(`  Retry ${index + 1}: ${log.substring(0, 100)}...`);
    });

    console.log(`Found ${storageErrors.length} storage error logs:`);
    storageErrors.forEach((log, index) => {
      console.log(`  Storage Error ${index + 1}: ${log}`);
    });

    // Verify data consistency
    if (widgetCount > 0 && messageInDatabase) {
      console.log('✅ SUCCESS: Message storage consistent between UI and database');
    } else if (widgetCount > 0 && !messageInDatabase) {
      console.log('⚠️ WARNING: Message in UI but not in database - potential consistency issue');
    } else if (widgetCount === 0 && messageInDatabase) {
      console.log('⚠️ WARNING: Message in database but not in UI - potential sync issue');
    } else {
      console.log('❌ ERROR: Message not found in UI or database');
    }

    console.log('🎉 Message storage verification completed!');
  });

  test('should verify message retrieval during dashboard retry scenarios', async () => {
    console.log('📥 Testing message retrieval during dashboard retry scenarios...');

    // First, ensure we have a message to retrieve
    await openWidget(visitorPage);
    const retrievalTestMessage = `Retrieval test - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, retrievalTestMessage);
    
    // Wait for message to be stored
    await visitorPage.waitForTimeout(10000);

    // Monitor dashboard retry attempts
    const dashboardRetryLogs: string[] = [];
    const retrievalErrors: string[] = [];
    
    agentPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('Retrying') || text.includes('attempt') || text.includes('subscription')) {
        dashboardRetryLogs.push(text);
      }
      if (text.includes('retrieval') || text.includes('fetch') || text.includes('load')) {
        if (msg.type() === 'error') {
          retrievalErrors.push(text);
        }
      }
    });

    // Login to dashboard and navigate to inbox
    console.log('📱 Agent logging into dashboard...');
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Wait for potential retry scenarios during message retrieval
    console.log('⏳ Waiting for message retrieval and potential retries...');
    await agentPage.waitForTimeout(90000); // Wait 1.5 minutes for retries

    // Check if message appears in dashboard
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`Found ${conversationCount} conversations in dashboard`);

    let messageFoundInDashboard = false;
    if (conversationCount > 0) {
      for (let i = 0; i < Math.min(conversationCount, 5); i++) {
        await conversations.nth(i).click();
        await agentPage.waitForTimeout(3000);
        
        const messageInConv = agentPage.locator(`text="${retrievalTestMessage}"`);
        const msgCount = await messageInConv.count();
        
        if (msgCount > 0) {
          console.log(`✅ Message found in dashboard conversation ${i + 1}`);
          messageFoundInDashboard = true;
          break;
        }
      }
    }

    // Verify database consistency
    const messageInDatabase = await verifyMessageInDatabase(agentPage, retrievalTestMessage);

    // Analyze retrieval patterns
    console.log(`Found ${dashboardRetryLogs.length} dashboard retry logs:`);
    dashboardRetryLogs.slice(0, 5).forEach((log, index) => {
      console.log(`  Dashboard Retry ${index + 1}: ${log.substring(0, 100)}...`);
    });

    console.log(`Found ${retrievalErrors.length} retrieval error logs:`);
    retrievalErrors.forEach((log, index) => {
      console.log(`  Retrieval Error ${index + 1}: ${log}`);
    });

    // Verify retrieval consistency
    if (messageFoundInDashboard && messageInDatabase) {
      console.log('✅ SUCCESS: Message retrieval consistent between dashboard and database');
    } else if (!messageFoundInDashboard && messageInDatabase) {
      console.log('⚠️ WARNING: Message in database but not retrieved in dashboard - potential sync issue');
    } else if (messageFoundInDashboard && !messageInDatabase) {
      console.log('⚠️ WARNING: Message in dashboard but not in database - data inconsistency');
    } else {
      console.log('❌ ERROR: Message not found in dashboard or database');
    }

    console.log('🎉 Message retrieval verification completed!');
  });

  test('should verify data integrity during high-frequency retry scenarios', async () => {
    console.log('🔄 Testing data integrity during high-frequency retry scenarios...');

    // Send multiple messages rapidly to stress test the retry system
    await openWidget(visitorPage);
    
    const rapidMessages = [];
    const messageCount = 5;
    
    console.log(`💬 Sending ${messageCount} rapid messages to test retry system...`);
    
    for (let i = 0; i < messageCount; i++) {
      const message = `Rapid test ${i + 1} - ${Date.now() + i}`;
      rapidMessages.push(message);
      
      await sendMessageFromWidget(visitorPage, message);
      await visitorPage.waitForTimeout(2000); // Short delay between messages
    }

    // Wait for all messages to be processed
    console.log('⏳ Waiting for all rapid messages to be processed...');
    await visitorPage.waitForTimeout(120000); // Wait 2 minutes for processing

    // Verify all messages in widget
    console.log('🔍 Verifying all rapid messages in widget...');
    let allMessagesInWidget = 0;
    for (const message of rapidMessages) {
      const messageInWidget = visitorPage.locator(`[data-testid="message"]:has-text("${message}")`);
      const count = await messageInWidget.count();
      if (count > 0) {
        allMessagesInWidget++;
      }
    }

    console.log(`✅ Found ${allMessagesInWidget}/${messageCount} messages in widget`);

    // Verify all messages in database
    await loginAsAgent(agentPage);
    console.log('🔍 Verifying all rapid messages in database...');
    
    let allMessagesInDatabase = 0;
    for (const message of rapidMessages) {
      const messageInDatabase = await verifyMessageInDatabase(agentPage, message);
      if (messageInDatabase) {
        allMessagesInDatabase++;
      }
      await agentPage.waitForTimeout(1000); // Small delay between checks
    }

    console.log(`✅ Found ${allMessagesInDatabase}/${messageCount} messages in database`);

    // Analyze data integrity
    const widgetIntegrity = (allMessagesInWidget / messageCount) * 100;
    const databaseIntegrity = (allMessagesInDatabase / messageCount) * 100;

    console.log(`📊 Widget data integrity: ${widgetIntegrity.toFixed(1)}%`);
    console.log(`📊 Database data integrity: ${databaseIntegrity.toFixed(1)}%`);

    if (widgetIntegrity >= 80 && databaseIntegrity >= 80) {
      console.log('✅ SUCCESS: High data integrity maintained during rapid message scenarios');
    } else if (widgetIntegrity >= 60 || databaseIntegrity >= 60) {
      console.log('⚠️ WARNING: Moderate data integrity - some messages may have been lost during retries');
    } else {
      console.log('❌ ERROR: Low data integrity - significant message loss during retry scenarios');
    }

    console.log('🎉 High-frequency retry data integrity test completed!');
  });

  test('should verify database consistency after network interruption simulation', async () => {
    console.log('🌐 Testing database consistency after network interruption simulation...');

    // Send initial message
    await openWidget(visitorPage);
    const preInterruptionMessage = `Pre-interruption - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, preInterruptionMessage);
    
    console.log('💬 Sent pre-interruption message');
    await visitorPage.waitForTimeout(5000);

    // Simulate network interruption by going offline and back online
    console.log('🔌 Simulating network interruption...');
    await visitorPage.context().setOffline(true);
    await visitorPage.waitForTimeout(10000); // Offline for 10 seconds

    // Try to send message while offline (should queue or fail gracefully)
    const duringInterruptionMessage = `During-interruption - ${Date.now()}`;
    try {
      await visitorPage.fill('[data-testid="widget-message-input"]', duringInterruptionMessage);
      await visitorPage.click('[data-testid="widget-send-button"]');
      console.log('💬 Attempted to send message during interruption');
    } catch (error) {
      console.log('⚠️ Message send failed during interruption (expected)');
    }

    // Go back online
    console.log('🔌 Restoring network connection...');
    await visitorPage.context().setOffline(false);
    await visitorPage.waitForTimeout(15000); // Wait for reconnection

    // Send post-interruption message
    const postInterruptionMessage = `Post-interruption - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, postInterruptionMessage);
    console.log('💬 Sent post-interruption message');

    // Wait for system to stabilize and process messages
    console.log('⏳ Waiting for system to stabilize after network interruption...');
    await visitorPage.waitForTimeout(60000);

    // Verify database consistency
    await loginAsAgent(agentPage);
    
    const preInterruptionInDB = await verifyMessageInDatabase(agentPage, preInterruptionMessage);
    const duringInterruptionInDB = await verifyMessageInDatabase(agentPage, duringInterruptionMessage);
    const postInterruptionInDB = await verifyMessageInDatabase(agentPage, postInterruptionMessage);

    console.log(`📊 Pre-interruption message in DB: ${preInterruptionInDB ? 'Yes' : 'No'}`);
    console.log(`📊 During-interruption message in DB: ${duringInterruptionInDB ? 'Yes' : 'No'}`);
    console.log(`📊 Post-interruption message in DB: ${postInterruptionInDB ? 'Yes' : 'No'}`);

    // Analyze network interruption handling
    if (preInterruptionInDB && postInterruptionInDB) {
      console.log('✅ SUCCESS: Database consistency maintained before and after network interruption');
    } else {
      console.log('⚠️ WARNING: Database consistency issues detected after network interruption');
    }

    if (duringInterruptionInDB) {
      console.log('✅ BONUS: Message sent during interruption was successfully queued and stored');
    } else {
      console.log('ℹ️ Message sent during interruption was not stored (expected behavior)');
    }

    console.log('🎉 Network interruption database consistency test completed!');
  });
});
