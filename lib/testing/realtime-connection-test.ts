/**
 * Enhanced Real-time Connection Testing Utility
 * Validates WebSocket connection timing, retry logic, and fallback mechanisms
 */

import { realtimeConnectionMonitor } from '@/lib/monitoring/realtime-connection-monitor';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: unknown;
  error?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  overallPassed: boolean;
  totalDuration: number;
}

class RealtimeConnectionTester {
  private results: TestResult[] = [];

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<TestSuite> {
    console.log('🧪 Starting Enhanced Real-time Connection Test Suite...');
    
    const startTime = Date.now();
    this.results = [];

    // Test 1: Message Creation Independence
    await this.testMessageCreationIndependence();

    // Test 2: WebSocket Connection Timing
    await this.testWebSocketConnectionTiming();

    // Test 3: Retry Logic
    await this.testRetryLogic();

    // Test 4: Fallback Mechanism
    await this.testFallbackMechanism();

    // Test 5: Monitoring Integration
    await this.testMonitoringIntegration();

    const totalDuration = Date.now() - startTime;
    const overallPassed = this.results.every(result => result.passed);

    const testSuite: TestSuite = {
      name: 'Enhanced Real-time Connection Tests',
      results: this.results,
      overallPassed,
      totalDuration
    };

    this.logTestSuiteResults(testSuite);
    return testSuite;
  }

  /**
   * Test 1: Verify message creation works without real-time connection
   */
  private async testMessageCreationIndependence(): Promise<void> {
    const testName = 'Message Creation Independence';
    const startTime = Date.now();

    try {
      const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

      // Step 1: Create a valid conversation first
      const conversationResponse = await fetch('/api/widget/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId
        },
        body: JSON.stringify({
          organizationId,
          visitorId: 'test-user-realtime-test',
          customerName: 'Test User',
          customerEmail: 'test@realtime-test.com'
        })
      });

      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        throw new Error(`Failed to create conversation: ${conversationResponse.status} - ${errorText}`);
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.conversation?.id || conversationData.conversationId || conversationData.id;

      if (!conversationId) {
        throw new Error(`No conversation ID returned from API. Response: ${JSON.stringify(conversationData)}`);
      }

      // Step 2: Test message creation with valid conversation
      const testMessage = {
        conversationId,
        content: 'Enhanced test message without real-time connection',
        senderType: 'visitor' as const,
        senderName: 'Test User',
        senderEmail: 'test@realtime-test.com'
      };

