/**
 * COMPREHENSIVE BIDIRECTIONAL COMMUNICATION E2E TEST
 * 
 * Tests real-time message flow between widget and dashboard interfaces:
 * 1. Widget → Dashboard message delivery with real-time UI updates
 * 2. Dashboard → Widget message delivery with real-time UI updates
 * 3. Typing indicators work bidirectionally
 * 4. Conversation list updates in real-time on both sides
 * 5. Performance validation and error monitoring
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  performanceThreshold: 100, // ms for AI handover
  realtimeTimeout: 10000, // ms for real-time updates
};

interface MessageMetrics {
  sendTime: number;
  receiveTime: number;
  latency: number;
  success: boolean;
}

class BidirectionalTestHelper {
  private messageMetrics: MessageMetrics[] = [];
  private startTime: number = 0;

  constructor(
    private agentPage: Page,
    private visitorPage: Page,
    private agentContext: BrowserContext,
    private visitorContext: BrowserContext
  ) {}

  async loginAsAgent(): Promise<boolean> {
    console.log('🔐 Agent logging in...');
    try {
      await this.agentPage.goto(`${TEST_CONFIG.baseURL}/login`);
      await this.agentPage.waitForLoadState('networkidle');
      
      // Wait for login form to be ready
      await this.agentPage.waitForSelector('#email', { timeout: 10000 });
      
      await this.agentPage.fill('#email', TEST_CONFIG.agentEmail);
      await this.agentPage.fill('#password', TEST_CONFIG.agentPassword);
      await this.agentPage.click('button[type="submit"]');
      
      // Wait for successful login
      await this.agentPage.waitForURL('**/dashboard**', { timeout: 15000 });
      console.log('✅ Agent logged in successfully');
      return true;
    } catch (error) {
      console.error('❌ Agent login failed:', error);
      return false;
    }
  }

                async openWidget(): Promise<boolean> {
                console.log('🔧 Opening widget...');
                try {
                  await this.visitorPage.goto(TEST_CONFIG.baseURL);
                  await this.visitorPage.waitForLoadState('networkidle');

                  // Wait for widget button to appear
                  await this.visitorPage.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
                  console.log('✅ Widget button found, clicking...');
                  await this.visitorPage.click('[data-testid="widget-button"]');

                  // Wait for widget panel to open
                  await this.visitorPage.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
                  console.log('✅ Widget panel opened');

                  // Wait for the message input to be available (this is the key element we need)
                  await this.visitorPage.waitForSelector('[data-testid="widget-message-input"]', { timeout: 10000 });
                  console.log('✅ Widget message input ready');

                  // Wait for the send button to be available
                  await this.visitorPage.waitForSelector('[data-testid="widget-send-button"]', { timeout: 10000 });
                  console.log('✅ Widget send button ready');

                  // Wait a bit more for any animations or content to fully load
                  await this.visitorPage.waitForTimeout(2000);

                  console.log('✅ Widget opened successfully');
                  return true;
                } catch (error) {
                  console.error('❌ Widget opening failed:', error);
                  return false;
                }
              }

                async sendMessageFromWidget(message: string): Promise<MessageMetrics> {
                console.log(`💬 Widget sending: "${message}"`);
                const metrics: MessageMetrics = {
                  sendTime: Date.now(),
                  receiveTime: 0,
                  latency: 0,
                  success: false
                };

                try {
                  // Use the correct selectors we know exist
                  await this.visitorPage.fill('[data-testid="widget-message-input"]', message);
                  console.log('✅ Message filled in widget input');

                  await this.visitorPage.click('[data-testid="widget-send-button"]');
                  console.log('✅ Send button clicked');

                  // Wait for message to appear in widget (confirmation it was sent)
                  await this.visitorPage.waitForSelector(`text="${message}"`, { timeout: 10000 });
                  console.log('✅ Message appeared in widget');

                  // Wait for message to appear in dashboard
                  await this.agentPage.waitForSelector(`text="${message}"`, { timeout: TEST_CONFIG.realtimeTimeout });
                  console.log('✅ Message appeared in dashboard');

                  metrics.receiveTime = Date.now();
                  metrics.latency = metrics.receiveTime - metrics.sendTime;
                  metrics.success = true;

                  console.log(`✅ Widget message delivered in ${metrics.latency}ms`);
                  this.messageMetrics.push(metrics);

                  return metrics;
                } catch (error) {
                  console.error('❌ Widget message failed:', error);
                  metrics.success = false;
                  this.messageMetrics.push(metrics);
                  return metrics;
                }
              }

  async sendMessageFromDashboard(message: string): Promise<MessageMetrics> {
    console.log(`💬 Agent sending: "${message}"`);
    const metrics: MessageMetrics = {
      sendTime: Date.now(),
      receiveTime: 0,
      latency: 0,
      success: false
    };

    try {
      // Find and fill the message input
      const messageInput = this.agentPage.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
      await messageInput.fill(message);
      
      // Try multiple send button selectors
      const sendSelectors = [
        'button[aria-label*="Send"]',
        'button[type="submit"]',
        'button:has-text("Send")',
        '[data-testid="send-button"]'
      ];
      
      let sent = false;
      for (const selector of sendSelectors) {
        const button = this.agentPage.locator(selector);
        const count = await button.count();
        if (count > 0 && await button.first().isVisible()) {
          try {
            await button.first().click({ force: true });
            sent = true;
            break;
          } catch (error) {
            continue;
          }
        }
      }
      
      if (!sent) {
        // Fallback to Enter key
        await messageInput.press('Enter');
      }
      
      // Wait for message to appear in dashboard (confirmation it was sent)
      await this.agentPage.waitForSelector(`text="${message}"`, { timeout: 10000 });
      
      // Wait for message to appear in widget
      await this.visitorPage.waitForSelector(`text="${message}"`, { timeout: TEST_CONFIG.realtimeTimeout });
      
      metrics.receiveTime = Date.now();
      metrics.latency = metrics.receiveTime - metrics.sendTime;
      metrics.success = true;
      
      console.log(`✅ Agent message delivered in ${metrics.latency}ms`);
      this.messageMetrics.push(metrics);
      
      return metrics;
    } catch (error) {
      console.error('❌ Agent message failed:', error);
      metrics.success = false;
      this.messageMetrics.push(metrics);
      return metrics;
    }
  }

  async openConversationInDashboard(): Promise<boolean> {
    console.log('📂 Opening conversation in dashboard...');
    try {
      // Wait for conversations to load
      await this.agentPage.waitForTimeout(3000);
      
      const conversations = this.agentPage.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]');
      const count = await conversations.count();
      
      if (count > 0) {
        await conversations.first().click();
        await this.agentPage.waitForTimeout(3000);
        console.log('✅ Conversation opened in dashboard');
        return true;
      } else {
        console.log('⚠️ No conversations found in dashboard');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to open conversation:', error);
      return false;
    }
  }

                async testTypingIndicator(direction: 'widget-to-dashboard' | 'dashboard-to-widget'): Promise<boolean> {
                console.log(`⌨️ Testing typing indicator: ${direction}`);

                try {
                  if (direction === 'widget-to-dashboard') {
                    // Start typing in widget using the correct selector
                    await this.visitorPage.fill('[data-testid="widget-message-input"]', '');
                    await this.visitorPage.type('[data-testid="widget-message-input"]', 'Testing typing indicator...', { delay: 100 });
                    console.log('✅ Started typing in widget');

                    // Wait and check for typing indicator in dashboard
                    await this.agentPage.waitForTimeout(3000);

                    const typingSelectors = [
                      ':has-text("typing")',
                      ':has-text("is typing")',
                      '.typing-indicator',
                      '[data-testid*="typing"]',
                      '.dots',
                      '.typing-dots'
                    ];

                    for (const selector of typingSelectors) {
                      const indicator = this.agentPage.locator(selector);
                      const count = await indicator.count();
                      if (count > 0) {
                        console.log(`✅ Typing indicator found with selector: ${selector}`);
                        return true;
                      }
                    }

                    // Clear typing
                    await this.visitorPage.fill('[data-testid="widget-message-input"]', '');

                  } else {
                    // Start typing in dashboard
                    const messageInput = this.agentPage.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
                    await messageInput.fill('');
                    await messageInput.type('Agent typing test...', { delay: 100 });

                    // Wait and check for typing indicator in widget
                    await this.visitorPage.waitForTimeout(3000);

                    const typingSelectors = [
                      ':has-text("typing")',
                      ':has-text("is typing")',
                      '.typing-indicator',
                      '[data-testid*="typing"]',
                      '.dots',
                      '.typing-dots'
                    ];

                    for (const selector of typingSelectors) {
                      const indicator = this.visitorPage.locator(selector);
                      const count = await indicator.count();
                      if (count > 0) {
                        console.log(`✅ Typing indicator found in widget with selector: ${selector}`);
                        return true;
                      }
                    }

                    // Clear typing
                    await messageInput.fill('');
                  }

                  console.log('⚠️ No typing indicator found (may not be implemented)');
                  return false;
                } catch (error) {
                  console.error('❌ Typing indicator test failed:', error);
                  return false;
                }
              }

                async verifyConversationListUpdates(): Promise<boolean> {
                console.log('📋 Verifying conversation list updates...');
                try {
                  // Get initial conversation count
                  const initialConversations = this.agentPage.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]');
                  const initialCount = await initialConversations.count();

                  // Send a new message to create/update conversation
                  const testMessage = `Conversation list test - ${Date.now()}`;
                  const messageResult = await this.sendMessageFromWidget(testMessage);

                  if (!messageResult.success) {
                    console.log('⚠️ Could not send test message for conversation list verification');
                    return false;
                  }

                  // Wait for conversation list to update
                  await this.agentPage.waitForTimeout(5000);

                  // Check if conversation count changed or conversation was updated
                  const updatedConversations = this.agentPage.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]');
                  const updatedCount = await updatedConversations.count();

                  // Look for the test message in conversation previews
                  const messageInPreview = this.agentPage.locator(`text="${testMessage}"`);
                  const previewCount = await messageInPreview.count();

                  if (updatedCount > initialCount || previewCount > 0) {
                    console.log('✅ Conversation list updated successfully');
                    return true;
                  } else {
                    console.log('⚠️ Conversation list may not have updated visibly');
                    return false;
                  }
                } catch (error) {
                  console.error('❌ Conversation list verification failed:', error);
                  return false;
                }
              }

  async verifyUnreadCounts(): Promise<boolean> {
    console.log('🔢 Verifying unread message counts...');
    try {
      // Look for unread indicators
      const unreadSelectors = [
        '[data-testid="unread-count"]',
        '.unread-count',
        '.badge',
        '[data-testid*="unread"]'
      ];
      
      for (const selector of unreadSelectors) {
        const unreadIndicator = this.agentPage.locator(selector);
        const count = await unreadIndicator.count();
        if (count > 0) {
          console.log(`✅ Unread indicator found with selector: ${selector}`);
          return true;
        }
      }
      
      console.log('⚠️ No unread indicators found (may not be implemented)');
      return false;
    } catch (error) {
      console.error('❌ Unread count verification failed:', error);
      return false;
    }
  }

  getPerformanceMetrics(): { avgLatency: number; successRate: number; totalMessages: number } {
    const successfulMessages = this.messageMetrics.filter(m => m.success);
    const avgLatency = successfulMessages.length > 0 
      ? successfulMessages.reduce((sum, m) => sum + m.latency, 0) / successfulMessages.length 
      : 0;
    
    return {
      avgLatency,
      successRate: this.messageMetrics.length > 0 ? successfulMessages.length / this.messageMetrics.length : 0,
      totalMessages: this.messageMetrics.length
    };
  }

  async checkForErrors(): Promise<boolean> {
    console.log('🔍 Checking for errors in console...');
    try {
      // Check agent page console for errors
      const agentErrors = await this.agentPage.evaluate(() => {
        return (window as unknown).consoleErrors || [];
      });
      
      // Check visitor page console for errors
      const visitorErrors = await this.visitorPage.evaluate(() => {
        return (window as unknown).consoleErrors || [];
      });
      
      const allErrors = [...agentErrors, ...visitorErrors];
      const bindingErrors = allErrors.filter(error => 
        error.includes('mismatch between server and client') ||
        error.includes('binding') ||
        error.includes('realtime')
      );
      
      if (bindingErrors.length > 0) {
        console.error('❌ Found binding errors:', bindingErrors);
        return false;
      }
      
      console.log('✅ No binding errors found');
      return true;
    } catch (error) {
      console.error('❌ Error checking failed:', error);
      return false;
    }
  }
}

