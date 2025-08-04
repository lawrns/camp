/**
 * MULTI-USER SCENARIO E2E TESTS
 * 
 * Complex scenarios with multiple users, agents, and AI interactions:
 * - Multiple agents handling different conversations
 * - Agent handoffs and transfers
 * - AI-to-human handover scenarios
 * - Supervisor monitoring and intervention
 * - Load testing with concurrent users
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const TEST_TIMEOUT = 60000;
const MESSAGE_WAIT_TIME = 10000;

interface MultiUserContext {
  browsers: Browser[];
  contexts: BrowserContext[];
  pages: Page[];
  users: Array<{
    type: 'agent' | 'customer' | 'supervisor';
    email: string;
    page: Page;
    context: BrowserContext;
  }>;
  organizationId: string;
  conversationIds: string[];
}

test.describe('Multi-User Scenarios E2E', () => {
  let testContext: MultiUserContext;

  test.beforeAll(async ({ browser }) => {
    const testMetadata = JSON.parse(
      require('fs').readFileSync('e2e/test-metadata.json', 'utf-8')
    );

    testContext = {
      browsers: [browser],
      contexts: [],
      pages: [],
      users: [],
      organizationId: testMetadata.testOrgId,
      conversationIds: testMetadata.testConversations.map((c: unknown) => c.id),
    };

    // Create additional browsers for multi-user testing
    for (let i = 0; i < 4; i++) {
      const newBrowser = await browser.browserType().launch();
      testContext.browsers.push(newBrowser);
    }

    // Setup users
    const userConfigs = [
      { type: 'agent' as const, email: 'jam@jam.com', needsAuth: true },
      { type: 'agent' as const, email: 'agent2@test.com', needsAuth: true },
      { type: 'supervisor' as const, email: 'admin@test.com', needsAuth: true },
      { type: 'customer' as const, email: 'customer1@test.com', needsAuth: false },
      { type: 'customer' as const, email: 'customer2@test.com', needsAuth: false },
    ];

    for (let i = 0; i < userConfigs.length; i++) {
      const config = userConfigs[i];
      const browser = testContext.browsers[i];
      
      const context = config.needsAuth 
        ? await browser.newContext({ storageState: 'e2e/auth-state.json' })
        : await browser.newContext();
      
      const page = await context.newPage();
      
      testContext.contexts.push(context);
      testContext.pages.push(page);
      testContext.users.push({
        ...config,
        page,
        context,
      });
    }
  });

  test.afterAll(async () => {
    // Close all browsers except the first one (managed by Playwright)
    for (let i = 1; i < testContext.browsers.length; i++) {
      await testContext.browsers[i].close();
    }
    
    // Close all contexts
    for (const context of testContext.contexts) {
      await context.close();
    }
  });

  test('should handle multiple agents serving different customers', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const agent1 = testContext.users.find(u => u.email === 'jam@jam.com')!;
    const agent2 = testContext.users.find(u => u.email === 'agent2@test.com')!;
    const customer1 = testContext.users.find(u => u.email === 'customer1@test.com')!;
    const customer2 = testContext.users.find(u => u.email === 'customer2@test.com')!;

    // ========================================
    // 1. SETUP AGENT DASHBOARDS
    // ========================================

    // Agent 1 goes to dashboard
    await agent1.page.goto('/dashboard/conversations');
    await agent1.page.waitForLoadState('networkidle');

    // Agent 2 goes to dashboard
    await agent2.page.goto('/dashboard/conversations');
    await agent2.page.waitForLoadState('networkidle');

    // ========================================
    // 2. CUSTOMERS START CONVERSATIONS
    // ========================================

    // Customer 1 starts conversation
    await customer1.page.goto(`/widget?org=${testContext.organizationId}`);
    await customer1.page.waitForLoadState('networkidle');

    const customer1Message = `E2E_TEST: Customer 1 message ${Date.now()}`;
    await customer1.page.fill('[data-testid="widget-message-input"]', customer1Message);
    await customer1.page.click('[data-testid="widget-send-button"]');

    // Customer 2 starts conversation
    await customer2.page.goto(`/widget?org=${testContext.organizationId}`);
    await customer2.page.waitForLoadState('networkidle');

    const customer2Message = `E2E_TEST: Customer 2 message ${Date.now()}`;
    await customer2.page.fill('[data-testid="widget-message-input"]', customer2Message);
    await customer2.page.click('[data-testid="widget-send-button"]');

    // ========================================
    // 3. AGENTS HANDLE DIFFERENT CONVERSATIONS
    // ========================================

    // Agent 1 takes first conversation
    await expect(
      agent1.page.locator('[data-testid="new-conversation-notification"]').first()
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await agent1.page.click('[data-testid="new-conversation-notification"]');
    await agent1.page.click('[data-testid="assign-to-me-button"]');

    // Agent 2 takes second conversation
    await expect(
      agent2.page.locator('[data-testid="new-conversation-notification"]').first()
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await agent2.page.click('[data-testid="new-conversation-notification"]');
    await agent2.page.click('[data-testid="assign-to-me-button"]');

    // ========================================
    // 4. VERIFY ISOLATED CONVERSATIONS
    // ========================================

    // Agent 1 responds to customer 1
    const agent1Response = `E2E_TEST: Agent 1 response ${Date.now()}`;
    await agent1.page.fill('[data-testid="message-input"]', agent1Response);
    await agent1.page.click('[data-testid="send-button"]');

    // Agent 2 responds to customer 2
    const agent2Response = `E2E_TEST: Agent 2 response ${Date.now()}`;
    await agent2.page.fill('[data-testid="message-input"]', agent2Response);
    await agent2.page.click('[data-testid="send-button"]');

    // Verify customers receive correct responses
    await expect(
      customer1.page.locator(`[data-testid="message"]:has-text("${agent1Response}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await expect(
      customer2.page.locator(`[data-testid="message"]:has-text("${agent2Response}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Verify agents don't see each other's conversations
    await expect(
      agent1.page.locator(`[data-testid="message"]:has-text("${customer2Message}")`)
    ).not.toBeVisible();

    await expect(
      agent2.page.locator(`[data-testid="message"]:has-text("${customer1Message}")`)
    ).not.toBeVisible();

    console.log('✅ Multiple agents serving different customers verified');
  });

  test('should handle agent handoff scenarios', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const agent1 = testContext.users.find(u => u.email === 'jam@jam.com')!;
    const agent2 = testContext.users.find(u => u.email === 'agent2@test.com')!;
    const customer = testContext.users.find(u => u.email === 'customer1@test.com')!;

    // ========================================
    // 1. CUSTOMER CONVERSATION WITH AGENT 1
    // ========================================

    const handoffMessage = `E2E_TEST: Handoff conversation ${Date.now()}`;
    await customer.page.fill('[data-testid="widget-message-input"]', handoffMessage);
    await customer.page.click('[data-testid="widget-send-button"]');

    // Agent 1 takes the conversation
    await agent1.page.reload();
    await expect(
      agent1.page.locator('[data-testid="new-conversation-notification"]').first()
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await agent1.page.click('[data-testid="new-conversation-notification"]');
    await agent1.page.click('[data-testid="assign-to-me-button"]');

    // ========================================
    // 2. AGENT 1 INITIATES HANDOFF
    // ========================================

    // Agent 1 transfers conversation to Agent 2
    await agent1.page.click('[data-testid="transfer-conversation-button"]');
    await agent1.page.selectOption('[data-testid="transfer-agent-select"]', 'agent2@test.com');
    await agent1.page.fill('[data-testid="transfer-note"]', 'Customer needs technical support');
    await agent1.page.click('[data-testid="confirm-transfer-button"]');

    // ========================================
    // 3. AGENT 2 RECEIVES HANDOFF
    // ========================================

    // Agent 2 should receive transfer notification
    await expect(
      agent2.page.locator('[data-testid="transfer-notification"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await agent2.page.click('[data-testid="accept-transfer-button"]');

    // ========================================
    // 4. VERIFY HANDOFF COMPLETION
    // ========================================

    // Customer should see handoff notification
    await expect(
      customer.page.locator('[data-testid="agent-changed-notification"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent 2 can now respond
    const handoffResponse = `E2E_TEST: Agent 2 after handoff ${Date.now()}`;
    await agent2.page.fill('[data-testid="message-input"]', handoffResponse);
    await agent2.page.click('[data-testid="send-button"]');

    // Customer receives response from new agent
    await expect(
      customer.page.locator(`[data-testid="message"]:has-text("${handoffResponse}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent 1 should no longer have access to the conversation
    await expect(
      agent1.page.locator('[data-testid="conversation-transferred-indicator"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Agent handoff scenario verified');
  });

  test('should handle AI to human handover', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const agent = testContext.users.find(u => u.email === 'jam@jam.com')!;
    const customer = testContext.users.find(u => u.email === 'customer2@test.com')!;

    // ========================================
    // 1. CUSTOMER STARTS WITH AI
    // ========================================

    const aiTriggerMessage = `E2E_TEST: I need help with billing ${Date.now()}`;
    await customer.page.fill('[data-testid="widget-message-input"]', aiTriggerMessage);
    await customer.page.click('[data-testid="widget-send-button"]');

    // AI should respond first
    await expect(
      customer.page.locator('[data-testid="ai-response-indicator"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. TRIGGER AI HANDOVER
    // ========================================

    // Customer asks for human agent
    const handoverRequest = `E2E_TEST: I need to speak with a human agent ${Date.now()}`;
    await customer.page.fill('[data-testid="widget-message-input"]', handoverRequest);
    await customer.page.click('[data-testid="widget-send-button"]');

    // AI should trigger handover
    await expect(
      customer.page.locator('[data-testid="ai-handover-message"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. AGENT RECEIVES AI HANDOVER
    // ========================================

    // Agent should receive AI handover notification
    await agent.page.reload();
    await expect(
      agent.page.locator('[data-testid="ai-handover-notification"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await agent.page.click('[data-testid="ai-handover-notification"]');
    await agent.page.click('[data-testid="accept-handover-button"]');

    // ========================================
    // 4. VERIFY HUMAN AGENT TAKEOVER
    // ========================================

    // Customer should see human agent joined
    await expect(
      customer.page.locator('[data-testid="human-agent-joined-message"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent can see AI conversation history
    await expect(
      agent.page.locator(`[data-testid="message"]:has-text("${aiTriggerMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent responds as human
    const humanResponse = `E2E_TEST: Human agent here, how can I help? ${Date.now()}`;
    await agent.page.fill('[data-testid="message-input"]', humanResponse);
    await agent.page.click('[data-testid="send-button"]');

    // Customer receives human response
    await expect(
      customer.page.locator(`[data-testid="message"]:has-text("${humanResponse}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ AI to human handover verified');
  });

  test('should handle supervisor monitoring and intervention', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const supervisor = testContext.users.find(u => u.email === 'admin@test.com')!;
    const agent = testContext.users.find(u => u.email === 'jam@jam.com')!;
    const customer = testContext.users.find(u => u.email === 'customer1@test.com')!;

    // ========================================
    // 1. SUPERVISOR MONITORS CONVERSATIONS
    // ========================================

    // Supervisor goes to monitoring dashboard
    await supervisor.page.goto('/dashboard/monitoring');
    await supervisor.page.waitForLoadState('networkidle');

    // Supervisor should see active conversations
    await expect(
      supervisor.page.locator('[data-testid="active-conversations-list"]')
    ).toBeVisible();

    // ========================================
    // 2. ONGOING AGENT-CUSTOMER CONVERSATION
    // ========================================

    const monitoredMessage = `E2E_TEST: Monitored conversation ${Date.now()}`;
    await customer.page.fill('[data-testid="widget-message-input"]', monitoredMessage);
    await customer.page.click('[data-testid="widget-send-button"]');

    // Agent responds
    const agentMonitoredResponse = `E2E_TEST: Agent monitored response ${Date.now()}`;
    await agent.page.fill('[data-testid="message-input"]', agentMonitoredResponse);
    await agent.page.click('[data-testid="send-button"]');

    // ========================================
    // 3. SUPERVISOR INTERVENTION
    // ========================================

    // Supervisor can see the conversation
    await expect(
      supervisor.page.locator(`[data-testid="conversation-preview"]:has-text("${monitoredMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Supervisor joins conversation
    await supervisor.page.click('[data-testid="join-conversation-button"]');

    // Supervisor sends message
    const supervisorMessage = `E2E_TEST: Supervisor intervention ${Date.now()}`;
    await supervisor.page.fill('[data-testid="supervisor-message-input"]', supervisorMessage);
    await supervisor.page.click('[data-testid="supervisor-send-button"]');

    // ========================================
    // 4. VERIFY SUPERVISOR VISIBILITY
    // ========================================

    // Agent should see supervisor joined
    await expect(
      agent.page.locator('[data-testid="supervisor-joined-notification"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Customer should see supervisor message
    await expect(
      customer.page.locator(`[data-testid="message"]:has-text("${supervisorMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Supervisor can see all messages
    await expect(
      supervisor.page.locator(`[data-testid="message"]:has-text("${agentMonitoredResponse}")`)
    ).toBeVisible();

    console.log('✅ Supervisor monitoring and intervention verified');
  });

  test('should handle concurrent message load', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const agent = testContext.users.find(u => u.email === 'jam@jam.com')!;
    const customers = testContext.users.filter(u => u.type === 'customer');

    // ========================================
    // 1. SETUP AGENT FOR LOAD TEST
    // ========================================

    await agent.page.goto('/dashboard/conversations');
    await agent.page.waitForLoadState('networkidle');

    // ========================================
    // 2. CONCURRENT CUSTOMER MESSAGES
    // ========================================

    const timestamp = Date.now();
    const messagePromises = customers.map(async (customer, index) => {
      const message = `E2E_TEST: Load test message ${index} at ${timestamp}`;
      
      await customer.page.fill('[data-testid="widget-message-input"]', message);
      await customer.page.click('[data-testid="widget-send-button"]');
      
      return message;
    });

    const sentMessages = await Promise.all(messagePromises);

    // ========================================
    // 3. VERIFY ALL MESSAGES RECEIVED
    // ========================================

    // Agent should receive all messages
    for (const message of sentMessages) {
      await expect(
        agent.page.locator(`[data-testid="message"]:has-text("${message}")`)
      ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });
    }

    // ========================================
    // 4. AGENT RESPONDS TO ALL
    // ========================================

    const responsePromises = sentMessages.map(async (_, index) => {
      const response = `E2E_TEST: Agent response ${index} at ${timestamp}`;
      
      // Navigate to conversation and respond
      await agent.page.click(`[data-testid="conversation-${index}"]`);
      await agent.page.fill('[data-testid="message-input"]', response);
      await agent.page.click('[data-testid="send-button"]');
      
      return response;
    });

    const sentResponses = await Promise.all(responsePromises);

    // Verify customers receive responses
    for (let i = 0; i < customers.length; i++) {
      await expect(
        customers[i].page.locator(`[data-testid="message"]:has-text("${sentResponses[i]}")`)
      ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });
    }

    console.log('✅ Concurrent message load handling verified');
  });
});
