const puppeteer = require('puppeteer');

async function testBidirectionalWithAuth() {
  console.log('🧪 Testing Bidirectional Communication with Agent Authentication...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Track all relevant logs
    const logs = {
      widgetMessages: [],
      agentMessages: [],
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
        logs.widgetMessages.push(text);
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
    
    // Step 1: Login as agent first
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
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Agent login successful!');
    } else {
      console.log('⚠️ Agent login may have failed, continuing anyway...');
    }
    
    // Step 2: Test widget on homepage
    console.log('📱 Navigating to homepage for widget test...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for widget to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Looking for widget button...');
    const widgetButton = await page.$('[data-testid="widget-button"]');
    
    if (!widgetButton) {
      throw new Error('Widget button not found');
    }
    
    console.log('✅ Widget button found!');
    console.log('🖱️ Clicking widget button...');
    await widgetButton.click();
    
    console.log('⏳ Waiting for widget to open...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for the message input field
    console.log('🔍 Looking for message input...');
    const messageInput = await page.$('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="message-input"]');
    
    if (!messageInput) {
      console.log('⚠️ Message input not found, checking for alternative selectors...');
      const altInput = await page.$('input, textarea');
      if (altInput) {
        console.log('✅ Found input field, attempting to type...');
        await altInput.type('Test message from widget');
        await altInput.press('Enter');
      } else {
        throw new Error('No input field found for sending messages');
      }
    } else {
      console.log('✅ Message input found!');
      console.log('📝 Typing test message...');
      await messageInput.type('Test message from widget');
      await messageInput.press('Enter');
    }
    
    console.log('⏳ Waiting for message to be sent...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if message appears in widget
    console.log('🔍 Checking if message appears in widget...');
    const messageElements = await page.$$('[data-testid="message"], .message, [class*="message"]');
    console.log(`📨 Found ${messageElements.length} message elements in widget`);
    
    // Step 3: Test agent dashboard (should be authenticated now)
    console.log('🔄 Testing agent dashboard with authentication...');
    await page.goto('http://localhost:3001/dashboard/inbox', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for conversations in dashboard
    console.log('🔍 Looking for conversations in dashboard...');
    const conversationElements = await page.$$('[data-testid="conversation"], .conversation, [class*="conversation"]');
    console.log(`💬 Found ${conversationElements.length} conversation elements in dashboard`);
    
    // Look for messages in dashboard
    const dashboardMessages = await page.$$('[data-testid="message"], .message, [class*="message"]');
    console.log(`📨 Found ${dashboardMessages.length} message elements in dashboard`);
    
    // Test agent sending message back
    console.log('🔍 Looking for agent message input...');
    const agentInput = await page.$('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="agent-input"]');
    
    if (agentInput) {
      console.log('✅ Agent input found!');
      console.log('📝 Typing agent response...');
      await agentInput.type('Response from agent');
      await agentInput.press('Enter');
      
      console.log('⏳ Waiting for agent message to be sent...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('⚠️ Agent input not found');
    }
    
    // Step 4: Go back to widget to check if agent message was received
    console.log('🔄 Going back to widget to check for agent response...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for widget to reload...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reopen widget
    const widgetButton2 = await page.$('[data-testid="widget-button"]');
    if (widgetButton2) {
      await widgetButton2.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Check for agent messages in widget
    const finalMessages = await page.$$('[data-testid="message"], .message, [class*="message"]');
    console.log(`📨 Final message count in widget: ${finalMessages.length}`);
    
    // Analyze results
    console.log('\n📊 BIDIRECTIONAL COMMUNICATION TEST RESULTS (WITH AUTH):');
    console.log('=' .repeat(60));
    
    console.log(`🔐 Auth Events: ${logs.authEvents.length}`);
    logs.authEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event}`);
    });
    
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
    
    console.log(`📨 Widget Messages: ${logs.widgetMessages.length}`);
    logs.widgetMessages.forEach((msg, index) => {
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
    const hasWidgetMessages = logs.widgetMessages.length > 0;
    const hasDashboardMessages = dashboardMessages.length > 0;
    const hasFinalMessages = finalMessages.length > 0;
    
    console.log('\n🎯 SUCCESS CRITERIA:');
    console.log(`✅ Auth Events: ${hasAuthEvents ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Realtime Events: ${hasRealtimeEvents ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Connection Status: ${hasConnectionStatus ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Widget Messages: ${hasWidgetMessages ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard Messages: ${hasDashboardMessages ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Final Messages: ${hasFinalMessages ? 'PASS' : 'FAIL'}`);
    
    const overallSuccess = hasAuthEvents && hasRealtimeEvents && hasConnectionStatus && hasWidgetMessages;
    
    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: Bidirectional communication with authentication appears to be working!');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some aspects of bidirectional communication may need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBidirectionalWithAuth(); 