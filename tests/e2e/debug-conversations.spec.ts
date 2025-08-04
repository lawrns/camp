import { test, expect } from '@playwright/test';

test('Debug conversation selectors', async ({ page }) => {
  console.log('🔍 Debugging conversation selectors...');

  // Login
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', 'jam@jam.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Navigate to inbox
  await page.goto('http://localhost:3001/dashboard/inbox');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Wait for conversations to load
  console.log('✅ Inbox loaded');

  // Debug: Check what elements are actually present
  console.log('🔍 Checking for conversation elements...');
  
  // Try different selectors
  const selectors = [
    '[data-testid="conversation-row"]',
    '[data-testid="conversation-card"]',
    '.conversation-item',
    '[class*="conversation"]',
    '[data-conversation-id]',
    'div[role="button"]',
    'div[class*="cursor-pointer"]'
  ];

  for (const selector of selectors) {
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

  // Look for any elements with "Anonymous User" text (from screenshot)
  const anonymousUserElements = await page.locator('text="Anonymous User"').count();
  console.log(`Elements with "Anonymous User" text: ${anonymousUserElements}`);

  // Look for any elements with "Test Visitor" text (from screenshot)
  const testVisitorElements = await page.locator('text="Test Visitor"').count();
  console.log(`Elements with "Test Visitor" text: ${testVisitorElements}`);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-inbox.png', fullPage: true });
  console.log('📸 Screenshot saved as debug-inbox.png');

  // Check the page HTML structure
  const pageContent = await page.content();
  console.log('📄 Page content length:', pageContent.length);
  
  // Look for conversation-related HTML
  if (pageContent.includes('conversation')) {
    console.log('✅ Found "conversation" in page HTML');
  }
  
  if (pageContent.includes('Anonymous User')) {
    console.log('✅ Found "Anonymous User" in page HTML');
  }

  console.log('🔍 Debug test completed');
}); 