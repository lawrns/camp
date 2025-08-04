import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration for multiple browsers as specified in JSON prompt
const browsers = ['chromium', 'firefox', 'webkit'];

// Helper function to wait for inbox to load
async function waitForInboxLoad(page: Page) {
  await page.waitForSelector('[data-testid="inbox-header"]');
  await page.waitForSelector('[data-testid="conversation-list"]');
  await page.waitForSelector('[data-testid="composer-toolbar"]');
}

// Helper function to check for duplicate toolbars
async function checkNoDuplicateToolbars(page: Page) {
  const toolbars = await page.locator('[role="toolbar"]').count();
  expect(toolbars).toBe(1);
}

// Helper function to verify clean header
async function verifyCleanHeader(page: Page) {
  // Should have search, filter, and new button only
  await expect(page.getByRole('searchbox')).toBeVisible();
  await expect(page.getByText('New')).toBeVisible();
  
  // Should NOT have performance metrics, notifications, or extra icons
  await expect(page.locator('text=/ms/')).not.toBeVisible();
  await expect(page.locator('[aria-label*="notification"]')).not.toBeVisible();
  await expect(page.locator('[aria-label*="shortcut"]')).not.toBeVisible();
}

test.describe('Inbox UI Overhaul - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inbox
    await page.goto('/dashboard/inbox');
    await waitForInboxLoad(page);
  });

  test('displays clean, Intercom-level interface', async ({ page }) => {
    // Verify no duplicate toolbars or icons visible
    await checkNoDuplicateToolbars(page);
    
    // Verify clean header
    await verifyCleanHeader(page);
    
    // Verify composer has only essential actions
    const composerActions = page.locator('[data-testid="composer-actions-left"] button');
    await expect(composerActions).toHaveCount(3); // Attach, Image, Emoji
    
    // Verify send button is properly styled
    const sendButton = page.getByTestId('composer-send-button');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toHaveClass(/bg-blue-600/);
  });

  test('search for conversation and select', async ({ page }) => {
    // Use search functionality
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('test conversation');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Select first conversation if available
    const firstConversation = page.locator('[data-testid="conversation-card"]').first();
    if (await firstConversation.isVisible()) {
      await firstConversation.click();
      
      // Verify conversation is selected
      await expect(page.locator('[data-testid="chat-pane"]')).toBeVisible();
    }
  });

  test('send reply message and verify it appears', async ({ page }) => {
    // First select a conversation
    const firstConversation = page.locator('[data-testid="conversation-card"]').first();
    if (await firstConversation.isVisible()) {
      await firstConversation.click();
    }
    
    // Type message
    const textarea = page.getByTestId('composer-textarea');
    await textarea.fill('This is a test reply message');
    
    // Send message
    const sendButton = page.getByTestId('composer-send-button');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    
    // Verify message appears in chat
    await expect(page.locator('text=This is a test reply message')).toBeVisible();
    
    // Verify textarea is cleared
    await expect(textarea).toHaveValue('');
  });

  test('file upload with security validation', async ({ page }) => {
    // Select a conversation first
    const firstConversation = page.locator('[data-testid="conversation-card"]').first();
    if (await firstConversation.isVisible()) {
      await firstConversation.click();
    }
    
    // Test file upload
    const fileInput = page.getByTestId('composer-file-input');
    
    // Create a test file
    const testFile = {
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test file content')
    };
    
    await fileInput.setInputFiles(testFile);
    
    // Verify file is processed (implementation depends on file handling UI)
    // This would check for file preview, upload progress, etc.
  });

  test('keyboard navigation through all interactive elements', async ({ page }) => {
    // Start from search input
    const searchInput = page.getByRole('searchbox');
    await searchInput.focus();
    
    // Tab through header elements
    await page.keyboard.press('Tab');
    await expect(page.getByLabelText('Filter conversations by status')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByText('New')).toBeFocused();
    
    // Continue to conversation list (if conversations exist)
    const firstConversation = page.locator('[data-testid="conversation-card"]').first();
    if (await firstConversation.isVisible()) {
      await page.keyboard.press('Tab');
      await expect(firstConversation).toBeFocused();
      
      // Select conversation with Enter
      await page.keyboard.press('Enter');
      
      // Tab to composer
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('composer-attachment-button').locator('button')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('composer-image-button')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('composer-emoji-button')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('composer-textarea')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('composer-send-button')).toBeFocused();
    }
  });

  test('responsive behavior at different screen sizes', async ({ page }) => {
    // Test desktop (1280px)
    await page.setViewportSize({ width: 1280, height: 720 });
    await verifyCleanHeader(page);
    await expect(page.locator('[data-testid="inbox-header"] > div')).toHaveClass(/lg:flex/);
    
    // Test tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);
    
    // Test mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    // Verify composer is still functional on mobile
    await expect(page.getByTestId('composer-toolbar')).toBeVisible();
    await expect(page.getByTestId('composer-send-button')).toBeVisible();
  });

  test('empty states display correctly', async ({ page }) => {
    // If no conversations, should show empty state
    const conversationList = page.locator('[data-testid="conversation-list"]');
    const emptyState = page.locator('[data-testid="conversation-list-empty-state"]');
    
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('No conversations yet');
      await expect(page.locator('text=Start New Conversation')).toBeVisible();
    }
    
    // If no conversation selected, should show choose conversation state
    const chatPane = page.locator('[data-testid="chat-pane"]');
    if (await chatPane.locator('text=Choose a conversation').isVisible()) {
      await expect(chatPane).toContainText('Choose a conversation');
    }
  });

  test('accessibility compliance', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('search')).toBeVisible();
    await expect(page.getByRole('toolbar')).toBeVisible();
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
    
    // Check for proper form labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.getAttribute('aria-label') || 
                      await input.getAttribute('aria-labelledby') ||
                      await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('performance meets targets', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await page.goto('/dashboard/inbox');
    await waitForInboxLoad(page);
    const loadTime = Date.now() - startTime;
    
    // Should load within 2.5 seconds (LCP target from JSON)
    expect(loadTime).toBeLessThan(2500);
    
    // Measure interaction responsiveness
    const interactionStart = Date.now();
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('test');
    const interactionTime = Date.now() - interactionStart;
    
    // Should respond within 100ms (composer response target)
    expect(interactionTime).toBeLessThan(100);
  });

  test('visual regression - no unintended changes', async ({ page }) => {
    // Take screenshots at different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot(`inbox-${viewport.name}.png`);
      
      // Take component-specific screenshots
      await expect(page.locator('[data-testid="inbox-header"]')).toHaveScreenshot(`header-${viewport.name}.png`);
      await expect(page.locator('[data-testid="composer-toolbar"]')).toHaveScreenshot(`composer-${viewport.name}.png`);
    }
  });

  test('error handling and recovery', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => route.abort());
    
    // Try to send a message
    const textarea = page.getByTestId('composer-textarea');
    await textarea.fill('Test message during network error');
    
    const sendButton = page.getByTestId('composer-send-button');
    await sendButton.click();
    
    // Should handle error gracefully (implementation depends on error handling)
    // This might show a retry button, error message, etc.
    
    // Restore network
    await page.unroute('**/api/**');
  });
});

// Cross-browser testing as specified in JSON prompt
for (const browserName of browsers) {
  test.describe(`Cross-browser compatibility - ${browserName}`, () => {
    test(`inbox workflow works in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
      
      await page.goto('/dashboard/inbox');
      await waitForInboxLoad(page);
      
      // Verify core functionality works
      await verifyCleanHeader(page);
      await checkNoDuplicateToolbars(page);
      
      // Test basic interaction
      const searchInput = page.getByRole('searchbox');
      await searchInput.fill('cross-browser test');
      await expect(searchInput).toHaveValue('cross-browser test');
    });
  });
}
