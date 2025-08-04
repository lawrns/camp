import { test, expect } from '@playwright/test';

test('Debug bidirectional real-time communication', async ({ browser }) => {
  console.log('🔍 Debugging bidirectional real-time communication...');

  const context = await browser.newContext();
  const agentPage = await context.newPage();
  const widgetPage = await context.newPage();

  try {
    // Step 1: Setup agent (dashboard)
    console.log('👤 Setting up agent...');
    await agentPage.goto('http://localhost:3001/login');
    await agentPage.waitForLoadState('networkidle');
    
    await agentPage.fill('#email', 'jam@jam.com');
    await agentPage.fill('#password', 'password123');
    await agentPage.click('button[type="submit"]');
    
    await agentPage.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Agent logged in successfully');

    // Navigate to inbox
    await agentPage.goto('http://localhost:3001/dashboard/inbox');
    await agentPage.waitForLoadState('networkidle');
    await agentPage.waitForTimeout(3000);
    console.log('✅ Agent in inbox');

    // Step 2: Setup widget (homepage)
    console.log('💬 Setting up widget...');
    await widgetPage.goto('http://localhost:3001/');
    await widgetPage.waitForLoadState('networkidle');
    await widgetPage.waitForTimeout(3000);
    console.log('✅ Widget page loaded');

    // Open widget
    const widgetButton = widgetPage.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    await widgetButton.click();
    console.log('✅ Widget opened');

    const widgetPanel = widgetPage.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 10000 });
    console.log('✅ Widget panel visible');

    // Step 3: Send message from widget
    console.log('📤 Sending message from widget...');
    const widgetMessageInput = widgetPage.locator('[data-testid="widget-message-input"], input[placeholder*="message"], textarea[placeholder*="message"]');
    await expect(widgetMessageInput).toBeVisible();
    
    const widgetMessage = `Widget test message ${Date.now()}`;
    await widgetMessageInput.fill(widgetMessage);
    console.log(`✅ Typed widget message: ${widgetMessage}`);

    const widgetSendButton = widgetPage.locator('[data-testid="widget-send-button"], button[aria-label*="send"], button[aria-label*="Send"]');
    await expect(widgetSendButton).toBeVisible();
    await widgetSendButton.click();
    console.log('✅ Widget message sent');

    // Step 4: Check if message appears in agent dashboard
    console.log('👤 Checking agent dashboard for widget message...');
    
    // Wait for conversation to appear
    await agentPage.waitForTimeout(5000);
    
    // Look for the conversation with the widget message
    const conversationElements = agentPage.locator('[data-testid="conversation-row"], [data-testid="conversation-card"], .conversation-item');
    const conversationCount = await conversationElements.count();
    console.log(`📋 Found ${conversationCount} conversations in agent dashboard`);

    // Click on first conversation
    if (conversationCount > 0) {
      await conversationElements.first().click();
      console.log('✅ Clicked on first conversation');
      
      // Wait for messages to load
      await agentPage.waitForTimeout(3000);
      
      // Check if widget message appears in agent view
      const widgetMessageInAgent = agentPage.locator(`text="${widgetMessage}"`);
      const messageFound = await widgetMessageInAgent.count();
      console.log(`🔍 Widget message found in agent view: ${messageFound > 0 ? 'YES' : 'NO'}`);
      
      if (messageFound === 0) {
        console.log('❌ ERROR: Widget message not found in agent dashboard!');
        console.log('🔍 This indicates a threading or real-time communication issue');
        
        // Check what messages are actually visible
        const allMessages = agentPage.locator('[data-testid="message"], .message, .chat-message');
        const messageCount = await allMessages.count();
        console.log(`📝 Total messages visible in agent view: ${messageCount}`);
        
        // Get text of visible messages
        for (let i = 0; i < Math.min(messageCount, 5); i++) {
          const messageText = await allMessages.nth(i).textContent();
          console.log(`  Message ${i + 1}: ${messageText?.substring(0, 100)}...`);
        }
        
        // STOP HERE - Found the first error
        throw new Error('Widget message not appearing in agent dashboard - threading issue detected');
      }
    } else {
      console.log('❌ ERROR: No conversations found in agent dashboard!');
      throw new Error('No conversations visible in agent dashboard - threading issue detected');
    }

    // Step 5: Send message from agent back to widget
    console.log('👤 Sending message from agent...');
    const agentMessageInput = agentPage.locator('textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="message-input"]');
    await expect(agentMessageInput).toBeVisible();
    
    const agentMessage = `Agent test message ${Date.now()}`;
    await agentMessageInput.fill(agentMessage);
    console.log(`✅ Typed agent message: ${agentMessage}`);

    const agentSendButton = agentPage.locator('[data-testid="composer-send-button"], button[aria-label*="Send"]');
    await expect(agentSendButton).toBeVisible();
    await agentSendButton.click();
    console.log('✅ Agent message sent');

    // Step 6: Check if agent message appears in widget
    console.log('💬 Checking widget for agent message...');
    await widgetPage.waitForTimeout(5000);
    
    const agentMessageInWidget = widgetPage.locator(`text="${agentMessage}"`);
    const agentMessageFound = await agentMessageInWidget.count();
    console.log(`🔍 Agent message found in widget: ${agentMessageFound > 0 ? 'YES' : 'NO'}`);
    
    if (agentMessageFound === 0) {
      console.log('❌ ERROR: Agent message not found in widget!');
      console.log('🔍 This indicates a bidirectional communication issue');
      
      // Check what messages are visible in widget
      const widgetMessages = widgetPage.locator('[data-testid="widget-message"], .message, .chat-message');
      const widgetMessageCount = await widgetMessages.count();
      console.log(`📝 Total messages visible in widget: ${widgetMessageCount}`);
      
      // Get text of visible messages
      for (let i = 0; i < Math.min(widgetMessageCount, 5); i++) {
        const messageText = await widgetMessages.nth(i).textContent();
        console.log(`  Widget Message ${i + 1}: ${messageText?.substring(0, 100)}...`);
      }
      
      throw new Error('Agent message not appearing in widget - bidirectional communication issue detected');
    }

    console.log('✅ Bidirectional communication test completed successfully');

  } catch (error) {
    console.log(`❌ ERROR DETECTED: ${error.message}`);
    console.log('🔍 Stopping investigation at first error as requested');
    throw error;
  } finally {
    await context.close();
  }
}); 