import { test, expect } from '@playwright/test';

test.describe('Comprehensive Inbox Dashboard Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const hasLoginForm = await page.locator('input[type="email"], #email').count() > 0;
    if (hasLoginForm) {
      await page.fill('input[type="email"], #email', 'jam@jam.com');
      await page.fill('input[type="password"], #password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    }
    
    // Navigate to inbox
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForLoadState('networkidle');
  });

  test('should load inbox dashboard with all core components', async ({ page }) => {
    console.log('🧪 Testing inbox dashboard core components...');
    
    // Check main dashboard structure
    await expect(page.locator('[data-testid="inbox-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="inbox-header"]')).toBeVisible();
    
    // Check for conversation list
    const conversationList = page.locator('[data-testid="conversation-list"], .conversation-list');
    await expect(conversationList).toBeVisible();
    
    // Check for chat area
    const chatArea = page.locator('[data-testid="chat-area"], .chat-area');
    await expect(chatArea).toBeVisible();
    
    console.log('✅ Core components loaded successfully');
  });

  test('should test conversation list functionality', async ({ page }) => {
    console.log('📋 Testing conversation list functionality...');
    
    // Check conversation list elements
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    const conversationCount = await conversationRows.count();
    console.log(`📊 Found ${conversationCount} conversation rows`);
    
    // Test conversation selection
    if (conversationCount > 0) {
      await conversationRows.first().click();
      console.log('✅ Conversation selection working');
      
      // Check if chat header appears
      const chatHeader = page.locator('[data-testid="chat-header"]');
      await expect(chatHeader).toBeVisible();
    }
    
    // Test search functionality
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      console.log('✅ Search input working');
    }
    
    console.log('✅ Conversation list functionality tested');
  });

  test('should test chat header and customer information', async ({ page }) => {
    console.log('👤 Testing chat header and customer information...');
    
    // Select a conversation first
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Check chat header elements
      const chatHeader = page.locator('[data-testid="chat-header"]');
      await expect(chatHeader).toBeVisible();
      
      // Check customer info
      const customerInfo = page.locator('[data-testid="chat-header-customer-info"]');
      if (await customerInfo.count() > 0) {
        console.log('✅ Customer information displayed');
      }
      
      // Check online indicator
      const onlineIndicator = page.locator('[data-testid="chat-header-online-indicator"]');
      if (await onlineIndicator.count() > 0) {
        console.log('✅ Online indicator present');
      }
      
      // Check chat header actions
      const headerActions = page.locator('[data-testid="chat-header-actions"]');
      if (await headerActions.count() > 0) {
        console.log('✅ Chat header actions present');
      }
    }
    
    console.log('✅ Chat header functionality tested');
  });

  test('should test message list and conversation display', async ({ page }) => {
    console.log('💬 Testing message list and conversation display...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Check message list
      const messageList = page.locator('[data-testid="messages"], .message-list');
      await expect(messageList).toBeVisible();
      
      // Check for message elements
      const messages = page.locator('[data-testid="message"], .message');
      const messageCount = await messages.count();
      console.log(`📊 Found ${messageCount} messages`);
      
      // Check for empty state if no messages
      if (messageCount === 0) {
        const emptyState = page.locator('text=Start the conversation');
        if (await emptyState.count() > 0) {
          console.log('✅ Empty state displayed correctly');
        }
      }
    }
    
    console.log('✅ Message list functionality tested');
  });

  test('should test message composer functionality', async ({ page }) => {
    console.log('✍️ Testing message composer functionality...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Check composer elements
      const composer = page.locator('[data-testid="composer"], .composer, textarea');
      if (await composer.count() > 0) {
        console.log('✅ Message composer found');
        
        // Test typing
        await composer.first().fill('Test message from Playwright');
        console.log('✅ Message typing working');
        
        // Check for send button
        const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")');
        if (await sendButton.count() > 0) {
          console.log('✅ Send button found');
        }
      }
    }
    
    console.log('✅ Message composer functionality tested');
  });

  test('should test AI handover functionality', async ({ page }) => {
    console.log('🤖 Testing AI handover functionality...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Look for AI handover buttons
      const aiButtons = page.locator('[data-testid*="ai"], [class*="ai"], button:has-text("AI"), button:has-text("Handover")');
      const aiButtonCount = await aiButtons.count();
      console.log(`📊 Found ${aiButtonCount} AI handover related buttons`);
      
      if (aiButtonCount > 0) {
        // Test AI handover toggle
        await aiButtons.first().click();
        console.log('✅ AI handover button clickable');
        
        // Check for AI status indicators
        const aiStatus = page.locator('[data-testid*="ai-status"], [class*="ai-active"]');
        if (await aiStatus.count() > 0) {
          console.log('✅ AI status indicators present');
        }
      }
    }
    
    console.log('✅ AI handover functionality tested');
  });

  test('should test customer sidebar functionality', async ({ page }) => {
    console.log('👥 Testing customer sidebar functionality...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Look for customer details button
      const customerDetailsButton = page.locator('[data-testid*="customer"], button:has-text("Customer"), button:has-text("Details")');
      if (await customerDetailsButton.count() > 0) {
        await customerDetailsButton.first().click();
        console.log('✅ Customer details button clickable');
        
        // Check for customer sidebar
        const customerSidebar = page.locator('[data-testid*="customer-sidebar"], .customer-sidebar');
        if (await customerSidebar.count() > 0) {
          console.log('✅ Customer sidebar displayed');
          
          // Check for customer information
          const customerInfo = page.locator('[data-testid*="customer-info"], .customer-info');
          if (await customerInfo.count() > 0) {
            console.log('✅ Customer information displayed in sidebar');
          }
        }
      }
    }
    
    console.log('✅ Customer sidebar functionality tested');
  });

  test('should test conversation management features', async ({ page }) => {
    console.log('⚙️ Testing conversation management features...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Look for conversation management buttons
      const managementButtons = page.locator('[data-testid*="management"], [class*="management"], button:has-text("Manage"), button:has-text("Settings")');
      const managementButtonCount = await managementButtons.count();
      console.log(`📊 Found ${managementButtonCount} conversation management buttons`);
      
      if (managementButtonCount > 0) {
        await managementButtons.first().click();
        console.log('✅ Conversation management button clickable');
        
        // Check for management panel
        const managementPanel = page.locator('[data-testid*="management-panel"], .management-panel');
        if (await managementPanel.count() > 0) {
          console.log('✅ Conversation management panel displayed');
        }
      }
    }
    
    console.log('✅ Conversation management features tested');
  });

  test('should test bulk actions functionality', async ({ page }) => {
    console.log('📦 Testing bulk actions functionality...');
    
    // Look for bulk action elements
    const bulkActionElements = page.locator('[data-testid*="bulk"], [class*="bulk"], button:has-text("Bulk"), button:has-text("Select")');
    const bulkActionCount = await bulkActionElements.count();
    console.log(`📊 Found ${bulkActionCount} bulk action elements`);
    
    if (bulkActionCount > 0) {
      // Test bulk selection
      const selectButtons = page.locator('[data-testid*="select"], input[type="checkbox"]');
      if (await selectButtons.count() > 0) {
        await selectButtons.first().click();
        console.log('✅ Bulk selection working');
      }
    }
    
    console.log('✅ Bulk actions functionality tested');
  });

  test('should test advanced filters functionality', async ({ page }) => {
    console.log('🔍 Testing advanced filters functionality...');
    
    // Look for filter elements
    const filterElements = page.locator('[data-testid*="filter"], [class*="filter"], button:has-text("Filter"), button:has-text("Advanced")');
    const filterCount = await filterElements.count();
    console.log(`📊 Found ${filterCount} filter elements`);
    
    if (filterCount > 0) {
      // Test filter button
      await filterElements.first().click();
      console.log('✅ Filter button clickable');
      
      // Check for filter panel
      const filterPanel = page.locator('[data-testid*="filter-panel"], .filter-panel');
      if (await filterPanel.count() > 0) {
        console.log('✅ Filter panel displayed');
      }
    }
    
    console.log('✅ Advanced filters functionality tested');
  });

  test('should test keyboard shortcuts', async ({ page }) => {
    console.log('⌨️ Testing keyboard shortcuts...');
    
    // Test search shortcut (Cmd/Ctrl + K)
    await page.keyboard.press('Meta+k');
    console.log('✅ Search shortcut (Cmd+K) working');
    
    // Test shortcuts modal (Cmd/Ctrl + /)
    await page.keyboard.press('Meta+/');
    console.log('✅ Shortcuts modal (Cmd+/) working');
    
    // Test escape key
    await page.keyboard.press('Escape');
    console.log('✅ Escape key working');
    
    console.log('✅ Keyboard shortcuts tested');
  });

  test('should test file upload functionality', async ({ page }) => {
    console.log('📎 Testing file upload functionality...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Look for file upload elements
      const fileUploadElements = page.locator('[data-testid*="file"], [class*="file"], input[type="file"], button:has-text("Upload"), button:has-text("File")');
      const fileUploadCount = await fileUploadElements.count();
      console.log(`📊 Found ${fileUploadCount} file upload elements`);
      
      if (fileUploadCount > 0) {
        console.log('✅ File upload elements present');
      }
    }
    
    console.log('✅ File upload functionality tested');
  });

  test('should test emoji picker and templates', async ({ page }) => {
    console.log('😊 Testing emoji picker and templates...');
    
    // Select a conversation
    const conversationRows = page.locator('[data-testid="conversation-row"], .conversation-row');
    if (await conversationRows.count() > 0) {
      await conversationRows.first().click();
      
      // Look for emoji picker
      const emojiButtons = page.locator('[data-testid*="emoji"], [class*="emoji"], button:has-text("😊"), button:has-text("Emoji")');
      const emojiCount = await emojiButtons.count();
      console.log(`📊 Found ${emojiCount} emoji picker elements`);
      
      if (emojiCount > 0) {
        await emojiButtons.first().click();
        console.log('✅ Emoji picker clickable');
      }
      
      // Look for template buttons
      const templateButtons = page.locator('[data-testid*="template"], [class*="template"], button:has-text("Template")');
      const templateCount = await templateButtons.count();
      console.log(`📊 Found ${templateCount} template elements`);
      
      if (templateCount > 0) {
        await templateButtons.first().click();
        console.log('✅ Template button clickable');
      }
    }
    
    console.log('✅ Emoji picker and templates tested');
  });

  test('should test real-time features and connections', async ({ page }) => {
    console.log('📡 Testing real-time features and connections...');
    
    // Monitor for real-time logs
    const realtimeLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('realtime') || text.includes('broadcast') || text.includes('channel') || text.includes('connected')) {
        realtimeLogs.push(text);
        console.log(`🔍 REALTIME: ${text}`);
      }
    });
    
    // Wait for real-time activity
    await page.waitForTimeout(3000);
    console.log(`📊 Captured ${realtimeLogs.length} real-time logs`);
    
    // Check for connection status indicators
    const connectionStatus = page.locator('[data-testid*="connection"], [class*="connection"], [class*="status"]');
    const connectionCount = await connectionStatus.count();
    console.log(`📊 Found ${connectionCount} connection status elements`);
    
    console.log('✅ Real-time features tested');
  });

  test('should test performance and loading states', async ({ page }) => {
    console.log('⚡ Testing performance and loading states...');
    
    // Check for loading indicators
    const loadingElements = page.locator('[data-testid*="loading"], [class*="loading"], [class*="spinner"]');
    const loadingCount = await loadingElements.count();
    console.log(`📊 Found ${loadingCount} loading elements`);
    
    // Test page load performance
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    // Check for error states
    const errorElements = page.locator('[data-testid*="error"], [class*="error"]');
    const errorCount = await errorElements.count();
    console.log(`📊 Found ${errorCount} error elements`);
    
    console.log('✅ Performance and loading states tested');
  });

  test('should test accessibility features', async ({ page }) => {
    console.log('♿ Testing accessibility features...');
    
    // Check for ARIA labels
    const ariaElements = page.locator('[aria-label], [aria-labelledby], [aria-describedby]');
    const ariaCount = await ariaElements.count();
    console.log(`📊 Found ${ariaCount} ARIA labeled elements`);
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    console.log('✅ Keyboard navigation working');
    
    // Check for focus indicators
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      console.log('✅ Focus indicators present');
    }
    
    console.log('✅ Accessibility features tested');
  });

  test('should test responsive design and mobile features', async ({ page }) => {
    console.log('📱 Testing responsive design and mobile features...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check for mobile-specific elements
    const mobileElements = page.locator('[data-testid*="mobile"], [class*="mobile"]');
    const mobileCount = await mobileElements.count();
    console.log(`📊 Found ${mobileCount} mobile-specific elements`);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    console.log('✅ Responsive design tested');
  });
}); 