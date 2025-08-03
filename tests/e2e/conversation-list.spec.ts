import { test, expect } from '@playwright/test';

test.describe('Conversation List Responsive Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the inbox dashboard
    await page.goto('/dashboard/inbox');
    // Wait for the conversation list to load
    await page.waitForSelector('[data-testid="conversation-list-container"]');
  });

  test('conversation list fills parent width at different breakpoints', async ({ page }) => {
    const breakpoints = [1920, 1280, 1024, 768, 640, 360];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      
      // Wait for layout to settle
      await page.waitForTimeout(100);
      
      // Get conversation list element
      const conversationList = page.locator('.conversation-list');
      await expect(conversationList).toBeVisible();
      
      // Get parent container
      const parentContainer = conversationList.locator('..');
      
      // Check that conversation list width equals parent width
      const listBox = await conversationList.boundingBox();
      const parentBox = await parentContainer.boundingBox();
      
      expect(listBox).toBeTruthy();
      expect(parentBox).toBeTruthy();
      
      if (listBox && parentBox) {
        // Allow for small differences due to borders/padding
        expect(Math.abs(listBox.width - parentBox.width)).toBeLessThan(5);
      }
    }
  });

  test('no horizontal scrollbar at any breakpoint', async ({ page }) => {
    const breakpoints = [1920, 1280, 1024, 768, 640, 360];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      
      // Wait for layout to settle
      await page.waitForTimeout(100);
      
      // Check for horizontal scrollbar on conversation list
      const conversationList = page.locator('.conversation-list');
      const scrollWidth = await conversationList.evaluate(el => el.scrollWidth);
      const clientWidth = await conversationList.evaluate(el => el.clientWidth);
      
      // No horizontal overflow
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
      
      // Check for horizontal scrollbar on the page
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
    }
  });

  test('conversation items maintain 56px height', async ({ page }) => {
    // Wait for conversation items to load
    await page.waitForSelector('.cl-item');
    
    const conversationItems = page.locator('.cl-item');
    const count = await conversationItems.count();
    
    // Check first few items (in case there are many)
    const itemsToCheck = Math.min(count, 5);
    
    for (let i = 0; i < itemsToCheck; i++) {
      const item = conversationItems.nth(i);
      const box = await item.boundingBox();
      
      expect(box).toBeTruthy();
      if (box) {
        // Allow small variance for borders/margins
        expect(box.height).toBeGreaterThanOrEqual(54);
        expect(box.height).toBeLessThanOrEqual(58);
      }
    }
  });

  test('text truncation works properly', async ({ page }) => {
    // Test at mobile width where truncation is most likely
    await page.setViewportSize({ width: 360, height: 800 });
    
    // Wait for conversation items to load
    await page.waitForSelector('.cl-item');
    
    // Check that text elements have proper truncation classes
    const customerNames = page.locator('.cl-item h3');
    const subjects = page.locator('.cl-item h4');
    const previews = page.locator('.cl-item p');
    
    // Verify truncation classes are applied
    await expect(customerNames.first()).toHaveClass(/truncate/);
    await expect(subjects.first()).toHaveClass(/truncate/);
    await expect(previews.first()).toHaveClass(/line-clamp-2/);
    
    // Check that badges have max-width constraints
    const badges = page.locator('.cl-item .max-w-\\[70px\\]');
    const badgeCount = await badges.count();
    
    if (badgeCount > 0) {
      const firstBadge = badges.first();
      const box = await firstBadge.boundingBox();
      
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(70);
      }
    }
  });

  test('vertical scrolling works within conversation list', async ({ page }) => {
    // Set a smaller height to force scrolling
    await page.setViewportSize({ width: 1280, height: 600 });
    
    // Wait for conversation items to load
    await page.waitForSelector('.cl-item');
    
    const conversationContainer = page.locator('[data-testid="conversation-list-container"]');
    
    // Check if container is scrollable
    const isScrollable = await conversationContainer.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });
    
    if (isScrollable) {
      // Test scrolling
      const initialScrollTop = await conversationContainer.evaluate(el => el.scrollTop);
      
      // Scroll down
      await conversationContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight / 2;
      });
      
      const newScrollTop = await conversationContainer.evaluate(el => el.scrollTop);
      expect(newScrollTop).toBeGreaterThan(initialScrollTop);
    }
  });

  test('blank area on right is minimal', async ({ page }) => {
    const breakpoints = [1920, 1280, 1024, 768, 640];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      
      // Wait for layout to settle
      await page.waitForTimeout(100);
      
      const conversationList = page.locator('.conversation-list');
      const listBox = await conversationList.boundingBox();
      
      expect(listBox).toBeTruthy();
      
      if (listBox) {
        // Get the rightmost conversation item
        const conversationItems = page.locator('.cl-item');
        const firstItem = conversationItems.first();
        const itemBox = await firstItem.boundingBox();
        
        expect(itemBox).toBeTruthy();
        
        if (itemBox) {
          // Calculate blank space on the right
          const blankSpace = (listBox.x + listBox.width) - (itemBox.x + itemBox.width);
          
          // Should be 8px or less as specified in acceptance criteria
          expect(blankSpace).toBeLessThanOrEqual(8);
        }
      }
    }
  });
});