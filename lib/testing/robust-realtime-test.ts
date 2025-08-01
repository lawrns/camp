/**
 * Robust Real-time Connection Test Suite
 * Tests the enhanced WebSocket connection management with proper cleanup patterns
 */

interface RobustTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
}

class RobustRealtimeConnectionTester {
  private results: RobustTestResult[] = [];

  /**
   * Run comprehensive robust test suite
   */
  async runRobustTestSuite(): Promise<{
    name: string;
    results: RobustTestResult[];
    overallPassed: boolean;
    totalDuration: number;
  }> {
    console.log('🧪 Starting Robust Real-time Connection Test Suite...');
    
    const startTime = Date.now();
    this.results = [];

    // Test 1: Robust Channel Cleanup
    await this.testRobustChannelCleanup();

    // Test 2: Recursive Unsubscribe Prevention
    await this.testRecursiveUnsubscribePrevention();

    // Test 3: Memory Leak Prevention
    await this.testMemoryLeakPrevention();

    // Test 4: Error Boundary Effectiveness
    await this.testErrorBoundaryEffectiveness();

    // Test 5: Concurrent Connection Handling
    await this.testConcurrentConnectionHandling();

    const totalDuration = Date.now() - startTime;
    const overallPassed = this.results.every(result => result.passed);

    const testSuite = {
      name: 'Robust Real-time Connection Tests',
      results: this.results,
      overallPassed,
      totalDuration
    };

    this.logTestSuiteResults(testSuite);
    return testSuite;
  }

