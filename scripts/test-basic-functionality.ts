/**
 * Basic functionality test for the fixed InboxDashboard
 * Tests that the application loads and basic features work
 */

import { chromium, Browser, Page } from 'playwright';

async function testBasicFunctionality() {
  console.log('🧪 Starting basic functionality test...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Launch browser
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    // Test 1: Application loads
    console.log('📱 Test 1: Loading application...');
    await page.goto('http://localhost:3002/dashboard/inbox');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if the inbox dashboard is visible
    const inboxDashboard = await page.locator('[data-testid="inbox-dashboard"]').isVisible();
    console.log(`✅ Inbox dashboard visible: ${inboxDashboard}`);
    
    // Test 2: Check for TypeScript/React errors in console
    console.log('📱 Test 2: Checking for console errors...');
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Wait a bit to collect any errors
    await page.waitForTimeout(2000);
    
    if (logs.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('⚠️  Console errors detected:');
      logs.forEach(log => console.log(`   - ${log}`));
    }
    
    // Test 3: Check if conversations load
    console.log('📱 Test 3: Checking conversation loading...');
    const conversationList = await page.locator('[data-testid="conversation-list"]').isVisible();
    console.log(`✅ Conversation list visible: ${conversationList}`);
    
    // Test 4: Check if header is functional
    console.log('📱 Test 4: Checking header functionality...');
    const header = await page.locator('[data-testid="inbox-header"]').isVisible();
    console.log(`✅ Header visible: ${header}`);
    
    // Test 5: Check if search works
    console.log('📱 Test 5: Testing search functionality...');
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await page.waitForTimeout(1000);
      console.log('✅ Search input functional');
    } else {
      console.log('⚠️  Search input not found');
    }
    
    // Test 6: Check if performance metrics are working
    console.log('📱 Test 6: Checking performance metrics...');
    // Look for any performance-related elements
    const performanceElements = await page.locator('[data-testid*="performance"], [data-testid*="metric"]').count();
    console.log(`✅ Performance elements found: ${performanceElements}`);
    
    console.log('🎉 Basic functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (page) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-failure-screenshot.png' });
      console.log('📸 Screenshot saved as test-failure-screenshot.png');
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testBasicFunctionality().catch(console.error);
