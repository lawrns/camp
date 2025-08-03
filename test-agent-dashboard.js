const { chromium } = require('playwright');

async function testAgentDashboard() {
  console.log('🎯 TESTING AGENT DASHBOARD MESSAGE RECEPTION');
  console.log('===========================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });
  
  try {
    console.log('\n--- Step 1: Login as Agent ---');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Agent logged in');
    
    console.log('\n--- Step 2: Navigate to Inbox ---');
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForTimeout(3000);
    console.log('✅ Inbox loaded');
    
    console.log('\n--- Step 3: Check for Conversations ---');
    const conversationElements = await page.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Conversation elements found: ${conversationElements}`);
    
    if (conversationElements > 0) {
      console.log('✅ Conversations found in dashboard');
      
      // Click on the first conversation
      await page.click('[data-testid="conversation-item"], .conversation, .conversation-item');
      await page.waitForTimeout(2000);
      console.log('✅ Conversation opened');
      
      // Check for messages
      const messageElements = await page.locator('[data-testid="message"], .message, .chat-message').count();
      console.log(`Message elements found: ${messageElements}`);
      
      if (messageElements > 0) {
        console.log('✅ Messages found in conversation');
        
        // Get message content
        const messageContent = await page.locator('[data-testid="message"], .message, .chat-message').first().textContent();
        console.log(`First message content: ${messageContent}`);
        
        // Check if it's our test message
        if (messageContent && messageContent.includes('E2E Test Message')) {
          console.log('🎉 SUCCESS: Agent dashboard received widget message!');
        } else {
          console.log('⚠️ Message found but not our test message');
        }
      } else {
        console.log('❌ No messages found in conversation');
      }
    } else {
      console.log('❌ No conversations found in dashboard');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'agent-dashboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🎉 AGENT DASHBOARD TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'agent-dashboard-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  }
  
  await browser.close();
}

testAgentDashboard();
