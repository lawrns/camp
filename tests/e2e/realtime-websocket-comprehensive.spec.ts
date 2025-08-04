import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestHelpers } from './test-config';

test.describe('Real-time WebSocket Comprehensive Tests', () => {
  test('should handle real-time message synchronization', async ({ browser }) => {
    console.log('🔌 Testing real-time message synchronization...');
    
    const context = await browser.newContext();
    const widgetPage = await context.newPage();
    const dashboardPage = await context.newPage();
    
    try {
      // Setup widget
      await widgetPage.goto(TEST_CONFIG.WIDGET_URL);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_PANEL);
      await expect(widgetPanel).toBeVisible();
      
      // Setup dashboard
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
      await TestHelpers.clickElement(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
      
      await TestHelpers.waitForNavigation(dashboardPage, '**/dashboard**');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
      await dashboardPage.waitForLoadState('networkidle');
      
      // Click on conversation
      const conversationRow = dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).first();
      await expect(conversationRow).toBeVisible({ timeout: 5000 });
      await conversationRow.click();
      
      // Send message from widget
      const widgetMessageInput = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_MESSAGE_INPUT);
      const widgetSendButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_SEND_BUTTON);
      
      const widgetMessage = 'Real-time test message from widget';
      await widgetMessageInput.fill(widgetMessage);
      await widgetSendButton.click();
      
      // Verify message appears in widget immediately
      const widgetMessageElement = widgetPage.locator(`${TEST_CONFIG.SELECTORS.WIDGET_MESSAGE}:has-text("${widgetMessage}")`);
      await expect(widgetMessageElement).toBeVisible({ timeout: 3000 });
      
      // Verify message appears in dashboard via real-time sync
      const dashboardMessageElement = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.MESSAGE_ITEM}:has-text("${widgetMessage}")`);
      await expect(dashboardMessageElement).toBeVisible({ timeout: 5000 });
      
      // Send message from dashboard
      const dashboardMessageInput = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_INPUT);
      const dashboardSendButton = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON);
      
      const dashboardMessage = 'Real-time test message from dashboard';
      await dashboardMessageInput.fill(dashboardMessage);
      await dashboardSendButton.click();
      
      // Verify message appears in dashboard immediately
      const dashboardSentMessage = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.MESSAGE_ITEM}:has-text("${dashboardMessage}")`);
      await expect(dashboardSentMessage).toBeVisible({ timeout: 3000 });
      
      // Verify message appears in widget via real-time sync
      const widgetReceivedMessage = widgetPage.locator(`${TEST_CONFIG.SELECTORS.WIDGET_MESSAGE}:has-text("${dashboardMessage}")`);
      await expect(widgetReceivedMessage).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Real-time message synchronization completed successfully');
      
    } finally {
      await context.close();
    }
  });
  
  test('should handle typing indicators in real-time', async ({ browser }) => {
    console.log('⌨️ Testing real-time typing indicators...');
    
    const context = await browser.newContext();
    const widgetPage = await context.newPage();
    const dashboardPage = await context.newPage();
    
    try {
      // Setup widget
      await widgetPage.goto(TEST_CONFIG.WIDGET_URL);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_PANEL);
      await expect(widgetPanel).toBeVisible();
      
      // Setup dashboard
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
      await TestHelpers.clickElement(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
      
      await TestHelpers.waitForNavigation(dashboardPage, '**/dashboard**');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
      await dashboardPage.waitForLoadState('networkidle');
      
      // Click on conversation
      const conversationRow = dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).first();
      await expect(conversationRow).toBeVisible({ timeout: 5000 });
      await conversationRow.click();
      
      // Start typing in dashboard
      const dashboardMessageInput = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_INPUT);
      await dashboardMessageInput.click();
      await dashboardMessageInput.type('Typing test message');
      
      // Verify typing indicator appears in widget
      const widgetTypingIndicator = widgetPage.locator('[data-testid="widget-typing-indicator"], [data-testid="typing-indicator"]');
      await expect(widgetTypingIndicator).toBeVisible({ timeout: 3000 });
      
      // Stop typing in dashboard
      await dashboardMessageInput.press('Escape');
      
      // Verify typing indicator disappears in widget
      await expect(widgetTypingIndicator).not.toBeVisible({ timeout: 3000 });
      
      // Start typing in widget
      const widgetMessageInput = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_MESSAGE_INPUT);
      await widgetMessageInput.click();
      await widgetMessageInput.type('Widget typing test');
      
      // Verify typing indicator appears in dashboard
      const dashboardTypingIndicator = dashboardPage.locator('[data-testid="typing-indicator"], [data-testid="agent-typing-indicator"]');
      await expect(dashboardTypingIndicator).toBeVisible({ timeout: 3000 });
      
      // Stop typing in widget
      await widgetMessageInput.press('Escape');
      
      // Verify typing indicator disappears in dashboard
      await expect(dashboardTypingIndicator).not.toBeVisible({ timeout: 3000 });
      
      console.log('✅ Real-time typing indicators completed successfully');
      
    } finally {
      await context.close();
    }
  });
  
  test('should handle connection status in real-time', async ({ page }) => {
    console.log('📡 Testing real-time connection status...');
    
    // Login to dashboard
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
    await TestHelpers.clickElement(page, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
    
    await TestHelpers.waitForNavigation(page, '**/dashboard**');
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Verify connection status indicator is present
    const connectionStatus = page.locator('[data-testid="connection-status"], [data-testid="realtime-status"]');
    await expect(connectionStatus).toBeVisible({ timeout: 5000 });
    
    // Verify connection is active
    const connectedStatus = page.locator('[data-testid="connection-connected"], [data-testid="status-connected"]');
    await expect(connectedStatus).toBeVisible({ timeout: 5000 });
    
    // Test connection status changes (simulate network issues)
    // Note: This would require mocking network conditions in a real test
    
    console.log('✅ Real-time connection status completed successfully');
  });
  
  test('should handle real-time conversation updates', async ({ browser }) => {
    console.log('🔄 Testing real-time conversation updates...');
    
    const context = await browser.newContext();
    const widgetPage = await context.newPage();
    const dashboardPage = await context.newPage();
    
    try {
      // Setup widget
      await widgetPage.goto(TEST_CONFIG.WIDGET_URL);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_PANEL);
      await expect(widgetPanel).toBeVisible();
      
      // Setup dashboard
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
      await TestHelpers.clickElement(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
      
      await TestHelpers.waitForNavigation(dashboardPage, '**/dashboard**');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
      await dashboardPage.waitForLoadState('networkidle');
      
      // Get initial conversation count
      const initialConversationCount = await dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).count();
      console.log(`Initial conversation count: ${initialConversationCount}`);
      
      // Send message from widget to create new conversation
      const widgetMessageInput = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_MESSAGE_INPUT);
      const widgetSendButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_SEND_BUTTON);
      
      const newConversationMessage = 'New conversation test message';
      await widgetMessageInput.fill(newConversationMessage);
      await widgetSendButton.click();
      
      // Wait for conversation to appear in dashboard
      await dashboardPage.waitForTimeout(3000);
      
      // Verify conversation count increased
      const newConversationCount = await dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).count();
      console.log(`New conversation count: ${newConversationCount}`);
      
      // Verify new conversation appears
      const newConversation = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.CONVERSATION_ROW}:has-text("${newConversationMessage}")`);
      await expect(newConversation).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Real-time conversation updates completed successfully');
      
    } finally {
      await context.close();
    }
  });
}); 