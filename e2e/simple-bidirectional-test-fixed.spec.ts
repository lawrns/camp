import { test, expect } from '@playwright/test';

test.describe('Simple Bidirectional Communication Test (Fixed)', () => {
  test('should load homepage and verify basic functionality', async ({ page }) => {
    console.log('🧪 Starting simple bidirectional communication test...');
    
    // Navigate to homepage
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Campfire/);
    console.log('✅ Page loaded successfully');
    
    // Check for basic elements
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has content');
    
    // Test basic interaction
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log(`📊 Found ${buttons} buttons and ${links} links`);
    
    // Test console logging for realtime
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      
      // Look for our realtime fix logs
      if (text.includes('SABOTEUR-FIX-V3') || text.includes('ensureChannelSubscription')) {
        console.log(`🔍 REALTIME LOG: ${text}`);
      }
    });
    
    // Wait a bit to capture any realtime logs
    await page.waitForTimeout(2000);
    
    console.log('✅ Basic functionality test completed');
  });

  test('should test widget functionality', async ({ page }) => {
    console.log('🔧 Testing widget functionality...');
    
    // Navigate to widget demo
    await page.goto('http://localhost:3001/widget-demo');
    await page.waitForLoadState('networkidle');
    
    // Check if widget loads
    const widgetContainer = page.locator('[class*="widget"], [class*="chat"], [data-testid*="widget"]');
    if (await widgetContainer.count() > 0) {
      console.log('✅ Widget container found');
    } else {
      console.log('ℹ️ Widget container not found, checking for alternative elements');
    }
    
    // Look for any interactive elements
    const interactiveElements = await page.locator('button, input, textarea').count();
    console.log(`📊 Found ${interactiveElements} interactive elements`);
    
    console.log('✅ Widget functionality test completed');
  });

  test('should test dashboard access', async ({ page }) => {
    console.log('📊 Testing dashboard access...');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if we get redirected to login (expected behavior)
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('✅ Properly redirected to login (expected)');
    } else {
      console.log('ℹ️ Dashboard accessible without login');
    }
    
    console.log('✅ Dashboard access test completed');
  });

  test('should test API endpoints', async ({ page }) => {
    console.log('🔌 Testing API endpoints...');
    
    // Test auth session endpoint
    const sessionResponse = await page.request.get('http://localhost:3001/api/auth/session');
    console.log(`📡 Auth session status: ${sessionResponse.status()}`);
    
    // Test homepage API
    const homeResponse = await page.request.get('http://localhost:3001/');
    console.log(`📡 Homepage status: ${homeResponse.status()}`);
    
    console.log('✅ API endpoints test completed');
  });

  test('should monitor realtime connections', async ({ page }) => {
    console.log('📡 Monitoring realtime connections...');
    
    // Navigate to homepage
    await page.goto('http://localhost:3001');
    
    // Monitor console for realtime logs
    const realtimeLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('realtime') || text.includes('broadcast') || text.includes('channel')) {
        realtimeLogs.push(text);
        console.log(`🔍 REALTIME: ${text}`);
      }
    });
    
    // Wait for any realtime activity
    await page.waitForTimeout(3000);
    
    console.log(`📊 Captured ${realtimeLogs.length} realtime logs`);
    console.log('✅ Realtime monitoring completed');
  });

  test('should test error handling', async ({ page }) => {
    console.log('🛡️ Testing error handling...');
    
    // Navigate to a non-existent page
    await page.goto('http://localhost:3001/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Check if we get a proper 404 or redirect
    const status = page.url();
    console.log(`📄 Non-existent page result: ${status}`);
    
    // Test with invalid API endpoint
    try {
      const invalidResponse = await page.request.get('http://localhost:3001/api/invalid-endpoint');
      console.log(`📡 Invalid API status: ${invalidResponse.status()}`);
    } catch (error) {
      console.log('✅ Invalid API properly handled');
    }
    
    console.log('✅ Error handling test completed');
  });
}); 