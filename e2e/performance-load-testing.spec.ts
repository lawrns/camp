/**
 * PERFORMANCE & LOAD TESTING E2E
 * 
 * High-load scenarios and performance testing:
 * - Message throughput testing
 * - Connection stability under load
 * - Memory usage monitoring
 * - Latency measurements
 * - Concurrent user limits
 * - Real-time performance metrics
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const LOAD_TEST_TIMEOUT = 120000; // 2 minutes
const PERFORMANCE_TIMEOUT = 60000; // 1 minute
const HIGH_LOAD_USERS = 10;
const MESSAGE_BURST_COUNT = 50;

interface PerformanceMetrics {
  messageLatency: number[];
  connectionTime: number[];
  memoryUsage: number[];
  cpuUsage: number[];
  networkRequests: number;
  errors: string[];
  timestamp: number;
}

interface LoadTestContext {
  browsers: Browser[];
  contexts: BrowserContext[];
  pages: Page[];
  metrics: PerformanceMetrics;
  organizationId: string;
}

test.describe('Performance & Load Testing E2E', () => {
  let testContext: LoadTestContext;

  test.beforeAll(async ({ browser }) => {
    const testMetadata = JSON.parse(
      require('fs').readFileSync('e2e/test-metadata.json', 'utf-8')
    );

    testContext = {
      browsers: [browser],
      contexts: [],
      pages: [],
      metrics: {
        messageLatency: [],
        connectionTime: [],
        memoryUsage: [],
        cpuUsage: [],
        networkRequests: 0,
        errors: [],
        timestamp: Date.now(),
      },
      organizationId: testMetadata.testOrgId,
    };

    // Create multiple browsers for load testing
    for (let i = 0; i < HIGH_LOAD_USERS; i++) {
      const newBrowser = await browser.browserType().launch({
        headless: true, // Force headless for performance
      });
      testContext.browsers.push(newBrowser);
    }
  });

  test.afterAll(async () => {
    // Generate performance report
    const report = {
      ...testContext.metrics,
      summary: {
        avgMessageLatency: testContext.metrics.messageLatency.reduce((a, b) => a + b, 0) / testContext.metrics.messageLatency.length || 0,
        avgConnectionTime: testContext.metrics.connectionTime.reduce((a, b) => a + b, 0) / testContext.metrics.connectionTime.length || 0,
        maxMemoryUsage: Math.max(...testContext.metrics.memoryUsage),
        totalErrors: testContext.metrics.errors.length,
        testDuration: Date.now() - testContext.metrics.timestamp,
      },
    };

    require('fs').writeFileSync(
      'test-results/performance-report.json',
      JSON.stringify(report, null, 2)
    );

    // Close all browsers except the first one
    for (let i = 1; i < testContext.browsers.length; i++) {
      await testContext.browsers[i].close();
    }

    // Close all contexts
    for (const context of testContext.contexts) {
      await context.close();
    }

    console.log('📊 Performance Report Generated:');
    console.log(`   Average Message Latency: ${report.summary.avgMessageLatency.toFixed(2)}ms`);
    console.log(`   Average Connection Time: ${report.summary.avgConnectionTime.toFixed(2)}ms`);
    console.log(`   Max Memory Usage: ${report.summary.maxMemoryUsage.toFixed(2)}MB`);
    console.log(`   Total Errors: ${report.summary.totalErrors}`);
    console.log(`   Test Duration: ${(report.summary.testDuration / 1000).toFixed(2)}s`);
  });

  test('should handle high-volume message throughput', async () => {
    test.setTimeout(LOAD_TEST_TIMEOUT);

    // ========================================
    // 1. SETUP MULTIPLE WIDGET INSTANCES
    // ========================================

    const widgetPages: Page[] = [];
    
    for (let i = 0; i < HIGH_LOAD_USERS; i++) {
      const browser = testContext.browsers[i];
      const context = await browser.newContext();
      const page = await context.newPage();
      
      testContext.contexts.push(context);
      testContext.pages.push(page);
      widgetPages.push(page);

      // Monitor performance
      await page.addInitScript(() => {
        (window as unknown).performanceMetrics = {
          messagesSent: 0,
          messagesReceived: 0,
          errors: [],
        };
      });

      // Navigate to widget
      const startTime = Date.now();
      await page.goto(`/widget?org=${testContext.organizationId}&user=${i}`);
      await page.waitForLoadState('networkidle');
      
      const connectionTime = Date.now() - startTime;
      testContext.metrics.connectionTime.push(connectionTime);
    }

    console.log(`✅ ${HIGH_LOAD_USERS} widget instances loaded`);

    // ========================================
    // 2. BURST MESSAGE SENDING
    // ========================================

    const messagePromises: Promise<void>[] = [];
    const startTime = Date.now();

    for (let userIndex = 0; userIndex < widgetPages.length; userIndex++) {
      const page = widgetPages[userIndex];
      
      for (let msgIndex = 0; msgIndex < MESSAGE_BURST_COUNT; msgIndex++) {
        const promise = (async () => {
          try {
            const messageStartTime = Date.now();
            const message = `LOAD_TEST: User ${userIndex} Message ${msgIndex} at ${messageStartTime}`;
            
            await page.fill('[data-testid="widget-message-input"]', message);
            await page.click('[data-testid="widget-send-button"]');
            
            // Wait for message to appear (measure latency)
            await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, {
              timeout: 10000,
            });
            
            const messageLatency = Date.now() - messageStartTime;
            testContext.metrics.messageLatency.push(messageLatency);
            
          } catch (error) {
            testContext.metrics.errors.push(`User ${userIndex} Message ${msgIndex}: ${error}`);
          }
        })();
        
        messagePromises.push(promise);
        
        // Stagger messages slightly to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Wait for all messages to complete
    await Promise.allSettled(messagePromises);
    
    const totalTime = Date.now() - startTime;
    const totalMessages = HIGH_LOAD_USERS * MESSAGE_BURST_COUNT;
    const throughput = totalMessages / (totalTime / 1000); // messages per second

    console.log(`✅ Load test completed:`);
    console.log(`   Total Messages: ${totalMessages}`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Throughput: ${throughput.toFixed(2)} messages/second`);
    console.log(`   Errors: ${testContext.metrics.errors.length}`);

    // Verify reasonable performance
    expect(throughput).toBeGreaterThan(1); // At least 1 message per second
    expect(testContext.metrics.errors.length).toBeLessThan(totalMessages * 0.1); // Less than 10% error rate
  });

  test('should maintain connection stability under load', async () => {
    test.setTimeout(PERFORMANCE_TIMEOUT);

    // ========================================
    // 1. SETUP AGENT DASHBOARD
    // ========================================

    const agentBrowser = testContext.browsers[0];
    const agentContext = await agentBrowser.newContext({
      storageState: 'e2e/auth-state.json',
    });
    const agentPage = await agentContext.newPage();

    await agentPage.goto('/dashboard/conversations');
    await agentPage.waitForLoadState('networkidle');

    // ========================================
    // 2. MONITOR CONNECTION STABILITY
    // ========================================

    const connectionChecks: boolean[] = [];
    const checkInterval = 2000; // Check every 2 seconds
    const totalChecks = 15; // 30 seconds of monitoring

    for (let i = 0; i < totalChecks; i++) {
      try {
        // Check if real-time connection is active
        const connectionStatus = await agentPage.evaluate(() => {
          // Check for WebSocket connection or Supabase realtime status
          return document.querySelector('[data-testid="connection-status-online"]') !== null;
        });

        connectionChecks.push(connectionStatus);

        // Send a test message to verify bidirectional communication
        if (i % 3 === 0) { // Every 6 seconds
          const testMessage = `CONNECTION_TEST: ${Date.now()}`;
          
          // Use first widget page to send message
          const widgetPage = testContext.pages[0];
          if (widgetPage) {
            await widgetPage.fill('[data-testid="widget-message-input"]', testMessage);
            await widgetPage.click('[data-testid="widget-send-button"]');
            
            // Verify agent receives it
            await expect(
              agentPage.locator(`[data-testid="message"]:has-text("${testMessage}")`)
            ).toBeVisible({ timeout: 5000 });
          }
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      } catch (error) {
        connectionChecks.push(false);
        testContext.metrics.errors.push(`Connection check ${i}: ${error}`);
      }
    }

    // ========================================
    // 3. ANALYZE CONNECTION STABILITY
    // ========================================

    const stableConnections = connectionChecks.filter(Boolean).length;
    const stabilityPercentage = (stableConnections / totalChecks) * 100;

    console.log(`✅ Connection stability test completed:`);
    console.log(`   Stable Connections: ${stableConnections}/${totalChecks}`);
    console.log(`   Stability Percentage: ${stabilityPercentage.toFixed(2)}%`);

    // Verify high stability
    expect(stabilityPercentage).toBeGreaterThan(90); // 90% stability required

    await agentContext.close();
  });

  test('should monitor memory usage during extended operation', async () => {
    test.setTimeout(PERFORMANCE_TIMEOUT);

    // ========================================
    // 1. SETUP MEMORY MONITORING
    // ========================================

    const monitoringPage = testContext.pages[0];
    
    // Enable memory monitoring
    await monitoringPage.addInitScript(() => {
      (window as unknown).memoryMonitor = {
        measurements: [],
        startMonitoring() {
          setInterval(() => {
            if ((performance as unknown).memory) {
              this.measurements.push({
                used: (performance as unknown).memory.usedJSHeapSize / 1024 / 1024, // MB
                total: (performance as unknown).memory.totalJSHeapSize / 1024 / 1024, // MB
                timestamp: Date.now(),
              });
            }
          }, 1000);
        },
      };
      (window as unknown).memoryMonitor.startMonitoring();
    });

    // ========================================
    // 2. SIMULATE EXTENDED USAGE
    // ========================================

    const operationDuration = 30000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < operationDuration) {
      // Send periodic messages
      const message = `MEMORY_TEST: ${Date.now()}`;
      await monitoringPage.fill('[data-testid="widget-message-input"]', message);
      await monitoringPage.click('[data-testid="widget-send-button"]');
      
      // Wait for message to appear
      await monitoringPage.waitForSelector(`[data-testid="message"]:has-text("${message}")`, {
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // ========================================
    // 3. COLLECT MEMORY MEASUREMENTS
    // ========================================

    const memoryData = await monitoringPage.evaluate(() => {
      return (window as unknown).memoryMonitor?.measurements || [];
    });

    if (memoryData.length > 0) {
      const memoryUsages = memoryData.map((m: unknown) => m.used);
      testContext.metrics.memoryUsage.push(...memoryUsages);

      const maxMemory = Math.max(...memoryUsages);
      const avgMemory = memoryUsages.reduce((a: number, b: number) => a + b, 0) / memoryUsages.length;

      console.log(`✅ Memory usage monitoring completed:`);
      console.log(`   Max Memory Usage: ${maxMemory.toFixed(2)}MB`);
      console.log(`   Average Memory Usage: ${avgMemory.toFixed(2)}MB`);
      console.log(`   Memory Measurements: ${memoryData.length}`);

      // Verify reasonable memory usage (adjust threshold as needed)
      expect(maxMemory).toBeLessThan(100); // Less than 100MB
    } else {
      console.log('⚠️  Memory monitoring not available in this browser');
    }
  });

  test('should handle concurrent typing indicators', async () => {
    test.setTimeout(PERFORMANCE_TIMEOUT);

    // ========================================
    // 1. SETUP MULTIPLE TYPING SESSIONS
    // ========================================

    const typingPages = testContext.pages.slice(0, 5); // Use 5 pages for typing test
    const agentBrowser = testContext.browsers[0];
    const agentContext = await agentBrowser.newContext({
      storageState: 'e2e/auth-state.json',
    });
    const agentPage = await agentContext.newPage();

    await agentPage.goto('/dashboard/conversations');
    await agentPage.waitForLoadState('networkidle');

    // ========================================
    // 2. CONCURRENT TYPING SIMULATION
    // ========================================

    const typingPromises = typingPages.map(async (page, index) => {
      try {
        // Start typing
        await page.focus('[data-testid="widget-message-input"]');
        
        // Type slowly to trigger typing indicators
        const typingText = `User ${index} is typing a long message...`;
        for (const char of typingText) {
          await page.type('[data-testid="widget-message-input"]', char);
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between characters
        }
        
        // Clear input (stop typing)
        await page.fill('[data-testid="widget-message-input"]', '');
        
        return true;
      } catch (error) {
        testContext.metrics.errors.push(`Typing test user ${index}: ${error}`);
        return false;
      }
    });

    // ========================================
    // 3. MONITOR TYPING INDICATORS
    // ========================================

    // Agent should see typing indicators
    const typingIndicatorChecks: boolean[] = [];
    
    const monitoringPromise = (async () => {
      for (let i = 0; i < 20; i++) { // Monitor for 10 seconds
        try {
          const hasTypingIndicator = await agentPage.locator('[data-testid="typing-indicator"]').count() > 0;
          typingIndicatorChecks.push(hasTypingIndicator);
        } catch {
          typingIndicatorChecks.push(false);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    })();

    // Wait for both typing and monitoring to complete
    const [typingResults] = await Promise.all([
      Promise.allSettled(typingPromises),
      monitoringPromise,
    ]);

    // ========================================
    // 4. ANALYZE RESULTS
    // ========================================

    const successfulTyping = typingResults.filter(result => result.status === 'fulfilled').length;
    const typingIndicatorDetected = typingIndicatorChecks.some(Boolean);

    console.log(`✅ Concurrent typing test completed:`);
    console.log(`   Successful Typing Sessions: ${successfulTyping}/${typingPages.length}`);
    console.log(`   Typing Indicators Detected: ${typingIndicatorDetected}`);

    // Verify typing functionality works under load
    expect(successfulTyping).toBeGreaterThan(typingPages.length * 0.8); // 80% success rate
    expect(typingIndicatorDetected).toBe(true);

    await agentContext.close();
  });
});
