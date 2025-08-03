const { chromium } = require('playwright');

async function testAgentSendDebug() {
  console.log('🎯 DEBUGGING AGENT SEND FUNCTIONALITY');
  console.log('====================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all console messages and errors
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('\n--- Step 1: Login as Agent ---');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Agent logged in');
    
    console.log('\n--- Step 2: Navigate to Inbox ---');
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForTimeout(5000);
    console.log('✅ Inbox loaded');
    
    console.log('\n--- Step 3: Open Conversation ---');
    const conversationCount = await page.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Found ${conversationCount} conversations`);
    
    if (conversationCount > 0) {
      await page.click('[data-testid="conversation-item"], .conversation, .conversation-item');
      await page.waitForTimeout(3000);
      console.log('✅ Conversation opened');
      
      console.log('\n--- Step 4: Debug Message Input ---');
      
      // Check all possible input elements
      const inputSelectors = [
        'textarea[placeholder*="message"]',
        '[data-testid="message-input"]',
        'input[placeholder*="message"]',
        'textarea',
        '.message-input'
      ];
      
      for (const selector of inputSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ Found input: ${selector} (count: ${count})`);
          const isVisible = await page.locator(selector).first().isVisible();
          const isEnabled = await page.locator(selector).first().isEnabled();
          console.log(`  - Visible: ${isVisible}, Enabled: ${isEnabled}`);
        }
      }
      
      console.log('\n--- Step 5: Debug Send Buttons ---');
      
      // Check all possible send button elements
      const sendSelectors = [
        'button[aria-label="Send message"]',
        'button[aria-label*="Send"]',
        'button[type="submit"]',
        'button:has-text("Send")',
        '[data-testid="send-button"]',
        'button:has([class*="send"])',
        'button:has(svg)'
      ];
      
      for (const selector of sendSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ Found send button: ${selector} (count: ${count})`);
          const isVisible = await page.locator(selector).first().isVisible();
          const isEnabled = await page.locator(selector).first().isEnabled();
          console.log(`  - Visible: ${isVisible}, Enabled: ${isEnabled}`);
        }
      }
      
      console.log('\n--- Step 6: Test Message Sending ---');
      
      const testMessage = `Debug test ${Date.now()}`;
      
      // Fill the input
      await page.fill('textarea[placeholder*="message"]', testMessage);
      console.log(`✅ Message typed: ${testMessage}`);
      
      // Wait a moment for any state changes
      await page.waitForTimeout(1000);
      
      // Check if send button is enabled after typing
      const sendButton = page.locator('button[aria-label="Send message"]');
      const isEnabledAfterTyping = await sendButton.isEnabled();
      console.log(`Send button enabled after typing: ${isEnabledAfterTyping}`);
      
      // Try to send the message
      console.log('Attempting to send message...');
      await page.click('button[aria-label="Send message"]', { force: true });
      console.log('✅ Send button clicked');
      
      // Wait and check for any network requests
      await page.waitForTimeout(5000);
      console.log('⏳ Waited 5 seconds for message processing');
      
      // Check if input was cleared (indicates successful send)
      const inputValue = await page.locator('textarea[placeholder*="message"]').inputValue();
      console.log(`Input value after send: "${inputValue}"`);
      
      if (inputValue === '') {
        console.log('✅ Input cleared - message likely sent successfully');
      } else {
        console.log('❌ Input not cleared - message send may have failed');
      }
      
    } else {
      console.log('❌ No conversations found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'agent-send-debug.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🎉 AGENT SEND DEBUG COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'agent-send-debug-error.png', fullPage: true });
  }
  
  await browser.close();
}

testAgentSendDebug();
