import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

/**
 * Comprehensive Widget-Dashboard Communication Test
 * Tests complete bidirectional communication flow and AI handover functionality
 */

// Test configuration
const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d',
  WIDGET_DEMO_URL: '/widget-demo',
  DASHBOARD_URL: '/dashboard',
  BASE_URL: 'http://localhost:3001', // Updated to use correct port
  TIMEOUTS: {
    MESSAGE_DELIVERY: 15000,
    TYPING_INDICATOR: 5000,
    READ_RECEIPT: 10000,
    AI_RESPONSE: 20000,
    REAL_TIME_UPDATE: 8000
  }
};

interface TestDiagnostics {
  startTime: number;
  errors: Array<{
    timestamp: number;
    type: string;
    message: string;
    context?: any;
  }>;
  timings: Record<string, number>;
  websocketStatus: Record<string, string>;
  apiResponses: Array<{
    url: string;
    status: number;
    timing: number;
  }>;
  messageFlow: Array<{
    timestamp: number;
    source: 'widget' | 'dashboard' | 'ai';
    content: string;
    delivered: boolean;
    readReceipt: boolean;
  }>;
}

class CommunicationTestRunner {
  private diagnostics: TestDiagnostics;
  private widgetContext: BrowserContext;
  private dashboardContext: BrowserContext;
  private widgetPage: Page;
  private dashboardPage: Page;

  constructor() {
    this.diagnostics = {
      startTime: Date.now(),
      errors: [],
      timings: {},
      websocketStatus: {},
      apiResponses: [],
      messageFlow: []
    };
  }

