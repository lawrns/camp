import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
};

test('Identify actual dashboard component being used', async ({ page }) => {
  console.log('🔍 Starting component identification test...');

  // Step 1: Login and navigate to dashboard
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Navigate to inbox
  await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Inbox page loaded');

  // Step 3: Inject debugging script to identify components
  await page.evaluate(() => {
    console.log('🚨🚨🚨 [COMPONENT IDENTIFICATION] Starting component analysis...');
    
    // Find all React components in the DOM
    const reactElements = document.querySelectorAll('[data-reactroot], [data-testid], [class*="react"], [class*="component"]');
    console.log('🔍 Found React elements:', reactElements.length);
    
    // Find all message input elements
    const messageInputs = document.querySelectorAll('input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="Message"], textarea[placeholder*="Message"]');
    console.log('📝 Found message inputs:', messageInputs.length);
    messageInputs.forEach((input, index) => {
      console.log(`📝 Input ${index}:`, {
        tagName: input.tagName,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id,
        parentElement: input.parentElement?.className
      });
    });
    
    // Find all send buttons
    const sendButtons = document.querySelectorAll('button[aria-label*="Send"], button:has-text("Send"), button[title*="Send"], [role="button"]:has-text("Send")');
    console.log('🔘 Found send buttons:', sendButtons.length);
    sendButtons.forEach((button, index) => {
      console.log(`🔘 Button ${index}:`, {
        tagName: button.tagName,
        textContent: button.textContent,
        className: button.className,
        id: button.id,
        ariaLabel: button.getAttribute('aria-label'),
        title: button.getAttribute('title'),
        parentElement: button.parentElement?.className
      });
    });
    
    // Find all emoji-related elements
    const emojiElements = document.querySelectorAll('[class*="emoji"], [aria-label*="emoji"], [title*="emoji"]');
    console.log('😀 Found emoji elements:', emojiElements.length);
    emojiElements.forEach((element, index) => {
      console.log(`😀 Emoji ${index}:`, {
        tagName: element.tagName,
        className: element.className,
        ariaLabel: element.getAttribute('aria-label'),
        title: element.getAttribute('title')
      });
    });
    
    // Find all composer-related elements
    const composerElements = document.querySelectorAll('[class*="composer"], [data-testid*="composer"], [class*="Composer"]');
    console.log('✏️ Found composer elements:', composerElements.length);
    composerElements.forEach((element, index) => {
      console.log(`✏️ Composer ${index}:`, {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        dataTestId: element.getAttribute('data-testid')
      });
    });
    
    // Check for any React component names in the DOM
    const allElements = document.querySelectorAll('*');
    const reactComponentNames = new Set();
    allElements.forEach(element => {
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ');
        classes.forEach(cls => {
          if (cls.includes('Dashboard') || cls.includes('Inbox') || cls.includes('Chat') || cls.includes('Message')) {
            reactComponentNames.add(cls);
          }
        });
      }
    });
    console.log('⚛️ React component class names found:', Array.from(reactComponentNames));
    
    // Check for any data attributes that might indicate component names
    const dataAttributes = new Set();
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && (attr.value.includes('Dashboard') || attr.value.includes('Inbox') || attr.value.includes('Chat'))) {
          dataAttributes.add(`${attr.name}="${attr.value}"`);
        }
      });
    });
    console.log('📊 Relevant data attributes:', Array.from(dataAttributes));
  });

  // Step 4: Take screenshot for visual analysis
  await page.screenshot({ path: 'test-results/component-identification.png', fullPage: true });
  console.log('📸 Screenshot saved for visual analysis');

  // Step 5: Try to find and interact with the actual send button
  console.log('🔍 Attempting to find the actual send button...');
  
  // Try multiple selectors to find the send button
  const sendButtonSelectors = [
    'button[aria-label*="Send"]',
    'button:has-text("Send")',
    'button[title*="Send"]',
    '[role="button"]:has-text("Send")',
    'button:has([class*="send"])',
    'button:has([class*="Send"])',
    'button svg[class*="send"]',
    'button svg[class*="Send"]'
  ];

  let foundButton = null;
  for (const selector of sendButtonSelectors) {
    try {
      const button = await page.locator(selector).first();
      if (await button.count() > 0) {
        foundButton = selector;
        console.log(`✅ Found send button with selector: ${selector}`);
        
        // Get button details
        const buttonInfo = await button.evaluate(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent,
          innerHTML: el.innerHTML,
          parentClassName: el.parentElement?.className,
          grandParentClassName: el.parentElement?.parentElement?.className
        }));
        console.log('🔘 Button details:', buttonInfo);
        break;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  if (!foundButton) {
    console.log('❌ No send button found with standard selectors');
  }

  console.log('🔍 Component identification test completed');
});
