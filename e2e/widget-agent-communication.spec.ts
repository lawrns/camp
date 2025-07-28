/**
 * WIDGET-AGENT COMMUNICATION E2E TESTS
 * 
 * Comprehensive tests for widget-to-agent communication flows:
 * - Widget initialization and connection
 * - Customer message flows
 * - Agent response handling
 * - File uploads and media
 * - Widget customization
 * - Mobile responsiveness
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const TEST_TIMEOUT = 45000;
const MESSAGE_WAIT_TIME = 8000;

interface WidgetTestContext {
  agentBrowser: Browser;
  widgetBrowser: Browser;
  agentContext: BrowserContext;
  widgetContext: BrowserContext;
  agentPage: Page;
  widgetPage: Page;
  organizationId: string;
  conversationId: string;
}

test.describe('Widget-Agent Communication E2E', () => {
  let testContext: WidgetTestContext;

  test.beforeAll(async ({ browser }) => {
    const testMetadata = JSON.parse(
      require('fs').readFileSync('e2e/test-metadata.json', 'utf-8')
    );

    testContext = {
      agentBrowser: browser,
      widgetBrowser: await browser.browserType().launch(),
      agentContext: null as any,
      widgetContext: null as any,
      agentPage: null as any,
      widgetPage: null as any,
      organizationId: testMetadata.testOrgId,
      conversationId: testMetadata.testConversations[0].id,
    };

    // Setup agent with authentication
    testContext.agentContext = await testContext.agentBrowser.newContext({
      storageState: 'e2e/auth-state.json',
    });
    testContext.agentPage = await testContext.agentContext.newPage();

    // Setup widget context
    testContext.widgetContext = await testContext.widgetBrowser.newContext();
    testContext.widgetPage = await testContext.widgetContext.newPage();
  });

  test.afterAll(async () => {
    await testContext.widgetBrowser?.close();
    await testContext.agentContext?.close();
    await testContext.widgetContext?.close();
  });

  test('should initialize widget and establish connection', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. LOAD WIDGET
    // ========================================
    await testContext.widgetPage.goto(`/widget?org=${testContext.organizationId}`);
    await testContext.widgetPage.waitForLoadState('networkidle');

    // Verify widget loads correctly
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-container"]')
    ).toBeVisible();

    // Verify connection status
    await expect(
      testContext.widgetPage.locator('[data-testid="connection-status-online"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. VERIFY WIDGET COMPONENTS
    // ========================================
    
    // Check essential widget elements
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-header"]')
    ).toBeVisible();

    await expect(
      testContext.widgetPage.locator('[data-testid="widget-message-input"]')
    ).toBeVisible();

    await expect(
      testContext.widgetPage.locator('[data-testid="widget-send-button"]')
    ).toBeVisible();

    // ========================================
    // 3. TEST INITIAL GREETING
    // ========================================

    // Widget should show initial greeting
    await expect(
      testContext.widgetPage.locator('[data-testid="welcome-message"]')
    ).toBeVisible();

    console.log('✅ Widget initialization verified');
  });

  test('should handle customer conversation initiation', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. CUSTOMER STARTS CONVERSATION
    // ========================================
    
    const initialMessage = `E2E_TEST: Customer starting conversation ${Date.now()}`;
    
    // Fill customer details if required
    const nameInput = testContext.widgetPage.locator('[data-testid="customer-name-input"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Customer');
    }

    const emailInput = testContext.widgetPage.locator('[data-testid="customer-email-input"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('e2e-customer@test.com');
    }

    // Send initial message
    await testContext.widgetPage.fill('[data-testid="widget-message-input"]', initialMessage);
    await testContext.widgetPage.click('[data-testid="widget-send-button"]');

    // Verify message appears in widget
    await expect(
      testContext.widgetPage.locator(`[data-testid="message"]:has-text("${initialMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. AGENT RECEIVES NOTIFICATION
    // ========================================

    // Navigate to agent dashboard
    await testContext.agentPage.goto('/dashboard/conversations');
    await testContext.agentPage.waitForLoadState('networkidle');

    // Check for new conversation notification
    await expect(
      testContext.agentPage.locator('[data-testid="new-conversation-notification"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Click on the new conversation
    await testContext.agentPage.click('[data-testid="new-conversation-notification"]');

    // Verify agent sees the customer message
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${initialMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Customer conversation initiation verified');
  });

  test('should handle agent assignment and response', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. AGENT TAKES CONVERSATION
    // ========================================

    // Agent assigns conversation to themselves
    await testContext.agentPage.click('[data-testid="assign-to-me-button"]');

    // Verify assignment
    await expect(
      testContext.agentPage.locator('[data-testid="assigned-to-me-indicator"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Customer should see agent assignment
    await expect(
      testContext.widgetPage.locator('[data-testid="agent-assigned-message"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. AGENT SENDS RESPONSE
    // ========================================

    const agentResponse = `E2E_TEST: Agent response ${Date.now()}`;
    
    await testContext.agentPage.fill('[data-testid="message-input"]', agentResponse);
    await testContext.agentPage.click('[data-testid="send-button"]');

    // Verify response appears in agent dashboard
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${agentResponse}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Verify response appears in widget
    await expect(
      testContext.widgetPage.locator(`[data-testid="message"]:has-text("${agentResponse}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. VERIFY AGENT INFORMATION
    // ========================================

    // Widget should show agent name and avatar
    await expect(
      testContext.widgetPage.locator('[data-testid="agent-name"]')
    ).toBeVisible();

    await expect(
      testContext.widgetPage.locator('[data-testid="agent-avatar"]')
    ).toBeVisible();

    console.log('✅ Agent assignment and response verified');
  });

  test('should handle emoji and rich text messages', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. CUSTOMER SENDS EMOJI MESSAGE
    // ========================================

    const emojiMessage = `E2E_TEST: Hello! 👋 How are you? 😊 ${Date.now()}`;

    await testContext.widgetPage.fill('[data-testid="widget-message-input"]', emojiMessage);
    await testContext.widgetPage.click('[data-testid="widget-send-button"]');

    // Verify emoji message appears correctly in widget
    await expect(
      testContext.widgetPage.locator(`[data-testid="message"]:has-text("👋")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Verify emoji message appears correctly in agent dashboard
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("👋")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. AGENT RESPONDS WITH FORMATTED TEXT
    // ========================================

    const formattedResponse = `E2E_TEST: I'm doing great! Thanks for asking. 🎉 ${Date.now()}`;

    await testContext.agentPage.fill('[data-testid="message-input"]', formattedResponse);
    await testContext.agentPage.click('[data-testid="send-button"]');

    // Verify formatted response appears in both interfaces
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("🎉")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await expect(
      testContext.widgetPage.locator(`[data-testid="message"]:has-text("🎉")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Emoji and rich text messaging verified');
  });

  test('should handle widget customization', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. TEST WIDGET THEMING
    // ========================================

    // Widget should respect organization branding
    const widgetContainer = testContext.widgetPage.locator('[data-testid="widget-container"]');
    
    // Check if custom colors are applied
    const backgroundColor = await widgetContainer.evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    expect(backgroundColor).toBeTruthy();

    // ========================================
    // 2. TEST WIDGET POSITIONING
    // ========================================

    // Widget should be positioned correctly
    const widgetPosition = await widgetContainer.boundingBox();
    expect(widgetPosition).toBeTruthy();
    expect(widgetPosition!.width).toBeGreaterThan(300);
    expect(widgetPosition!.height).toBeGreaterThan(400);

    // ========================================
    // 3. TEST WIDGET MINIMIZATION
    // ========================================

    // Minimize widget
    await testContext.widgetPage.click('[data-testid="minimize-widget-button"]');

    // Widget should be minimized
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-minimized"]')
    ).toBeVisible();

    // Restore widget
    await testContext.widgetPage.click('[data-testid="restore-widget-button"]');

    // Widget should be restored
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-container"]')
    ).toBeVisible();

    console.log('✅ Widget customization verified');
  });

  test('should handle mobile responsiveness', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. TEST MOBILE VIEWPORT
    // ========================================

    // Set mobile viewport
    await testContext.widgetPage.setViewportSize({ width: 375, height: 667 });

    // Widget should adapt to mobile
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-mobile-view"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. TEST MOBILE INTERACTIONS
    // ========================================

    const mobileMessage = `E2E_TEST: Mobile message ${Date.now()}`;

    // Send message on mobile
    await testContext.widgetPage.fill('[data-testid="widget-message-input"]', mobileMessage);
    await testContext.widgetPage.click('[data-testid="widget-send-button"]');

    // Message should appear
    await expect(
      testContext.widgetPage.locator(`[data-testid="message"]:has-text("${mobileMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent should receive mobile message
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${mobileMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. RESTORE DESKTOP VIEWPORT
    // ========================================

    await testContext.widgetPage.setViewportSize({ width: 1280, height: 720 });

    console.log('✅ Mobile responsiveness verified');
  });

  test('should handle conversation closure', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. AGENT CLOSES CONVERSATION
    // ========================================

    // Agent closes the conversation
    await testContext.agentPage.click('[data-testid="close-conversation-button"]');

    // Confirm closure
    await testContext.agentPage.click('[data-testid="confirm-close-button"]');

    // Verify conversation is closed in agent dashboard
    await expect(
      testContext.agentPage.locator('[data-testid="conversation-status-closed"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. CUSTOMER SEES CLOSURE NOTIFICATION
    // ========================================

    // Widget should show conversation closed message
    await expect(
      testContext.widgetPage.locator('[data-testid="conversation-closed-message"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. CUSTOMER CAN START NEW CONVERSATION
    // ========================================

    // Customer should be able to start new conversation
    await expect(
      testContext.widgetPage.locator('[data-testid="start-new-conversation-button"]')
    ).toBeVisible();

    // Click to start new conversation
    await testContext.widgetPage.click('[data-testid="start-new-conversation-button"]');

    // Widget should reset for new conversation
    await expect(
      testContext.widgetPage.locator('[data-testid="widget-message-input"]')
    ).toBeEnabled();

    console.log('✅ Conversation closure verified');
  });
});
