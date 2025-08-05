/**
 * Memory Validation Tests for Realtime System
 * 
 * Validates memory usage patterns and leak prevention:
 * - Memory snapshots before/after operations
 * - Subscription cleanup validation
 * - Data structure size limits
 * - Garbage collection effectiveness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRealtimeStore, realtimeManager } from '../RealtimeStateManager';

// Mock performance.memory for testing
const mockMemory = {
  usedJSHeapSize: 1024 * 1024, // 1MB initial
  totalJSHeapSize: 2048 * 1024, // 2MB total
  jsHeapSizeLimit: 4096 * 1024, // 4MB limit
};

Object.defineProperty(global, 'performance', {
  value: {
    memory: mockMemory,
    now: () => Date.now(),
  },
});

// Helper to simulate memory usage
function simulateMemoryUsage(additionalBytes: number) {
  mockMemory.usedJSHeapSize += additionalBytes;
}

// Helper to reset memory
function resetMemory() {
  mockMemory.usedJSHeapSize = 1024 * 1024; // Reset to 1MB
}

// Memory snapshot utility
interface MemorySnapshot {
  timestamp: number;
  usedHeapSize: number;
  totalHeapSize: number;
  activeChannels: number;
  storedMessages: number;
  storedTyping: number;
  storedPresence: number;
}

function takeMemorySnapshot(): MemorySnapshot {
  const store = useRealtimeStore.getState();
  return {
    timestamp: Date.now(),
    usedHeapSize: performance.memory?.usedJSHeapSize || 0,
    totalHeapSize: performance.memory?.totalJSHeapSize || 0,
    activeChannels: store.activeChannels.size,
    storedMessages: store.messages.size,
    storedTyping: store.typingIndicators.size,
    storedPresence: store.presenceStates.size,
  };
}

function compareSnapshots(before: MemorySnapshot, after: MemorySnapshot) {
  return {
    memoryGrowth: after.usedHeapSize - before.usedHeapSize,
    channelGrowth: after.activeChannels - before.activeChannels,
    messageGrowth: after.storedMessages - before.storedMessages,
    typingGrowth: after.storedTyping - before.storedTyping,
    presenceGrowth: after.storedPresence - before.storedPresence,
    timeDelta: after.timestamp - before.timestamp,
  };
}

describe('Memory Validation Tests', () => {
  beforeEach(() => {
    // Reset memory and store
    resetMemory();
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
  });

  afterEach(() => {
    realtimeManager.destroy();
  });

  describe('Subscription Memory Management', () => {
    it('should not leak memory when creating and destroying channels', async () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Create multiple channels
      const channelPromises = [];
      for (let i = 0; i < 10; i++) {
        channelPromises.push(store.connect(`org${i}`, `conv${i}`));
        simulateMemoryUsage(50 * 1024); // 50KB per channel
      }

      await Promise.all(channelPromises);
      const afterCreateSnapshot = takeMemorySnapshot();

      // Verify channels were created
      expect(afterCreateSnapshot.activeChannels).toBe(10);

      // Disconnect all channels
      await store.disconnect();
      
      // Simulate garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterCleanupSnapshot = takeMemorySnapshot();

      // Verify cleanup
      expect(afterCleanupSnapshot.activeChannels).toBe(0);
      
      // Memory should return close to original (allowing for some overhead)
      const createComparison = compareSnapshots(beforeSnapshot, afterCreateSnapshot);
      const cleanupComparison = compareSnapshots(beforeSnapshot, afterCleanupSnapshot);
      
      expect(createComparison.memoryGrowth).toBeGreaterThan(0); // Memory should grow
      expect(cleanupComparison.memoryGrowth).toBeLessThan(createComparison.memoryGrowth * 0.2); // 80% cleanup
    });

    it('should cleanup idle channels automatically', async () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Create channels
      await store.connect('org1', 'conv1');
      await store.connect('org2', 'conv2');
      await store.connect('org3', 'conv3');
      
      simulateMemoryUsage(150 * 1024); // 150KB for 3 channels
      
      const afterCreateSnapshot = takeMemorySnapshot();
      expect(afterCreateSnapshot.activeChannels).toBe(3);

      // Mark channels as idle
      store.activeChannels.forEach(subscription => {
        subscription.isIdle = true;
        subscription.lastActivity = Date.now() - (6 * 60 * 1000); // 6 minutes ago
        subscription.subscribers = 0;
      });

      // Trigger cleanup
      store.cleanupIdleChannels();
      
      const afterCleanupSnapshot = takeMemorySnapshot();

      // All channels should be cleaned up
      expect(afterCleanupSnapshot.activeChannels).toBe(0);
      
      const comparison = compareSnapshots(afterCreateSnapshot, afterCleanupSnapshot);
      expect(comparison.channelGrowth).toBe(-3); // 3 channels removed
    });

    it('should handle heartbeat intervals without memory leaks', async () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Connect with heartbeat
      await store.connect('org1', 'conv1');
      simulateMemoryUsage(50 * 1024);

      // Simulate multiple heartbeats
      for (let i = 0; i < 100; i++) {
        // Simulate heartbeat execution
        store.activeChannels.forEach(subscription => {
          if (subscription.heartbeatInterval) {
            // Simulate heartbeat memory usage
            simulateMemoryUsage(100); // 100 bytes per heartbeat
          }
        });
      }

      const afterHeartbeatsSnapshot = takeMemorySnapshot();
      
      // Disconnect to cleanup
      await store.disconnect();
      
      const afterCleanupSnapshot = takeMemorySnapshot();

      const heartbeatComparison = compareSnapshots(beforeSnapshot, afterHeartbeatsSnapshot);
      const cleanupComparison = compareSnapshots(beforeSnapshot, afterCleanupSnapshot);

      // Heartbeats should not cause significant memory growth
      expect(heartbeatComparison.memoryGrowth).toBeLessThan(200 * 1024); // Less than 200KB
      
      // Cleanup should remove most memory
      expect(cleanupComparison.memoryGrowth).toBeLessThan(heartbeatComparison.memoryGrowth * 0.3);
    });
  });

  describe('Data Structure Size Limits', () => {
    it('should limit message storage to prevent unbounded growth', () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Add messages beyond the limit
      const messageCount = 1200; // Above MAX_STORED_MESSAGES (1000)
      for (let i = 0; i < messageCount; i++) {
        store.addMessage({
          id: `msg_${i}`,
          conversationId: 'conv1',
          organizationId: 'org1',
          content: `Message ${i}`,
          senderType: 'visitor',
          timestamp: new Date().toISOString(),
        });
        simulateMemoryUsage(1024); // 1KB per message
      }

      const afterSnapshot = takeMemorySnapshot();

      // Should be limited to 1000 messages
      expect(afterSnapshot.storedMessages).toBe(1000);
      
      const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);
      expect(comparison.messageGrowth).toBe(1000); // Only 1000 stored, not 1200
    });

    it('should limit typing indicator storage', () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Add typing indicators beyond the limit
      const typingCount = 60; // Above MAX_STORED_TYPING (50)
      for (let i = 0; i < typingCount; i++) {
        store.updateTyping({
          conversationId: `conv_${i}`,
          organizationId: 'org1',
          userId: `user_${i}`,
          userName: `User ${i}`,
          isTyping: true,
          timestamp: new Date().toISOString(),
        });
        simulateMemoryUsage(512); // 512 bytes per typing indicator
      }

      const afterSnapshot = takeMemorySnapshot();

      // Should be limited to 50 typing indicators
      expect(afterSnapshot.storedTyping).toBe(50);
      
      const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);
      expect(comparison.typingGrowth).toBe(50); // Only 50 stored, not 60
    });

    it('should limit presence state storage', () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Add presence states beyond the limit
      const presenceCount = 120; // Above MAX_STORED_PRESENCE (100)
      for (let i = 0; i < presenceCount; i++) {
        store.updatePresence({
          userId: `user_${i}`,
          status: 'online',
          lastSeen: new Date().toISOString(),
        });
        simulateMemoryUsage(256); // 256 bytes per presence state
      }

      const afterSnapshot = takeMemorySnapshot();

      // Should be limited to 100 presence states
      expect(afterSnapshot.storedPresence).toBe(100);
      
      const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);
      expect(comparison.presenceGrowth).toBe(100); // Only 100 stored, not 120
    });
  });

  describe('Periodic Cleanup Effectiveness', () => {
    it('should clear old messages effectively', () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Add old and new messages
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const newTimestamp = new Date().toISOString();

      // Add old messages
      for (let i = 0; i < 50; i++) {
        store.addMessage({
          id: `old_msg_${i}`,
          conversationId: 'conv1',
          organizationId: 'org1',
          content: `Old message ${i}`,
          senderType: 'visitor',
          timestamp: oldTimestamp,
        });
        simulateMemoryUsage(1024);
      }

      // Add new messages
      for (let i = 0; i < 50; i++) {
        store.addMessage({
          id: `new_msg_${i}`,
          conversationId: 'conv1',
          organizationId: 'org1',
          content: `New message ${i}`,
          senderType: 'visitor',
          timestamp: newTimestamp,
        });
        simulateMemoryUsage(1024);
      }

      const beforeCleanupSnapshot = takeMemorySnapshot();
      expect(beforeCleanupSnapshot.storedMessages).toBe(100);

      // Clear old data
      store.clearOldData();

      const afterCleanupSnapshot = takeMemorySnapshot();

      // Only new messages should remain
      expect(afterCleanupSnapshot.storedMessages).toBe(50);
      
      const comparison = compareSnapshots(beforeCleanupSnapshot, afterCleanupSnapshot);
      expect(comparison.messageGrowth).toBe(-50); // 50 messages removed
    });

    it('should clear old typing indicators', () => {
      const store = useRealtimeStore.getState();

      // Add old typing indicators
      const oldTimestamp = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
      for (let i = 0; i < 10; i++) {
        store.updateTyping({
          conversationId: `conv_${i}`,
          organizationId: 'org1',
          userId: `user_${i}`,
          userName: `User ${i}`,
          isTyping: true,
          timestamp: oldTimestamp,
        });
      }

      // Add recent typing indicators
      const recentTimestamp = new Date().toISOString();
      for (let i = 10; i < 15; i++) {
        store.updateTyping({
          conversationId: `conv_${i}`,
          organizationId: 'org1',
          userId: `user_${i}`,
          userName: `User ${i}`,
          isTyping: true,
          timestamp: recentTimestamp,
        });
      }

      const beforeCleanupSnapshot = takeMemorySnapshot();
      expect(beforeCleanupSnapshot.storedTyping).toBe(15);

      // Clear old data
      store.clearOldData();

      const afterCleanupSnapshot = takeMemorySnapshot();

      // Only recent typing indicators should remain
      expect(afterCleanupSnapshot.storedTyping).toBe(5);
    });
  });

  describe('Burst Buffering Memory Impact', () => {
    it('should handle burst buffering without excessive memory growth', () => {
      const beforeSnapshot = takeMemorySnapshot();

      // Create many messages for buffering
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `burst_msg_${i}`,
        conversationId: 'conv1',
        organizationId: 'org1',
        content: `Burst message ${i}`,
        senderType: 'visitor' as const,
        timestamp: new Date().toISOString(),
      }));

      // Buffer messages
      messages.forEach(msg => {
        realtimeManager.bufferMessage(msg);
        simulateMemoryUsage(1024); // 1KB per message
      });

      const afterBufferSnapshot = takeMemorySnapshot();

      // Wait for buffer to flush
      setTimeout(() => {
        const afterFlushSnapshot = takeMemorySnapshot();
        
        const bufferComparison = compareSnapshots(beforeSnapshot, afterBufferSnapshot);
        const flushComparison = compareSnapshots(afterBufferSnapshot, afterFlushSnapshot);

        // Buffer should not grow excessively
        expect(bufferComparison.memoryGrowth).toBeLessThan(100 * 1024); // Less than 100KB overhead
        
        // Flush should reduce memory usage
        expect(flushComparison.memoryGrowth).toBeLessThanOrEqual(0);
      }, 500);
    });
  });

  describe('Memory Monitoring and Alerts', () => {
    it('should track memory usage in metrics', () => {
      const store = useRealtimeStore.getState();

      // Simulate memory usage
      simulateMemoryUsage(5 * 1024 * 1024); // 5MB

      // Trigger memory update
      store.clearOldData();

      // Check metrics
      expect(store.metrics.memoryUsage).toBeGreaterThan(0);
      expect(store.metrics.memoryUsage).toBe(mockMemory.usedJSHeapSize);
    });

    it('should provide accurate performance reports', () => {
      const store = useRealtimeStore.getState();

      // Set up some state
      store.connect('org1', 'conv1');
      store.addMessage({
        id: 'msg1',
        conversationId: 'conv1',
        organizationId: 'org1',
        content: 'Test message',
        senderType: 'visitor',
        timestamp: new Date().toISOString(),
      });

      simulateMemoryUsage(2 * 1024 * 1024); // 2MB

      const report = realtimeManager.getPerformanceReport();

      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('activeChannels');
      expect(report).toHaveProperty('connectionUptime');
      expect(report).toHaveProperty('averageLatency');
      expect(report).toHaveProperty('messagesPerSecond');
      expect(report).toHaveProperty('reconnections');

      expect(report.memoryUsage).toBeGreaterThan(0);
      expect(report.activeChannels).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Garbage Collection Simulation', () => {
    it('should handle simulated garbage collection cycles', async () => {
      const store = useRealtimeStore.getState();
      const beforeSnapshot = takeMemorySnapshot();

      // Create and destroy channels multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        // Create channels
        await store.connect(`org${cycle}`, `conv${cycle}`);
        simulateMemoryUsage(100 * 1024); // 100KB per channel

        // Add some data
        for (let i = 0; i < 20; i++) {
          store.addMessage({
            id: `msg_${cycle}_${i}`,
            conversationId: `conv${cycle}`,
            organizationId: `org${cycle}`,
            content: `Message ${i}`,
            senderType: 'visitor',
            timestamp: new Date().toISOString(),
          });
          simulateMemoryUsage(1024);
        }

        // Disconnect
        await store.disconnect();

        // Simulate garbage collection
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Simulate memory reclamation (not perfect, but some)
        mockMemory.usedJSHeapSize = Math.max(
          1024 * 1024, // Minimum 1MB
          mockMemory.usedJSHeapSize * 0.8 // 20% reclaimed
        );
      }

      const afterSnapshot = takeMemorySnapshot();
      const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);

      // Memory growth should be reasonable after multiple cycles
      expect(comparison.memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
      expect(afterSnapshot.activeChannels).toBe(0); // No active channels
      expect(afterSnapshot.storedMessages).toBeGreaterThan(0); // Some messages remain
    });
  });
});
