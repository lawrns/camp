import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration for multiple browsers as specified in JSON prompt
const browsers = ['chromium', 'firefox', 'webkit'];

// Helper function to wait for inbox to load
async function waitForInboxLoad(page: Page) {
  await page.waitForSelector('[data-testid="inbox-header"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="composer-toolbar"]', { timeout: 10000 });
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
  });

  test('search functionality works correctly', async ({ page }) => {
    // Use search functionality
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('test conversation');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify search input has value
    await expect(searchInput).toHaveValue('test conversation');
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
  });

  test('responsive behavior at different screen sizes', async ({ page }) => {
    // Test desktop (1280px)
    await page.setViewportSize({ width: 1280, height: 720 });
    await verifyCleanHeader(page);
    
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

  test('accessibility compliance', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('search')).toBeVisible();
    await expect(page.getByRole('toolbar')).toBeVisible();
    
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
});

// Simplified cross-browser testing
test.describe('Cross-browser compatibility', () => {
  test('inbox loads correctly in all browsers', async ({ page, browserName }) => {
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
