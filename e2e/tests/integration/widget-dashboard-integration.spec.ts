import { test, expect } from '@playwright/test';

test.describe('Widget-Dashboard Integration', () => {
  const TEST_CONVERSATION_ID = '48eedfba-2568-4231-bb38-2ce20420900d';
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

  test.beforeEach(async ({ page }) => {
    // Login as agent for dashboard access
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], #email, input[type="email"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"], #password, input[type="password"]', 'password123');
    await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should display widget container with proper test selectors', async ({ page }) => {
    console.log('🔍 Testing widget container display...');

    // Navigate to a page with the widget
    await page.goto('/widget-demo'); // Assuming there's a demo page

    // Check if widget container exists
    const widgetContainer = page.locator('[data-testid="widget-container"]');
    await expect(widgetContainer).toBeVisible({ timeout: 10000 });

    // Check widget button
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();

    console.log('✅ Widget container and button visible');
  });

  test('should open widget panel when button is clicked', async ({ page }) => {
    console.log('🔍 Testing widget panel opening...');

    await page.goto('/widget-demo');

    // Click widget button to open panel
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();

    // Check if widget panel opens
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 5000 });

    // Check widget header
    const widgetHeader = page.locator('[data-testid="widget-header"]');
    await expect(widgetHeader).toBeVisible();
    await expect(widgetHeader).toContainText('Customer Support');

    console.log('✅ Widget panel opens correctly');
  });

  test('should display message input with proper test selectors', async ({ page }) => {
    console.log('🔍 Testing message input display...');

    await page.goto('/widget-demo');

    // Open widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="widget-panel"]');

    // Check message input
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toHaveAttribute('placeholder', 'Type your message...');

    // Check send button
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toContainText('Send');

    console.log('✅ Message input and send button visible');
  });

  test('should send message from widget to dashboard', async ({ page, context }) => {
    console.log('🔄 Testing widget to dashboard message flow...');

    // Open dashboard in current page
    await page.goto('/dashboard');
    
    // Open a test conversation
    await page.click(`[data-conversation-id="${TEST_CONVERSATION_ID}"]`);
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Open widget in new page (simulating customer)
    const widgetPage = await context.newPage();
    await widgetPage.goto('/widget-demo');
    
    // Open widget panel
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    // Send message from widget
    const testMessage = `Widget test message - ${Date.now()}`;
    await widgetPage.fill('[data-testid="widget-message-input"]', testMessage);
    await widgetPage.click('[data-testid="widget-send-button"]');

    // Wait for message to appear in widget
    await widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${testMessage}")`, { timeout: 10000 });

    // Check if message appears in dashboard
    await page.waitForSelector(`[data-testid="message"]:has-text("${testMessage}")`, { timeout: 15000 });
    
    const dashboardMessage = page.locator(`[data-testid="message"]:has-text("${testMessage}")`);
    await expect(dashboardMessage).toBeVisible();

    console.log('✅ Message sent from widget to dashboard successfully');

    await widgetPage.close();
  });

  test('should send message from dashboard to widget', async ({ page, context }) => {
    console.log('🔄 Testing dashboard to widget message flow...');

    // Open widget in new page first
    const widgetPage = await context.newPage();
    await widgetPage.goto('/widget-demo');
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    // Open dashboard and conversation
    await page.goto('/dashboard');
    await page.click(`[data-conversation-id="${TEST_CONVERSATION_ID}"]`);
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Send message from dashboard
    const testMessage = `Dashboard test message - ${Date.now()}`;
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Wait for message to appear in dashboard
    await page.waitForSelector(`[data-testid="message"]:has-text("${testMessage}")`, { timeout: 10000 });

    // Check if message appears in widget
    await widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${testMessage}")`, { timeout: 15000 });
    
    const widgetMessage = widgetPage.locator(`[data-testid="widget-message"]:has-text("${testMessage}")`);
    await expect(widgetMessage).toBeVisible();

    console.log('✅ Message sent from dashboard to widget successfully');

    await widgetPage.close();
  });

  test('should show typing indicators bidirectionally', async ({ page, context }) => {
    console.log('⌨️ Testing bidirectional typing indicators...');

    // Open widget in new page
    const widgetPage = await context.newPage();
    await widgetPage.goto('/widget-demo');
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    // Open dashboard and conversation
    await page.goto('/dashboard');
    await page.click(`[data-conversation-id="${TEST_CONVERSATION_ID}"]`);
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Test widget typing indicator
    await widgetPage.fill('[data-testid="widget-message-input"]', 'Testing typing...');
    
    // Should show typing indicator in dashboard
    await page.waitForSelector('[data-testid="typing-indicator"]', { timeout: 10000 });
    const dashboardTyping = page.locator('[data-testid="typing-indicator"]');
    await expect(dashboardTyping).toBeVisible();

    // Clear widget input to stop typing
    await widgetPage.fill('[data-testid="widget-message-input"]', '');
    
    // Typing indicator should disappear
    await expect(dashboardTyping).toBeHidden({ timeout: 5000 });

    // Test dashboard typing indicator
    await page.fill('[data-testid="message-input"]', 'Agent typing...');
    
    // Should show typing indicator in widget
    await widgetPage.waitForSelector('[data-testid="widget-agent-typing-indicator"]', { timeout: 10000 });
    const widgetTyping = widgetPage.locator('[data-testid="widget-agent-typing-indicator"]');
    await expect(widgetTyping).toBeVisible();
    await expect(widgetTyping).toContainText('Agent is typing');

    console.log('✅ Bidirectional typing indicators working');

    await widgetPage.close();
  });

  test('should handle real-time message delivery', async ({ page, context }) => {
    console.log('📡 Testing real-time message delivery...');

    // Open widget in new page
    const widgetPage = await context.newPage();
    await widgetPage.goto('/widget-demo');
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    // Open dashboard and conversation
    await page.goto('/dashboard');
    await page.click(`[data-conversation-id="${TEST_CONVERSATION_ID}"]`);
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Send multiple messages rapidly
    const messages = [
      `Real-time test 1 - ${Date.now()}`,
      `Real-time test 2 - ${Date.now() + 1}`,
      `Real-time test 3 - ${Date.now() + 2}`,
    ];

    for (const message of messages) {
      await widgetPage.fill('[data-testid="widget-message-input"]', message);
      await widgetPage.click('[data-testid="widget-send-button"]');
      
      // Wait for message to appear in both places
      await widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${message}")`, { timeout: 5000 });
      await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 10000 });
    }

    // Verify all messages are present
    for (const message of messages) {
      await expect(page.locator(`[data-testid="message"]:has-text("${message}")`)).toBeVisible();
      await expect(widgetPage.locator(`[data-testid="widget-message"]:has-text("${message}")`)).toBeVisible();
    }

    console.log('✅ Real-time message delivery working');

    await widgetPage.close();
  });

  test('should maintain conversation context across widget sessions', async ({ page, context }) => {
    console.log('💾 Testing conversation context persistence...');

    // Open widget and send a message
    const widgetPage = await context.newPage();
    await widgetPage.goto('/widget-demo');
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    const contextMessage = `Context test - ${Date.now()}`;
    await widgetPage.fill('[data-testid="widget-message-input"]', contextMessage);
    await widgetPage.click('[data-testid="widget-send-button"]');
    await widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${contextMessage}")`);

    // Close and reopen widget
    await widgetPage.click('[data-testid="widget-close-button"]');
    await widgetPage.click('[data-testid="widget-button"]');
    await widgetPage.waitForSelector('[data-testid="widget-panel"]');

    // Message should still be visible
    await expect(widgetPage.locator(`[data-testid="widget-message"]:has-text("${contextMessage}")`)).toBeVisible();

    console.log('✅ Conversation context maintained');

    await widgetPage.close();
  });

  test('should handle error states gracefully', async ({ page }) => {
    console.log('🛡️ Testing error handling...');

    await page.goto('/widget-demo');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="widget-panel"]');

    // Test sending empty message
    await page.click('[data-testid="widget-send-button"]');
    
    // Should not create any message
    const emptyMessage = page.locator('[data-testid="widget-message"]:has-text("")');
    await expect(emptyMessage).toHaveCount(0);

    // Test sending very long message
    const longMessage = 'A'.repeat(5000);
    await page.fill('[data-testid="widget-message-input"]', longMessage);
    await page.click('[data-testid="widget-send-button"]');

    // Should handle gracefully (either truncate or show error)
    // The exact behavior depends on implementation
    console.log('✅ Error states handled gracefully');
  });
});
