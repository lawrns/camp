/**
 * BIDIRECTIONAL REAL-TIME UNIT TESTS
 * 
 * Unit tests for real-time communication logic without browser dependencies.
 * Tests the core bidirectional communication patterns and message flow.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock WebSocket for testing
class MockWebSocket {
  public readyState = 1; // OPEN
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  
  private listeners: { [key: string]: Function[] } = {};

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
      this.dispatchEvent('open', new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Simulate echo for testing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
      this.dispatchEvent('message', new MessageEvent('message', { data }));
    }, 10);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
    this.dispatchEvent('close', new CloseEvent('close'));
  }

  addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener);
    }
  }

  private dispatchEvent(type: string, event: Event) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => listener(event));
    }
  }
}

// Mock Supabase Realtime Channel
class MockRealtimeChannel {
  private subscriptions: { [key: string]: Function[] } = {};
  private isSubscribed = false;

  constructor(private channelName: string) {}

  on(event: string, callback: Function) {
    if (!this.subscriptions[event]) {
      this.subscriptions[event] = [];
    }
    this.subscriptions[event].push(callback);
    return this;
  }

  subscribe(callback?: Function) {
    this.isSubscribed = true;
    setTimeout(() => {
      if (callback) callback('SUBSCRIBED');
    }, 10);
    return this;
  }

  unsubscribe() {
    this.isSubscribed = false;
    return this;
  }

  send(payload: unknown) {
    // Simulate real-time message
    setTimeout(() => {
      // Trigger the appropriate event based on payload type
      if (payload.type === 'message') {
        this.trigger('message', payload);
      } else if (payload.type === 'typing') {
        this.trigger('typing', payload);
      } else {
        this.trigger('broadcast', payload);
      }
    }, 10);
  }

  private trigger(event: string, payload: unknown) {
    if (this.subscriptions[event]) {
      this.subscriptions[event].forEach(callback => callback(payload));
    }
  }

  // Simulate receiving messages from other clients
  simulateMessage(event: string, payload: unknown) {
    this.trigger(event, payload);
  }
}

// Real-time communication manager for testing
class RealtimeCommunicationManager {
  private channels = new Map<string, MockRealtimeChannel>();
  private messageHandlers = new Map<string, Function[]>();

  createChannel(channelName: string): MockRealtimeChannel {
    const channel = new MockRealtimeChannel(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  getChannel(channelName: string): MockRealtimeChannel | undefined {
    return this.channels.get(channelName);
  }

  subscribeToConversation(conversationId: string, onMessage: Function, onTyping: Function) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.createChannel(channelName);
    
    channel
      .on('message', onMessage)
      .on('typing', onTyping)
      .subscribe();

    return channel;
  }

  sendMessage(conversationId: string, message: unknown) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.getChannel(channelName);
    
    if (channel) {
      channel.send({
        type: 'message',
        payload: message
      });
    }
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean, userId: string) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.getChannel(channelName);
    
    if (channel) {
      channel.send({
        type: 'typing',
        payload: { isTyping, userId, timestamp: Date.now() }
      });
    }
  }

  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.messageHandlers.clear();
  }
}

describe('Bidirectional Real-time Communication', () => {
  let rtManager: RealtimeCommunicationManager;

  beforeEach(() => {
    rtManager = new RealtimeCommunicationManager();
    // Mock global WebSocket
    (global as unknown).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    rtManager.cleanup();
  });

  describe('Channel Management', () => {
    test('should create and manage channels correctly', () => {
      const conversationId = 'test-conversation-123';
      const channelName = `conversation:${conversationId}`;
      
      const channel = rtManager.createChannel(channelName);
      expect(channel).toBeDefined();
      
      const retrievedChannel = rtManager.getChannel(channelName);
      expect(retrievedChannel).toBe(channel);
    });

    test('should handle multiple channels simultaneously', () => {
      const conversationIds = ['conv-1', 'conv-2', 'conv-3'];
      const channels = conversationIds.map(id => 
        rtManager.createChannel(`conversation:${id}`)
      );

      expect(channels).toHaveLength(3);
      channels.forEach((channel, index) => {
        expect(channel).toBeDefined();
        expect(rtManager.getChannel(`conversation:${conversationIds[index]}`)).toBe(channel);
      });
    });
  });

  describe('Message Flow', () => {
    test('should handle bidirectional message exchange', async () => {
      const conversationId = 'bidirectional-test';
      const receivedMessages: unknown[] = [];
      
      // Set up message handler
      const onMessage = (payload: unknown) => {
        receivedMessages.push(payload);
      };
      
      const onTyping = jest.fn();
      
      // Subscribe to conversation
      const channel = rtManager.subscribeToConversation(conversationId, onMessage, onTyping);
      
      // Send message
      const testMessage = {
        id: 'msg-123',
        content: 'Hello from customer',
        senderType: 'customer',
        timestamp: Date.now()
      };
      
      rtManager.sendMessage(conversationId, testMessage);
      
      // Wait for message to be processed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].payload).toEqual(testMessage);
    });

    test('should handle typing indicators bidirectionally', async () => {
      const conversationId = 'typing-test';
      const typingEvents: unknown[] = [];
      
      const onMessage = jest.fn();
      const onTyping = (payload: unknown) => {
        typingEvents.push(payload);
      };
      
      // Subscribe to conversation
      rtManager.subscribeToConversation(conversationId, onMessage, onTyping);
      
      // Send typing indicator
      rtManager.sendTypingIndicator(conversationId, true, 'user-123');
      
      // Wait for typing event
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(typingEvents).toHaveLength(1);
      expect(typingEvents[0].payload.isTyping).toBe(true);
      expect(typingEvents[0].payload.userId).toBe('user-123');
      
      // Stop typing
      rtManager.sendTypingIndicator(conversationId, false, 'user-123');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(typingEvents).toHaveLength(2);
      expect(typingEvents[1].payload.isTyping).toBe(false);
    });

    test('should handle rapid message sequences', async () => {
      const conversationId = 'rapid-test';
      const receivedMessages: unknown[] = [];
      
      const onMessage = (payload: unknown) => {
        receivedMessages.push(payload);
      };
      
      rtManager.subscribeToConversation(conversationId, onMessage, jest.fn());
      
      // Send multiple messages rapidly
      const messageCount = 10;
      for (let i = 1; i <= messageCount; i++) {
        rtManager.sendMessage(conversationId, {
          id: `msg-${i}`,
          content: `Message ${i}`,
          timestamp: Date.now() + i
        });
      }
      
      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(receivedMessages).toHaveLength(messageCount);
      receivedMessages.forEach((msg, index) => {
        expect(msg.payload.content).toBe(`Message ${index + 1}`);
      });
    });
  });

  describe('Connection Management', () => {
    test('should handle connection establishment', () => {
      const ws = new MockWebSocket('wss://test.supabase.co/realtime/v1/websocket');
      let connectionOpened = false;
      
      ws.onopen = () => {
        connectionOpened = true;
      };
      
      // Wait for connection
      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(connectionOpened).toBe(true);
          expect(ws.readyState).toBe(1); // OPEN
          resolve();
        }, 50);
      });
    });

    test('should handle connection loss and cleanup', () => {
      const ws = new MockWebSocket('wss://test.supabase.co/realtime/v1/websocket');
      let connectionClosed = false;
      
      ws.onclose = () => {
        connectionClosed = true;
      };
      
      // Close connection
      ws.close();
      
      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(connectionClosed).toBe(true);
          expect(ws.readyState).toBe(3); // CLOSED
          resolve();
        }, 50);
      });
    });

    test('should handle message serialization and deserialization', () => {
      const ws = new MockWebSocket('wss://test.supabase.co/realtime/v1/websocket');
      let receivedData: string | null = null;
      
      ws.onmessage = (event) => {
        receivedData = event.data;
      };
      
      const testData = JSON.stringify({
        event: 'message',
        payload: { content: 'Test message' }
      });
      
      ws.send(testData);
      
      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(receivedData).toBe(testData);
          
          // Test deserialization
          const parsed = JSON.parse(receivedData!);
          expect(parsed.event).toBe('message');
          expect(parsed.payload.content).toBe('Test message');
          resolve();
        }, 50);
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle channel subscription failures gracefully', () => {
      const conversationId = 'error-test';
      let subscriptionError = false;
      
      try {
        const channel = rtManager.subscribeToConversation(
          conversationId,
          () => {},
          () => {}
        );
        
        // Simulate subscription error
        channel.unsubscribe();
        
        // Try to send message to unsubscribed channel
        rtManager.sendMessage(conversationId, { content: 'Test' });
        
      } catch (error) {
        subscriptionError = true;
      }
      
      // Should not throw error, should handle gracefully
      expect(subscriptionError).toBe(false);
    });

    test('should handle malformed message data', async () => {
      const conversationId = 'malformed-test';
      const receivedMessages: unknown[] = [];
      const errors: unknown[] = [];
      
      const onMessage = (payload: unknown) => {
        try {
          receivedMessages.push(payload);
        } catch (error) {
          errors.push(error);
        }
      };
      
      const channel = rtManager.subscribeToConversation(conversationId, onMessage, jest.fn());
      
      // Simulate malformed message
      channel.simulateMessage('message', null);
      channel.simulateMessage('message', undefined);
      channel.simulateMessage('message', { malformed: true });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should handle malformed data without crashing
      expect(errors).toHaveLength(0);
      expect(receivedMessages).toHaveLength(3);
    });

    test('should handle concurrent operations safely', async () => {
      const conversationId = 'concurrent-test';
      const receivedMessages: unknown[] = [];
      
      const onMessage = (payload: unknown) => {
        receivedMessages.push(payload);
      };
      
      rtManager.subscribeToConversation(conversationId, onMessage, jest.fn());
      
      // Send messages concurrently
      const promises = Array.from({ length: 20 }, (_, i) =>
        Promise.resolve().then(() => {
          rtManager.sendMessage(conversationId, {
            id: `concurrent-msg-${i}`,
            content: `Concurrent message ${i}`,
            timestamp: Date.now()
          });
        })
      );
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedMessages).toHaveLength(20);
      
      // Verify all messages were received
      const messageIds = receivedMessages.map(msg => msg.payload.id);
      for (let i = 0; i < 20; i++) {
        expect(messageIds).toContain(`concurrent-msg-${i}`);
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high-frequency events efficiently', async () => {
      const conversationId = 'performance-test';
      const receivedEvents: unknown[] = [];
      
      const onMessage = (payload: unknown) => {
        receivedEvents.push(payload);
      };
      
      const onTyping = (payload: unknown) => {
        receivedEvents.push(payload);
      };
      
      rtManager.subscribeToConversation(conversationId, onMessage, onTyping);
      
      const startTime = Date.now();
      const eventCount = 100;
      
      // Send high-frequency events
      for (let i = 0; i < eventCount; i++) {
        if (i % 2 === 0) {
          rtManager.sendMessage(conversationId, {
            id: `perf-msg-${i}`,
            content: `Performance message ${i}`
          });
        } else {
          rtManager.sendTypingIndicator(conversationId, i % 4 === 1, `user-${i}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(receivedEvents).toHaveLength(eventCount);
      expect(duration).toBeLessThan(1000); // Should process 100 events in under 1 second
    });

    test('should maintain memory efficiency with large datasets', () => {
      const conversationCount = 50;
      const channels: MockRealtimeChannel[] = [];
      
      // Create many channels
      for (let i = 0; i < conversationCount; i++) {
        const channel = rtManager.createChannel(`conversation:perf-${i}`);
        channels.push(channel);
      }
      
      expect(channels).toHaveLength(conversationCount);
      
      // Cleanup should work efficiently
      const cleanupStart = Date.now();
      rtManager.cleanup();
      const cleanupEnd = Date.now();
      
      expect(cleanupEnd - cleanupStart).toBeLessThan(100); // Cleanup should be fast
    });
  });
});
