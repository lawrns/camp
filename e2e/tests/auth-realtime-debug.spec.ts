import { test, expect } from '@playwright/test';

test('Debug authentication and real-time issues', async ({ page }) => {
  console.log('🔍 Debugging authentication and real-time issues...');

  // Step 1: Login and monitor console for auth issues
  console.log('👤 Logging in and monitoring auth...');
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');
  
  // Listen for console messages to catch auth errors
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('Failed to load agents') || 
        text.includes('CLOSED') || 
        text.includes('Failed to parse cookie') ||
        text.includes('multiple GoTrueClient') ||
        text.includes('two children with the same key')) {
      console.log(`🔍 Console: ${text}`);
    }
  });

  // Listen for network requests to catch API failures
  const failedRequests: string[] = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      if (url.includes('/api/agents') || url.includes('/api/organizations')) {
        failedRequests.push(`${response.status()} ${url}`);
        console.log(`❌ API Error: ${response.status()} ${url}`);
      }
    }
  });

  await page.fill('#email', 'jam@jam.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Navigate to inbox and check for "Failed to load agents"
  console.log('📋 Checking for agent loading issues...');
  await page.goto('http://localhost:3001/dashboard/inbox');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Check for "Failed to load agents" error message
  const failedToLoadAgents = page.locator('text="Failed to load agents"');
  const hasAgentError = await failedToLoadAgents.count();
  
  if (hasAgentError > 0) {
    console.log('❌ ERROR: "Failed to load agents" message found!');
    console.log('🔍 This confirms the agent API authentication issue');
    throw new Error('Failed to load agents - agent API authentication issue detected');
  } else {
    console.log('✅ No "Failed to load agents" error found');
  }

  // Step 3: Check for real-time channel issues
  console.log('🔌 Checking for real-time channel issues...');
  
  // Look for channel closed messages in console
  const channelClosedMessages = consoleMessages.filter(msg => 
    msg.includes('CLOSED') && msg.includes('will retry automatically')
  );
  
  if (channelClosedMessages.length > 0) {
    console.log(`❌ ERROR: Found ${channelClosedMessages.length} real-time channel closed messages!`);
    console.log('🔍 This confirms the real-time authentication cycling issue');
    for (const msg of channelClosedMessages.slice(0, 3)) {
      console.log(`  Channel Error: ${msg}`);
    }
    throw new Error('Real-time channels closing - authentication cycling issue detected');
  } else {
    console.log('✅ No real-time channel closed messages found');
  }

  // Step 4: Check for authentication parsing issues
  console.log('🔐 Checking for authentication parsing issues...');
  
  const authParsingErrors = consoleMessages.filter(msg => 
    msg.includes('Failed to parse cookie string') || 
    msg.includes('multiple GoTrueClient instances')
  );
  
  if (authParsingErrors.length > 0) {
    console.log(`❌ ERROR: Found ${authParsingErrors.length} authentication parsing errors!`);
    console.log('🔍 This confirms the JWT/cookie authentication issue');
    for (const msg of authParsingErrors.slice(0, 3)) {
      console.log(`  Auth Error: ${msg}`);
    }
    throw new Error('Authentication parsing errors - JWT/cookie issue detected');
  } else {
    console.log('✅ No authentication parsing errors found');
  }

  // Step 5: Check for API failures
  console.log('🌐 Checking for API failures...');
  
  if (failedRequests.length > 0) {
    console.log(`❌ ERROR: Found ${failedRequests.length} failed API requests!`);
    console.log('🔍 This confirms the agent API authentication issue');
    for (const req of failedRequests.slice(0, 3)) {
      console.log(`  API Error: ${req}`);
    }
    throw new Error('Agent API failures - authentication issue detected');
  } else {
    console.log('✅ No failed API requests found');
  }

  // Step 6: Test message sending to check for React key duplication
  console.log('💬 Testing message sending for React key issues...');
  
  // Click on first conversation
  const conversationElements = page.locator('[data-testid="conversation-row"], [data-testid="conversation-card"], .conversation-item');
  const conversationCount = await conversationElements.count();
  
  if (conversationCount > 0) {
    await conversationElements.first().click();
    await page.waitForTimeout(3000);
    
    // Send a test message
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    
    const testMessage = `Auth test message ${Date.now()}`;
    await messageInput.fill(testMessage);
    
    const sendButton = page.locator('[data-testid="composer-send-button"], button[aria-label*="Send"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Wait and check for React key errors
    await page.waitForTimeout(3000);
    
    const reactKeyErrors = consoleMessages.filter(msg => 
      msg.includes('two children with the same key') ||
      msg.includes('Warning: Each child in a list should have a unique "key" prop')
    );
    
    if (reactKeyErrors.length > 0) {
      console.log(`❌ ERROR: Found ${reactKeyErrors.length} React key duplication errors!`);
      console.log('🔍 This confirms the optimistic message deduplication issue');
      for (const msg of reactKeyErrors.slice(0, 3)) {
        console.log(`  React Error: ${msg}`);
      }
      throw new Error('React key duplication - optimistic message deduplication issue detected');
    } else {
      console.log('✅ No React key duplication errors found');
    }
  }

  // Step 7: Summary of findings
  console.log('📊 Authentication and real-time investigation summary:');
  console.log(`  Console messages captured: ${consoleMessages.length}`);
  console.log(`  Failed API requests: ${failedRequests.length}`);
  console.log(`  Channel closed messages: ${channelClosedMessages.length}`);
  console.log(`  Auth parsing errors: ${authParsingErrors.length}`);
  
  if (consoleMessages.length > 0) {
    console.log('🔍 Sample console messages:');
    consoleMessages.slice(0, 5).forEach((msg, i) => {
      console.log(`  ${i + 1}: ${msg.substring(0, 100)}...`);
    });
  }

  console.log('✅ Authentication and real-time investigation completed successfully');

}); 