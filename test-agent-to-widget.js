const puppeteer = require('puppeteer');

async function testAgentToWidget() {
  console.log('🧪 Testing Agent → Widget Communication...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Track all relevant logs
    const logs = {
      agentMessages: [],
      widgetMessages: [],
      realtimeEvents: [],
      connectionStatus: [],
      errors: [],
      authEvents: []
    };
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[BROWSER] ${text}`);
      
      // Categorize logs
      if (text.includes('Message sent') || text.includes('Message received')) {
        logs.agentMessages.push(text);
      }
      if (text.includes('realtime') || text.includes('channel')) {
        logs.realtimeEvents.push(text);
      }
      if (text.includes('connected') || text.includes('disconnected')) {
        logs.connectionStatus.push(text);
      }
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        logs.errors.push(text);
      }
      if (text.includes('auth') || text.includes('Auth') || text.includes('login')) {
        logs.authEvents.push(text);
      }
    });
    
    // Step 1: Login as agent
    console.log('🔐 Logging in as agent...');
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for login page...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill login form
    await page.type('input[type="email"]', 'jam@jam.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for login to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Go to dashboard and find a conversation
    console.log('📊 Navigating to agent dashboard...');
    await page.goto('http://localhost:3001/dashboard/inbox', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for conversations
    console.log('🔍 Looking for conversations in dashboard...');
    const conversationElements = await page.$$('[data-testid="conversation"], .conversation, [class*="conversation"]');
    console.log(`💬 Found ${conversationElements.length} conversation elements in dashboard`);
    
    if (conversationElements.length === 0) {
      console.log('⚠️ No conversations found, creating one via widget first...');
      
      // Go to homepage and create a conversation via widget
      await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const widgetButton = await page.$('[data-testid="widget-button"]');
      if (widgetButton) {
        await widgetButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const messageInput = await page.$('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="message-input"]');
        if (messageInput) {
          await messageInput.type('Test message to create conversation');
          await messageInput.press('Enter');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Go back to dashboard
      await page.goto('http://localhost:3001/dashboard/inbox', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Try to click on first conversation
    console.log('🔍 Looking for conversation to click...');
    const conversations = await page.$$('[data-testid="conversation"], .conversation, [class*="conversation"]');
    
    if (conversations.length > 0) {
      console.log('✅ Found conversations, clicking on first one...');
      await conversations[0].click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for agent message input
      console.log('🔍 Looking for agent message input...');
      const agentInput = await page.$('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="agent-input"], [data-testid="message-input"]');
      
      if (agentInput) {
        console.log('✅ Agent input found!');
        console.log('📝 Typing agent response...');
        await agentInput.type('Hello from agent! This is a test message.');
        await agentInput.press('Enter');
        
        console.log('⏳ Waiting for agent message to be sent...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if message appears in dashboard
        console.log('🔍 Checking if agent message appears in dashboard...');
        const dashboardMessages = await page.$$('[data-testid="message"], .message, [class*="message"]');
        console.log(`📨 Found ${dashboardMessages.length} message elements in dashboard after sending`);
        
      } else {
        console.log('⚠️ Agent input not found, trying alternative selectors...');
        const altInputs = await page.$$('input, textarea');
        console.log(`Found ${altInputs.length} input elements`);
        
        if (altInputs.length > 0) {
          console.log('✅ Found input field, attempting to type...');
          await altInputs[0].type('Hello from agent! This is a test message.');
          await altInputs[0].press('Enter');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    } else {
      console.log('❌ No conversations found to test with');
    }
    
    // Step 3: Test if widget receives the message
    console.log('🔄 Testing if widget receives agent message...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for widget to reload...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reopen widget
    const widgetButton2 = await page.$('[data-testid="widget-button"]');
    if (widgetButton2) {
      console.log('🖱️ Reopening widget...');
      await widgetButton2.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Check for agent messages in widget
    console.log('🔍 Checking for agent messages in widget...');
    const finalMessages = await page.$$('[data-testid="message"], .message, [class*="message"]');
    console.log(`📨 Final message count in widget: ${finalMessages.length}`);
    
    // Try to find agent messages specifically
    const pageContent = await page.content();
    const hasAgentMessage = pageContent.includes('Hello from agent') || pageContent.includes('agent');
    console.log(`🔍 Widget contains agent message: ${hasAgentMessage ? 'YES' : 'NO'}`);
    
    // Analyze results
    console.log('\n📊 AGENT → WIDGET COMMUNICATION TEST RESULTS:');
    console.log('=' .repeat(55));
    
    console.log(`🔐 Auth Events: ${logs.authEvents.length}`);
    logs.authEvents.slice(0, 5).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event}`);
    });
    if (logs.authEvents.length > 5) {
      console.log(`  ... and ${logs.authEvents.length - 5} more`);
    }
    
    console.log(`🔗 Realtime Events: ${logs.realtimeEvents.length}`);
    logs.realtimeEvents.slice(0, 10).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event}`);
    });
    if (logs.realtimeEvents.length > 10) {
      console.log(`  ... and ${logs.realtimeEvents.length - 10} more`);
    }
    
    console.log(`📡 Connection Status: ${logs.connectionStatus.length}`);
    logs.connectionStatus.forEach((status, index) => {
      console.log(`  ${index + 1}. ${status}`);
    });
    
    console.log(`📨 Agent Messages: ${logs.agentMessages.length}`);
    logs.agentMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg}`);
    });
    
    console.log(`❌ Errors: ${logs.errors.length}`);
    logs.errors.slice(0, 5).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    if (logs.errors.length > 5) {
      console.log(`  ... and ${logs.errors.length - 5} more`);
    }
    
    // Success criteria
    const hasAuthEvents = logs.authEvents.length > 0;
    const hasRealtimeEvents = logs.realtimeEvents.length > 0;
    const hasConnectionStatus = logs.connectionStatus.length > 0;
    const hasAgentMessages = logs.agentMessages.length > 0;
    const hasDashboardMessages = finalMessages.length > 0;
    const hasFinalMessages = finalMessages.length > 0;
    const hasAgentMessageInWidget = hasAgentMessage;
    
    console.log('\n🎯 SUCCESS CRITERIA:');
    console.log(`✅ Auth Events: ${hasAuthEvents ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Realtime Events: ${hasRealtimeEvents ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Connection Status: ${hasConnectionStatus ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Agent Messages: ${hasAgentMessages ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard Messages: ${hasDashboardMessages ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Final Messages: ${hasFinalMessages ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Agent Message in Widget: ${hasAgentMessageInWidget ? 'PASS' : 'FAIL'}`);
    
    const overallSuccess = hasAuthEvents && hasRealtimeEvents && hasConnectionStatus && hasAgentMessages && hasAgentMessageInWidget;
    
    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: Agent → Widget communication is working!');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some aspects of agent → widget communication may need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAgentToWidget(); 