import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';

test.describe('Inbox AI Handover Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.admin.email);
    await page.fill('[data-testid="password-input"]', testUsers.admin.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for login to complete and navigate to inbox
    await page.waitForURL('/dashboard');
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
  });

  test('should initiate AI handover from agent to AI', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click AI handover button
    await page.click('[data-testid="ai-handover-button"]');
    
    // Verify handover modal appears
    await expect(page.locator('[data-testid="handover-modal"]')).toBeVisible();
    
    // Select handover reason
    await page.click('[data-testid="handover-reason-complex"]');
    
    // Add handover notes
    const notesInput = page.locator('[data-testid="handover-notes"]');
    await notesInput.fill('Customer needs technical assistance with API integration');
    
    // Confirm handover
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify handover is initiated
    await expect(page.locator('[data-testid="handover-status"]')).toContainText('AI Handover');
    await expect(page.locator('[data-testid="ai-indicator"]')).toBeVisible();
  });

  test('should handle AI handover from AI to agent', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Simulate conversation already in AI mode
    await page.evaluate(() => {
      const event = new CustomEvent('campfire-ai-handover-started', {
        detail: {
          conversationId: 'test-conv-123',
          aiAgent: 'gpt-4',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });
    
    // Click human handover button
    await page.click('[data-testid="human-handover-button"]');
    
    // Verify handover modal appears
    await expect(page.locator('[data-testid="handover-modal"]')).toBeVisible();
    
    // Select handover reason
    await page.click('[data-testid="handover-reason-escalation"]');
    
    // Add handover notes
    const notesInput = page.locator('[data-testid="handover-notes"]');
    await notesInput.fill('Customer requested human assistance for billing issue');
    
    // Confirm handover
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify handover is completed
    await expect(page.locator('[data-testid="handover-status"]')).toContainText('Human Agent');
    await expect(page.locator('[data-testid="ai-indicator"]')).not.toBeVisible();
  });

  test('should show AI handover history and context', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click on handover history button
    await page.click('[data-testid="handover-history-button"]');
    
    // Verify handover history modal appears
    await expect(page.locator('[data-testid="handover-history-modal"]')).toBeVisible();
    
    // Verify handover entries are displayed
    await expect(page.locator('[data-testid="handover-entry"]')).toBeVisible();
    
    // Verify handover context is preserved
    await expect(page.locator('[data-testid="handover-context"]')).toContainText('Previous conversation context');
  });

  test('should handle AI handover with conversation context', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Send a message to establish context
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Customer is asking about API documentation');
    await messageInput.press('Enter');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives conversation context
    await expect(page.locator('[data-testid="ai-context"]')).toContainText('API documentation');
    
    // Verify AI can continue the conversation
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
  });

  test('should handle AI handover with file attachments', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Upload a file
    await page.click('[data-testid="attachment-button"]');
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('e2e/fixtures/test-file.txt');
    
    // Send message with attachment
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Please review this file');
    await messageInput.press('Enter');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI has access to the file
    await expect(page.locator('[data-testid="ai-file-access"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-file-access"]')).toContainText('test-file.txt');
  });

  test('should handle AI handover with conversation tags', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Add conversation tag
    await page.click('[data-testid="add-tag-button"]');
    await page.click('[data-testid="tag-technical"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives tag information
    await expect(page.locator('[data-testid="ai-conversation-tags"]')).toContainText('technical');
  });

  test('should handle AI handover with customer information', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // View customer information
    await page.click('[data-testid="customer-info-button"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI has access to customer information
    await expect(page.locator('[data-testid="ai-customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-customer-info"]')).toContainText('Customer details');
  });

  test('should handle AI handover with conversation history', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Send multiple messages to create history
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('First message');
    await messageInput.press('Enter');
    await messageInput.fill('Second message');
    await messageInput.press('Enter');
    await messageInput.fill('Third message');
    await messageInput.press('Enter');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI has access to conversation history
    await expect(page.locator('[data-testid="ai-conversation-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-conversation-history"]')).toContainText('First message');
    await expect(page.locator('[data-testid="ai-conversation-history"]')).toContainText('Second message');
    await expect(page.locator('[data-testid="ai-conversation-history"]')).toContainText('Third message');
  });

  test('should handle AI handover with conversation priority', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Set conversation priority
    await page.click('[data-testid="priority-button"]');
    await page.click('[data-testid="priority-high"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives priority information
    await expect(page.locator('[data-testid="ai-priority"]')).toContainText('high');
  });

  test('should handle AI handover with conversation status', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Set conversation status
    await page.click('[data-testid="status-button"]');
    await page.click('[data-testid="status-in-progress"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives status information
    await expect(page.locator('[data-testid="ai-status"]')).toContainText('in-progress');
  });

  test('should handle AI handover with conversation assignment', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Assign conversation to specific agent
    await page.click('[data-testid="assign-button"]');
    await page.click('[data-testid="agent-john"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives assignment information
    await expect(page.locator('[data-testid="ai-assignment"]')).toContainText('John');
  });

  test('should handle AI handover with conversation metrics', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // View conversation metrics
    await page.click('[data-testid="metrics-button"]');
    
    // Initiate AI handover
    await page.click('[data-testid="ai-handover-button"]');
    await page.click('[data-testid="handover-reason-complex"]');
    await page.click('[data-testid="confirm-handover-button"]');
    
    // Verify AI receives metrics information
    await expect(page.locator('[data-testid="ai-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-metrics"]')).toContainText('Response time');
  });
}); 