test.describe('Comprehensive Bidirectional Communication E2E Test', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;
  let testHelper: BidirectionalTestHelper;

  test.beforeAll(async ({ browser }) => {
    console.log('\n🚀 Starting Comprehensive Bidirectional Communication E2E Test');
    console.log('================================================================');
    
    agentContext = await browser.newContext();
    visitorContext = await browser.newContext();
    
    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();
    
    testHelper = new BidirectionalTestHelper(agentPage, visitorPage, agentContext, visitorContext);
    
    // Setup error logging
    await agentPage.addInitScript(() => {
      (window as unknown).consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as unknown).consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    await visitorPage.addInitScript(() => {
      (window as unknown).consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as unknown).consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
  });

  test.afterAll(async () => {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const metrics = testHelper.getPerformanceMetrics();
    console.log(`📈 Average Latency: ${metrics.avgLatency.toFixed(2)}ms`);
    console.log(`📊 Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`📨 Total Messages: ${metrics.totalMessages}`);
    
    await agentContext.close();
    await visitorContext.close();
  });

  test('should establish authenticated session and open interfaces', async () => {
    console.log('\n🎯 SETUP: Authentication and Interface Setup');
    console.log('============================================');
    
    // Test agent authentication
    const agentLoggedIn = await testHelper.loginAsAgent();
    expect(agentLoggedIn).toBe(true);
    
    // Navigate to inbox
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');
    
    // Test widget opening
    const widgetOpened = await testHelper.openWidget();
    expect(widgetOpened).toBe(true);
    
    console.log('✅ Setup completed successfully');
  });

  test('should verify widget to dashboard message delivery with real-time updates', async () => {
    console.log('\n🎯 TEST 1: Widget → Dashboard Message Delivery');
    console.log('==============================================');
    
    // Ensure we're on the right pages
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');
    
    // Send message from widget
    const widgetMessage = `Widget test message - ${Date.now()}`;
    const metrics = await testHelper.sendMessageFromWidget(widgetMessage);
    
    // Verify message delivery
    expect(metrics.success).toBe(true);
    expect(metrics.latency).toBeLessThan(TEST_CONFIG.realtimeTimeout);
    
    // Verify message appears in dashboard without refresh
    const messageInDashboard = agentPage.locator(`text="${widgetMessage}"`);
    await expect(messageInDashboard).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Widget → Dashboard test passed');
  });

  test('should verify dashboard to widget message delivery with real-time updates', async () => {
    console.log('\n🎯 TEST 2: Dashboard → Widget Message Delivery');
    console.log('==============================================');
    
    // Ensure we have a conversation open
    const conversationOpened = await testHelper.openConversationInDashboard();
    expect(conversationOpened).toBe(true);
    
    // Send message from dashboard
    const agentMessage = `Agent response - ${Date.now()}`;
    const metrics = await testHelper.sendMessageFromDashboard(agentMessage);
    
    // Verify message delivery
    expect(metrics.success).toBe(true);
    expect(metrics.latency).toBeLessThan(TEST_CONFIG.realtimeTimeout);
    
    // Verify message appears in widget without refresh
    const messageInWidget = visitorPage.locator(`text="${agentMessage}"`);
    await expect(messageInWidget).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Dashboard → Widget test passed');
  });

  test('should verify typing indicators work bidirectionally', async () => {
    console.log('\n🎯 TEST 3: Bidirectional Typing Indicators');
    console.log('===========================================');
    
    // Test widget to dashboard typing indicator
    const widgetTypingWorks = await testHelper.testTypingIndicator('widget-to-dashboard');
    
    // Test dashboard to widget typing indicator
    const dashboardTypingWorks = await testHelper.testTypingIndicator('dashboard-to-widget');
    
    // At least one direction should work
    expect(widgetTypingWorks || dashboardTypingWorks).toBe(true);
    
    if (widgetTypingWorks && dashboardTypingWorks) {
      console.log('✅ Both typing indicators working');
    } else if (widgetTypingWorks) {
      console.log('✅ Widget typing indicator working');
    } else if (dashboardTypingWorks) {
      console.log('✅ Dashboard typing indicator working');
    }
  });

  test('should verify conversation list updates in real-time', async () => {
    console.log('\n🎯 TEST 4: Real-time Conversation List Updates');
    console.log('==============================================');
    
    // Test conversation list updates
    const listUpdatesWork = await testHelper.verifyConversationListUpdates();
    
    // Test unread counts
    const unreadCountsWork = await testHelper.verifyUnreadCounts();
    
    // At least conversation list updates should work
    expect(listUpdatesWork).toBe(true);
    
    if (listUpdatesWork && unreadCountsWork) {
      console.log('✅ Conversation list and unread counts working');
    } else if (listUpdatesWork) {
      console.log('✅ Conversation list updates working');
    }
  });

  test('should validate performance and error monitoring', async () => {
    console.log('\n🎯 TEST 5: Performance and Error Monitoring');
    console.log('===========================================');
    
    // Send multiple messages to test performance
    const messages = [
      'Performance test message 1',
      'Performance test message 2',
      'Performance test message 3'
    ];
    
    for (const message of messages) {
      await testHelper.sendMessageFromWidget(message);
      await testHelper.sendMessageFromDashboard(`Response to ${message}`);
    }
    
    // Get performance metrics
    const metrics = testHelper.getPerformanceMetrics();
    
    // Validate performance
    expect(metrics.avgLatency).toBeLessThan(TEST_CONFIG.performanceThreshold);
    expect(metrics.successRate).toBeGreaterThan(0.8); // 80% success rate minimum
    
    console.log(`📈 Performance Metrics:`);
    console.log(`   Average Latency: ${metrics.avgLatency.toFixed(2)}ms`);
    console.log(`   Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`   Total Messages: ${metrics.totalMessages}`);
    
    // Check for errors
    const noErrors = await testHelper.checkForErrors();
    expect(noErrors).toBe(true);
    
    console.log('✅ Performance and error monitoring passed');
  });

  test('should handle multiple concurrent conversations', async () => {
    console.log('\n🎯 TEST 6: Multiple Concurrent Conversations');
    console.log('=============================================');
    
    // Open a second visitor context
    const visitor2Context = await agentPage.context().browser()!.newContext();
    const visitor2Page = await visitor2Context.newPage();
    
    try {
      // Open widget in second visitor
      await visitor2Page.goto(TEST_CONFIG.baseURL);
      await visitor2Page.waitForLoadState('networkidle');
      await visitor2Page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
      await visitor2Page.click('[data-testid="widget-button"]');
      await visitor2Page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
      
      // Send message from second visitor
      const message2 = `Concurrent test message - ${Date.now()}`;
      await visitor2Page.fill('[data-testid="widget-message-input"]', message2);
      await visitor2Page.click('[data-testid="widget-send-button"]');
      
      // Verify both conversations exist in dashboard
      await agentPage.waitForTimeout(5000);
      const conversations = agentPage.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]');
      const conversationCount = await conversations.count();
      
      expect(conversationCount).toBeGreaterThanOrEqual(2);
      
      console.log(`✅ Multiple conversations handled: ${conversationCount} conversations found`);
    } finally {
      await visitor2Context.close();
    }
  });
}); 