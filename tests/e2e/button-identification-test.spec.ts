import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
};

test('Identify which send button is being clicked', async ({ page }) => {
  console.log('🔍 Starting button identification test...');

  // Step 1: Login as agent
  console.log('🔐 Logging in as agent...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Navigate to inbox
  console.log('📂 Navigating to inbox...');
  await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Inbox loaded');

  // Step 3: Click on first conversation
  const conversations = await page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]').count();
  console.log(`📋 Found ${conversations} conversations`);

  if (conversations > 0) {
    await page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]').first().click();
    console.log('✅ Clicked on first conversation');
    await page.waitForTimeout(2000);

    // Step 4: Identify ALL send buttons on the page
    console.log('🔍 Identifying ALL send buttons on the page...');
    
    const sendSelectors = [
      'button[aria-label*="Send"]',
      'button:has-text("Send")',
      'button[type="submit"]',
      '[data-testid*="send"]',
      '[data-testid="composer-send-button"]'
    ];

    for (const selector of sendSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      console.log(`🔘 Selector "${selector}": ${count} buttons found`);
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          const isVisible = await button.isVisible();
          const isEnabled = await button.isEnabled();
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const className = await button.getAttribute('class');
          
          console.log(`  Button ${i + 1}:`, {
            visible: isVisible,
            enabled: isEnabled,
            text: text?.trim(),
            ariaLabel,
            className: className?.substring(0, 100) + '...'
          });
        }
      }
    }

    // Step 5: Add click listeners to all buttons to see which one gets clicked
    console.log('🎯 Adding click listeners to identify which button gets clicked...');
    
    await page.evaluate(() => {
      // Add click listeners to all buttons
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
          console.log(`🚨 BUTTON CLICKED: Button ${index}`, {
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label'),
            className: button.className,
            id: button.id,
            type: button.type
          });
        });
      });
    });

    // Step 6: Type message and click send button (same as manual test)
    const messageInputs = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').count();
    console.log(`📝 Found ${messageInputs} message inputs`);

    if (messageInputs > 0) {
      const testMessage = `BUTTON ID TEST: ${Date.now()}`;
      
      await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first().fill(testMessage);
      console.log(`✅ Typed message: ${testMessage}`);

      // Click the send button using the same selector as manual test
      const sendButtons = await page.locator('button[aria-label*="Send"], button:has-text("Send"), button[type="submit"]').count();
      console.log(`🔘 Found ${sendButtons} send buttons with test selector`);

      if (sendButtons > 0) {
        console.log('🎯 About to click send button - check console for which button gets clicked...');
        await page.locator('button[aria-label*="Send"], button:has-text("Send"), button[type="submit"]').first().click({ force: true });
        console.log('✅ Clicked send button');

        await page.waitForTimeout(3000);
      }
    }
  }

  console.log('🔍 Button identification test completed');
});
