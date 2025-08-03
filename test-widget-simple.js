const { chromium } = require('playwright');

async function testWidget() {
  console.log('🔧 Testing widget on homepage...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });
  
  try {
    // Go to homepage
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000); // Wait 3 seconds for widget to load
    
    console.log('✅ Page loaded');
    
    // Check if widget button exists
    const widgetButton = await page.locator('[data-testid="widget-button"]').count();
    console.log(`Widget button count: ${widgetButton}`);
    
    if (widgetButton > 0) {
      console.log('✅ Widget button found!');

      // Try to click it
      await page.click('[data-testid="widget-button"]');
      console.log('✅ Widget button clicked');

      // Check if widget panel appears
      await page.waitForTimeout(3000);
      const widgetPanel = await page.locator('[data-testid="widget-panel"]').count();
      console.log(`Widget panel count: ${widgetPanel}`);

      if (widgetPanel > 0) {
        console.log('✅ Widget panel opened!');

        // Try to send a message
        const messageInput = await page.locator('[data-testid="widget-message-input"], input[placeholder*="message"], textarea[placeholder*="message"]').count();
        console.log(`Message input count: ${messageInput}`);

        if (messageInput > 0) {
          const testMessage = `Test message ${Date.now()}`;
          await page.fill('[data-testid="widget-message-input"], input[placeholder*="message"], textarea[placeholder*="message"]', testMessage);
          console.log(`✅ Message typed: ${testMessage}`);

          // Try to send the message
          const sendButton = await page.locator('[data-testid="widget-send-button"], button[type="submit"], button:has-text("Send")').count();
          console.log(`Send button count: ${sendButton}`);

          if (sendButton > 0) {
            await page.click('[data-testid="widget-send-button"], button[type="submit"], button:has-text("Send")');
            console.log('✅ Send button clicked');

            // Wait for message to be sent
            await page.waitForTimeout(2000);
            console.log('⏳ Waiting for message to be processed...');
          } else {
            console.log('❌ Send button not found');
          }
        } else {
          console.log('❌ Message input not found');
        }
      } else {
        console.log('❌ Widget panel did not open');
      }

    } else {
      console.log('❌ Widget button not found');
      
      // Check for any widget-related elements
      const anyWidget = await page.locator('div[class*="widget"], button[class*="widget"], [data-testid*="widget"]').count();
      console.log(`Any widget elements: ${anyWidget}`);
      
      // Check for WidgetProvider
      const widgetProvider = await page.locator('[data-widget-provider], .widget-provider').count();
      console.log(`Widget provider elements: ${widgetProvider}`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'homepage-widget-test.png' });
    console.log('📸 Screenshot saved as homepage-widget-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
}

testWidget();
