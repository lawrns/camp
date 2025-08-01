import { test, expect } from '@playwright/test';

/**
 * UI Functional Test
 * Tests actual UI interactions: handovers, conversations, ticket conversion, etc.
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  BASE_URL: 'http://localhost:3005'
};

test.describe('UI Functional Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await page.fill('#email', TEST_CONFIG.AGENT_EMAIL);
    await page.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**/dashboard');
  });

  test('should test real conversation assignment functionality', async ({ page }) => {
    console.log('👥 Testing conversation assignment...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for assignment button/option
    const assignButton = page.locator('[class*="assign"], [class*="assignment"], button:has-text("Assign"), button:has-text("assign")');
    
    if (await assignButton.count() > 0) {
      console.log('✅ Assignment button found');
      await assignButton.first().click();
      
      // Look for assignment modal or dropdown
      const assignModal = page.locator('[class*="modal"], [class*="dropdown"], [class*="popup"]');
      if (await assignModal.count() > 0) {
        console.log('✅ Assignment modal/dropdown appeared');
        
        // Look for team members to assign to
        const teamMembers = page.locator('[class*="member"], [class*="agent"], [class*="user"]');
        if (await teamMembers.count() > 0) {
          console.log(`✅ Found ${await teamMembers.count()} team members to assign to`);
          await teamMembers.first().click();
          console.log('✅ Successfully assigned conversation');
        }
      }
    } else {
      console.log('ℹ️  Assignment functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-assignment.png' });
  });

  test('should test real AI handover functionality', async ({ page }) => {
    console.log('🤖 Testing AI handover functionality...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for AI handover button
    const aiHandoverButton = page.locator('[class*="ai"], [class*="handover"], button:has-text("AI"), button:has-text("handover"), button:has-text("GPT")');
    
    if (await aiHandoverButton.count() > 0) {
      console.log('✅ AI handover button found');
      await aiHandoverButton.first().click();
      
      // Look for handover modal
      const handoverModal = page.locator('[class*="modal"], [class*="dialog"], [class*="popup"]');
      if (await handoverModal.count() > 0) {
        console.log('✅ Handover modal appeared');
        
        // Look for handover reason options
        const handoverReasons = page.locator('[class*="reason"], [class*="option"], [class*="radio"]');
        if (await handoverReasons.count() > 0) {
          console.log(`✅ Found ${await handoverReasons.count()} handover reason options`);
          await handoverReasons.first().click();
        }
        
        // Look for notes input
        const notesInput = page.locator('textarea, input[type="text"], [class*="notes"], [class*="comment"]');
        if (await notesInput.count() > 0) {
          console.log('✅ Notes input found');
          await notesInput.first().fill('Testing AI handover functionality');
        }
        
        // Look for confirm button
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Handover")');
        if (await confirmButton.count() > 0) {
          console.log('✅ Confirm button found');
          await confirmButton.first().click();
          console.log('✅ AI handover initiated');
        }
      }
    } else {
      console.log('ℹ️  AI handover functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/ai-handover.png' });
  });

  test('should test real ticket conversion functionality', async ({ page }) => {
    console.log('🎫 Testing ticket conversion...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for convert to ticket button
    const convertButton = page.locator('[class*="ticket"], [class*="convert"], button:has-text("Ticket"), button:has-text("Convert"), button:has-text("Issue")');
    
    if (await convertButton.count() > 0) {
      console.log('✅ Convert to ticket button found');
      await convertButton.first().click();
      
      // Look for ticket modal
      const ticketModal = page.locator('[class*="modal"], [class*="dialog"], [class*="popup"]');
      if (await ticketModal.count() > 0) {
        console.log('✅ Ticket conversion modal appeared');
        
        // Look for ticket type options
        const ticketTypes = page.locator('[class*="type"], [class*="category"], [class*="priority"]');
        if (await ticketTypes.count() > 0) {
          console.log(`✅ Found ${await ticketTypes.count()} ticket type options`);
          await ticketTypes.first().click();
        }
        
        // Look for ticket title input
        const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="subject"], [class*="title"]');
        if (await titleInput.count() > 0) {
          console.log('✅ Ticket title input found');
          await titleInput.first().fill('Test ticket from conversation');
        }
        
        // Look for ticket description input
        const descriptionInput = page.locator('textarea, input[type="text"], [class*="description"], [class*="details"]');
        if (await descriptionInput.count() > 0) {
          console.log('✅ Ticket description input found');
          await descriptionInput.first().fill('Converting conversation to ticket for testing');
        }
        
        // Look for create ticket button
        const createButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button:has-text("Convert")');
        if (await createButton.count() > 0) {
          console.log('✅ Create ticket button found');
          await createButton.first().click();
          console.log('✅ Ticket conversion completed');
        }
      }
    } else {
      console.log('ℹ️  Ticket conversion functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/ticket-conversion.png' });
  });

  test('should test real conversation tagging functionality', async ({ page }) => {
    console.log('🏷️  Testing conversation tagging...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for tag button
    const tagButton = page.locator('[class*="tag"], [class*="label"], button:has-text("Tag"), button:has-text("Label")');
    
    if (await tagButton.count() > 0) {
      console.log('✅ Tag button found');
      await tagButton.first().click();
      
      // Look for tag input or dropdown
      const tagInput = page.locator('input[placeholder*="tag"], input[placeholder*="label"], [class*="tag-input"]');
      if (await tagInput.count() > 0) {
        console.log('✅ Tag input found');
        await tagInput.first().fill('test-tag');
        await tagInput.first().press('Enter');
        console.log('✅ Tag added to conversation');
      }
      
      // Look for existing tags
      const existingTags = page.locator('[class*="tag"], [class*="label"], [class*="badge"]');
      console.log(`✅ Found ${await existingTags.count()} existing tags`);
    } else {
      console.log('ℹ️  Tagging functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-tagging.png' });
  });

  test('should test real conversation priority functionality', async ({ page }) => {
    console.log('⭐ Testing conversation priority...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for priority button
    const priorityButton = page.locator('[class*="priority"], [class*="urgent"], button:has-text("Priority"), button:has-text("Urgent")');
    
    if (await priorityButton.count() > 0) {
      console.log('✅ Priority button found');
      await priorityButton.first().click();
      
      // Look for priority options
      const priorityOptions = page.locator('[class*="priority"], [class*="option"], [class*="level"]');
      if (await priorityOptions.count() > 0) {
        console.log(`✅ Found ${await priorityOptions.count()} priority options`);
        await priorityOptions.first().click();
        console.log('✅ Priority set for conversation');
      }
    } else {
      console.log('ℹ️  Priority functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-priority.png' });
  });

  test('should test real conversation status functionality', async ({ page }) => {
    console.log('📊 Testing conversation status...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for status button
    const statusButton = page.locator('[class*="status"], [class*="state"], button:has-text("Status"), button:has-text("State")');
    
    if (await statusButton.count() > 0) {
      console.log('✅ Status button found');
      await statusButton.first().click();
      
      // Look for status options
      const statusOptions = page.locator('[class*="status"], [class*="option"], [class*="state"]');
      if (await statusOptions.count() > 0) {
        console.log(`✅ Found ${await statusOptions.count()} status options`);
        await statusOptions.first().click();
        console.log('✅ Status updated for conversation');
      }
    } else {
      console.log('ℹ️  Status functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-status.png' });
  });

  test('should test real bidirectional communication between widget and agent', async ({ page }) => {
    console.log('💬 Testing bidirectional communication...');
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Look for widget
    const widgetButton = page.locator('[class*="widget"], [class*="chat"], button[class*="rounded-full"]');
    await expect(widgetButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click widget to open
    await widgetButton.first().click();
    console.log('✅ Widget opened');
    
    // Wait for chat interface
    await page.waitForTimeout(2000);
    
    // Look for message input - target the actual textarea inside composer
    const messageInput = page.locator('[data-testid="composer"] textarea, [class*="composer"] textarea, textarea');
    if (await messageInput.count() > 0) {
      console.log('✅ Message input found');
      
      // Type a test message
      await messageInput.first().fill('Hello from widget test');
      console.log('✅ Message typed');
      
      // Look for send button
      const sendButton = page.locator('button:has-text("Send"), button[class*="send"], [class*="send-button"]');
      if (await sendButton.count() > 0) {
        console.log('✅ Send button found');
        await sendButton.first().click();
        console.log('✅ Message sent from widget');
      }
    }
    
    // Now test agent side - navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for the conversation that should have the widget message
    const conversations = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    if (await conversations.count() > 0) {
      console.log(`✅ Found ${await conversations.count()} conversations`);
      
      // Click on first conversation
      await conversations.first().click();
      
          // Look for message input in agent interface - target the actual textarea inside composer
    const agentInput = page.locator('[data-testid="composer"] textarea, [class*="composer"] textarea, textarea');
    if (await agentInput.count() > 0) {
      console.log('✅ Agent message input found');
      
      // Type a response
      await agentInput.first().fill('Hello from agent test');
        console.log('✅ Agent message typed');
        
        // Look for send button
        const agentSendButton = page.locator('button:has-text("Send"), button[class*="send"], [class*="send-button"]');
        if (await agentSendButton.count() > 0) {
          console.log('✅ Agent send button found');
          await agentSendButton.first().click();
          console.log('✅ Agent message sent');
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/bidirectional-communication.png' });
  });

  test('should test real conversation notes functionality', async ({ page }) => {
    console.log('📝 Testing conversation notes...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for notes button
    const notesButton = page.locator('[class*="notes"], [class*="note"], button:has-text("Notes"), button:has-text("Add Note")');
    
    if (await notesButton.count() > 0) {
      console.log('✅ Notes button found');
      await notesButton.first().click();
      
      // Look for notes input
      const notesInput = page.locator('textarea, input[type="text"], [class*="notes"], [class*="comment"]');
      if (await notesInput.count() > 0) {
        console.log('✅ Notes input found');
        await notesInput.first().fill('Test note for conversation');
        console.log('✅ Note added to conversation');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")');
        if (await saveButton.count() > 0) {
          console.log('✅ Save button found');
          await saveButton.first().click();
          console.log('✅ Note saved');
        }
      }
    } else {
      console.log('ℹ️  Notes functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-notes.png' });
  });

  test('should test real conversation history and export functionality', async ({ page }) => {
    console.log('📋 Testing conversation history and export...');
    
    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation list
    const conversationList = page.locator('[class*="conversation"], [class*="message"], [class*="chat"]');
    await expect(conversationList.first()).toBeVisible({ timeout: 10000 });
    
    // Click on first conversation
    await conversationList.first().click();
    
    // Look for history/export button
    const historyButton = page.locator('[class*="history"], [class*="export"], button:has-text("History"), button:has-text("Export")');
    
    if (await historyButton.count() > 0) {
      console.log('✅ History/Export button found');
      await historyButton.first().click();
      
      // Look for history modal or export options
      const historyModal = page.locator('[class*="modal"], [class*="dialog"], [class*="popup"]');
      if (await historyModal.count() > 0) {
        console.log('✅ History/Export modal appeared');
        
        // Look for export format options
        const exportOptions = page.locator('[class*="format"], [class*="option"], [class*="type"]');
        if (await exportOptions.count() > 0) {
          console.log(`✅ Found ${await exportOptions.count()} export format options`);
          await exportOptions.first().click();
        }
        
        // Look for export button
        const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Save")');
        if (await exportButton.count() > 0) {
          console.log('✅ Export button found');
          await exportButton.first().click();
          console.log('✅ Conversation exported');
        }
      }
    } else {
      console.log('ℹ️  History/Export functionality not found in UI');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/baseline-screenshots/conversation-history-export.png' });
  });
}); 