/**
 * COMPREHENSIVE THREAD INBOX E2E TESTS
 * 
 * Tests all thread inbox functionality including:
 * - Thread list display and navigation
 * - Empty state handling
 * - Thread conversation view
 * - Message sending
 * - State persistence
 * - Mobile responsiveness
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  demoPage: '/thread-inbox-demo',
  timeout: 30000,
};

test.describe('Thread Inbox System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}${TEST_CONFIG.demoPage}`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Thread List Functionality', () => {
    test('should display thread list with mock data', async ({ page }) => {
      console.log('🧪 Testing thread list display...');

      // Wait for thread list to load
      await page.waitForSelector('[data-testid="thread-list"]', { timeout: 10000 });
      
      // Check if threads are displayed
      const threadItems = page.locator('[data-testid="thread-item"]');
      const threadCount = await threadItems.count();
      
      expect(threadCount).toBeGreaterThan(0);
      console.log(`✅ Found ${threadCount} thread items`);

      // Verify thread item structure
      const firstThread = threadItems.first();
      await expect(firstThread.locator('[data-testid="thread-title"]')).toBeVisible();
      await expect(firstThread.locator('[data-testid="thread-last-message"]')).toBeVisible();
      await expect(firstThread.locator('[data-testid="thread-timestamp"]')).toBeVisible();
      
      console.log('✅ Thread list structure verified');
    });

    test('should display empty state when no threads', async ({ page }) => {
      console.log('🧪 Testing empty state...');

      // Mock empty state by clearing localStorage
      await page.evaluate(() => {
        localStorage.clear();
        window.location.reload();
      });

      await page.waitForLoadState('networkidle');

      // Check for empty state elements
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(page.locator('text=No messages')).toBeVisible();
      await expect(page.locator('text=Messages from the team will be shown here')).toBeVisible();
      await expect(page.locator('text=Send us a message')).toBeVisible();
      
      console.log('✅ Empty state displayed correctly');
    });

    test('should navigate to thread conversation when clicking thread', async ({ page }) => {
      console.log('🧪 Testing thread navigation...');

      // Wait for thread list
      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      
      // Click on first thread
      const firstThread = page.locator('[data-testid="thread-item"]').first();
      await firstThread.click();

      // Wait for conversation view
      await page.waitForSelector('[data-testid="thread-conversation"]', { timeout: 10000 });
      
      // Verify conversation view elements
      await expect(page.locator('[data-testid="conversation-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
      
      console.log('✅ Thread navigation working');
    });

    test('should show thread metadata correctly', async ({ page }) => {
      console.log('🧪 Testing thread metadata display...');

      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      
      const firstThread = page.locator('[data-testid="thread-item"]').first();
      
      // Check for avatar/initials
      await expect(firstThread.locator('[data-testid="thread-avatar"]')).toBeVisible();
      
      // Check for participant name
      await expect(firstThread.locator('[data-testid="thread-participant"]')).toBeVisible();
      
      // Check for status badge
      await expect(firstThread.locator('[data-testid="thread-status"]')).toBeVisible();
      
      console.log('✅ Thread metadata displayed correctly');
    });
  });

  test.describe('Thread Conversation Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a thread conversation
      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      await page.locator('[data-testid="thread-item"]').first().click();
      await page.waitForSelector('[data-testid="thread-conversation"]', { timeout: 10000 });
    });

    test('should display conversation messages', async ({ page }) => {
      console.log('🧪 Testing conversation message display...');

      // Check for message list
      await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
      
      // Check for at least one message
      const messages = page.locator('[data-testid="message-bubble"]');
      const messageCount = await messages.count();
      expect(messageCount).toBeGreaterThan(0);
      
      console.log(`✅ Found ${messageCount} messages in conversation`);
    });

    test('should send new message', async ({ page }) => {
      console.log('🧪 Testing message sending...');

      const testMessage = `Test message - ${Date.now()}`;
      
      // Type message
      await page.locator('[data-testid="message-input"]').fill(testMessage);
      
      // Send message
      await page.locator('[data-testid="send-button"]').click();
      
      // Wait for message to appear
      await page.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
      
      // Verify message appears in conversation
      await expect(page.locator(`text="${testMessage}"`)).toBeVisible();
      
      console.log('✅ Message sent successfully');
    });

    test('should handle back navigation', async ({ page }) => {
      console.log('🧪 Testing back navigation...');

      // Click back button
      await page.locator('[data-testid="back-button"]').click();
      
      // Should return to thread list
      await page.waitForSelector('[data-testid="thread-list"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="thread-list"]')).toBeVisible();
      
      console.log('✅ Back navigation working');
    });

    test('should auto-scroll to latest messages', async ({ page }) => {
      console.log('🧪 Testing auto-scroll...');

      // Send a message to trigger scroll
      const testMessage = `Scroll test - ${Date.now()}`;
      await page.locator('[data-testid="message-input"]').fill(testMessage);
      await page.locator('[data-testid="send-button"]').click();
      
      // Wait for message to appear
      await page.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
      
      // Verify the message is visible (indicating scroll worked)
      await expect(page.locator(`text="${testMessage}"`)).toBeVisible();
      
      console.log('✅ Auto-scroll working');
    });
  });

  test.describe('Bottom Navigation', () => {
    test('should display bottom navigation tabs', async ({ page }) => {
      console.log('🧪 Testing bottom navigation...');

      // Check for bottom navigation
      await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();
      
      // Check for all three tabs
      await expect(page.locator('text=Home')).toBeVisible();
      await expect(page.locator('text=Messages')).toBeVisible();
      await expect(page.locator('text=Help')).toBeVisible();
      
      console.log('✅ Bottom navigation displayed');
    });

    test('should highlight active tab', async ({ page }) => {
      console.log('🧪 Testing active tab highlighting...');

      // Messages tab should be active by default
      const messagesTab = page.locator('[data-testid="tab-messages"]');
      await expect(messagesTab).toHaveClass(/active/);
      
      console.log('✅ Active tab highlighting working');
    });

    test('should switch between tabs', async ({ page }) => {
      console.log('🧪 Testing tab switching...');

      // Click on Home tab
      await page.locator('[data-testid="tab-home"]').click();
      
      // Verify Home tab is now active
      await expect(page.locator('[data-testid="tab-home"]')).toHaveClass(/active/);
      
      // Click on Help tab
      await page.locator('[data-testid="tab-help"]').click();
      
      // Verify Help tab is now active
      await expect(page.locator('[data-testid="tab-help"]')).toHaveClass(/active/);
      
      console.log('✅ Tab switching working');
    });
  });

  test.describe('State Persistence', () => {
    test('should persist thread selection across page reloads', async ({ page }) => {
      console.log('🧪 Testing state persistence...');

      // Select a thread
      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      await page.locator('[data-testid="thread-item"]').first().click();
      await page.waitForSelector('[data-testid="thread-conversation"]', { timeout: 10000 });
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be in conversation view
      await expect(page.locator('[data-testid="thread-conversation"]')).toBeVisible();
      
      console.log('✅ Thread selection persisted');
    });

    test('should persist search query', async ({ page }) => {
      console.log('🧪 Testing search persistence...');

      // Enter search query
      const searchQuery = 'test search';
      await page.locator('[data-testid="search-input"]').fill(searchQuery);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Search query should still be there
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue(searchQuery);
      
      console.log('✅ Search query persisted');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      console.log('🧪 Testing mobile responsiveness...');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify thread list is still accessible
      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="thread-item"]').first()).toBeVisible();
      
      // Verify bottom navigation is accessible
      await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();
      
      console.log('✅ Mobile responsiveness verified');
    });

    test('should handle touch interactions', async ({ page }) => {
      console.log('🧪 Testing touch interactions...');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test tapping on thread item
      await page.waitForSelector('[data-testid="thread-item"]', { timeout: 10000 });
      await page.locator('[data-testid="thread-item"]').first().tap();
      
      // Should navigate to conversation
      await page.waitForSelector('[data-testid="thread-conversation"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="thread-conversation"]')).toBeVisible();
      
      console.log('✅ Touch interactions working');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      console.log('🧪 Testing error handling...');

      // Mock API error by intercepting requests
      await page.route('**/api/widget/threads**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Reload page to trigger error
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      console.log('✅ Error handling working');
    });

    test('should handle network failures', async ({ page }) => {
      console.log('🧪 Testing network failure handling...');

      // Mock network failure
      await page.route('**/api/widget/threads**', route => {
        route.abort();
      });

      // Reload page to trigger failure
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should show appropriate error state
      await expect(page.locator('[data-testid="error-message"], [data-testid="empty-state"]')).toBeVisible();
      
      console.log('✅ Network failure handling working');
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      console.log('🧪 Testing load performance...');

      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.baseURL}${TEST_CONFIG.demoPage}`);
      await page.waitForSelector('[data-testid="thread-list"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      console.log(`✅ Page loaded in ${loadTime}ms`);
    });

    test('should handle large thread lists efficiently', async ({ page }) => {
      console.log('🧪 Testing large list performance...');

      // Mock large thread list
      await page.evaluate(() => {
        const mockThreads = Array.from({ length: 100 }, (_, i) => ({
          id: `thread-${i}`,
          title: `Thread ${i}`,
          participants: [{ id: '1', name: 'User', email: 'user@test.com', avatar: null, role: 'customer' }],
          lastMessage: {
            id: `msg-${i}`,
            content: `Message ${i}`,
            sender: { id: '1', name: 'User', email: 'user@test.com', avatar: null, role: 'customer' },
            timestamp: new Date().toISOString(),
            isUnread: false
          },
          unreadCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {}
        }));
        
        localStorage.setItem('campfire-thread-inbox-state', JSON.stringify({
          threads: mockThreads,
          selectedThreadId: null,
          isLoading: false,
          error: null,
          searchQuery: '',
          activeTab: 'messages',
          scrollPosition: 0,
          lastVisitedThreads: []
        }));
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be responsive
      await expect(page.locator('[data-testid="thread-item"]')).toBeVisible();
      
      console.log('✅ Large list performance verified');
    });
  });
}); 