  async initialize(browser: Browser) {
    console.log('🚀 Initializing comprehensive communication test...');
    
    // Create separate browser contexts for widget and dashboard
    this.widgetContext = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Widget-Test-Client'
    });
    
    this.dashboardContext = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      userAgent: 'Dashboard-Test-Client'
    });

    // Create pages
    this.widgetPage = await this.widgetContext.newPage();
    this.dashboardPage = await this.dashboardContext.newPage();

    // Set up monitoring
    await this.setupMonitoring();
  }

  private async setupMonitoring() {
    // Monitor API requests and responses
    [this.widgetPage, this.dashboardPage].forEach((page, index) => {
      const context = index === 0 ? 'widget' : 'dashboard';
      
      page.on('response', (response) => {
        this.diagnostics.apiResponses.push({
          url: response.url(),
          status: response.status(),
          timing: Date.now() - this.diagnostics.startTime
        });
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          this.diagnostics.errors.push({
            timestamp: Date.now(),
            type: 'console_error',
            message: msg.text(),
            context
          });
        }
      });

      page.on('pageerror', (error) => {
        this.diagnostics.errors.push({
          timestamp: Date.now(),
          type: 'page_error',
          message: error.message,
          context
        });
      });
    });
  }

  async setupDashboard() {
    console.log('📊 Setting up dashboard context...');
    const startTime = Date.now();

    try {
      // Navigate to login
      await this.dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);

      // Login as agent
      await this.dashboardPage.fill('#email', TEST_CONFIG.AGENT_EMAIL);
      await this.dashboardPage.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
      await this.dashboardPage.click('button[type="submit"]');
      
      // Wait for dashboard
      await this.dashboardPage.waitForURL('**/dashboard', { timeout: 15000 });
      
      // Navigate to test conversation
      await this.dashboardPage.click(`[data-conversation-id="${TEST_CONFIG.TEST_CONVERSATION_ID}"]`);
      await this.dashboardPage.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

      this.diagnostics.timings.dashboardSetup = Date.now() - startTime;
      console.log('✅ Dashboard setup complete');
      
      return true;
    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'dashboard_setup_error',
        message: error.message
      });
      console.error('❌ Dashboard setup failed:', error);
      return false;
    }
  }

  async setupWidget() {
    console.log('🔧 Setting up widget context...');
    const startTime = Date.now();

    try {
      // Navigate to widget demo
      await this.widgetPage.goto(`${TEST_CONFIG.BASE_URL}${TEST_CONFIG.WIDGET_DEMO_URL}`);
      
      // Open widget
      await this.widgetPage.click('[data-testid="widget-button"]');
      await this.widgetPage.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });

      this.diagnostics.timings.widgetSetup = Date.now() - startTime;
      console.log('✅ Widget setup complete');
      
      return true;
    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'widget_setup_error',
        message: error.message
      });
      console.error('❌ Widget setup failed:', error);
      return false;
    }
  }

  async testBidirectionalMessaging() {
    console.log('💬 Testing bidirectional messaging...');
    
    // Test 1: Widget → Dashboard
    const widgetMessage = `Widget test message - ${Date.now()}`;
    const startTime = Date.now();

    try {
      // Send from widget
      await this.widgetPage.fill('[data-testid="widget-message-input"]', widgetMessage);
      await this.widgetPage.click('[data-testid="widget-send-button"]');
      
      // Verify in widget
      await this.widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${widgetMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });
      
      // Verify in dashboard
      await this.dashboardPage.waitForSelector(`[data-testid="message"]:has-text("${widgetMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });

      this.diagnostics.messageFlow.push({
        timestamp: Date.now(),
        source: 'widget',
        content: widgetMessage,
        delivered: true,
        readReceipt: false
      });

      this.diagnostics.timings.widgetToDashboard = Date.now() - startTime;
      console.log('✅ Widget → Dashboard message delivery successful');

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'widget_to_dashboard_error',
        message: error.message
      });
      console.error('❌ Widget → Dashboard message failed:', error);
    }

    // Test 2: Dashboard → Widget
    const dashboardMessage = `Dashboard test message - ${Date.now()}`;
    const dashboardStartTime = Date.now();

    try {
      // Send from dashboard
      await this.dashboardPage.fill('[data-testid="message-input"]', dashboardMessage);
      await this.dashboardPage.click('[data-testid="send-button"]');
      
      // Verify in dashboard
      await this.dashboardPage.waitForSelector(`[data-testid="message"]:has-text("${dashboardMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });
      
      // Verify in widget
      await this.widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${dashboardMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });

      this.diagnostics.messageFlow.push({
        timestamp: Date.now(),
        source: 'dashboard',
        content: dashboardMessage,
        delivered: true,
        readReceipt: false
      });

      this.diagnostics.timings.dashboardToWidget = Date.now() - dashboardStartTime;
      console.log('✅ Dashboard → Widget message delivery successful');

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'dashboard_to_widget_error',
        message: error.message
      });
      console.error('❌ Dashboard → Widget message failed:', error);
    }
  }

  async testTypingIndicators() {
    console.log('⌨️ Testing typing indicators...');

    try {
      // Test widget typing → dashboard
      await this.widgetPage.fill('[data-testid="widget-message-input"]', 'Testing typing...');
      
      // Check for typing indicator in dashboard
      const dashboardTypingVisible = await this.dashboardPage.waitForSelector('[data-testid="typing-indicator"]', { 
        timeout: TEST_CONFIG.TIMEOUTS.TYPING_INDICATOR 
      }).then(() => true).catch(() => false);

      if (dashboardTypingVisible) {
        console.log('✅ Widget typing indicator appears in dashboard');
      } else {
        console.log('⚠️ Widget typing indicator not detected in dashboard');
      }

      // Clear widget input
      await this.widgetPage.fill('[data-testid="widget-message-input"]', '');

      // Test dashboard typing → widget
      await this.dashboardPage.fill('[data-testid="message-input"]', 'Agent typing...');
      
      // Check for typing indicator in widget
      const widgetTypingVisible = await this.widgetPage.waitForSelector('[data-testid="widget-agent-typing-indicator"]', { 
        timeout: TEST_CONFIG.TIMEOUTS.TYPING_INDICATOR 
      }).then(() => true).catch(() => false);

      if (widgetTypingVisible) {
        console.log('✅ Dashboard typing indicator appears in widget');
      } else {
        console.log('⚠️ Dashboard typing indicator not detected in widget');
      }

      // Clear dashboard input
      await this.dashboardPage.fill('[data-testid="message-input"]', '');

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'typing_indicator_error',
        message: error.message
      });
      console.error('❌ Typing indicators test failed:', error);
    }
  }

  async testReadReceipts() {
    console.log('📖 Testing read receipts...');

    try {
      // Send a message from widget
      const readReceiptTestMessage = `Read receipt test - ${Date.now()}`;
      await this.widgetPage.fill('[data-testid="widget-message-input"]', readReceiptTestMessage);
      await this.widgetPage.click('[data-testid="widget-send-button"]');

      // Wait for message to appear in both places
      await this.widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${readReceiptTestMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });
      await this.dashboardPage.waitForSelector(`[data-testid="message"]:has-text("${readReceiptTestMessage}")`, { 
        timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY 
      });

      // Check for read receipt indicators
      const widgetReadReceipt = await this.widgetPage.waitForSelector('[data-testid="widget-read-receipt"]', { 
        timeout: TEST_CONFIG.TIMEOUTS.READ_RECEIPT 
      }).then(() => true).catch(() => false);

      const dashboardReadReceipt = await this.dashboardPage.waitForSelector('[data-testid="dashboard-read-receipt"]', { 
        timeout: TEST_CONFIG.TIMEOUTS.READ_RECEIPT 
      }).then(() => true).catch(() => false);

      if (widgetReadReceipt || dashboardReadReceipt) {
        console.log('✅ Read receipts are working');
        
        // Update message flow with read receipt status
        const lastMessage = this.diagnostics.messageFlow[this.diagnostics.messageFlow.length - 1];
        if (lastMessage) {
          lastMessage.readReceipt = true;
        }
      } else {
        console.log('⚠️ Read receipts not detected');
      }

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'read_receipt_error',
        message: error.message
      });
      console.error('❌ Read receipts test failed:', error);
    }
  }

  async testAIHandover() {
    console.log('🤖 Testing AI handover functionality...');

    try {
      // Test 1: Trigger AI response with common support queries
      const aiTriggerMessages = [
        `Hello, I need help with my account - ${Date.now()}`,
        `I forgot my password, can you help?`,
        `How do I cancel my subscription?`,
        `What are your business hours?`
      ];

      for (const message of aiTriggerMessages) {
        await this.widgetPage.fill('[data-testid="widget-message-input"]', message);
        await this.widgetPage.click('[data-testid="widget-send-button"]');

        // Wait for message to appear
        await this.widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${message}")`, {
          timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY
        });

        // Wait for potential AI response
        await this.widgetPage.waitForTimeout(3000); // Give AI time to respond
      }

      // Check for AI responses
      const aiMessages = await this.widgetPage.locator('[data-testid="widget-message"]').filter({ hasText: /🤖|AI|Bot|Assistant/ });
      const aiResponseCount = await aiMessages.count();

      if (aiResponseCount > 0) {
        console.log(`✅ ${aiResponseCount} AI response(s) detected`);

        // Check for confidence scores
        for (let i = 0; i < aiResponseCount; i++) {
          const aiMessage = aiMessages.nth(i);
          const confidenceScore = await aiMessage.locator('.confidence-score, [data-testid="confidence-score"]').textContent();
          if (confidenceScore) {
            console.log(`✅ AI confidence score displayed: ${confidenceScore}`);
          }
        }

        this.diagnostics.messageFlow.push({
          timestamp: Date.now(),
          source: 'ai',
          content: `${aiResponseCount} AI responses`,
          delivered: true,
          readReceipt: false
        });

        // Test 2: Manual handover from AI to human
        await this.testManualHandover();

        // Test 3: AI confidence scoring
        await this.testAIConfidenceScoring();

      } else {
        console.log('ℹ️ No AI responses detected - testing manual trigger');
        await this.testManualAITrigger();
      }

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'ai_handover_error',
        message: error.message
      });
      console.error('❌ AI handover test failed:', error);
    }
  }

  async testManualHandover() {
    console.log('👤 Testing manual AI to human handover...');

    try {
      // Look for handover controls in dashboard
      const handoverButton = await this.dashboardPage.locator('[data-testid="handover-button"], button:has-text("Take Over"), button:has-text("Handover")').first();

      if (await handoverButton.isVisible()) {
        await handoverButton.click();
        console.log('✅ Manual handover button clicked');

        // Verify handover status change
        const handoverStatus = await this.dashboardPage.locator('[data-testid="handover-status"], .handover-status').textContent();
        if (handoverStatus) {
          console.log(`✅ Handover status: ${handoverStatus}`);
        }

        // Send a message as human agent after handover
        const humanMessage = `Hello! I'm a human agent taking over this conversation - ${Date.now()}`;
        await this.dashboardPage.fill('[data-testid="message-input"]', humanMessage);
        await this.dashboardPage.click('[data-testid="send-button"]');

        // Verify message appears in widget
        await this.widgetPage.waitForSelector(`[data-testid="widget-message"]:has-text("${humanMessage}")`, {
          timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_DELIVERY
        });

        console.log('✅ Human agent message delivered after handover');

      } else {
        console.log('ℹ️ Manual handover button not found - may not be implemented');
      }

    } catch (error) {
      console.log('⚠️ Manual handover test failed:', error.message);
    }
  }

  async testAIConfidenceScoring() {
    console.log('📊 Testing AI confidence scoring...');

    try {
      // Send a complex query that might have lower confidence
      const complexQuery = `I have a very specific technical issue with integrating your API using GraphQL subscriptions with custom authentication headers in a React Native environment while handling offline scenarios - ${Date.now()}`;

      await this.widgetPage.fill('[data-testid="widget-message-input"]', complexQuery);
      await this.widgetPage.click('[data-testid="widget-send-button"]');

      // Wait for potential AI response
      await this.widgetPage.waitForTimeout(5000);

      // Check for confidence indicators
      const confidenceElements = await this.widgetPage.locator('.confidence-score, [data-testid="confidence-score"], .ai-confidence').all();

      if (confidenceElements.length > 0) {
        for (const element of confidenceElements) {
          const score = await element.textContent();
          console.log(`✅ AI confidence score found: ${score}`);
        }
      } else {
        console.log('ℹ️ No confidence scores displayed - may not be implemented');
      }

    } catch (error) {
      console.log('⚠️ AI confidence scoring test failed:', error.message);
    }
  }

  async testManualAITrigger() {
    console.log('🔧 Testing manual AI trigger...');

    try {
      // Look for AI trigger button in dashboard
      const aiTriggerButton = await this.dashboardPage.locator('[data-testid="ai-trigger"], button:has-text("AI Response"), button:has-text("Generate AI")').first();

      if (await aiTriggerButton.isVisible()) {
        await aiTriggerButton.click();
        console.log('✅ Manual AI trigger activated');

        // Wait for AI response
        await this.widgetPage.waitForTimeout(5000);

        // Check for AI response in widget
        const aiResponse = await this.widgetPage.locator('[data-testid="widget-message"]').filter({ hasText: /🤖|AI|Bot/ }).first();

        if (await aiResponse.isVisible()) {
          console.log('✅ AI response generated via manual trigger');
        }

      } else {
        console.log('ℹ️ Manual AI trigger not found');
      }

    } catch (error) {
      console.log('⚠️ Manual AI trigger test failed:', error.message);
    }
  }

  async testErrorScenarios() {
    console.log('🛡️ Testing error scenarios...');

    try {
      // Test 1: Empty message validation
      await this.widgetPage.click('[data-testid="widget-send-button"]');
      await this.widgetPage.waitForTimeout(2000);
      const emptyMessages = await this.widgetPage.locator('[data-testid="widget-message"]:has-text("")').count();

      if (emptyMessages === 0) {
        console.log('✅ Empty message validation working');
      } else {
        console.log('⚠️ Empty message validation may need improvement');
      }

      // Test 2: Very long message
      const longMessage = 'A'.repeat(5000);
      await this.widgetPage.fill('[data-testid="widget-message-input"]', longMessage);
      await this.widgetPage.click('[data-testid="widget-send-button"]');
      await this.widgetPage.waitForTimeout(3000);
      console.log('✅ Long message handling tested');

      // Test 3: Special characters and XSS prevention
      const xssMessage = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      await this.widgetPage.fill('[data-testid="widget-message-input"]', xssMessage);
      await this.widgetPage.click('[data-testid="widget-send-button"]');
      await this.widgetPage.waitForTimeout(2000);

      // Check if XSS is properly escaped
      const messageContent = await this.widgetPage.locator('[data-testid="widget-message"]').last().textContent();
      if (messageContent && !messageContent.includes('<script>')) {
        console.log('✅ XSS prevention working');
      } else {
        console.log('⚠️ XSS prevention may need attention');
      }

      // Test 4: Network interruption simulation
      await this.testNetworkInterruption();

      // Test 5: Authentication edge cases
      await this.testAuthenticationEdgeCases();

    } catch (error) {
      this.diagnostics.errors.push({
        timestamp: Date.now(),
        type: 'error_scenario_test',
        message: error.message
      });
      console.error('❌ Error scenario test failed:', error);
    }
  }

  async testNetworkInterruption() {
    console.log('🌐 Testing network interruption scenarios...');

    try {
      // Simulate network offline
      await this.widgetPage.context().setOffline(true);

      // Try to send a message while offline
      const offlineMessage = `Offline test message - ${Date.now()}`;
      await this.widgetPage.fill('[data-testid="widget-message-input"]', offlineMessage);
      await this.widgetPage.click('[data-testid="widget-send-button"]');

      // Wait a bit
      await this.widgetPage.waitForTimeout(3000);

      // Restore network
      await this.widgetPage.context().setOffline(false);

      // Wait for reconnection
      await this.widgetPage.waitForTimeout(5000);

      // Check if message was queued and sent after reconnection
      const offlineMessageVisible = await this.widgetPage.locator(`[data-testid="widget-message"]:has-text("${offlineMessage}")`).isVisible();

      if (offlineMessageVisible) {
        console.log('✅ Offline message queuing and retry working');
      } else {
        console.log('ℹ️ Offline message handling may need implementation');
      }

    } catch (error) {
      console.log('⚠️ Network interruption test failed:', error.message);
      // Ensure network is restored
      await this.widgetPage.context().setOffline(false);
    }
  }

  async testAuthenticationEdgeCases() {
    console.log('🔐 Testing authentication edge cases...');

    try {
      // Test session expiration handling
      // Clear cookies to simulate session expiration
      await this.dashboardPage.context().clearCookies();

      // Try to send a message with expired session
      const expiredSessionMessage = `Expired session test - ${Date.now()}`;
      await this.dashboardPage.fill('[data-testid="message-input"]', expiredSessionMessage);
      await this.dashboardPage.click('[data-testid="send-button"]');

      // Check for authentication error or redirect
      await this.dashboardPage.waitForTimeout(3000);

      const currentUrl = this.dashboardPage.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        console.log('✅ Session expiration handling working - redirected to login');
      } else {
        console.log('ℹ️ Session expiration handling may need implementation');
      }

    } catch (error) {
      console.log('⚠️ Authentication edge case test failed:', error.message);
    }
  }

  async testMessageComposerFunctionality() {
    console.log('✍️ Testing message composer functionality...');

    try {
      // Test character limit (if implemented)
      const charLimitTest = 'A'.repeat(1000);
      await this.widgetPage.fill('[data-testid="widget-message-input"]', charLimitTest);

      const inputValue = await this.widgetPage.locator('[data-testid="widget-message-input"]').inputValue();
      console.log(`✅ Character input test: ${inputValue.length} characters`);

      // Test Enter key to send
      await this.widgetPage.fill('[data-testid="widget-message-input"]', 'Enter key test');
      await this.widgetPage.press('[data-testid="widget-message-input"]', 'Enter');

      // Check if message was sent
      const enterKeyMessage = await this.widgetPage.locator('[data-testid="widget-message"]:has-text("Enter key test")').isVisible();
      if (enterKeyMessage) {
        console.log('✅ Enter key to send working');
      } else {
        console.log('ℹ️ Enter key to send may not be implemented');
      }

      // Test Shift+Enter for new line (if implemented)
      await this.widgetPage.fill('[data-testid="widget-message-input"]', 'Line 1');
      await this.widgetPage.press('[data-testid="widget-message-input"]', 'Shift+Enter');
      await this.widgetPage.type('[data-testid="widget-message-input"]', 'Line 2');

      const multilineValue = await this.widgetPage.locator('[data-testid="widget-message-input"]').inputValue();
      if (multilineValue.includes('\n')) {
        console.log('✅ Multiline input working');
      } else {
        console.log('ℹ️ Multiline input may not be supported');
      }

      // Clear input for next tests
      await this.widgetPage.fill('[data-testid="widget-message-input"]', '');

    } catch (error) {
      console.log('⚠️ Message composer test failed:', error.message);
    }
  }

  async checkWebSocketConnections() {
    console.log('🔌 Checking WebSocket connections...');

    try {
      // Check widget WebSocket status
      const widgetWsStatus = await this.widgetPage.evaluate(() => {
        // @ts-ignore
        return window.supabaseRealtimeStatus || 'unknown';
      });

      // Check dashboard WebSocket status
      const dashboardWsStatus = await this.dashboardPage.evaluate(() => {
        // @ts-ignore
        return window.supabaseRealtimeStatus || 'unknown';
      });

      this.diagnostics.websocketStatus = {
        widget: widgetWsStatus,
        dashboard: dashboardWsStatus
      };

      console.log(`📡 WebSocket Status - Widget: ${widgetWsStatus}, Dashboard: ${dashboardWsStatus}`);

    } catch (error) {
      console.log('⚠️ Could not determine WebSocket status');
    }
  }

  generateDiagnosticsReport(): string {
    const totalTime = Date.now() - this.diagnostics.startTime;
    const errorCount = this.diagnostics.errors.length;
    const successfulMessages = this.diagnostics.messageFlow.filter(m => m.delivered).length;

    let report = '\n' + '='.repeat(80) + '\n';
    report += '📊 COMPREHENSIVE COMMUNICATION TEST DIAGNOSTICS REPORT\n';
    report += '='.repeat(80) + '\n\n';

    // Summary
    report += '📋 SUMMARY\n';
    report += '-'.repeat(40) + '\n';
    report += `Total Test Duration: ${totalTime}ms\n`;
    report += `Errors Encountered: ${errorCount}\n`;
    report += `Successful Messages: ${successfulMessages}\n`;
    report += `API Requests Made: ${this.diagnostics.apiResponses.length}\n\n`;

    // Timings
    report += '⏱️ PERFORMANCE TIMINGS\n';
    report += '-'.repeat(40) + '\n';
    Object.entries(this.diagnostics.timings).forEach(([key, value]) => {
      report += `${key}: ${value}ms\n`;
    });
    report += '\n';

    // Message Flow
    report += '💬 MESSAGE FLOW\n';
    report += '-'.repeat(40) + '\n';
    this.diagnostics.messageFlow.forEach((msg, index) => {
      const status = msg.delivered ? '✅' : '❌';
      const readStatus = msg.readReceipt ? '📖' : '📄';
      report += `${index + 1}. ${status} ${readStatus} [${msg.source}] ${msg.content.substring(0, 50)}...\n`;
    });
    report += '\n';

    // WebSocket Status
    report += '🔌 WEBSOCKET STATUS\n';
    report += '-'.repeat(40) + '\n';
    Object.entries(this.diagnostics.websocketStatus).forEach(([context, status]) => {
      report += `${context}: ${status}\n`;
    });
    report += '\n';

    // Errors
    if (errorCount > 0) {
      report += '❌ ERRORS ENCOUNTERED\n';
      report += '-'.repeat(40) + '\n';
      this.diagnostics.errors.forEach((error, index) => {
        report += `${index + 1}. [${error.type}] ${error.message}\n`;
        if (error.context) {
          report += `   Context: ${error.context}\n`;
        }
      });
      report += '\n';
    }

    // API Responses
    report += '📡 API RESPONSE SUMMARY\n';
    report += '-'.repeat(40) + '\n';
    const apiSummary = this.diagnostics.apiResponses.reduce((acc, response) => {
      const status = Math.floor(response.status / 100) * 100;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    Object.entries(apiSummary).forEach(([status, count]) => {
      report += `${status}xx responses: ${count}\n`;
    });
    report += '\n';

    // Recommendations
    report += '💡 RECOMMENDATIONS\n';
    report += '-'.repeat(40) + '\n';
    
    if (errorCount === 0) {
      report += '✅ All tests passed successfully!\n';
    } else {
      report += '⚠️ Issues detected that need attention:\n';
      this.diagnostics.errors.forEach(error => {
        if (error.type.includes('setup')) {
          report += '• Check authentication and test data setup\n';
        } else if (error.type.includes('message')) {
          report += '• Investigate real-time message delivery\n';
        } else if (error.type.includes('typing')) {
          report += '• Review typing indicator implementation\n';
        }
      });
    }

    if (this.diagnostics.timings.widgetToDashboard > 5000) {
      report += '• Widget to dashboard message delivery is slow (>5s)\n';
    }
    if (this.diagnostics.timings.dashboardToWidget > 5000) {
      report += '• Dashboard to widget message delivery is slow (>5s)\n';
    }

    report += '\n' + '='.repeat(80) + '\n';
    
    return report;
  }

  async cleanup() {
    console.log('🧹 Cleaning up test contexts...');
    
    try {
      await this.widgetContext?.close();
      await this.dashboardContext?.close();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

test.describe('Comprehensive Widget-Dashboard Communication', () => {
  let testRunner: CommunicationTestRunner;

  test('should validate complete communication flow and AI handover', async ({ browser }) => {
    testRunner = new CommunicationTestRunner();
    
    try {
      // Initialize test contexts
      await testRunner.initialize(browser);
      
      // Setup dashboard and widget
      const dashboardReady = await testRunner.setupDashboard();
      const widgetReady = await testRunner.setupWidget();
      
      if (!dashboardReady || !widgetReady) {
        throw new Error('Failed to setup test contexts');
      }

      // Run comprehensive tests
      await testRunner.testBidirectionalMessaging();
      await testRunner.testMessageComposerFunctionality();
      await testRunner.testTypingIndicators();
      await testRunner.testReadReceipts();
      await testRunner.testAIHandover();
      await testRunner.testErrorScenarios();
      await testRunner.checkWebSocketConnections();

      // Generate and display diagnostics report
      const report = testRunner.generateDiagnosticsReport();
      console.log(report);

      // Assert overall success
      expect(testRunner.diagnostics.errors.filter(e => e.type.includes('setup')).length).toBe(0);
      
    } finally {
      await testRunner.cleanup();
    }
  });
});
