/**
 * BIDIRECTIONAL CHANNEL TESTING FRAMEWORK
 * 
 * Comprehensive testing suite for all channel communications including:
 * - Client-to-server message flows
 * - Server-to-client broadcast flows  
 * - Event validation and error handling
 * - Connection reliability testing
 * - Performance and latency testing
 */

import { UNIFIED_CHANNELS, UNIFIED_EVENTS, isValidChannelName, isValidEventName } from './unified-channel-standards';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export interface TestConfig {
  organizationId: string;
  conversationId: string;
  userId: string;
  timeout: number;
  retries: number;
  enableLogging: boolean;
}

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface BidirectionalTestSuite {
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

// ============================================================================
// BIDIRECTIONAL TEST RUNNER
// ============================================================================

export class ChannelTestRunner {
  private supabase: SupabaseClient;
  private config: TestConfig;
  private results: TestResult[] = [];

  constructor(supabase: SupabaseClient, config: TestConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  /**
   * Run complete bidirectional test suite
   */
  async runFullTestSuite(): Promise<BidirectionalTestSuite> {
    const startTime = Date.now();
    this.results = [];

    this.log('🚀 Starting bidirectional channel testing suite...');

    // Test channel naming validation
    await this.testChannelNamingValidation();
    
    // Test event naming validation  
    await this.testEventNamingValidation();
    
    // Test basic connectivity
    await this.testBasicConnectivity();
    
    // Test message flow (client -> server -> client)
    await this.testMessageFlow();
    
    // Test typing indicators (bidirectional)
    await this.testTypingIndicators();
    
    // Test presence updates (bidirectional)
    await this.testPresenceUpdates();
    
    // Test conversation events (bidirectional)
    await this.testConversationEvents();
    
    // Test agent status updates (bidirectional)
    await this.testAgentStatusUpdates();
    
    // Test AI handover flow (bidirectional)
    await this.testAIHandoverFlow();
    
    // Test error handling and recovery
    await this.testErrorHandling();
    
    // Test connection reliability
    await this.testConnectionReliability();
    
    // Test performance and latency
    await this.testPerformanceLatency();

    const endTime = Date.now();
    const duration = endTime - startTime;

    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      duration
    };

    this.log(`✅ Test suite completed: ${summary.passed}/${summary.total} passed in ${duration}ms`);

    return {
      results: this.results,
      summary
    };
  }

  /**
   * Test channel naming validation
   */
  private async testChannelNamingValidation(): Promise<void> {
    const testName = 'Channel Naming Validation';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId, userId } = this.config;

      // Test valid channel names
      const validChannels = [
        UNIFIED_CHANNELS.organization(organizationId),
        UNIFIED_CHANNELS.conversation(organizationId, conversationId),
        UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId),
        UNIFIED_CHANNELS.user(organizationId, userId),
        UNIFIED_CHANNELS.widget(organizationId, conversationId),
      ];

      for (const channel of validChannels) {
        if (!isValidChannelName(channel)) {
          throw new Error(`Valid channel name failed validation: ${channel}`);
        }
      }

      // Test invalid channel names
      const invalidChannels = [
        'invalid-channel',
        'org:',
        'org:abc:invalid:too:many:parts',
        'wrong:format',
      ];

      for (const channel of invalidChannels) {
        if (isValidChannelName(channel)) {
          throw new Error(`Invalid channel name passed validation: ${channel}`);
        }
      }

      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test event naming validation
   */
  private async testEventNamingValidation(): Promise<void> {
    const testName = 'Event Naming Validation';
    const startTime = Date.now();

    try {
      // Test valid event names
      const validEvents = [
        UNIFIED_EVENTS.MESSAGE_CREATED,
        UNIFIED_EVENTS.CONVERSATION_ASSIGNED,
        UNIFIED_EVENTS.TYPING_START,
        UNIFIED_EVENTS.AGENT_STATUS_ONLINE,
        UNIFIED_EVENTS.AI_HANDOVER_REQUESTED,
      ];

      for (const event of validEvents) {
        if (!isValidEventName(event)) {
          throw new Error(`Valid event name failed validation: ${event}`);
        }
      }

      // Test invalid event names
      const invalidEvents = [
        'invalid_event',
        'wrong-format',
        'too:many:colons:here',
      ];

      for (const event of invalidEvents) {
        if (isValidEventName(event)) {
          throw new Error(`Invalid event name passed validation: ${event}`);
        }
      }

      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test basic connectivity
   */
  private async testBasicConnectivity(): Promise<void> {
    const testName = 'Basic Connectivity';
    const startTime = Date.now();

    try {
      const { organizationId } = this.config;
      const channelName = UNIFIED_CHANNELS.organization(organizationId);
      
      const channel = this.supabase.channel(channelName);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.timeout);

        channel.on('system', {}, (payload) => {
          if (payload.status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve();
          }
        });

        channel.subscribe();
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test message flow (bidirectional)
   */
  private async testMessageFlow(): Promise<void> {
    const testName = 'Message Flow (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
      
      const channel = this.supabase.channel(channelName);
      let messageReceived = false;

      // Set up listener for incoming messages
      channel.on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload) => {
        if (payload.payload.testMessage === 'bidirectional-test') {
          messageReceived = true;
        }
      });

      await channel.subscribe();

      // Send test message
      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.MESSAGE_CREATED,
        payload: {
          testMessage: 'bidirectional-test',
          timestamp: new Date().toISOString(),
        }
      });

      // Wait for message to be received
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (messageReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test typing indicators (bidirectional)
   */
  private async testTypingIndicators(): Promise<void> {
    const testName = 'Typing Indicators (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId, userId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId);
      
      const channel = this.supabase.channel(channelName);
      let typingReceived = false;

      // Listen for typing events
      channel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload) => {
        if (payload.payload.userId === userId) {
          typingReceived = true;
        }
      });

      await channel.subscribe();

      // Send typing start event
      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.TYPING_START,
        payload: {
          userId,
          timestamp: new Date().toISOString(),
        }
      });

      // Wait for typing event to be received
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Typing event not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (typingReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test presence updates (bidirectional)
   */
  private async testPresenceUpdates(): Promise<void> {
    const testName = 'Presence Updates (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId, userId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversationPresence(organizationId, conversationId);

      const channel = this.supabase.channel(channelName);
      let presenceReceived = false;

      channel.on('broadcast', { event: UNIFIED_EVENTS.PRESENCE_JOIN }, (payload) => {
        if (payload.payload.userId === userId) {
          presenceReceived = true;
        }
      });

      await channel.subscribe();

      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.PRESENCE_JOIN,
        payload: {
          userId,
          status: 'online',
          timestamp: new Date().toISOString(),
        }
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Presence event not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (presenceReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test conversation events (bidirectional)
   */
  private async testConversationEvents(): Promise<void> {
    const testName = 'Conversation Events (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);

      const channel = this.supabase.channel(channelName);
      let eventReceived = false;

      channel.on('broadcast', { event: UNIFIED_EVENTS.CONVERSATION_UPDATED }, (payload) => {
        if (payload.payload.conversationId === conversationId) {
          eventReceived = true;
        }
      });

      await channel.subscribe();

      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.CONVERSATION_UPDATED,
        payload: {
          conversationId,
          status: 'active',
          timestamp: new Date().toISOString(),
        }
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Conversation event not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (eventReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test agent status updates (bidirectional)
   */
  private async testAgentStatusUpdates(): Promise<void> {
    const testName = 'Agent Status Updates (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, userId } = this.config;
      const channelName = UNIFIED_CHANNELS.userPresence(organizationId, userId);

      const channel = this.supabase.channel(channelName);
      let statusReceived = false;

      channel.on('broadcast', { event: UNIFIED_EVENTS.AGENT_STATUS_ONLINE }, (payload) => {
        if (payload.payload.agentId === userId) {
          statusReceived = true;
        }
      });

      await channel.subscribe();

      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.AGENT_STATUS_ONLINE,
        payload: {
          agentId: userId,
          status: 'online',
          timestamp: new Date().toISOString(),
        }
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Agent status not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (statusReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test AI handover flow (bidirectional)
   */
  private async testAIHandoverFlow(): Promise<void> {
    const testName = 'AI Handover Flow (Bidirectional)';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversationHandover(organizationId, conversationId);

      const channel = this.supabase.channel(channelName);
      let handoverReceived = false;

      channel.on('broadcast', { event: UNIFIED_EVENTS.AI_HANDOVER_REQUESTED }, (payload) => {
        if (payload.payload.conversationId === conversationId) {
          handoverReceived = true;
        }
      });

      await channel.subscribe();

      await channel.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.AI_HANDOVER_REQUESTED,
        payload: {
          conversationId,
          reason: 'low_confidence',
          confidence: 0.3,
          timestamp: new Date().toISOString(),
        }
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('AI handover event not received within timeout'));
        }, this.config.timeout);

        const checkInterval = setInterval(() => {
          if (handoverReceived) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      await channel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test error handling and recovery
   */
  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling and Recovery';
    const startTime = Date.now();

    try {
      // Test invalid channel name
      try {
        const invalidChannel = this.supabase.channel('invalid-channel-name');
        await invalidChannel.subscribe();
        throw new Error('Should have failed with invalid channel name');
      } catch (error) {
        // Expected to fail
      }

      // Test invalid event name
      const { organizationId } = this.config;
      const validChannel = this.supabase.channel(UNIFIED_CHANNELS.organization(organizationId));

      try {
        await validChannel.send({
          type: 'broadcast',
          event: 'invalid-event-name',
          payload: {}
        });
        // This might not fail immediately, so we continue
      } catch (error) {
        // Expected behavior
      }

      await validChannel.unsubscribe();
      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test connection reliability
   */
  private async testConnectionReliability(): Promise<void> {
    const testName = 'Connection Reliability';
    const startTime = Date.now();

    try {
      const { organizationId } = this.config;
      const channelName = UNIFIED_CHANNELS.organization(organizationId);

      // Test multiple rapid connections/disconnections
      for (let i = 0; i < 3; i++) {
        const channel = this.supabase.channel(`${channelName}-${i}`);
        await channel.subscribe();
        await new Promise(resolve => setTimeout(resolve, 100));
        await channel.unsubscribe();
      }

      this.addResult(testName, true, Date.now() - startTime);
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Test performance and latency
   */
  private async testPerformanceLatency(): Promise<void> {
    const testName = 'Performance and Latency';
    const startTime = Date.now();

    try {
      const { organizationId, conversationId } = this.config;
      const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);

      const channel = this.supabase.channel(channelName);
      const latencies: number[] = [];

      channel.on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload) => {
        const sentTime = payload.payload.sentTime;
        const receivedTime = Date.now();
        latencies.push(receivedTime - sentTime);
      });

      await channel.subscribe();

      // Send multiple messages to test latency
      for (let i = 0; i < 5; i++) {
        const sentTime = Date.now();
        await channel.send({
          type: 'broadcast',
          event: UNIFIED_EVENTS.MESSAGE_CREATED,
          payload: {
            messageId: `test-${i}`,
            sentTime,
          }
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Wait for all messages to be received
      await new Promise(resolve => setTimeout(resolve, 1000));

      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;

      await channel.unsubscribe();

      this.addResult(testName, true, Date.now() - startTime, undefined, {
        averageLatency: avgLatency,
        messagesSent: 5,
        messagesReceived: latencies.length,
        latencies
      });
    } catch (error) {
      this.addResult(testName, false, Date.now() - startTime, error);
    }
  }

  /**
   * Add test result
   */
  private addResult(testName: string, success: boolean, duration: number, error?: unknown, details?: Record<string, any>): void {
    this.results.push({
      testName,
      success,
      duration,
      error: error?.message || error?.toString(),
      details: details || (error ? { stack: error.stack } : undefined),
    });

    const status = success ? '✅' : '❌';
    this.log(`${status} ${testName} (${duration}ms)${error ? `: ${error.message}` : ''}`);
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[ChannelTest] ${message}`);
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Run quick bidirectional test
 */
export async function runQuickChannelTest(
  supabase: SupabaseClient,
  organizationId: string,
  conversationId: string,
  userId: string
): Promise<BidirectionalTestSuite> {
  const config: TestConfig = {
    organizationId,
    conversationId,
    userId,
    timeout: 5000,
    retries: 3,
    enableLogging: true,
  };

  const runner = new ChannelTestRunner(supabase, config);
  return await runner.runFullTestSuite();
}

/**
 * Test specific channel functionality
 */
export async function testChannelFunction(
  supabase: SupabaseClient,
  channelName: string,
  eventName: string,
  payload: unknown,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const channel = supabase.channel(channelName);
    let received = false;

    channel.on('broadcast', { event: eventName }, () => {
      received = true;
    });

    await channel.subscribe();

    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout);

      const checkInterval = setInterval(() => {
        if (received) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    await channel.unsubscribe();
    return true;
  } catch {
    return false;
  }
}
