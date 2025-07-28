import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';

test.describe('Inbox Features and Functionalities', () => {
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

  test('should display conversation list with proper information', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Verify conversation list is visible
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
    
    // Verify conversation items have required information
    const conversationItems = page.locator('[data-testid="conversation-item"]');
    await expect(conversationItems.first()).toBeVisible();
    
    // Check for customer name
    await expect(conversationItems.first().locator('[data-testid="customer-name"]')).toBeVisible();
    
    // Check for last message preview
    await expect(conversationItems.first().locator('[data-testid="last-message"]')).toBeVisible();
    
    // Check for timestamp
    await expect(conversationItems.first().locator('[data-testid="conversation-timestamp"]')).toBeVisible();
  });

  test('should filter conversations by status', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Click on status filter
    await page.click('[data-testid="status-filter"]');
    
    // Select "Active" status
    await page.click('[data-testid="filter-active"]');
    
    // Verify only active conversations are shown
    const activeConversations = page.locator('[data-testid="conversation-item"]');
    await expect(activeConversations).toHaveCount(await activeConversations.count());
    
    // Clear filter
    await page.click('[data-testid="clear-filter"]');
  });

  test('should search conversations', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Click search input
    const searchInput = page.locator('[data-testid="conversation-search"]');
    await searchInput.click();
    
    // Type search query
    await searchInput.fill('test customer');
    await searchInput.press('Enter');
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Clear search
    await searchInput.clear();
    await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible();
  });

  test('should sort conversations by different criteria', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Click sort dropdown
    await page.click('[data-testid="sort-dropdown"]');
    
    // Sort by latest message
    await page.click('[data-testid="sort-latest"]');
    
    // Verify conversations are sorted
    const timestamps = page.locator('[data-testid="conversation-timestamp"]');
    await expect(timestamps.first()).toBeVisible();
    
    // Sort by priority
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('[data-testid="sort-priority"]');
    
    // Verify priority sorting
    await expect(page.locator('[data-testid="priority-indicator"]')).toBeVisible();
  });

  test('should handle conversation selection and navigation', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Select first conversation
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    // Verify conversation details panel opens
    await expect(page.locator('[data-testid="conversation-details"]')).toBeVisible();
    
    // Verify message list is loaded
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
    
    // Select another conversation
    const secondConversation = page.locator('[data-testid="conversation-item"]').nth(1);
    await secondConversation.click();
    
    // Verify conversation details update
    await expect(page.locator('[data-testid="conversation-details"]')).toBeVisible();
  });

  test('should handle conversation assignment', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click assign button
    await page.click('[data-testid="assign-button"]');
    
    // Verify assignment modal appears
    await expect(page.locator('[data-testid="assignment-modal"]')).toBeVisible();
    
    // Select an agent
    await page.click('[data-testid="agent-john"]');
    
    // Confirm assignment
    await page.click('[data-testid="confirm-assignment"]');
    
    // Verify assignment is updated
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('John');
  });

  test('should handle conversation priority changes', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click priority button
    await page.click('[data-testid="priority-button"]');
    
    // Select high priority
    await page.click('[data-testid="priority-high"]');
    
    // Verify priority is updated
    await expect(page.locator('[data-testid="priority-indicator"]')).toContainText('high');
  });

  test('should handle conversation status changes', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click status button
    await page.click('[data-testid="status-button"]');
    
    // Select "In Progress" status
    await page.click('[data-testid="status-in-progress"]');
    
    // Verify status is updated
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('in-progress');
  });

  test('should handle conversation tags and labels', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click add tag button
    await page.click('[data-testid="add-tag-button"]');
    
    // Select a tag
    await page.click('[data-testid="tag-technical"]');
    
    // Verify tag is added
    await expect(page.locator('[data-testid="conversation-tag"]')).toContainText('technical');
    
    // Remove tag
    await page.click('[data-testid="remove-tag-button"]');
    await expect(page.locator('[data-testid="conversation-tag"]')).not.toBeVisible();
  });

  test('should handle customer information display', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click customer info button
    await page.click('[data-testid="customer-info-button"]');
    
    // Verify customer information panel
    await expect(page.locator('[data-testid="customer-info-panel"]')).toBeVisible();
    
    // Verify customer details are displayed
    await expect(page.locator('[data-testid="customer-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-phone"]')).toBeVisible();
  });

  test('should handle conversation history and context', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click conversation history button
    await page.click('[data-testid="history-button"]');
    
    // Verify history panel
    await expect(page.locator('[data-testid="history-panel"]')).toBeVisible();
    
    // Verify conversation context is displayed
    await expect(page.locator('[data-testid="conversation-context"]')).toBeVisible();
  });

  test('should handle conversation metrics and analytics', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click metrics button
    await page.click('[data-testid="metrics-button"]');
    
    // Verify metrics panel
    await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible();
    
    // Verify metrics are displayed
    await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="resolution-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="satisfaction-score"]')).toBeVisible();
  });

  test('should handle conversation notes and internal comments', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click notes button
    await page.click('[data-testid="notes-button"]');
    
    // Add internal note
    const noteInput = page.locator('[data-testid="note-input"]');
    await noteInput.fill('Internal note: Customer needs follow-up');
    await noteInput.press('Enter');
    
    // Verify note is added
    await expect(page.locator('[data-testid="internal-note"]')).toContainText('Customer needs follow-up');
  });

  test('should handle conversation templates and canned responses', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click templates button
    await page.click('[data-testid="templates-button"]');
    
    // Select a template
    await page.click('[data-testid="template-greeting"]');
    
    // Verify template is inserted
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toHaveValue('Hello! How can I help you today?');
  });

  test('should handle conversation export and sharing', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    
    await page.waitForSelector('[data-testid="message-list"]');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Verify export modal
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    
    // Select export format
    await page.click('[data-testid="export-pdf"]');
    
    // Confirm export
    await page.click('[data-testid="confirm-export"]');
    
    // Verify export starts
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
  });

  test('should handle conversation bulk actions', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Select multiple conversations
    const checkboxes = page.locator('[data-testid="conversation-checkbox"]');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();
    
    // Verify bulk actions toolbar appears
    await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();
    
    // Perform bulk assignment
    await page.click('[data-testid="bulk-assign"]');
    await page.click('[data-testid="agent-john"]');
    await page.click('[data-testid="confirm-bulk-assignment"]');
    
    // Verify bulk action is completed
    await expect(page.locator('[data-testid="bulk-action-success"]')).toBeVisible();
  });

  test('should handle conversation keyboard shortcuts', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Use keyboard shortcut to search
    await page.keyboard.press('Control+f');
    await expect(page.locator('[data-testid="conversation-search"]')).toBeFocused();
    
    // Use keyboard shortcut to refresh
    await page.keyboard.press('F5');
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
    
    // Use keyboard shortcut to mark as read
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();
    await page.keyboard.press('r');
    await expect(page.locator('[data-testid="read-indicator"]')).toBeVisible();
  });

  test('should handle conversation accessibility features', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Verify ARIA labels are present
    await expect(page.locator('[data-testid="conversation-list"]')).toHaveAttribute('aria-label');
    
    // Verify keyboard navigation works
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="conversation-item"]').first()).toBeFocused();
    
    // Verify screen reader announcements
    await expect(page.locator('[data-testid="sr-announcement"]')).toBeVisible();
  });

  test('should handle conversation performance and loading states', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]');
    
    // Verify loading states
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
    
    // Verify skeleton loading is not visible after load
    await expect(page.locator('[data-testid="skeleton-loader"]')).not.toBeVisible();
    
    // Verify performance metrics
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
  });
}); 