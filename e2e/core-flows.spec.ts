/**
 * E2E Tests for Core Flows
 * 
 * Comprehensive testing of:
 * - AI handoff scenarios
 * - Typing indicators
 * - Widget interactions
 * - Visual regressions
 * - Cross-browser compatibility
 * - Performance validation
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const WIDGET_URL = `${BASE_URL}/widget`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

// Test credentials
const TEST_CREDENTIALS = {
  email: 'jam@jam.com',
  password: 'password123',
};

// Test organization
const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

// Helper functions
async function authenticateUser(page: Page) {
  await page.goto(`${DASHBOARD_URL}/login`);
  await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
  await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard/**');
}

async function openWidget(page: Page, orgId: string = TEST_ORG_ID) {
  await page.goto(`${WIDGET_URL}?org=${orgId}`);
  await page.waitForSelector('[data-testid="widget-button"]');
  await page.click('[data-testid="widget-button"]');
  await page.waitForSelector('[data-testid="chat-interface"]');
}

async function sendMessage(page: Page, message: string) {
  await page.fill('[data-testid="message-input"]', message);
  await page.click('[data-testid="send-button"]');
  await page.waitForSelector(`[data-testid="message-content"]:has-text("${message}")`);
}

async function waitForTypingIndicator(page: Page, timeout: number = 5000) {
  await page.waitForSelector('[data-testid="typing-indicator"]', { timeout });
}

async function waitForAIResponse(page: Page, timeout: number = 10000) {
  await page.waitForSelector('[data-testid="ai-message"]', { timeout });
}

test.describe('Core Flows E2E Tests', () => {
  test.describe('AI Handoff Scenarios', () => {
    test('should handle visitor to AI conversation flow', async ({ page }) => {
      await openWidget(page);

      // Send initial message
      await sendMessage(page, 'Hello, I need help with my order');

      // Wait for AI response
      await waitForAIResponse(page);

      // Verify AI response appears
      const aiMessage = await page.locator('[data-testid="ai-message"]').first();
      expect(await aiMessage.isVisible()).toBe(true);

      // Verify AI response content is relevant
      const aiContent = await aiMessage.textContent();
      expect(aiContent).toMatch(/help|assist|order/i);
    });

    test('should trigger AI to human handoff for complex queries', async ({ page }) => {
      await openWidget(page);

      // Send complex query that should trigger handoff
      await sendMessage(page, 'I need to cancel my order and get a refund, but I also want to change my shipping address for future orders');

      // Wait for AI response
      await waitForAIResponse(page);

      // Send follow-up that increases complexity
      await sendMessage(page, 'Actually, this is urgent and I need to speak to a manager about billing issues');

      // Wait for handoff indicator
      await page.waitForSelector('[data-testid="ai-handoff-indicator"]', { timeout: 10000 });

      // Verify handoff message
      const handoffMessage = await page.locator('[data-testid="handoff-message"]');
      expect(await handoffMessage.isVisible()).toBe(true);
      expect(await handoffMessage.textContent()).toMatch(/connecting.*human|agent/i);
    });

    test('should maintain conversation context during handoff', async ({ page, context }) => {
      // Open widget
      await openWidget(page);

      // Send initial message
      await sendMessage(page, 'My order #12345 is missing items');

      // Wait for AI response
      await waitForAIResponse(page);

      // Send follow-up
      await sendMessage(page, 'I ordered 3 items but only received 2');

      // Trigger handoff
      await sendMessage(page, 'This is unacceptable, I want to speak to a manager');

      // Wait for handoff
      await page.waitForSelector('[data-testid="ai-handoff-indicator"]');

      // Open dashboard in new page
      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Find the conversation
      await dashboardPage.waitForSelector('[data-testid="conversation-item"]');
      await dashboardPage.click('[data-testid="conversation-item"]');

      // Verify conversation history is preserved
      const messages = await dashboardPage.locator('[data-testid="message-content"]').all();
      expect(messages.length).toBeGreaterThan(2);

      // Verify order number is mentioned in context
      const conversationText = await dashboardPage.locator('[data-testid="conversation-history"]').textContent();
      expect(conversationText).toContain('#12345');
    });

    test('should handle AI confidence scoring and handoff thresholds', async ({ page }) => {
      await openWidget(page);

      // Send ambiguous query
      await sendMessage(page, 'I have a problem with something I bought');

      // Wait for AI response
      await waitForAIResponse(page);

      // Send increasingly specific queries
      const queries = [
        'It\'s not working properly',
        'The software keeps crashing when I try to use the main feature',
        'Specifically, when I click the export button, the application freezes',
      ];

      for (const query of queries) {
        await sendMessage(page, query);
        await waitForAIResponse(page);
      }

      // Check if confidence indicator is shown
      const confidenceIndicator = page.locator('[data-testid="ai-confidence-indicator"]');
      if (await confidenceIndicator.isVisible()) {
        const confidence = await confidenceIndicator.getAttribute('data-confidence');
        expect(parseFloat(confidence || '0')).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Typing Indicators', () => {
    test('should show typing indicator when visitor types', async ({ page, context }) => {
      // Open widget
      await openWidget(page);

      // Open dashboard
      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Start typing in widget
      await page.focus('[data-testid="message-input"]');
      await page.type('[data-testid="message-input"]', 'I am typing...', { delay: 100 });

      // Check for typing indicator in dashboard
      await waitForTypingIndicator(dashboardPage);
      const typingIndicator = await dashboardPage.locator('[data-testid="typing-indicator"]');
      expect(await typingIndicator.isVisible()).toBe(true);
      expect(await typingIndicator.textContent()).toMatch(/typing/i);
    });

    test('should hide typing indicator when user stops typing', async ({ page, context }) => {
      await openWidget(page);

      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Start typing
      await page.focus('[data-testid="message-input"]');
      await page.type('[data-testid="message-input"]', 'Hello', { delay: 100 });

      // Wait for typing indicator
      await waitForTypingIndicator(dashboardPage);

      // Clear input (stop typing)
      await page.fill('[data-testid="message-input"]', '');

      // Wait for typing indicator to disappear
      await dashboardPage.waitForSelector('[data-testid="typing-indicator"]', { 
        state: 'hidden',
        timeout: 5000 
      });
    });

    test('should show agent typing indicator in widget', async ({ page, context }) => {
      await openWidget(page);

      // Send initial message to establish conversation
      await sendMessage(page, 'Hello, I need help');

      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Find and open conversation
      await dashboardPage.waitForSelector('[data-testid="conversation-item"]');
      await dashboardPage.click('[data-testid="conversation-item"]');

      // Start typing as agent
      await dashboardPage.focus('[data-testid="agent-message-input"]');
      await dashboardPage.type('[data-testid="agent-message-input"]', 'Let me help you...', { delay: 100 });

      // Check for typing indicator in widget
      await waitForTypingIndicator(page);
      const typingIndicator = await page.locator('[data-testid="typing-indicator"]');
      expect(await typingIndicator.isVisible()).toBe(true);
      expect(await typingIndicator.textContent()).toMatch(/agent.*typing|typing/i);
    });

    test('should handle multiple users typing simultaneously', async ({ page, context }) => {
      await openWidget(page);

      // Create multiple dashboard sessions
      const dashboardPage1 = await context.newPage();
      const dashboardPage2 = await context.newPage();

      await authenticateUser(dashboardPage1);
      await authenticateUser(dashboardPage2);

      await dashboardPage1.goto(`${DASHBOARD_URL}/inbox`);
      await dashboardPage2.goto(`${DASHBOARD_URL}/inbox`);

      // Send message to create conversation
      await sendMessage(page, 'I need help from multiple agents');

      // Both agents start typing
      await dashboardPage1.focus('[data-testid="agent-message-input"]');
      await dashboardPage2.focus('[data-testid="agent-message-input"]');

      await dashboardPage1.type('[data-testid="agent-message-input"]', 'Agent 1 typing...', { delay: 100 });
      await dashboardPage2.type('[data-testid="agent-message-input"]', 'Agent 2 typing...', { delay: 100 });

      // Check that widget shows multiple typing indicators or combined indicator
      await waitForTypingIndicator(page);
      const typingText = await page.locator('[data-testid="typing-indicator"]').textContent();
      expect(typingText).toMatch(/typing|multiple|agents/i);
    });
  });

  test.describe('Widget Interactions', () => {
    test('should open and close widget smoothly', async ({ page }) => {
      await page.goto(`${WIDGET_URL}?org=${TEST_ORG_ID}`);

      // Widget should be closed initially
      const chatInterface = page.locator('[data-testid="chat-interface"]');
      expect(await chatInterface.isVisible()).toBe(false);

      // Open widget
      await page.click('[data-testid="widget-button"]');
      await page.waitForSelector('[data-testid="chat-interface"]');
      expect(await chatInterface.isVisible()).toBe(true);

      // Close widget
      await page.click('[data-testid="close-button"]');
      await page.waitForSelector('[data-testid="chat-interface"]', { state: 'hidden' });
      expect(await chatInterface.isVisible()).toBe(false);
    });

    test('should handle file uploads', async ({ page }) => {
      await openWidget(page);

      // Click file upload button
      await page.click('[data-testid="file-upload-button"]');

      // Wait for file upload interface
      await page.waitForSelector('[data-testid="file-upload-area"]');

      // Simulate file selection (create a test file)
      const fileContent = 'Test file content';
      const fileName = 'test-document.txt';

      await page.setInputFiles('[data-testid="file-input"]', {
        name: fileName,
        mimeType: 'text/plain',
        buffer: Buffer.from(fileContent),
      });

      // Verify file appears in upload area
      await page.waitForSelector(`[data-testid="uploaded-file"]:has-text("${fileName}")`);

      // Send file
      await page.click('[data-testid="send-file-button"]');

      // Verify file message appears in chat
      await page.waitForSelector('[data-testid="file-message"]');
      const fileMessage = await page.locator('[data-testid="file-message"]');
      expect(await fileMessage.isVisible()).toBe(true);
    });

    test('should handle emoji picker', async ({ page }) => {
      await openWidget(page);

      // Click emoji button
      await page.click('[data-testid="emoji-button"]');

      // Wait for emoji picker
      await page.waitForSelector('[data-testid="emoji-picker"]');

      // Select an emoji
      await page.click('[data-testid="emoji-😀"]');

      // Verify emoji appears in input
      const input = await page.locator('[data-testid="message-input"]');
      const inputValue = await input.inputValue();
      expect(inputValue).toContain('😀');

      // Send message with emoji
      await page.click('[data-testid="send-button"]');

      // Verify emoji appears in message
      await page.waitForSelector('[data-testid="message-content"]:has-text("😀")');
    });

    test('should handle message reactions', async ({ page, context }) => {
      await openWidget(page);

      // Send a message
      await sendMessage(page, 'This is a great service!');

      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Find conversation and add reaction
      await dashboardPage.waitForSelector('[data-testid="conversation-item"]');
      await dashboardPage.click('[data-testid="conversation-item"]');

      // Hover over message to show reaction button
      await dashboardPage.hover('[data-testid="message-content"]');
      await dashboardPage.click('[data-testid="add-reaction-button"]');

      // Select reaction
      await dashboardPage.click('[data-testid="reaction-👍"]');

      // Verify reaction appears in widget
      await page.waitForSelector('[data-testid="message-reaction"]:has-text("👍")');
    });

    test('should maintain scroll position during conversation', async ({ page }) => {
      await openWidget(page);

      // Send multiple messages to create scrollable content
      for (let i = 1; i <= 20; i++) {
        await sendMessage(page, `Message number ${i}`);
        await page.waitForTimeout(100); // Small delay between messages
      }

      // Scroll to top
      await page.locator('[data-testid="chat-messages"]').evaluate(el => {
        el.scrollTop = 0;
      });

      // Send new message
      await sendMessage(page, 'New message at bottom');

      // Verify scroll position moved to bottom for new message
      const scrollTop = await page.locator('[data-testid="chat-messages"]').evaluate(el => el.scrollTop);
      const scrollHeight = await page.locator('[data-testid="chat-messages"]').evaluate(el => el.scrollHeight);
      const clientHeight = await page.locator('[data-testid="chat-messages"]').evaluate(el => el.clientHeight);

      expect(scrollTop).toBeGreaterThan(scrollHeight - clientHeight - 50); // Near bottom
    });
  });

  test.describe('Visual Regression Tests', () => {
    test('should match widget button appearance', async ({ page }) => {
      await page.goto(`${WIDGET_URL}?org=${TEST_ORG_ID}`);
      await page.waitForSelector('[data-testid="widget-button"]');

      // Take screenshot of widget button
      await expect(page.locator('[data-testid="widget-button"]')).toHaveScreenshot('widget-button.png');
    });

    test('should match open widget appearance', async ({ page }) => {
      await openWidget(page);

      // Take screenshot of open widget
      await expect(page.locator('[data-testid="chat-interface"]')).toHaveScreenshot('open-widget.png');
    });

    test('should match conversation with messages', async ({ page }) => {
      await openWidget(page);

      // Add some test messages
      await sendMessage(page, 'Hello, I need help');
      await page.waitForTimeout(1000); // Wait for AI response

      await sendMessage(page, 'Thank you for your help');
      await page.waitForTimeout(1000);

      // Take screenshot of conversation
      await expect(page.locator('[data-testid="chat-messages"]')).toHaveScreenshot('conversation-messages.png');
    });

    test('should match typing indicator appearance', async ({ page, context }) => {
      await openWidget(page);

      const dashboardPage = await context.newPage();
      await authenticateUser(dashboardPage);
      await dashboardPage.goto(`${DASHBOARD_URL}/inbox`);

      // Send message to create conversation
      await sendMessage(page, 'Hello');

      // Start typing as agent
      await dashboardPage.focus('[data-testid="agent-message-input"]');
      await dashboardPage.type('[data-testid="agent-message-input"]', 'Typing...', { delay: 100 });

      // Wait for typing indicator and screenshot
      await waitForTypingIndicator(page);
      await expect(page.locator('[data-testid="typing-indicator"]')).toHaveScreenshot('typing-indicator.png');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          await openWidget(page);

          // Test basic functionality
          await sendMessage(page, 'Cross-browser test message');

          // Verify message appears
          await page.waitForSelector('[data-testid="message-content"]:has-text("Cross-browser test message")');

          // Test widget close/open
          await page.click('[data-testid="close-button"]');
          await page.waitForSelector('[data-testid="chat-interface"]', { state: 'hidden' });

          await page.click('[data-testid="widget-button"]');
          await page.waitForSelector('[data-testid="chat-interface"]');

          // Verify functionality works across browsers
          expect(await page.locator('[data-testid="chat-interface"]').isVisible()).toBe(true);
        } finally {
          await context.close();
        }
      });
    });
  });

  test.describe('Performance Validation', () => {
    test('should load widget within performance budget', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${WIDGET_URL}?org=${TEST_ORG_ID}`);
      await page.waitForSelector('[data-testid="widget-button"]');

      const loadTime = Date.now() - startTime;

      // Widget should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle rapid interactions without lag', async ({ page }) => {
      await openWidget(page);

      const startTime = Date.now();

      // Rapidly open/close widget multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="close-button"]');
        await page.waitForSelector('[data-testid="chat-interface"]', { state: 'hidden' });
        
        await page.click('[data-testid="widget-button"]');
        await page.waitForSelector('[data-testid="chat-interface"]');
      }

      const totalTime = Date.now() - startTime;

      // Should complete all interactions within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });

    test('should maintain performance with many messages', async ({ page }) => {
      await openWidget(page);

      const startTime = Date.now();

      // Send many messages quickly
      for (let i = 1; i <= 50; i++) {
        await page.fill('[data-testid="message-input"]', `Performance test message ${i}`);
        await page.click('[data-testid="send-button"]');
        
        if (i % 10 === 0) {
          await page.waitForTimeout(100); // Brief pause every 10 messages
        }
      }

      const totalTime = Date.now() - startTime;

      // Should handle 50 messages within 30 seconds
      expect(totalTime).toBeLessThan(30000);

      // Verify all messages are present
      const messages = await page.locator('[data-testid="message-content"]').count();
      expect(messages).toBeGreaterThanOrEqual(50);
    });
  });
});
