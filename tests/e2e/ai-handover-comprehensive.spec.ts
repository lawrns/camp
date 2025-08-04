import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestHelpers } from './test-config';

test.describe('AI Handover Comprehensive Tests', () => {
  test('should handle AI handover flow from widget to dashboard', async ({ browser }) => {
    console.log('🤖 Testing AI handover flow...');
    
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
      
      // Send initial message from widget
      const messageInput = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_MESSAGE_INPUT);
      const sendButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_SEND_BUTTON);
      
      const initialMessage = 'I need help with a complex issue';
      await messageInput.fill(initialMessage);
      await sendButton.click();
      
      // Verify message appears
      const sentMessage = widgetPage.locator(`${TEST_CONFIG.SELECTORS.WIDGET_MESSAGE}:has-text("${initialMessage}")`);
      await expect(sentMessage).toBeVisible({ timeout: 5000 });
      
      // Setup dashboard
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
      await TestHelpers.fillInput(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
      await TestHelpers.clickElement(dashboardPage, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
      
      await TestHelpers.waitForNavigation(dashboardPage, '**/dashboard**');
      
      // Navigate to inbox
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
      await dashboardPage.waitForLoadState('networkidle');
      
      // Wait for conversation to appear
      const conversationList = dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_LIST);
      await expect(conversationList).toBeVisible({ timeout: 10000 });
      
      // Click on the conversation
      const conversationRow = dashboardPage.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).first();
      await expect(conversationRow).toBeVisible({ timeout: 5000 });
      await conversationRow.click();
      
      // Verify AI handover button is present
      const aiHandoverButton = dashboardPage.locator('[data-testid="ai-handover-button"], [data-testid="composer-ai-handover"]');
      await expect(aiHandoverButton).toBeVisible({ timeout: 5000 });
      
      // Test AI handover activation
      await aiHandoverButton.click();
      
      // Verify AI is now active
      const aiActiveIndicator = dashboardPage.locator('[data-testid="ai-active-indicator"], [data-testid="ai-status-active"]');
      await expect(aiActiveIndicator).toBeVisible({ timeout: 5000 });
      
      // Send message as AI
      const dashboardMessageInput = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_INPUT);
      const dashboardSendButton = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON);
      
      const aiMessage = 'I am now handling this conversation with AI assistance. How can I help you?';
      await dashboardMessageInput.fill(aiMessage);
      await dashboardSendButton.click();
      
      // Verify AI message appears in dashboard
      const aiMessageElement = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.MESSAGE_ITEM}:has-text("${aiMessage}")`);
      await expect(aiMessageElement).toBeVisible({ timeout: 5000 });
      
      // Verify AI message appears in widget
      await widgetPage.waitForTimeout(3000);
      const widgetAiMessage = widgetPage.locator(`${TEST_CONFIG.SELECTORS.WIDGET_MESSAGE}:has-text("${aiMessage}")`);
      await expect(widgetAiMessage).toBeVisible({ timeout: 5000 });
      
      console.log('✅ AI handover flow completed successfully');
      
    } finally {
      await context.close();
    }
  });
  
  test('should handle AI handover deactivation', async ({ page }) => {
    console.log('🔄 Testing AI handover deactivation...');
    
    // Login to dashboard
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
    await TestHelpers.clickElement(page, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
    
    await TestHelpers.waitForNavigation(page, '**/dashboard**');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Click on conversation
    const conversationRow = page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ROW).first();
    await expect(conversationRow).toBeVisible({ timeout: 5000 });
    await conversationRow.click();
    
    // Activate AI handover
    const aiHandoverButton = page.locator('[data-testid="ai-handover-button"], [data-testid="composer-ai-handover"]');
    await expect(aiHandoverButton).toBeVisible({ timeout: 5000 });
    await aiHandoverButton.click();
    
    // Verify AI is active
    const aiActiveIndicator = page.locator('[data-testid="ai-active-indicator"], [data-testid="ai-status-active"]');
    await expect(aiActiveIndicator).toBeVisible({ timeout: 5000 });
    
    // Deactivate AI handover
    await aiHandoverButton.click();
    
    // Verify AI is deactivated
    const aiInactiveIndicator = page.locator('[data-testid="ai-inactive-indicator"], [data-testid="ai-status-inactive"]');
    await expect(aiInactiveIndicator).toBeVisible({ timeout: 5000 });
    
    console.log('✅ AI handover deactivation completed successfully');
  });
  
  test('should handle AI handover with conversation history', async ({ browser }) => {
    console.log('📚 Testing AI handover with conversation history...');
    
    const context = await browser.newContext();
    const widgetPage = await context.newPage();
    const dashboardPage = await context.newPage();
    
    try {
      // Setup widget and send multiple messages
      await widgetPage.goto(TEST_CONFIG.WIDGET_URL);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_PANEL);
      await expect(widgetPanel).toBeVisible();
      
      // Send multiple messages to build conversation history
      const messages = [
        'Hello, I have a question',
        'I need help with my account',
        'Can you assist me with billing?'
      ];
      
      for (const message of messages) {
        const messageInput = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_MESSAGE_INPUT);
        const sendButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_SEND_BUTTON);
        
        await messageInput.fill(message);
        await sendButton.click();
        await widgetPage.waitForTimeout(1000);
      }
      
      // Setup dashboard and navigate to conversation
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
      
      // Verify conversation history is visible
      for (const message of messages) {
        const messageElement = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.MESSAGE_ITEM}:has-text("${message}")`);
        await expect(messageElement).toBeVisible({ timeout: 5000 });
      }
      
      // Activate AI handover
      const aiHandoverButton = dashboardPage.locator('[data-testid="ai-handover-button"], [data-testid="composer-ai-handover"]');
      await expect(aiHandoverButton).toBeVisible({ timeout: 5000 });
      await aiHandoverButton.click();
      
      // Verify AI is active and can see conversation history
      const aiActiveIndicator = dashboardPage.locator('[data-testid="ai-active-indicator"], [data-testid="ai-status-active"]');
      await expect(aiActiveIndicator).toBeVisible({ timeout: 5000 });
      
      // Send AI response that references conversation history
      const dashboardMessageInput = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_INPUT);
      const dashboardSendButton = dashboardPage.locator(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON);
      
      const aiResponse = 'I can see you have questions about your account and billing. Let me help you with that.';
      await dashboardMessageInput.fill(aiResponse);
      await dashboardSendButton.click();
      
      // Verify AI response appears
      const aiResponseElement = dashboardPage.locator(`${TEST_CONFIG.SELECTORS.MESSAGE_ITEM}:has-text("${aiResponse}")`);
      await expect(aiResponseElement).toBeVisible({ timeout: 5000 });
      
      console.log('✅ AI handover with conversation history completed successfully');
      
    } finally {
      await context.close();
    }
  });
}); 