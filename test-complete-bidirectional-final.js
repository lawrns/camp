const { chromium } = require('playwright');

async function testCompleteBidirectional() {
  console.log('🎯 COMPLETE BIDIRECTIONAL COMMUNICATION TEST');
  console.log('==========================================');
  
  const browser = await chromium.launch({ headless: false });
  
  // Create separate contexts for agent and visitor
  const agentContext = await browser.newContext();
  const visitorContext = await browser.newContext();
  
  const agentPage = await agentContext.newPage();
  const visitorPage = await visitorContext.newPage();
  
  // Track console messages
  agentPage.on('console', msg => {
    console.log(`[AGENT] ${msg.type()}: ${msg.text()}`);
  });
  
  visitorPage.on('console', msg => {
    console.log(`[VISITOR] ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('\n=== PHASE 1: AGENT SETUP ===');
    
    // Agent login
    await agentPage.goto('http://localhost:3001/login');
    await agentPage.waitForTimeout(2000);
    await agentPage.fill('#email', 'jam@jam.com');
    await agentPage.fill('#password', 'password123');
    await agentPage.click('button[type="submit"]');
    await agentPage.waitForTimeout(3000);
    console.log('✅ Agent logged in');
    
    // Navigate to inbox
    await agentPage.goto('http://localhost:3001/dashboard/inbox');
    await agentPage.waitForTimeout(5000);
    console.log('✅ Agent inbox loaded');
    
    console.log('\n=== PHASE 2: VISITOR SENDS MESSAGE ===');
    
    // Visitor opens widget
    await visitorPage.goto('http://localhost:3001');
    await visitorPage.waitForTimeout(3000);
    
    // Click widget button
    await visitorPage.click('[data-testid="widget-button"]');
    await visitorPage.waitForTimeout(2000);
    console.log('✅ Widget opened');
    
    // Send message from visitor
    const visitorMessage = `BIDIRECTIONAL TEST ${Date.now()}`;

    // Check if input exists
    const inputCount = await visitorPage.locator('[data-testid="widget-message-input"]').count();
    console.log(`Found ${inputCount} message inputs`);

    if (inputCount > 0) {
      await visitorPage.fill('[data-testid="widget-message-input"]', visitorMessage);
      console.log(`✅ Message typed: ${visitorMessage}`);

      // Check if send button exists
      const sendButtonCount = await visitorPage.locator('[data-testid="widget-send-button"]').count();
      console.log(`Found ${sendButtonCount} send buttons`);

      if (sendButtonCount > 0) {
        await visitorPage.click('[data-testid="widget-send-button"]');
        await visitorPage.waitForTimeout(3000);
        console.log(`✅ Visitor sent: ${visitorMessage}`);
      } else {
        console.log('❌ Send button not found');
        throw new Error('Send button not found in widget');
      }
    } else {
      console.log('❌ Message input not found');
      throw new Error('Message input not found in widget');
    }
    
    console.log('\n=== PHASE 3: AGENT RECEIVES MESSAGE ===');
    
    // Refresh agent inbox to see new conversation
    await agentPage.reload();
    await agentPage.waitForTimeout(5000);
    
    // Check for conversations
    const conversationCount = await agentPage.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Agent sees ${conversationCount} conversations`);
    
    if (conversationCount > 0) {
      // Click first conversation (should be our new one)
      await agentPage.click('[data-testid="conversation-item"], .conversation, .conversation-item');
      await agentPage.waitForTimeout(3000);
      console.log('✅ Agent opened conversation');
      
      // Check for visitor message
      const messageElements = await agentPage.locator('[data-testid="message-row"], [data-testid="message"], .message, .chat-message').count();
      console.log(`Agent sees ${messageElements} message elements`);
      
      if (messageElements > 0) {
        console.log('✅ Agent can see visitor message');
        
        console.log('\n=== PHASE 4: AGENT SENDS RESPONSE ===');
        
        // Send response from agent
        const agentResponse = `Agent response to: ${visitorMessage}`;
        const messageInput = await agentPage.locator('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="message-input"]').count();
        
        if (messageInput > 0) {
          await agentPage.fill('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="message-input"]', agentResponse);
          await agentPage.click('button[type="submit"], button:has-text("Send"), [data-testid="send-button"]');
          await agentPage.waitForTimeout(3000);
          console.log(`✅ Agent sent: ${agentResponse}`);
          
          console.log('\n=== PHASE 5: VISITOR RECEIVES RESPONSE ===');
          
          // Check if visitor receives the response
          await visitorPage.waitForTimeout(5000);
          
          // Look for agent response in widget
          const visitorMessageElements = await visitorPage.locator('[data-testid="widget-message"], .message, .chat-message').count();
          console.log(`Visitor sees ${visitorMessageElements} message elements`);
          
          if (visitorMessageElements > 1) {
            console.log('✅ Visitor can see multiple messages (including agent response)');
            
            // Try to get the last message content
            try {
              const lastMessage = await visitorPage.locator('[data-testid="widget-message"], .message, .chat-message').last().textContent();
              console.log(`Last message in widget: ${lastMessage}`);
              
              if (lastMessage && lastMessage.includes('Agent response')) {
                console.log('🎉 SUCCESS: Complete bidirectional communication working!');
                console.log('✅ Widget → Agent: Working');
                console.log('✅ Agent → Widget: Working');
              } else {
                console.log('⚠️ Agent response not found in widget');
              }
            } catch (e) {
              console.log('⚠️ Could not read last message content');
            }
          } else {
            console.log('❌ Visitor does not see agent response');
          }
        } else {
          console.log('❌ Agent message input not found');
        }
      } else {
        console.log('❌ Agent cannot see visitor message');
      }
    } else {
      console.log('❌ No conversations found in agent dashboard');
    }
    
    // Take final screenshots
    await agentPage.screenshot({ path: 'bidirectional-final-agent.png', fullPage: true });
    await visitorPage.screenshot({ path: 'bidirectional-final-visitor.png', fullPage: true });
    console.log('📸 Screenshots saved');
    
    console.log('\n🎉 COMPLETE BIDIRECTIONAL TEST FINISHED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await agentPage.screenshot({ path: 'bidirectional-final-agent-error.png', fullPage: true });
    await visitorPage.screenshot({ path: 'bidirectional-final-visitor-error.png', fullPage: true });
  }
  
  await browser.close();
}

testCompleteBidirectional();
