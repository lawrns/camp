import { test, expect } from '@playwright/test';

test('Debug homepage widget elements', async ({ page }) => {
  console.log('🔍 Debugging homepage widget elements...');

  // Navigate to homepage
  await page.goto('http://localhost:3001/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Wait longer for widget to load
  console.log('✅ Homepage loaded');

  // Check for iframes
  const iframes = await page.locator('iframe').count();
  console.log(`Number of iframes: ${iframes}`);
  
  if (iframes > 0) {
    console.log('🔍 Found iframes, checking their content...');
    for (let i = 0; i < iframes; i++) {
      const iframe = page.frameLocator('iframe').nth(i);
      console.log(`Checking iframe ${i + 1}...`);
      
      // Try to find widget elements in iframe
      const iframeWidgetElements = await iframe.locator('[class*="widget"], [class*="chat"], [class*="messaging"]').count();
      console.log(`  Widget elements in iframe ${i + 1}: ${iframeWidgetElements}`);
      
      if (iframeWidgetElements > 0) {
        const firstElement = iframe.locator('[class*="widget"], [class*="chat"], [class*="messaging"]').first();
        const text = await firstElement.textContent();
        console.log(`  First element text: ${text?.substring(0, 100)}...`);
      }
    }
  }

  // Debug: Check what elements are actually present
  console.log('🔍 Checking for widget elements...');
  
  // Try different selectors for widget
  const widgetSelectors = [
    '[data-testid="widget-panel"]',
    '.widget-container',
    '[class*="widget"]',
    '[class*="chat"]',
    '[class*="messaging"]',
    '[class*="support"]',
    '[class*="floating"]',
    '[class*="overlay"]',
    '[class*="popup"]',
    '[class*="UltimateWidget"]',
    '[class*="ultimate-widget"]'
  ];

  for (const selector of widgetSelectors) {
    const count = await page.locator(selector).count();
    console.log(`Selector "${selector}": ${count} elements found`);
    
    if (count > 0) {
      // Get some details about the first element
      const firstElement = page.locator(selector).first();
      const text = await firstElement.textContent();
      const classes = await firstElement.getAttribute('class');
      console.log(`  First element text: ${text?.substring(0, 100)}...`);
      console.log(`  First element classes: ${classes}`);
    }
  }

  // Look for any elements with "Campfire" text (from screenshot)
  const campfireElements = await page.locator('text="Campfire"').count();
  console.log(`Elements with "Campfire" text: ${campfireElements}`);

  // Look for any elements with "Welcome" text (from screenshot)
  const welcomeElements = await page.locator('text="Welcome"').count();
  console.log(`Elements with "Welcome" text: ${welcomeElements}`);

  // Look for any elements with "Type your message" text (from screenshot)
  const messageInputElements = await page.locator('text="Type your message"').count();
  console.log(`Elements with "Type your message" text: ${messageInputElements}`);

  // Look for any input fields
  const inputFields = await page.locator('input, textarea').count();
  console.log(`Total input fields: ${inputFields}`);

  // Look for any buttons
  const buttons = await page.locator('button').count();
  console.log(`Total buttons: ${buttons}`);

  // Look for any divs with specific classes
  const allDivs = await page.locator('div').count();
  console.log(`Total divs: ${allDivs}`);

  // Look for elements with specific text patterns
  const ultimateWidgetElements = await page.locator('text="UltimateWidget"').count();
  console.log(`Elements with "UltimateWidget" text: ${ultimateWidgetElements}`);

  const advancedFeaturesElements = await page.locator('text="advanced features"').count();
  console.log(`Elements with "advanced features" text: ${advancedFeaturesElements}`);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
  console.log('📸 Screenshot saved as debug-homepage.png');

  // Check the page HTML structure
  const pageContent = await page.content();
  console.log('📄 Page content length:', pageContent.length);
  
  // Look for widget-related HTML
  if (pageContent.includes('widget')) {
    console.log('✅ Found "widget" in page HTML');
  }
  
  if (pageContent.includes('Campfire')) {
    console.log('✅ Found "Campfire" in page HTML');
  }

  if (pageContent.includes('Welcome')) {
    console.log('✅ Found "Welcome" in page HTML');
  }

  if (pageContent.includes('UltimateWidget')) {
    console.log('✅ Found "UltimateWidget" in page HTML');
  }

  console.log('🔍 Debug test completed');
}); 