const { chromium } = require('playwright');

async function testRealtimeCommunication() {
  console.log('🎯 TESTING REAL-TIME COMMUNICATION');
  console.log('=================================');
  
  const browser = await chromium.launch({ headless: false });
  
  // Create separate contexts
  const agentContext = await browser.newContext();
  const visitorContext = await browser.newContext();
  
  const agentPage = await agentContext.newPage();
  const visitorPage = await visitorContext.newPage();
  
  // Track console messages
  const agentLogs = [];
  const visitorLogs = [];
  
  agentPage.on('console', msg => {
    const log = `[AGENT] ${msg.type()}: ${msg.text()}`;
    agentLogs.push(log);
    console.log(log);
  });
  
  visitorPage.on('console', msg => {
    const log = `[VISITOR] ${msg.type()}: ${msg.text()}`;
    visitorLogs.push(log);
    console.log(log);
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
    const testMessage = `REALTIME TEST ${Date.now()}`;
    await visitorPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', testMessage);
    await visitorPage.click('button[type="submit"], button:has-text("Send")');
    await visitorPage.waitForTimeout(2000);
    console.log(`✅ Visitor sent: ${testMessage}`);
    
    console.log('\n=== PHASE 3: WAIT FOR REAL-TIME PROPAGATION ===');
    
    // Wait for real-time propagation
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('⏳ Waited 10 seconds for real-time propagation');
    
    console.log('\n=== PHASE 4: CHECK AGENT DASHBOARD ===');
    
    // Refresh agent page to ensure latest data
    await agentPage.reload();
    await agentPage.waitForTimeout(3000);
    
    // Check for conversations
    const conversationCount = await agentPage.locator('[data-testid="conversation-item"], .conversation, .conversation-item').count();
    console.log(`Agent sees ${conversationCount} conversations`);
    
    if (conversationCount > 0) {
      // Click first conversation
      await agentPage.click('[data-testid="conversation-item"], .conversation, .conversation-item');
      await agentPage.waitForTimeout(3000);
      console.log('✅ Agent opened conversation');
      
      // Check for messages
      const messageElements = await agentPage.locator('[data-testid="message"], .message, .chat-message').count();
      console.log(`Agent sees ${messageElements} message elements`);
      
      // Try to find our test message
      const pageContent = await agentPage.content();
      const hasTestMessage = pageContent.includes('REALTIME TEST');
      
      if (hasTestMessage) {
        console.log('🎉 SUCCESS: Agent dashboard received widget message!');
      } else {
        console.log('❌ FAILED: Test message not found in agent dashboard');
        
        // Check if message is in database
        console.log('\n=== PHASE 5: DATABASE VERIFICATION ===');
        
        // Get conversation ID from logs
        const conversationIdMatch = visitorLogs.find(log => log.includes('Created new conversation:'));
        if (conversationIdMatch) {
          const conversationId = conversationIdMatch.match(/([a-f0-9-]{36})/)?.[1];
          console.log(`Found conversation ID: ${conversationId}`);
          
          // We'll verify this manually in the database
        }
      }
    } else {
      console.log('❌ No conversations found in agent dashboard');
    }
    
    console.log('\n=== PHASE 6: ANALYZE LOGS ===');
    
    // Check for realtime connection logs
    const agentRealtimeLogs = agentLogs.filter(log => log.includes('Channel') || log.includes('realtime') || log.includes('postgres_changes'));
    const visitorRealtimeLogs = visitorLogs.filter(log => log.includes('Channel') || log.includes('realtime') || log.includes('broadcast'));
    
    console.log('\n--- Agent Realtime Logs ---');
    agentRealtimeLogs.slice(-10).forEach(log => console.log(log));
    
    console.log('\n--- Visitor Realtime Logs ---');
    visitorRealtimeLogs.slice(-10).forEach(log => console.log(log));
    
    // Check for broadcast logs
    const broadcastLogs = visitorLogs.filter(log => log.includes('broadcast') || log.includes('Broadcasting'));
    console.log('\n--- Broadcast Logs ---');
    broadcastLogs.forEach(log => console.log(log));
    
    // Take screenshots
    await agentPage.screenshot({ path: 'realtime-agent-final.png', fullPage: true });
    await visitorPage.screenshot({ path: 'realtime-visitor-final.png', fullPage: true });
    console.log('📸 Screenshots saved');
    
    console.log('\n🎉 REAL-TIME COMMUNICATION TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await agentPage.screenshot({ path: 'realtime-agent-error.png', fullPage: true });
    await visitorPage.screenshot({ path: 'realtime-visitor-error.png', fullPage: true });
  }
  
  await browser.close();
}

testRealtimeCommunication();
