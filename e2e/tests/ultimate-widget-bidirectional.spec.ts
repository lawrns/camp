import { test, expect } from '@playwright/test';

test.describe('UltimateWidget Bidirectional Communication', () => {
  test('should establish real-time connection and send messages', async ({ page }) => {
    // Navigate to homepage with UltimateWidget
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open UltimateWidget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Verify widget opens
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Test conversation creation
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    
    // Send first message (should create conversation)
    const testMessage = `E2E Test Message ${Date.now()}`;
    await messageInput.fill(testMessage);
    await page.click('[data-testid="widget-send-button"]');
    
    // Verify message appears in widget
    await expect(
      page.locator(`[data-testid="message"]:has-text("${testMessage}")`)
    ).toBeVisible({ timeout: 10000 });
    
    // Verify conversation created in database
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    
    // Look for conversation with test message
    await expect(
      page.locator(`[data-testid="conversation"]:has-text("${testMessage}")`)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display typing indicators bidirectionally', async ({ page, context }) => {
    // Setup agent dashboard
    const agentPage = await context.newPage();
    await agentPage.goto('/dashboard/conversations');
    await agentPage.waitForLoadState('networkidle');
    
    // Setup widget
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget and start typing
    await page.click('[data-testid="widget-button"]');
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.focus();
    await messageInput.type('Test typing');
    
    // Verify typing indicator appears in agent dashboard
    await expect(
      agentPage.locator('[data-testid="typing-indicator"]')
    ).toBeVisible({ timeout: 5000 });
    
    // Stop typing
    await messageInput.blur();
    
    // Verify typing indicator disappears
    await expect(
      agentPage.locator('[data-testid="typing-indicator"]')
    ).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle real-time message synchronization', async ({ page, context }) => {
    // Setup both pages
    const agentPage = await context.newPage();
    await agentPage.goto('/dashboard/conversations');
    await page.goto('/');
    
    // Open widget and send message
    await page.click('[data-testid="widget-button"]');
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const testMessage = `Real-time test ${Date.now()}`;
    
    await messageInput.fill(testMessage);
    await page.click('[data-testid="widget-send-button"]');
    
    // Verify message appears in agent dashboard in real-time
    await expect(
      agentPage.locator(`[data-testid="message"]:has-text("${testMessage}")`)
    ).toBeVisible({ timeout: 10000 });
    
    // Send message from agent dashboard
    const agentInput = agentPage.locator('[data-testid="message-input"]');
    const agentResponse = `Agent response ${Date.now()}`;
    
    await agentInput.fill(agentResponse);
    await agentPage.click('[data-testid="send-button"]');
    
    // Verify agent message appears in widget
    await expect(
      page.locator(`[data-testid="message"]:has-text("${agentResponse}")`)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Simulate network disconnection
    await page.route('**/api/widget/**', route => route.abort());
    
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Try to send message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.fill('Test message');
    await page.click('[data-testid="widget-send-button"]');
    
    // Verify error handling
    await expect(
      page.locator('[data-testid="error-message"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should support advanced features', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Test file upload
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test file content')
      });
      
      await expect(
        page.locator('[data-testid="file-attachment"]')
      ).toBeVisible({ timeout: 5000 });
    }
    
    // Test reactions
    const message = page.locator('[data-testid="message"]').first();
    await message.hover();
    
    const reactionButton = page.locator('[data-testid="reaction-button"]');
    if (await reactionButton.count() > 0) {
      await reactionButton.click();
      await expect(
        page.locator('[data-testid="reaction"]')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should maintain conversation state across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const testMessage = `Persistent test ${Date.now()}`;
    await messageInput.fill(testMessage);
    await page.click('[data-testid="widget-send-button"]');
    
    // Verify message appears
    await expect(
      page.locator(`[data-testid="message"]:has-text("${testMessage}")`)
    ).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Reopen widget
    await page.click('[data-testid="widget-button"]');
    
    // Verify message still appears (conversation persisted)
    await expect(
      page.locator(`[data-testid="message"]:has-text("${testMessage}")`)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle multiple rapid messages', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send 5 messages rapidly
    for (let i = 0; i < 5; i++) {
      const message = `Rapid message ${i} - ${Date.now()}`;
      await messageInput.fill(message);
      await sendButton.click();
      await page.waitForTimeout(100); // Small delay
    }
    
    // Verify all messages appear
    for (let i = 0; i < 5; i++) {
      await expect(
        page.locator(`[data-testid="message"]:has-text("Rapid message ${i}")`)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle AI handover functionality', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Send a message that might trigger AI handover
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const handoverMessage = 'I need to speak with a human agent immediately';
    await messageInput.fill(handoverMessage);
    await page.click('[data-testid="widget-send-button"]');
    
    // Check for AI handover indicators
    const handoverIndicator = page.locator('[data-testid="ai-handover-indicator"]');
    if (await handoverIndicator.count() > 0) {
      await expect(handoverIndicator).toBeVisible({ timeout: 10000 });
    }
  });
}); 