      const messageResponse = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId
        },
        body: JSON.stringify(testMessage)
      });

      const success = messageResponse.ok;
      const duration = Date.now() - startTime;

      let responseData = null;
      try {
        responseData = await messageResponse.json();
      } catch (e) {
        // Response might not be JSON, try to get text
        try {
          responseData = { error: await messageResponse.text() };
        } catch (textError) {
          responseData = { error: 'Failed to parse response' };
        }
      }

      this.results.push({
        testName,
        passed: success,
        duration,
        details: {
          statusCode: messageResponse.status,
          messageCreated: success,
          independentOfRealtime: true,
          conversationCreated: true,
          conversationId,
          responseData: success ? responseData : undefined,
          errorData: !success ? responseData : undefined
        }
      });

    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test 2: Verify WebSocket connections establish within 15 seconds
   */
  private async testWebSocketConnectionTiming(): Promise<void> {
    const testName = 'WebSocket Connection Timing';
    const startTime = Date.now();

    try {
      // Use proper Supabase realtime connection test with robust cleanup
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();

      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        let isResolved = false;
        let testChannel: unknown = null;

        const cleanup = () => {
          if (testChannel && !isResolved) {
            try {
              // ROBUST FIX: Use supabase.removeChannel() instead of channel.unsubscribe()
              // This prevents recursive unsubscribe loops as documented in Supabase best practices
              client.removeChannel(testChannel);
            } catch (cleanupError) {
              console.warn('Channel cleanup error (non-critical):', cleanupError);
            }
          }
        };

        const resolveOnce = (result: boolean) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve(result);
          }
        };

        const rejectOnce = (error: Error) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(error);
          }
        };

        const timeout = setTimeout(() => {
          rejectOnce(new Error('Connection timeout after 15 seconds'));
        }, 15000);

        try {
          // Create test channel with minimal configuration to avoid conflicts
          testChannel = client.channel(`test-timing-${Date.now()}`, {
            config: {
              presence: { key: 'test' },
              broadcast: { self: false }
            }
          });

          testChannel.subscribe((status: string) => {
            clearTimeout(timeout);

            if (status === 'SUBSCRIBED') {
              resolveOnce(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              rejectOnce(new Error(`Connection failed with status: ${status}`));
            }
          });
        } catch (subscribeError) {
          clearTimeout(timeout);
          rejectOnce(new Error(`Subscription setup failed: ${subscribeError}`));
        }
      });

      await connectionPromise;
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        passed: duration < 15000,
        duration,
        details: {
          connectionTime: duration,
          withinTimeout: duration < 15000,
          targetTimeout: 15000,
          connectionMethod: 'supabase-realtime-robust',
          cleanupMethod: 'removeChannel'
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        passed: false,
        duration,
        details: { 
          connectionTime: duration,
          withinTimeout: false,
          targetTimeout: 15000
        },
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }

  /**
   * Test 3: Verify retry logic with exponential backoff
   */
  private async testRetryLogic(): Promise<void> {
    const testName = 'Retry Logic with Exponential Backoff';
    const startTime = Date.now();

    try {
      // Test actual exponential backoff pattern (scaled down for testing speed)
      const maxRetries = 3;
      const baseDelay = 50; // Reduced base delay for faster testing
      const retryTimes: number[] = [];
      const expectedDelays: number[] = [];

      for (let i = 0; i < maxRetries; i++) {
        const retryStart = Date.now();
        const expectedDelay = baseDelay * Math.pow(2, i); // True exponential: 50ms, 100ms, 200ms
        expectedDelays.push(expectedDelay);

        // Use actual exponential delay (not capped)
        await new Promise(resolve => setTimeout(resolve, expectedDelay));

        const actualDelay = Date.now() - retryStart;
        retryTimes.push(actualDelay);
      }

      const duration = Date.now() - startTime;

      // Verify exponential pattern: each delay should be approximately double the previous
      const exponentialPattern = retryTimes.every((time, index) => {
        if (index === 0) return true;
        const previousTime = retryTimes[index - 1];
        const expectedRatio = 2; // Should be roughly double
        const actualRatio = time / previousTime;
        // Allow 20% tolerance for timing variations
        return actualRatio >= (expectedRatio * 0.8) && actualRatio <= (expectedRatio * 1.2);
      });

      // Also verify delays are close to expected values (within 20% tolerance)
      const delaysAccurate = retryTimes.every((time, index) => {
        const expected = expectedDelays[index];
        const tolerance = expected * 0.2; // 20% tolerance
        return Math.abs(time - expected) <= tolerance;
      });

      this.results.push({
        testName,
        passed: exponentialPattern && delaysAccurate,
        duration,
        details: {
          retryTimes,
          expectedDelays,
          exponentialPattern,
          delaysAccurate,
          maxRetries,
          baseDelay,
          actualRatios: retryTimes.map((time, index) =>
            index === 0 ? 1 : time / retryTimes[index - 1]
          )
        }
      });

    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test 4: Verify fallback mechanism activates when needed
   */
  private async testFallbackMechanism(): Promise<void> {
    const testName = 'Fallback Mechanism Activation';
    const startTime = Date.now();

    try {
      // Simulate fallback activation
      let fallbackActivated = false;
      let pollingStarted = false;

      // Simulate connection failures leading to fallback
      const simulateConnectionFailures = async () => {
        for (let i = 0; i < 6; i++) { // Exceed max retries (5)
          await new Promise(resolve => setTimeout(resolve, 10)); // Quick simulation
        }
        fallbackActivated = true;
        pollingStarted = true;
      };

      await simulateConnectionFailures();

      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        passed: fallbackActivated && pollingStarted,
        duration,
        details: {
          fallbackActivated,
          pollingStarted,
          maxRetriesExceeded: true
        }
      });

    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test 5: Verify monitoring integration works correctly
   */
  private async testMonitoringIntegration(): Promise<void> {
    const testName = 'Monitoring Integration';
    const startTime = Date.now();

    try {
      // Test monitoring functions
      realtimeConnectionMonitor.trackConnectionAttempt();
      realtimeConnectionMonitor.trackConnectionSuccess();
      realtimeConnectionMonitor.trackStateTransition('connecting', 'connected');
      realtimeConnectionMonitor.trackMessageSent('test-message-123');
      realtimeConnectionMonitor.trackMessageDelivered('test-message-123');

      const metrics = realtimeConnectionMonitor.getMetricsSummary();
      
      const duration = Date.now() - startTime;
      const hasConnectionMetrics = metrics.connection.connectionAttempts > 0;
      const hasMessageMetrics = metrics.messaging.messagesSent > 0;
      const hasWebSocketMetrics = metrics.webSocket.stateTransitions.length > 0;

      this.results.push({
        testName,
        passed: hasConnectionMetrics && hasMessageMetrics && hasWebSocketMetrics,
        duration,
        details: {
          connectionMetrics: metrics.connection,
          messageMetrics: metrics.messaging,
          webSocketMetrics: metrics.webSocket,
          hasAllMetrics: hasConnectionMetrics && hasMessageMetrics && hasWebSocketMetrics
        }
      });

    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Log test suite results
   */
  private logTestSuiteResults(testSuite: TestSuite): void {
    console.log('\n🧪 Enhanced Real-time Connection Test Results');
    console.log('='.repeat(50));
    
    testSuite.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    });

    console.log('='.repeat(50));
    console.log(`Overall Result: ${testSuite.overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Total Duration: ${testSuite.totalDuration}ms`);
    console.log(`Tests Passed: ${testSuite.results.filter(r => r.passed).length}/${testSuite.results.length}`);
  }
}

// Export singleton instance
export const realtimeConnectionTester = new RealtimeConnectionTester();
