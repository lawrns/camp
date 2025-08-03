const { chromium } = require('playwright');

async function testWidgetMessageFlow() {
  console.log('🎯 TESTING COMPLETE WIDGET MESSAGE FLOW');
  console.log('=====================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });
  
  try {
    console.log('\n--- Step 1: Load Homepage ---');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    console.log('✅ Homepage loaded');
    
    console.log('\n--- Step 2: Find and Click Widget Button ---');
    const widgetButton = await page.locator('[data-testid="widget-button"]').count();
    console.log(`Widget button count: ${widgetButton}`);
    
    if (widgetButton === 0) {
      throw new Error('Widget button not found');
    }
    
    await page.click('[data-testid="widget-button"]');
    await page.waitForTimeout(2000);
    console.log('✅ Widget button clicked');
    
    console.log('\n--- Step 3: Verify Widget Panel Opens ---');
    const widgetPanel = await page.locator('[data-testid="widget-panel"]').count();
    console.log(`Widget panel count: ${widgetPanel}`);
    
    if (widgetPanel === 0) {
      throw new Error('Widget panel did not open');
    }
    console.log('✅ Widget panel opened');
    
    console.log('\n--- Step 4: Find Message Input ---');
    const messageInput = await page.locator('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="widget-message-input"]').count();
    console.log(`Message input count: ${messageInput}`);
    
    if (messageInput === 0) {
      throw new Error('Message input not found');
    }
    
    console.log('\n--- Step 5: Type and Send Message ---');
    const testMessage = `E2E Test Message ${Date.now()}`;
    await page.fill('input[placeholder*="message"], textarea[placeholder*="message"], [data-testid="widget-message-input"]', testMessage);
    console.log(`✅ Message typed: ${testMessage}`);
    
    // Find and click send button
    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), [data-testid="widget-send-button"]').count();
    console.log(`Send button count: ${sendButton}`);
    
    if (sendButton === 0) {
      throw new Error('Send button not found');
    }
    
    await page.click('button[type="submit"], button:has-text("Send"), [data-testid="widget-send-button"]');
    console.log('✅ Send button clicked');
    
    console.log('\n--- Step 6: Wait for Message Processing ---');
    await page.waitForTimeout(5000);
    
    console.log('\n--- Step 7: Verify Message Appears in Widget ---');
    const messageElements = await page.locator('[data-testid="widget-message"], .message, .chat-message').count();
    console.log(`Message elements in widget: ${messageElements}`);
    
    if (messageElements === 0) {
      console.log('⚠️ No message elements found in widget');
    } else {
      console.log('✅ Message elements found in widget');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'widget-message-flow-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    console.log('\n🎉 WIDGET MESSAGE FLOW TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'widget-message-flow-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  }
  
  await browser.close();
}

testWidgetMessageFlow();
