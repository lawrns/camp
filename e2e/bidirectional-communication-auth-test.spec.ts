import { test, expect } from '@playwright/test';

test.describe('Bidirectional Communication with Authentication Test', () => {
  test('should test authenticated bidirectional communication', async ({ page }) => {
    console.log('🔐 Testing authenticated bidirectional communication...');
    
    // Navigate to login page
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login page loaded
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      console.log('✅ Login page loaded');
      
      // Fill login form with test credentials
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      console.log('✅ Login successful');
      
      // Navigate to conversations
      await page.goto('http://localhost:3001/dashboard/conversations');
      await page.waitForLoadState('networkidle');
      
      // Monitor for realtime logs
      const realtimeLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('realtime') || text.includes('broadcast') || text.includes('channel') || text.includes('SABOTEUR-FIX')) {
          realtimeLogs.push(text);
          console.log(`🔍 REALTIME: ${text}`);
        }
      });
      
      // Wait for any realtime activity
      await page.waitForTimeout(3000);
      
      console.log(`📊 Captured ${realtimeLogs.length} authenticated realtime logs`);
      
    } else {
      console.log('ℹ️ Login form not found, testing without authentication');
    }
    
    console.log('✅ Authenticated communication test completed');
  });

  test('should test widget with authentication', async ({ page }) => {
    console.log('🔧 Testing widget with authentication...');
    
    // First login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      
      // Now test widget with authentication
      await page.goto('http://localhost:3001/widget-demo');
      await page.waitForLoadState('networkidle');
      
      // Monitor for authenticated realtime logs
      const authRealtimeLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('SABOTEUR-FIX-V3') || text.includes('ensureChannelSubscription') || text.includes('Auth validated')) {
          authRealtimeLogs.push(text);
          console.log(`🔍 AUTH REALTIME: ${text}`);
        }
      });
      
      await page.waitForTimeout(3000);
      console.log(`📊 Captured ${authRealtimeLogs.length} authenticated widget realtime logs`);
      
    } else {
      console.log('ℹ️ Testing widget without authentication');
      await page.goto('http://localhost:3001/widget-demo');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Widget authentication test completed');
  });

  test('should test AI handover functionality', async ({ page }) => {
    console.log('🤖 Testing AI handover functionality...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      
      // Navigate to inbox to test AI handover
      await page.goto('http://localhost:3001/dashboard/inbox');
      await page.waitForLoadState('networkidle');
      
      // Look for AI handover controls
      const aiHandoverElements = await page.locator('[class*="ai"], [class*="handover"], [data-testid*="ai"]').count();
      console.log(`📊 Found ${aiHandoverElements} AI handover related elements`);
      
      // Monitor for AI handover logs
      const aiLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('AI') || text.includes('handover') || text.includes('confidence')) {
          aiLogs.push(text);
          console.log(`🔍 AI: ${text}`);
        }
      });
      
      await page.waitForTimeout(3000);
      console.log(`📊 Captured ${aiLogs.length} AI handover logs`);
      
    } else {
      console.log('ℹ️ Testing AI handover without authentication');
    }
    
    console.log('✅ AI handover test completed');
  });

  test('should test message sending and receiving', async ({ page }) => {
    console.log('💬 Testing message sending and receiving...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      
      // Navigate to a conversation or create one
      await page.goto('http://localhost:3001/dashboard/conversations');
      await page.waitForLoadState('networkidle');
      
      // Look for message input
      const messageInputs = await page.locator('textarea, input[type="text"], [contenteditable="true"]').count();
      console.log(`📊 Found ${messageInputs} message input elements`);
      
      // Monitor for message-related logs
      const messageLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('message') || text.includes('send') || text.includes('broadcast')) {
          messageLogs.push(text);
          console.log(`🔍 MESSAGE: ${text}`);
        }
      });
      
      // Try to send a test message if input is found
      if (messageInputs > 0) {
        const firstInput = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
        await firstInput.fill('Test message from Playwright');
        await firstInput.press('Enter');
        console.log('✅ Test message sent');
      }
      
      await page.waitForTimeout(3000);
      console.log(`📊 Captured ${messageLogs.length} message-related logs`);
      
    } else {
      console.log('ℹ️ Testing message functionality without authentication');
    }
    
    console.log('✅ Message test completed');
  });

  test('should test realtime connection stability', async ({ page }) => {
    console.log('🔗 Testing realtime connection stability...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      
      // Navigate to dashboard and monitor connections
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Monitor for connection logs
      const connectionLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('connected') || text.includes('disconnected') || text.includes('connection')) {
          connectionLogs.push(text);
          console.log(`🔍 CONNECTION: ${text}`);
        }
      });
      
      // Wait and monitor for connection stability
      await page.waitForTimeout(5000);
      console.log(`📊 Captured ${connectionLogs.length} connection logs`);
      
      // Check for connection errors
      const errorLogs = connectionLogs.filter(log => log.includes('error') || log.includes('failed'));
      if (errorLogs.length > 0) {
        console.log(`⚠️ Found ${errorLogs.length} connection errors`);
      } else {
        console.log('✅ No connection errors detected');
      }
      
    } else {
      console.log('ℹ️ Testing connection stability without authentication');
    }
    
    console.log('✅ Connection stability test completed');
  });
}); 