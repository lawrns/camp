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
  
  // Listen for console messages
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
    await agentPage.waitForTimeout(3000);
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
    const visitorMessage = `Bidirectional Test ${Date.now()}`;
    await visitorPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', visitorMessage);
    await visitorPage.click('button[type="submit"], button:has-text("Send")');
    await visitorPage.waitForTimeout(3000);
    console.log(`✅ Visitor sent: ${visitorMessage}`);
    
    console.log('\n=== PHASE 3: AGENT RECEIVES MESSAGE ===');
    
    // Refresh agent inbox to see new conversation
    await agentPage.reload();
    await agentPage.waitForTimeout(3000);
    
    // Check for conversations
    const conversationCount = await agentPage.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Agent sees ${conversationCount} conversations`);
    
    if (conversationCount > 0) {
      // Click first conversation
      await agentPage.click('[data-testid="conversation-item"], .conversation, .conversation-item');
      await agentPage.waitForTimeout(2000);
      console.log('✅ Agent opened conversation');
      
      console.log('\n=== PHASE 4: AGENT SENDS RESPONSE ===');
      
      // Send response from agent
      const agentResponse = `Agent response ${Date.now()}`;
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
        const messageElements = await visitorPage.locator('[data-testid="widget-message"], .message, .chat-message').count();
        console.log(`Visitor sees ${messageElements} message elements`);
        
        if (messageElements > 0) {
          console.log('✅ Messages found in widget');
          
          // Try to get message content
          try {
            const messageContent = await visitorPage.locator('[data-testid="widget-message"], .message, .chat-message').last().textContent();
            console.log(`Last message content: ${messageContent}`);
            
            if (messageContent && messageContent.includes('Agent response')) {
              console.log('🎉 SUCCESS: Complete bidirectional communication working!');
            } else {
              console.log('⚠️ Message found but not agent response');
            }
          } catch (e) {
            console.log('⚠️ Could not read message content');
          }
        } else {
          console.log('❌ No messages visible in widget UI');
        }
      } else {
        console.log('❌ Agent message input not found');
      }
    } else {
      console.log('❌ No conversations found in agent dashboard');
    }
    
    // Take final screenshots
    await agentPage.screenshot({ path: 'bidirectional-agent-final.png', fullPage: true });
    await visitorPage.screenshot({ path: 'bidirectional-visitor-final.png', fullPage: true });
    console.log('📸 Screenshots saved');
    
    console.log('\n🎉 COMPLETE BIDIRECTIONAL TEST FINISHED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await agentPage.screenshot({ path: 'bidirectional-agent-error.png', fullPage: true });
    await visitorPage.screenshot({ path: 'bidirectional-visitor-error.png', fullPage: true });
  }
  
  await browser.close();
}

testCompleteBidirectional();
