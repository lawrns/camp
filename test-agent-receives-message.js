const { chromium } = require('playwright');

async function testAgentReceivesMessage() {
  console.log('🎯 TESTING AGENT RECEIVES WIDGET MESSAGE');
  console.log('======================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
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
    await page.waitForTimeout(5000);
    console.log('✅ Inbox loaded');
    
    console.log('\n--- Step 3: Look for Test Conversation ---');
    
    // Check for conversations
    const conversationElements = await page.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Found ${conversationElements} conversations`);
    
    if (conversationElements > 0) {
      console.log('✅ Conversations found');
      
      // Look for our specific conversation by checking text content
      const conversations = await page.locator('[data-testid="conversation-item"], .conversation, .conversation-item').all();
      
      let foundTestConversation = false;
      for (let i = 0; i < Math.min(conversations.length, 10); i++) {
        try {
          const conversationText = await conversations[i].textContent();
          console.log(`Conversation ${i + 1}: ${conversationText?.substring(0, 100)}...`);
          
          if (conversationText && conversationText.includes('Test message')) {
            console.log(`🎯 Found test conversation at index ${i + 1}`);
            await conversations[i].click();
            await page.waitForTimeout(3000);
            foundTestConversation = true;
            break;
          }
        } catch (e) {
          console.log(`Could not read conversation ${i + 1}: ${e.message}`);
        }
      }
      
      if (!foundTestConversation) {
        console.log('⚠️ Test conversation not found, clicking first conversation');
        await conversations[0].click();
        await page.waitForTimeout(3000);
      }
      
      console.log('✅ Conversation opened');
      
      console.log('\n--- Step 4: Check for Messages ---');
      
      // Check for messages in the conversation
      const messageElements = await page.locator('[data-testid="message-row"], [data-testid="message"], .message, .chat-message').count();
      console.log(`Found ${messageElements} message elements`);
      
      if (messageElements > 0) {
        console.log('✅ Messages found in conversation');
        
        // Get all message content
        const messages = await page.locator('[data-testid="message-row"], [data-testid="message"], .message, .chat-message').all();
        
        for (let i = 0; i < messages.length; i++) {
          try {
            const messageContent = await messages[i].textContent();
            console.log(`Message ${i + 1}: ${messageContent?.substring(0, 100)}...`);
            
            if (messageContent && messageContent.includes('Test message')) {
              console.log('🎉 SUCCESS: Found test message in agent dashboard!');
              console.log(`Full message: ${messageContent}`);
              break;
            }
          } catch (e) {
            console.log(`Could not read message ${i + 1}: ${e.message}`);
          }
        }
      } else {
        console.log('❌ No messages found in conversation');
        
        // Check page content for any test messages
        const pageContent = await page.content();
        if (pageContent.includes('Test message')) {
          console.log('⚠️ Test message found in page content but not in message elements');
        } else {
          console.log('❌ Test message not found anywhere on page');
        }
      }
      
    } else {
      console.log('❌ No conversations found in dashboard');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'agent-receives-message-test.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🎉 AGENT RECEIVES MESSAGE TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'agent-receives-message-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  }
  
  await browser.close();
}

testAgentReceivesMessage();