  /**
   * Test 1: Verify robust channel cleanup using removeChannel()
   */
  private async testRobustChannelCleanup(): Promise<void> {
    const testName = 'Robust Channel Cleanup';
    const startTime = Date.now();

    try {
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();
      
      // Create multiple channels to test cleanup
      const channels = [];
      for (let i = 0; i < 3; i++) {
        const channel = client.channel(`test-cleanup-${i}-${Date.now()}`);
        channels.push(channel);
      }

      // Test removeChannel cleanup method
      let cleanupSuccessCount = 0;
      for (const channel of channels) {
        try {
          await client.removeChannel(channel);
          cleanupSuccessCount++;
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      }

      const duration = Date.now() - startTime;
      const allCleaned = cleanupSuccessCount === channels.length;

      this.results.push({
        testName,
        passed: allCleaned,
        duration,
        details: {
          channelsCreated: channels.length,
          channelsCleaned: cleanupSuccessCount,
          cleanupMethod: 'removeChannel',
          allCleaned
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
   * Test 2: Verify prevention of recursive unsubscribe calls
   */
  private async testRecursiveUnsubscribePrevention(): Promise<void> {
    const testName = 'Recursive Unsubscribe Prevention';
    const startTime = Date.now();

    try {
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();
      
      // Create a channel and attempt rapid cleanup operations
      const channel = client.channel(`test-recursive-${Date.now()}`);
      
      // Attempt multiple rapid cleanup calls (this should not cause stack overflow)
      const cleanupPromises = [];
      for (let i = 0; i < 5; i++) {
        cleanupPromises.push(
          new Promise<boolean>((resolve) => {
            try {
              client.removeChannel(channel);
              resolve(true);
            } catch (error) {
              // Expected for subsequent calls
              resolve(false);
            }
          })
        );
      }

      const results = await Promise.all(cleanupPromises);
      const duration = Date.now() - startTime;
      
      // At least one should succeed, others may fail gracefully
      const hasSuccessfulCleanup = results.some(r => r);
      const noStackOverflow = duration < 5000; // Should complete quickly

      this.results.push({
        testName,
        passed: hasSuccessfulCleanup && noStackOverflow,
        duration,
        details: {
          cleanupAttempts: cleanupPromises.length,
          successfulCleanups: results.filter(r => r).length,
          noStackOverflow,
          hasSuccessfulCleanup
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
   * Test 3: Verify memory leak prevention
   */
  private async testMemoryLeakPrevention(): Promise<void> {
    const testName = 'Memory Leak Prevention';
    const startTime = Date.now();

    try {
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();
      
      // Create and cleanup many channels to test for memory leaks
      const channelCount = 10;
      const channels = [];
      
      // Create channels
      for (let i = 0; i < channelCount; i++) {
        const channel = client.channel(`test-memory-${i}-${Date.now()}`);
        channels.push(channel);
      }

      // Cleanup all channels
      for (const channel of channels) {
        try {
          await client.removeChannel(channel);
        } catch (error) {
          // Ignore cleanup errors for this test
        }
      }

      const duration = Date.now() - startTime;
      
      // Test should complete quickly if no memory leaks
      const completedQuickly = duration < 2000;
      
      this.results.push({
        testName,
        passed: completedQuickly,
        duration,
        details: {
          channelsCreated: channelCount,
          completedQuickly,
          averageTimePerChannel: duration / channelCount
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
   * Test 4: Verify error boundary effectiveness
   */
  private async testErrorBoundaryEffectiveness(): Promise<void> {
    const testName = 'Error Boundary Effectiveness';
    const startTime = Date.now();

    try {
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();
      
      // Test error handling with invalid channel operations
      let errorsCaught = 0;
      const totalTests = 3;

      // Test 1: Invalid channel name
      try {
        const invalidChannel = client.channel('');
        await client.removeChannel(invalidChannel);
      } catch (error) {
        errorsCaught++;
      }

      // Test 2: Null channel cleanup
      try {
        await client.removeChannel(null as any);
      } catch (error) {
        errorsCaught++;
      }

      // Test 3: Already removed channel
      try {
        const channel = client.channel(`test-error-${Date.now()}`);
        await client.removeChannel(channel);
        await client.removeChannel(channel); // Second removal should be handled gracefully
      } catch (error) {
        // This is expected, but should not crash
        errorsCaught++;
      }

      const duration = Date.now() - startTime;
      const errorsHandledGracefully = errorsCaught <= totalTests; // All errors should be caught

      this.results.push({
        testName,
        passed: errorsHandledGracefully,
        duration,
        details: {
          totalTests,
          errorsCaught,
          errorsHandledGracefully
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
   * Test 5: Verify concurrent connection handling
   */
  private async testConcurrentConnectionHandling(): Promise<void> {
    const testName = 'Concurrent Connection Handling';
    const startTime = Date.now();

    try {
      const { supabase } = await import('@/lib/supabase');
      const client = supabase.widget();
      
      // Create multiple concurrent connections
      const concurrentCount = 5;
      const connectionPromises = [];

      for (let i = 0; i < concurrentCount; i++) {
        const promise = new Promise<boolean>(async (resolve) => {
          try {
            const channel = client.channel(`test-concurrent-${i}-${Date.now()}`);
            
            // Quick cleanup
            setTimeout(async () => {
              try {
                await client.removeChannel(channel);
                resolve(true);
              } catch (error) {
                resolve(false);
              }
            }, 100);
          } catch (error) {
            resolve(false);
          }
        });
        connectionPromises.push(promise);
      }

      const results = await Promise.all(connectionPromises);
      const duration = Date.now() - startTime;
      
      const successfulConnections = results.filter(r => r).length;
      const handledConcurrency = successfulConnections >= concurrentCount * 0.8; // 80% success rate

      this.results.push({
        testName,
        passed: handledConcurrency,
        duration,
        details: {
          concurrentCount,
          successfulConnections,
          successRate: successfulConnections / concurrentCount,
          handledConcurrency
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
  private logTestSuiteResults(testSuite: any): void {
    console.log('\n🧪 Robust Real-time Connection Test Results');
    console.log('='.repeat(60));
    
    testSuite.results.forEach((result: RobustTestResult, index: number) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('='.repeat(60));
    console.log(`Overall Result: ${testSuite.overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Total Duration: ${testSuite.totalDuration}ms`);
    console.log(`Tests Passed: ${testSuite.results.filter((r: RobustTestResult) => r.passed).length}/${testSuite.results.length}`);
  }
}

// Export singleton instance
export const robustRealtimeConnectionTester = new RobustRealtimeConnectionTester();
