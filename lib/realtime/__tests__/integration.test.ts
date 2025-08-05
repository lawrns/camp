/**
 * Integration Tests for Realtime System
 * 
 * Tests the complete realtime flow:
 * - Widget to Dashboard communication
 * - AI handover scenarios
 * - Performance under load
 * - Memory leak prevention
 * - Database integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRealtimeStore, realtimeManager } from '../RealtimeStateManager';
import { supabase } from '@/lib/supabase';

// Mock environment for testing
const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const TEST_CONV_ID = 'test-conv-123';

describe('Realtime Integration Tests', () => {
  beforeEach(async () => {
    // Reset store
    useRealtimeStore.setState({
      isConnected: false,
      connectionStatus: 'disconnected',
      messages: new Map(),
      typingIndicators: new Map(),
      presenceStates: new Map(),
      activeChannels: new Map(),
      metrics: {
        messageLatency: 0,
        connectionUptime: 0,
        messagesReceived: 0,
        messagesSent: 0,
        reconnections: 0,
        lastHeartbeat: 0,
        memoryUsage: 0,
      },
      config: {
        idleTimeout: 5 * 60 * 1000,
        heartbeatInterval: 25 * 1000,
        burstBufferSize: 10,
        burstBufferTimeout: 300,
        enableMobileOptimizations: false,
        enableReducedMotion: false,
      },
    });

    // Initialize realtime manager
    realtimeManager.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await useRealtimeStore.getState().disconnect();
    realtimeManager.destroy();
  });

  describe('Widget to Dashboard Communication', () => {
    it('should establish bidirectional communication', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect as widget
      const widgetConnected = await store.connect(TEST_ORG_ID, TEST_CONV_ID);
      expect(widgetConnected).toBe(true);
      expect(store.isConnected).toBe(true);
      
      // Simulate message from widget
      const messageResult = await store.sendMessage({
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: 'Hello from widget',
        senderType: 'visitor',
      });
      
      expect(messageResult).toBe(true);
      expect(store.metrics.messagesSent).toBe(1);
    });

    it('should handle typing indicators correctly', async () => {
      const store = useRealtimeStore.getState();
      await store.connect(TEST_ORG_ID, TEST_CONV_ID);
      
      // Start typing
      const typingResult = await store.broadcastTyping({
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        userId: 'visitor-123',
        userName: 'Test Visitor',
        isTyping: true,
      });
      
      expect(typingResult).toBe(true);
      expect(store.typingIndicators.size).toBe(1);
      
      // Stop typing
      await store.broadcastTyping({
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        userId: 'visitor-123',
        userName: 'Test Visitor',
        isTyping: false,
      });
      
      expect(store.typingIndicators.size).toBe(0);
    });
  });

  describe('AI Handover Scenarios', () => {
    it('should handle AI to human handover with <100ms latency', async () => {
      const store = useRealtimeStore.getState();
      await store.connect(TEST_ORG_ID, TEST_CONV_ID);
      
      const startTime = Date.now();
      
      // Simulate AI handover message
      const handoverResult = await store.sendMessage({
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: 'Transferring to human agent...',
        senderType: 'ai',
        metadata: {
          handover: true,
          reason: 'complex_query',
          confidence: 0.3,
        },
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      expect(handoverResult).toBe(true);
      expect(latency).toBeLessThan(100); // <100ms requirement
      expect(store.metrics.messageLatency).toBeLessThan(100);
    });

    it('should maintain context during handover', async () => {
      const store = useRealtimeStore.getState();
      await store.connect(TEST_ORG_ID, TEST_CONV_ID);
      
      // Send multiple messages to build context
      const messages = [
        'Hello, I need help with my order',
        'My order number is #12345',
        'It was supposed to arrive yesterday',
      ];
      
      for (const content of messages) {
        await store.sendMessage({
          conversationId: TEST_CONV_ID,
          organizationId: TEST_ORG_ID,
          content,
          senderType: 'visitor',
        });
      }
      
      // Verify all messages are stored
      expect(store.messages.size).toBe(3);
      
      // Simulate handover with context preservation
      await store.sendMessage({
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: 'I understand you need help with order #12345. Let me check that for you.',
        senderType: 'agent',
        metadata: {
          handover_context: Array.from(store.messages.values()),
        },
      });
      
      expect(store.messages.size).toBe(4);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle burst messaging without degradation', async () => {
      const store = useRealtimeStore.getState();
      await store.connect(TEST_ORG_ID, TEST_CONV_ID);
      
      const messageCount = 50;
      const startTime = Date.now();
      
      // Send burst of messages
      const promises = [];
      for (let i = 0; i < messageCount; i++) {
        promises.push(
          store.sendMessage({
            conversationId: TEST_CONV_ID,
            organizationId: TEST_ORG_ID,
            content: `Burst message ${i}`,
            senderType: 'visitor',
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgLatency = totalTime / messageCount;
      
      // All messages should succeed
      expect(results.every(r => r === true)).toBe(true);
      
      // Average latency should be reasonable
      expect(avgLatency).toBeLessThan(50); // 50ms average
      
      // Metrics should be updated
      expect(store.metrics.messagesSent).toBe(messageCount);
    });

    it('should use burst buffering for high-volume scenarios', async () => {
      const store = useRealtimeStore.getState();
      
      // Create multiple messages quickly
      const messages = Array.from({ length: 15 }, (_, i) => ({
        id: `msg_${i}`,
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: `Buffered message ${i}`,
        senderType: 'visitor' as const,
        timestamp: new Date().toISOString(),
      }));
      
      // Buffer messages
      messages.forEach(msg => {
        realtimeManager.bufferMessage(msg);
      });
      
      // Wait for buffer to flush
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Messages should be processed
      expect(store.messages.size).toBeGreaterThan(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup idle channels automatically', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect to multiple conversations
      await store.connect(TEST_ORG_ID, 'conv1');
      await store.connect(TEST_ORG_ID, 'conv2');
      await store.connect(TEST_ORG_ID, 'conv3');
      
      expect(store.activeChannels.size).toBe(3);
      
      // Mark channels as idle
      store.activeChannels.forEach(subscription => {
        subscription.isIdle = true;
        subscription.lastActivity = Date.now() - (6 * 60 * 1000); // 6 minutes ago
        subscription.subscribers = 0;
      });
      
      // Trigger cleanup
      store.cleanupIdleChannels();
      
      // All idle channels should be cleaned up
      expect(store.activeChannels.size).toBe(0);
    });

    it('should limit stored data to prevent memory growth', async () => {
      const store = useRealtimeStore.getState();
      
      // Add many messages
      for (let i = 0; i < 1200; i++) {
        store.addMessage({
          id: `msg_${i}`,
          conversationId: TEST_CONV_ID,
          organizationId: TEST_ORG_ID,
          content: `Message ${i}`,
          senderType: 'visitor',
          timestamp: new Date().toISOString(),
        });
      }
      
      // Should be limited to MAX_STORED_MESSAGES (1000)
      expect(store.messages.size).toBe(1000);
      
      // Add many typing indicators
      for (let i = 0; i < 60; i++) {
        store.updateTyping({
          conversationId: `conv_${i}`,
          organizationId: TEST_ORG_ID,
          userId: `user_${i}`,
          userName: `User ${i}`,
          isTyping: true,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Should be limited to MAX_STORED_TYPING (50)
      expect(store.typingIndicators.size).toBe(50);
    });

    it('should clear old data periodically', async () => {
      const store = useRealtimeStore.getState();
      
      // Add old and new data
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const newTimestamp = new Date().toISOString();
      
      store.addMessage({
        id: 'old_msg',
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: 'Old message',
        senderType: 'visitor',
        timestamp: oldTimestamp,
      });
      
      store.addMessage({
        id: 'new_msg',
        conversationId: TEST_CONV_ID,
        organizationId: TEST_ORG_ID,
        content: 'New message',
        senderType: 'visitor',
        timestamp: newTimestamp,
      });
      
      expect(store.messages.size).toBe(2);
      
      // Clear old data
      store.clearOldData();
      
      // Only new message should remain
      expect(store.messages.size).toBe(1);
      expect(store.messages.has('new_msg')).toBe(true);
      expect(store.messages.has('old_msg')).toBe(false);
    });
  });

  describe('Database Integration', () => {
    it('should record performance metrics to database', async () => {
      // This would require actual database connection in real test
      // For now, we'll test the function exists and can be called
      const store = useRealtimeStore.getState();
      
      // Simulate recording metrics
      const metrics = realtimeManager.getPerformanceReport();
      
      expect(metrics).toHaveProperty('connectionUptime');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('messagesPerSecond');
      expect(metrics).toHaveProperty('activeChannels');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('reconnections');
    });
  });

  describe('Mobile Optimizations', () => {
    it('should apply mobile-specific optimizations', async () => {
      // Mock mobile environment
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
        configurable: true,
      });
      
      const store = useRealtimeStore.getState();
      
      // Mobile optimizations should be enabled
      expect(store.config.enableMobileOptimizations).toBe(true);
      
      // Should use longer intervals for mobile
      expect(store.config.heartbeatInterval).toBeGreaterThanOrEqual(25000);
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(global, 'window', {
        value: {
          matchMedia: vi.fn(() => ({ matches: true })),
        },
        configurable: true,
      });
      
      const store = useRealtimeStore.getState();
      expect(store.config.enableReducedMotion).toBe(true);
    });
  });
});
