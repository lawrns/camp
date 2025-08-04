import { test, expect } from '@playwright/test';

test('Investigate threading and conversation data', async ({ page }) => {
  console.log('🔍 Investigating threading and conversation data...');

  // Step 1: Login as agent
  console.log('👤 Logging in as agent...');
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', 'jam@jam.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Navigate to inbox and examine conversations
  console.log('📋 Examining conversations in inbox...');
  await page.goto('http://localhost:3001/dashboard/inbox');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Check conversation list
  const conversationElements = page.locator('[data-testid="conversation-row"], [data-testid="conversation-card"], .conversation-item');
  const conversationCount = await conversationElements.count();
  console.log(`📊 Found ${conversationCount} conversations`);

  if (conversationCount === 0) {
    console.log('❌ ERROR: No conversations found!');
    console.log('🔍 This suggests threading is not working or conversations are not being created');
    throw new Error('No conversations visible - threading issue detected');
  }

  // Examine first conversation for mock data indicators
  console.log('🔍 Examining first conversation for mock data...');
  const firstConversation = conversationElements.first();
  
  // Get conversation text content
  const conversationText = await firstConversation.textContent();
  console.log(`📝 First conversation content: ${conversationText?.substring(0, 200)}...`);

  // Check for mock data indicators
  const mockDataIndicators = [
    'Anonymous User',
    'Test Visitor', 
    'No messages yet',
    'mock',
    'test',
    'sample',
    'placeholder'
  ];

  let mockDataFound = false;
  for (const indicator of mockDataIndicators) {
    if (conversationText?.toLowerCase().includes(indicator.toLowerCase())) {
      console.log(`⚠️  Found mock data indicator: "${indicator}"`);
      mockDataFound = true;
    }
  }

  if (mockDataFound) {
    console.log('❌ ERROR: Mock data detected in conversations!');
    console.log('🔍 This confirms the threading issue - conversations are filled with mock data');
    throw new Error('Mock data found in conversations - threading not using real data');
  }

  // Step 3: Click on first conversation and examine messages
  console.log('👆 Clicking on first conversation...');
  await firstConversation.click();
  await page.waitForTimeout(3000);

  // Check for messages in the conversation
  const messageElements = page.locator('[data-testid="message"], .message, .chat-message');
  const messageCount = await messageElements.count();
  console.log(`💬 Found ${messageCount} messages in conversation`);

  if (messageCount === 0) {
    console.log('❌ ERROR: No messages found in conversation!');
    console.log('🔍 This suggests the conversation is empty or not loading messages');
    throw new Error('No messages in conversation - threading issue detected');
  }

  // Examine first few messages for mock data
  console.log('🔍 Examining messages for mock data...');
  for (let i = 0; i < Math.min(messageCount, 3); i++) {
    const messageText = await messageElements.nth(i).textContent();
    console.log(`  Message ${i + 1}: ${messageText?.substring(0, 100)}...`);
    
    // Check for mock data in messages
    for (const indicator of mockDataIndicators) {
      if (messageText?.toLowerCase().includes(indicator.toLowerCase())) {
        console.log(`⚠️  Found mock data in message ${i + 1}: "${indicator}"`);
        mockDataFound = true;
      }
    }
  }

  if (mockDataFound) {
    console.log('❌ ERROR: Mock data found in messages!');
    console.log('🔍 This confirms the threading issue - messages are mock data');
    throw new Error('Mock data found in messages - threading not using real data');
  }

  // Step 4: Check for real-time connection indicators
  console.log('🔌 Checking for real-time connection indicators...');
  
  // Look for connection status indicators
  const connectionIndicators = [
    'connected',
    'connecting',
    'disconnected',
    'websocket',
    'realtime'
  ];

  const pageContent = await page.content();
  let realtimeFound = false;
  for (const indicator of connectionIndicators) {
    if (pageContent.toLowerCase().includes(indicator.toLowerCase())) {
      console.log(`✅ Found real-time indicator: "${indicator}"`);
      realtimeFound = true;
    }
  }

  if (!realtimeFound) {
    console.log('⚠️  No real-time connection indicators found');
    console.log('🔍 This suggests real-time communication might not be active');
  }

  // Step 5: Check conversation IDs and threading
  console.log('🆔 Checking conversation IDs and threading...');
  
  // Look for conversation ID in URL or page
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('conversation') || currentUrl.includes('conv')) {
    console.log('✅ Conversation ID found in URL');
  } else {
    console.log('⚠️  No conversation ID in URL');
  }

  // Check for conversation ID in page content
  const conversationIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
  const conversationIdMatch = pageContent.match(conversationIdPattern);
  
  if (conversationIdMatch) {
    console.log(`✅ Found conversation ID: ${conversationIdMatch[0]}`);
  } else {
    console.log('⚠️  No conversation ID found in page content');
  }

  console.log('✅ Threading investigation completed - no mock data detected');

}); 