/**
 * SIMPLE CONVERSATION CONTINUITY TEST
 * 
 * Tests the simplified visitor tracking implementation to ensure
 * returning visitors resume existing conversations instead of creating new ones.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd'
};

// Helper functions
async function loginAsAgent(page: Page) {
  console.log('🔐 Agent logging in...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');
}

async function openWidget(page: Page) {
  console.log('🔧 Opening widget...');
  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
  await page.click('[data-testid="widget-button"]');
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
  console.log('✅ Widget opened successfully');
}

async function sendMessageFromWidget(page: Page, message: string) {
  console.log(`💬 Widget sending: "${message}"`);
  await page.fill('[data-testid="widget-message-input"]', message);
  await page.click('[data-testid="widget-send-button"]');
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 15000 });
  console.log('✅ Message sent from widget');
}

async function getVisitorIdFromLocalStorage(page: Page): Promise<string | null> {
  return await page.evaluate((orgId) => {
    return localStorage.getItem(`campfire_visitor_${orgId}`);
  }, TEST_CONFIG.organizationId);
}

async function clearVisitorIdFromLocalStorage(page: Page) {
  await page.evaluate((orgId) => {
    localStorage.removeItem(`campfire_visitor_${orgId}`);
  }, TEST_CONFIG.organizationId);
}

test.describe('Simple Conversation Continuity', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;

  test.beforeAll(async ({ browser }) => {
    agentContext = await browser.newContext();
    visitorContext = await browser.newContext();
    
    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();
  });

  test.afterAll(async () => {
    await agentContext.close();
    await visitorContext.close();
  });

  test('should create visitor ID and persist it across sessions', async () => {
    console.log('\n🎯 TEST 1: Visitor ID Persistence');
    console.log('=================================');

    // Clear any existing visitor ID
    await clearVisitorIdFromLocalStorage(visitorPage);

    // Open widget for the first time
    await openWidget(visitorPage);

    // Get the visitor ID that was created
    const visitorId1 = await getVisitorIdFromLocalStorage(visitorPage);
    console.log(`First visitor ID: ${visitorId1}`);
    expect(visitorId1).toBeTruthy();
    expect(visitorId1).toMatch(/^visitor_\d+_[a-z0-9]+$/);

    // Close and reopen widget
    await visitorPage.reload();
    await openWidget(visitorPage);

    // Get the visitor ID again
    const visitorId2 = await getVisitorIdFromLocalStorage(visitorPage);
    console.log(`Second visitor ID: ${visitorId2}`);

    // Should be the same visitor ID
    expect(visitorId2).toBe(visitorId1);
    console.log('✅ SUCCESS: Visitor ID persisted across sessions');
  });

  test('should reuse existing conversation for returning visitor', async () => {
    console.log('\n🎯 TEST 2: Conversation Continuity');
    console.log('==================================');

    // Clear any existing visitor ID to start fresh
    await clearVisitorIdFromLocalStorage(visitorPage);

    // Session 1: First visit - create conversation
    console.log('\n--- Session 1: First Visit ---');
    await openWidget(visitorPage);
    
    const message1 = `First message - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, message1);
    
    const visitorId = await getVisitorIdFromLocalStorage(visitorPage);
    console.log(`Visitor ID: ${visitorId}`);

    // Wait for conversation to be created
    await visitorPage.waitForTimeout(5000);

    // Session 2: Return visit - should reuse conversation
    console.log('\n--- Session 2: Return Visit ---');
    await visitorPage.reload();
    await openWidget(visitorPage);

    // Send another message
    const message2 = `Second message - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, message2);

    // Verify both messages are in the same conversation
    const message1Visible = await visitorPage.locator(`[data-testid="message"]:has-text("${message1}")`).count();
    const message2Visible = await visitorPage.locator(`[data-testid="message"]:has-text("${message2}")`).count();

    console.log(`Message 1 visible: ${message1Visible > 0}`);
    console.log(`Message 2 visible: ${message2Visible > 0}`);

    expect(message1Visible).toBeGreaterThan(0);
    expect(message2Visible).toBeGreaterThan(0);

    console.log('✅ SUCCESS: Conversation continuity working - both messages visible');
  });

  test('should create new conversation for different visitor', async () => {
    console.log('\n🎯 TEST 3: New Visitor Gets New Conversation');
    console.log('============================================');

    // Clear visitor ID to simulate new visitor
    await clearVisitorIdFromLocalStorage(visitorPage);

    // New visitor session
    await openWidget(visitorPage);
    
    const newVisitorMessage = `New visitor message - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, newVisitorMessage);

    const newVisitorId = await getVisitorIdFromLocalStorage(visitorPage);
    console.log(`New visitor ID: ${newVisitorId}`);

    // This should be a fresh conversation, so previous messages shouldn't be visible
    await visitorPage.waitForTimeout(3000);
    
    // Check that we only see the new message
    const allMessages = visitorPage.locator('[data-testid="message"]');
    const messageCount = await allMessages.count();
    
    console.log(`Total messages visible: ${messageCount}`);
    
    // Should only see the new visitor's message (and potentially a welcome message)
    expect(messageCount).toBeLessThanOrEqual(2);

    const newMessageVisible = await visitorPage.locator(`[data-testid="message"]:has-text("${newVisitorMessage}")`).count();
    expect(newMessageVisible).toBeGreaterThan(0);

    console.log('✅ SUCCESS: New visitor gets fresh conversation');
  });

  test('should verify conversation count in database', async () => {
    console.log('\n🎯 TEST 4: Database Verification');
    console.log('================================');

    // Login as agent to check dashboard
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Wait for conversations to load
    await agentPage.waitForTimeout(5000);

    // Count conversations in dashboard
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();

    console.log(`Conversations in dashboard: ${conversationCount}`);

    // We should have a reasonable number of conversations (not thousands)
    // Based on our tests, we should have 2-3 conversations max
    expect(conversationCount).toBeLessThan(10);
    expect(conversationCount).toBeGreaterThan(0);

    console.log('✅ SUCCESS: Reasonable conversation count in database');
  });

  test('should verify visitor ID format and uniqueness', async () => {
    console.log('\n🎯 TEST 5: Visitor ID Format Verification');
    console.log('=========================================');

    // Clear and create multiple visitor IDs to test format
    const visitorIds: string[] = [];

    for (let i = 0; i < 3; i++) {
      await clearVisitorIdFromLocalStorage(visitorPage);
      await openWidget(visitorPage);
      
      const visitorId = await getVisitorIdFromLocalStorage(visitorPage);
      console.log(`Visitor ID ${i + 1}: ${visitorId}`);
      
      expect(visitorId).toBeTruthy();
      expect(visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      
      visitorIds.push(visitorId!);
      
      await visitorPage.reload();
    }

    // Verify all visitor IDs are unique
    const uniqueIds = new Set(visitorIds);
    expect(uniqueIds.size).toBe(visitorIds.length);

    console.log('✅ SUCCESS: All visitor IDs are unique and properly formatted');
  });
});
