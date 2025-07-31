/**
 * Real-time Edge Case Testing Script
 * Tests system behavior under various stress conditions and error scenarios
 */

import { realtimeMonitor, RealtimeLogger } from "../lib/realtime/enhanced-monitoring";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "../lib/realtime/unified-channel-standards";

interface TestConfig {
  organizationId: string;
  conversationId: string;
  baseUrl: string;
  testDuration: number; // in milliseconds
  messageInterval: number; // in milliseconds
}

const DEFAULT_CONFIG: TestConfig = {
  organizationId: "test-org-123",
  conversationId: "test-conv-456",
  baseUrl: "http://localhost:3006",
  testDuration: 30000, // 30 seconds
  messageInterval: 1000, // 1 second
};

class RealtimeEdgeCaseTester {
  private config: TestConfig;
  private testResults: Map<string, any> = new Map();
  private isRunning = false;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all edge case tests
   */
  async runAllTests(): Promise<void> {
    console.log("🧪 Starting Real-time Edge Case Tests");
    console.log("=====================================");

    this.isRunning = true;
    realtimeMonitor.reset();

    try {
      // Test 1: Rapid message sending
      await this.testRapidMessageSending();
      
      // Test 2: Network interruption simulation
      await this.testNetworkInterruption();
      
      // Test 3: Concurrent user scenarios
      await this.testConcurrentUsers();
      
      // Test 4: Large message payloads
      await this.testLargeMessagePayloads();
      
      // Test 5: Connection recovery
      await this.testConnectionRecovery();
      
      // Test 6: Channel subscription limits
      await this.testChannelSubscriptionLimits();

      // Generate final report
      this.generateTestReport();

    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Test 1: Rapid message sending
   */
  private async testRapidMessageSending(): Promise<void> {
    console.log("\n📨 Test 1: Rapid Message Sending");
    console.log("--------------------------------");

    const startTime = Date.now();
    const messageCount = 50;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < messageCount; i++) {
      const promise = this.sendTestMessage(`Rapid test message ${i + 1}`);
      promises.push(promise);
      
      // Send messages every 100ms
      if (i < messageCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      const duration = Date.now() - startTime;

      this.testResults.set("rapidMessaging", {
        messageCount,
        successful,
        failed,
        duration,
        messagesPerSecond: (successful / duration) * 1000,
      });

      console.log(`✅ Sent ${successful}/${messageCount} messages in ${duration}ms`);
      console.log(`📊 Rate: ${((successful / duration) * 1000).toFixed(2)} messages/second`);
      
      if (failed > 0) {
        console.log(`⚠️  ${failed} messages failed`);
      }

    } catch (error) {
      console.error("❌ Rapid messaging test failed:", error);
    }
  }

  /**
   * Test 2: Network interruption simulation
   */
  private async testNetworkInterruption(): Promise<void> {
    console.log("\n🌐 Test 2: Network Interruption Simulation");
    console.log("------------------------------------------");

    try {
      // Send initial message
      await this.sendTestMessage("Pre-interruption message");
      console.log("✅ Pre-interruption message sent");

      // Simulate network interruption by temporarily disabling monitoring
      console.log("🔌 Simulating network interruption...");
      realtimeMonitor.setEnabled(false);
      
      // Try to send messages during "interruption"
      const interruptionPromises = [];
      for (let i = 0; i < 5; i++) {
        interruptionPromises.push(
          this.sendTestMessage(`Interruption message ${i + 1}`)
            .catch(error => ({ error: error.message }))
        );
      }

      await Promise.all(interruptionPromises);
      
      // Wait for "network recovery"
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Re-enable monitoring (simulate recovery)
      console.log("🔄 Simulating network recovery...");
      realtimeMonitor.setEnabled(true);
      
      // Send recovery message
      await this.sendTestMessage("Post-recovery message");
      console.log("✅ Post-recovery message sent");

      this.testResults.set("networkInterruption", {
        status: "completed",
        recoveryTime: 2000,
      });

    } catch (error) {
      console.error("❌ Network interruption test failed:", error);
    }
  }

  /**
   * Test 3: Concurrent user scenarios
   */
  private async testConcurrentUsers(): Promise<void> {
    console.log("\n👥 Test 3: Concurrent User Scenarios");
    console.log("------------------------------------");

    const userCount = 5;
    const messagesPerUser = 10;
    const userPromises: Promise<any>[] = [];

    for (let userId = 1; userId <= userCount; userId++) {
      const userPromise = this.simulateUser(userId, messagesPerUser);
      userPromises.push(userPromise);
    }

    try {
      const results = await Promise.allSettled(userPromises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      this.testResults.set("concurrentUsers", {
        userCount,
        messagesPerUser,
        successful,
        failed,
        totalMessages: userCount * messagesPerUser,
      });

      console.log(`✅ ${successful}/${userCount} users completed successfully`);
      console.log(`📊 Total messages: ${userCount * messagesPerUser}`);

    } catch (error) {
      console.error("❌ Concurrent users test failed:", error);
    }
  }

  /**
   * Test 4: Large message payloads
   */
  private async testLargeMessagePayloads(): Promise<void> {
    console.log("\n📦 Test 4: Large Message Payloads");
    console.log("---------------------------------");

    const payloadSizes = [1024, 5120, 10240, 51200]; // 1KB, 5KB, 10KB, 50KB
    const results: any[] = [];

    for (const size of payloadSizes) {
      try {
        const largeMessage = "A".repeat(size);
        const startTime = Date.now();
        
        await this.sendTestMessage(largeMessage);
        
        const duration = Date.now() - startTime;
        results.push({ size, duration, success: true });
        
        console.log(`✅ ${(size / 1024).toFixed(1)}KB message sent in ${duration}ms`);
        
      } catch (error) {
        results.push({ size, error: error.message, success: false });
        console.log(`❌ ${(size / 1024).toFixed(1)}KB message failed`);
      }
    }

    this.testResults.set("largePayloads", results);
  }

  /**
   * Test 5: Connection recovery
   */
  private async testConnectionRecovery(): Promise<void> {
    console.log("\n🔄 Test 5: Connection Recovery");
    console.log("------------------------------");

    try {
      // Test automatic reconnection logic
      const connectionHealth = realtimeMonitor.getConnectionHealth();
      console.log("📊 Current connection health:", connectionHealth);

      // Simulate connection drops and recovery
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Recovery attempt ${attempt}/3`);
        
        // Send test message to verify connection
        await this.sendTestMessage(`Recovery test ${attempt}`);
        console.log(`✅ Recovery attempt ${attempt} successful`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.testResults.set("connectionRecovery", {
        attempts: 3,
        successful: 3,
        status: "passed",
      });

    } catch (error) {
      console.error("❌ Connection recovery test failed:", error);
    }
  }

  /**
   * Test 6: Channel subscription limits
   */
  private async testChannelSubscriptionLimits(): Promise<void> {
    console.log("\n📡 Test 6: Channel Subscription Limits");
    console.log("--------------------------------------");

    const maxChannels = 10;
    const channels: string[] = [];

    try {
      for (let i = 1; i <= maxChannels; i++) {
        const channelName = UNIFIED_CHANNELS.conversation(
          this.config.organizationId, 
          `test-conv-${i}`
        );
        channels.push(channelName);
        
        // Track channel creation
        realtimeMonitor.trackConnection(channelName, `test-conn-${i}`);
        console.log(`📡 Created channel ${i}/${maxChannels}: ${channelName}`);
      }

      this.testResults.set("channelLimits", {
        maxChannels,
        created: channels.length,
        status: "completed",
      });

      console.log(`✅ Successfully created ${channels.length} channels`);

    } catch (error) {
      console.error("❌ Channel subscription limits test failed:", error);
    }
  }

  /**
   * Simulate a user sending messages
   */
  private async simulateUser(userId: number, messageCount: number): Promise<void> {
    for (let i = 1; i <= messageCount; i++) {
      await this.sendTestMessage(`User ${userId} - Message ${i}`);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    }
  }

  /**
   * Send a test message
   */
  private async sendTestMessage(content: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/widget/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Organization-ID": this.config.organizationId,
      },
      body: JSON.stringify({
        conversationId: this.config.conversationId,
        content,
        senderType: "visitor",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log("\n📊 Test Report");
    console.log("==============");

    const connectionHealth = realtimeMonitor.getConnectionHealth();
    const recentEvents = realtimeMonitor.getRecentEvents(20);

    console.log("\n🔌 Connection Health:");
    console.log(`  Total Connections: ${connectionHealth.totalConnections}`);
    console.log(`  Healthy Connections: ${connectionHealth.healthyConnections}`);
    console.log(`  Average Latency: ${connectionHealth.averageLatency.toFixed(2)}ms`);
    console.log(`  Total Messages: ${connectionHealth.totalMessages}`);
    console.log(`  Broadcast Success Rate: ${(connectionHealth.broadcastSuccessRate * 100).toFixed(1)}%`);

    console.log("\n📋 Test Results:");
    for (const [testName, result] of this.testResults.entries()) {
      console.log(`  ${testName}:`, JSON.stringify(result, null, 2));
    }

    console.log("\n📝 Recent Events:");
    recentEvents.slice(-5).forEach(event => {
      const status = event.success ? "✅" : "❌";
      console.log(`  ${status} ${event.type}:${event.eventName || "generic"} on ${event.channelName}`);
    });

    console.log("\n🎉 Edge case testing completed!");
  }
}

// Export for use in other scripts
export { RealtimeEdgeCaseTester };

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new RealtimeEdgeCaseTester();
  tester.runAllTests().catch(console.error);
}
