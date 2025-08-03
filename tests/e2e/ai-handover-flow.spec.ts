import { test, expect, Page } from '@playwright/test';
// Removed Supabase import to avoid environment variable issues in testing

/**
 * AI Handover Flow E2E Tests
 * 
 * Tests the complete AI handover system including:
 * - Human to AI handover
 * - AI to Human escalation
 * - AI to AI transfer
 * - Handover rollback
 */

// Test data
const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const TEST_AGENT_EMAIL = 'jam@jam.com';
const TEST_AGENT_PASSWORD = 'password123';

test.describe('AI Handover Flow', () => {
  let agentPage: Page;
  let widgetPage: Page;
  let conversationId: string;

  test.beforeEach(async ({ browser }) => {
    // Create separate pages for agent dashboard and widget
    agentPage = await browser.newPage();
    widgetPage = await browser.newPage();

    // Setup agent authentication
    await agentPage.goto('http://localhost:3001/dashboard/inbox');
    await agentPage.fill('[data-testid="email-input"]', TEST_AGENT_EMAIL);
    await agentPage.fill('[data-testid="password-input"]', TEST_AGENT_PASSWORD);
    await agentPage.click('[data-testid="login-button"]');
    await agentPage.waitForURL('**/dashboard/inbox');

    // Setup widget conversation
    await widgetPage.goto('http://localhost:3001/widget-test');
    await widgetPage.click('[data-testid="start-conversation"]');
    
    // Get conversation ID from widget
    const conversationElement = await widgetPage.locator('[data-conversation-id]').first();
    conversationId = await conversationElement.getAttribute('data-conversation-id') || '';
    expect(conversationId).toBeTruthy();
  });

  test('Human to AI Handover Flow', async () => {
    // Step 1: Agent starts conversation
    await agentPage.click(`[data-conversation-id="${conversationId}"]`);
    await agentPage.fill('[data-testid="message-input"]', 'Hello! How can I help you today?');
    await agentPage.click('[data-testid="send-button"]');

    // Verify message appears in widget
    await expect(widgetPage.locator('[data-testid="message-bubble"]').last()).toContainText('Hello! How can I help you today?');

    // Step 2: Customer asks a knowledge-base question
    await widgetPage.fill('[data-testid="widget-message-input"]', 'How do I reset my password?');
    await widgetPage.click('[data-testid="widget-send-button"]');

    // Step 3: Agent initiates handover to AI
    await agentPage.click('[data-testid="ai-handover-button"]');
    await agentPage.fill('[data-testid="handover-context"]', 'Customer needs password reset help');
    await agentPage.selectOption('[data-testid="confidence-threshold"]', '0.8');
    await agentPage.click('[data-testid="confirm-handover"]');

    // Step 4: Verify handover completion
    await expect(agentPage.locator('[data-testid="handover-status"]')).toContainText('Handover completed');
    await expect(agentPage.locator('[data-testid="ai-session-indicator"]')).toBeVisible();

    // Step 5: Verify AI responds to customer
    await expect(widgetPage.locator('[data-testid="ai-message"]').last()).toContainText('password reset');
    
    // Verify AI response includes knowledge base content
    const aiResponse = await widgetPage.locator('[data-testid="ai-message"]').last().textContent();
    expect(aiResponse).toMatch(/reset.*password|password.*reset/i);

    // Step 6: Verify real-time sync
    await expect(agentPage.locator('[data-testid="ai-response-indicator"]')).toBeVisible();
  });

  test('AI to Human Escalation Flow', async () => {
    // Step 1: Start with AI session
    await agentPage.goto(`http://localhost:3001/dashboard/inbox/${conversationId}`);
    await agentPage.click('[data-testid="start-ai-session"]');
    
    // Step 2: Customer asks complex question that triggers escalation
    await widgetPage.fill('[data-testid="widget-message-input"]', 'I need to cancel my subscription and get a refund for billing issues');
    await widgetPage.click('[data-testid="widget-send-button"]');

    // Step 3: AI detects low confidence and escalates
    await expect(agentPage.locator('[data-testid="escalation-alert"]')).toBeVisible({ timeout: 10000 });
    await expect(agentPage.locator('[data-testid="escalation-reason"]')).toContainText('low_confidence');

    // Step 4: Agent accepts escalation
    await agentPage.click('[data-testid="accept-escalation"]');

    // Step 5: Verify agent receives full context
    await expect(agentPage.locator('[data-testid="ai-context-panel"]')).toBeVisible();
    await expect(agentPage.locator('[data-testid="previous-ai-responses"]')).toBeVisible();
    await expect(agentPage.locator('[data-testid="customer-intent"]')).toContainText('billing');

    // Step 6: Agent responds with context
    await agentPage.fill('[data-testid="message-input"]', 'I can help you with your billing and refund request');
    await agentPage.click('[data-testid="send-button"]');

    // Verify customer receives agent response
    await expect(widgetPage.locator('[data-testid="agent-message"]').last()).toContainText('billing and refund');
  });

  test('Handover Rollback Flow', async () => {
    // Step 1: Perform initial handover
    await agentPage.goto(`http://localhost:3001/dashboard/inbox/${conversationId}`);
    await agentPage.click('[data-testid="ai-handover-button"]');
    await agentPage.click('[data-testid="confirm-handover"]');
    
    await expect(agentPage.locator('[data-testid="handover-status"]')).toContainText('completed');

    // Step 2: Initiate rollback
    await agentPage.click('[data-testid="handover-options"]');
    await agentPage.click('[data-testid="rollback-handover"]');
    await agentPage.fill('[data-testid="rollback-reason"]', 'AI not handling customer properly');
    await agentPage.click('[data-testid="confirm-rollback"]');

    // Step 3: Verify rollback completion
    await expect(agentPage.locator('[data-testid="rollback-status"]')).toContainText('Rollback completed');
    await expect(agentPage.locator('[data-testid="ai-session-indicator"]')).not.toBeVisible();
    await expect(agentPage.locator('[data-testid="agent-active-indicator"]')).toBeVisible();

    // Step 4: Verify agent can resume conversation
    await agentPage.fill('[data-testid="message-input"]', 'I\'m back to help you personally');
    await agentPage.click('[data-testid="send-button"]');

    await expect(widgetPage.locator('[data-testid="agent-message"]').last()).toContainText('back to help');
  });

  test('Real-time Handover Synchronization', async () => {
    // Test that all parties see handover events in real-time
    
    // Step 1: Start handover process
    await agentPage.goto(`http://localhost:3001/dashboard/inbox/${conversationId}`);
    await agentPage.click('[data-testid="ai-handover-button"]');

    // Step 2: Verify real-time status updates
    await expect(agentPage.locator('[data-testid="handover-progress"]')).toBeVisible();
    await expect(widgetPage.locator('[data-testid="handover-notification"]')).toBeVisible({ timeout: 5000 });

    // Step 3: Complete handover
    await agentPage.click('[data-testid="confirm-handover"]');

    // Step 4: Verify all parties receive completion events
    await expect(agentPage.locator('[data-testid="handover-completed"]')).toBeVisible({ timeout: 3000 });
    await expect(widgetPage.locator('[data-testid="ai-takeover-message"]')).toBeVisible({ timeout: 3000 });

    // Step 5: Test message continuity during handover
    await widgetPage.fill('[data-testid="widget-message-input"]', 'Test message during handover');
    await widgetPage.click('[data-testid="widget-send-button"]');

    // Verify message is handled by AI
    await expect(widgetPage.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 5000 });
    await expect(agentPage.locator('[data-testid="ai-handled-message"]')).toBeVisible({ timeout: 5000 });
  });

  test.afterEach(async () => {
    // Cleanup: Close pages
    await agentPage.close();
    await widgetPage.close();

    // Cleanup: Reset conversation state in database
    if (conversationId) {
      await supabase.admin()
        .from('conversations')
        .update({ 
          status: 'closed',
          ai_session_id: null,
          assigned_agent_id: null 
        })
        .eq('id', conversationId);
    }
  });
});
