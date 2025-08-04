import { test, expect } from '@playwright/test';

/**
 * DEBUG REAL-TIME SUBSCRIPTION
 * 
 * Focused test to debug why dashboard messages don't appear in widget real-time
 */

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  conversationId: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b'
};

test('Debug widget real-time subscription', async ({ page, context }) => {
  console.log('🔍 DEBUG WIDGET REAL-TIME SUBSCRIPTION');
  console.log('=====================================');

  // Step 1: Setup widget with console monitoring
  console.log('🔧 Step 1: Setting up widget with console monitoring...');
  
  // Monitor console logs from the widget page
  const widgetLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[useMessages]') || text.includes('[Realtime]') || text.includes('Real-time')) {
      widgetLogs.push(`WIDGET: ${text}`);
      console.log(`📡 ${text}`);
    }
  });

  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Open widget
  const widgetButton = page.locator('[data-testid="widget-button"]');
  await widgetButton.click();
  await page.waitForTimeout(3000);
  console.log('✅ Widget opened, monitoring real-time subscription...');

  // Step 2: Setup dashboard
  console.log('📥 Step 2: Setting up dashboard...');
  const dashboardPage = await context.newPage();
  
  // Monitor dashboard console logs
  const dashboardLogs: string[] = [];
  dashboardPage.on('console', msg => {
    const text = msg.text();
    if (text.includes('[SendMessage]') || text.includes('[Realtime]') || text.includes('Broadcast')) {
      dashboardLogs.push(`DASHBOARD: ${text}`);
      console.log(`📤 ${text}`);
    }
  });

  await dashboardPage.goto(`${TEST_CONFIG.baseURL}/login`);
  await dashboardPage.waitForLoadState('networkidle');

  // Login
  await dashboardPage.fill('#email', TEST_CONFIG.agentEmail);
  await dashboardPage.fill('#password', TEST_CONFIG.agentPassword);
  await dashboardPage.click('button[type="submit"]');
  await dashboardPage.waitForURL('**/dashboard**', { timeout: 15000 });

  // Go to inbox and select conversation
  await dashboardPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await dashboardPage.waitForLoadState('networkidle');
  await dashboardPage.waitForTimeout(3000);

  // Find and select the test conversation
  const conversations = await dashboardPage.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').count();
  console.log(`📋 Found ${conversations} conversations`);

  let conversationSelected = false;
  for (let i = 0; i < Math.min(conversations, 5); i++) {
    try {
      await dashboardPage.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').nth(i).click();
      await dashboardPage.waitForTimeout(2000);
      
      // Check if this conversation has our test messages
      const hasTestMessage = await dashboardPage.locator('text*="SIMPLE TEST"').count() > 0;
      if (hasTestMessage) {
        console.log(`✅ Selected conversation ${i + 1} with test messages`);
        conversationSelected = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ Could not select conversation ${i + 1}`);
    }
  }

  if (!conversationSelected) {
    console.log('❌ Could not find conversation with test messages');
    return;
  }

  // Step 3: Send message from dashboard and monitor
  console.log('💬 Step 3: Sending message from dashboard...');
  
  const testMessage = `REALTIME DEBUG: Dashboard message ${Date.now()}`;
  console.log('📤 Sending:', testMessage);

  try {
    await dashboardPage.fill('textarea[placeholder*="message"], input[placeholder*="message"]', testMessage);
    await dashboardPage.click('[data-testid="composer-send-button"], button[aria-label*="Send"]', { force: true });
    console.log('✅ Dashboard message sent');
    
    // Wait and monitor for real-time events
    await dashboardPage.waitForTimeout(5000);
    
  } catch (error) {
    console.log('❌ Failed to send dashboard message:', error);
    return;
  }

  // Step 4: Check if message appears in widget
  console.log('🔍 Step 4: Checking if message appears in widget...');
  
  const messageInWidget = await page.locator(`text="${testMessage}"`).count() > 0;
  console.log(`📋 Message in widget: ${messageInWidget ? 'YES' : 'NO'}`);

  // Step 5: Debug analysis
  console.log('');
  console.log('🔍 REAL-TIME DEBUG ANALYSIS');
  console.log('===========================');
  
  console.log('📡 Widget Console Logs:');
  widgetLogs.forEach(log => console.log(`   ${log}`));
  
  console.log('📤 Dashboard Console Logs:');
  dashboardLogs.forEach(log => console.log(`   ${log}`));

  // Check widget subscription status
  const subscriptionStatus = await page.evaluate(() => {
    // Try to access widget state
    const widgetState = (window as any).widgetState;
    const supabaseClient = (window as any).supabase;
    
    return {
      widgetState: widgetState ? 'FOUND' : 'NOT_FOUND',
      supabaseClient: supabaseClient ? 'FOUND' : 'NOT_FOUND',
      channels: supabaseClient?.getChannels?.()?.length || 0
    };
  });

  console.log('📋 Widget Subscription Status:', JSON.stringify(subscriptionStatus, null, 2));

  // Step 6: Manual refresh test
  console.log('🔄 Step 6: Testing manual refresh...');
  
  // Refresh widget messages manually
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Open widget again
  const widgetButtonAfterRefresh = page.locator('[data-testid="widget-button"]');
  await widgetButtonAfterRefresh.click();
  await page.waitForTimeout(2000);

  // Check if message appears after refresh
  const messageAfterRefresh = await page.locator(`text="${testMessage}"`).count() > 0;
  console.log(`📋 Message after refresh: ${messageAfterRefresh ? 'YES' : 'NO'}`);

  // Step 7: Summary
  console.log('');
  console.log('🎯 REAL-TIME DEBUG SUMMARY');
  console.log('==========================');
  console.log(`📤 Dashboard message sent: YES`);
  console.log(`📡 Real-time delivery: ${messageInWidget ? 'WORKING' : 'FAILED'}`);
  console.log(`🔄 Manual refresh delivery: ${messageAfterRefresh ? 'WORKING' : 'FAILED'}`);
  
  if (!messageInWidget && messageAfterRefresh) {
    console.log('');
    console.log('🚨 ISSUE IDENTIFIED: Real-time subscription not working');
    console.log('💡 Messages are stored correctly but not delivered in real-time');
    console.log('🔧 Need to check widget real-time subscription setup');
  } else if (messageInWidget) {
    console.log('🎉 SUCCESS: Real-time delivery working!');
  } else {
    console.log('❌ CRITICAL: Messages not being delivered at all');
  }
});
