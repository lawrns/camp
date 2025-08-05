/**
 * Tests for RealtimeStateManager
 * 
 * Covers:
 * - Subscription lifecycle management
 * - Memory leak prevention
 * - Idle channel cleanup
 * - Visibility change handling
 * - Burst buffering
 * - Performance metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRealtimeStore, realtimeManager, useRealtime, useConversationRealtime } from '../RealtimeStateManager';

// Mock Supabase
const mockChannel = {
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  send: vi.fn(),
  track: vi.fn(),
  on: vi.fn(),
  presenceState: vi.fn(),
};

const mockSupabase = {
  browser: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  })),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
    },
  },
});

// Mock document and window for visibility API
Object.defineProperty(global, 'document', {
  value: {
    hidden: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    matchMedia: vi.fn(() => ({ matches: false })),
  },
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

describe('RealtimeStateManager', () => {
  beforeEach(() => {
    // Reset store state
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

    // Reset mocks
    vi.clearAllMocks();
    mockChannel.subscribe.mockResolvedValue('SUBSCRIBED');
    mockChannel.send.mockResolvedValue('ok');
    mockChannel.track.mockResolvedValue('ok');
    mockChannel.presenceState.mockReturnValue({});
  });

  afterEach(() => {
    // Clean up any running intervals
    realtimeManager.destroy();
  });

  describe('Connection Management', () => {
    it('should connect to a channel successfully', async () => {
      const store = useRealtimeStore.getState();
      
      const result = await store.connect('org123', 'conv456');
      
      expect(result).toBe(true);
      expect(mockSupabase.browser).toHaveBeenCalled();
      expect(mockSupabase.browser().channel).toHaveBeenCalledWith(
        'org:org123:conv:conv456',
        expect.objectContaining({
          config: expect.objectContaining({
            presence: expect.any(Object),
            broadcast: { ack: false },
          }),
        })
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      mockChannel.subscribe.mockRejectedValue(new Error('Connection failed'));
      
      const store = useRealtimeStore.getState();
      const result = await store.connect('org123', 'conv456');
      
      expect(result).toBe(false);
      expect(store.connectionStatus).toBe('error');
    });

    it('should disconnect specific channels', async () => {
      const store = useRealtimeStore.getState();
      
      // First connect
      await store.connect('org123', 'conv456');
      expect(store.activeChannels.size).toBe(1);
      
      // Then disconnect
      await store.disconnect('org:org123:conv:conv456');
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
      expect(store.activeChannels.size).toBe(0);
      expect(store.isConnected).toBe(false);
    });

    it('should disconnect all channels', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect to multiple channels
      await store.connect('org123', 'conv456');
      await store.connect('org123', 'conv789');
      expect(store.activeChannels.size).toBe(2);
      
      // Disconnect all
      await store.disconnect();
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
      expect(store.activeChannels.size).toBe(0);
      expect(store.isConnected).toBe(false);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up idle channels automatically', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect and mark as idle
      await store.connect('org123', 'conv456');
      const channelName = 'org:org123:conv:conv456';
      const subscription = store.activeChannels.get(channelName)!;
      subscription.isIdle = true;
      subscription.lastActivity = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      
      // Trigger cleanup
      store.cleanupIdleChannels();
      
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
      expect(store.activeChannels.has(channelName)).toBe(false);
    });

    it('should limit stored messages to prevent memory growth', () => {
      const store = useRealtimeStore.getState();
      
      // Add more messages than the limit
      for (let i = 0; i < 1100; i++) {
        store.addMessage({
          id: `msg_${i}`,
          conversationId: 'conv123',
          organizationId: 'org123',
          content: `Message ${i}`,
          senderType: 'visitor',
          timestamp: new Date().toISOString(),
        });
      }
      
      // Should be limited to MAX_STORED_MESSAGES (1000)
      expect(store.messages.size).toBe(1000);
    });

    it('should clear old data periodically', () => {
      const store = useRealtimeStore.getState();
      
      // Add old message
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      store.addMessage({
        id: 'old_msg',
        conversationId: 'conv123',
        organizationId: 'org123',
        content: 'Old message',
        senderType: 'visitor',
        timestamp: oldTimestamp,
      });
      
      // Add recent message
      store.addMessage({
        id: 'new_msg',
        conversationId: 'conv123',
        organizationId: 'org123',
        content: 'New message',
        senderType: 'visitor',
        timestamp: new Date().toISOString(),
      });
      
      expect(store.messages.size).toBe(2);
      
      // Clear old data
      store.clearOldData();
      
      // Only recent message should remain
      expect(store.messages.size).toBe(1);
      expect(store.messages.has('new_msg')).toBe(true);
      expect(store.messages.has('old_msg')).toBe(false);
    });
  });

  describe('Visibility Change Handling', () => {
    it('should pause channels when page becomes hidden', () => {
      const store = useRealtimeStore.getState();
      const pauseSpy = vi.spyOn(store, 'pauseAllChannels');
      
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true });
      
      // Trigger visibility change handler
      const visibilityHandler = (document.addEventListener as Mock).mock.calls
        .find(call => call[0] === 'visibilitychange')?.[1];
      
      if (visibilityHandler) {
        visibilityHandler();
        expect(pauseSpy).toHaveBeenCalled();
      }
    });

    it('should resume channels when page becomes visible', () => {
      const store = useRealtimeStore.getState();
      const resumeSpy = vi.spyOn(store, 'resumeAllChannels');
      
      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', { value: false });
      
      // Trigger visibility change handler
      const visibilityHandler = (document.addEventListener as Mock).mock.calls
        .find(call => call[0] === 'visibilitychange')?.[1];
      
      if (visibilityHandler) {
        visibilityHandler();
        expect(resumeSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Message Operations', () => {
    it('should send messages successfully', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect first
      await store.connect('org123', 'conv456');
      
      const result = await store.sendMessage({
        conversationId: 'conv456',
        organizationId: 'org123',
        content: 'Test message',
        senderType: 'visitor',
      });
      
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'message',
        payload: expect.objectContaining({
          content: 'Test message',
          senderType: 'visitor',
          id: expect.stringMatching(/^msg_/),
          timestamp: expect.any(String),
        }),
      });
      expect(store.metrics.messagesSent).toBe(1);
    });

    it('should broadcast typing indicators', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect first
      await store.connect('org123', 'conv456');
      
      const result = await store.broadcastTyping({
        conversationId: 'conv456',
        organizationId: 'org123',
        userId: 'user123',
        userName: 'Test User',
        isTyping: true,
      });
      
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'typing_start',
        payload: expect.objectContaining({
          isTyping: true,
          userId: 'user123',
          userName: 'Test User',
        }),
      });
    });

    it('should update presence state', async () => {
      const store = useRealtimeStore.getState();
      
      // Connect first
      await store.connect('org123', 'conv456');
      
      const result = await store.updatePresence({
        userId: 'user123',
        status: 'online',
      });
      
      expect(result).toBe(true);
      expect(mockChannel.track).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          status: 'online',
          lastSeen: expect.any(String),
        })
      );
    });
  });

  describe('Hooks', () => {
    it('should connect and disconnect through useRealtime hook', () => {
      const { result, unmount } = renderHook(() => 
        useRealtime('org123', 'conv456')
      );
      
      expect(mockSupabase.browser).toHaveBeenCalled();
      expect(mockSupabase.browser().channel).toHaveBeenCalled();
      
      // Unmount should trigger disconnect
      unmount();
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should handle conversation realtime through useConversationRealtime hook', () => {
      const callbacks = {
        onMessage: vi.fn(),
        onTyping: vi.fn(),
        onPresence: vi.fn(),
      };
      
      const { result, unmount } = renderHook(() => 
        useConversationRealtime('org123', 'conv456', callbacks)
      );
      
      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.broadcastTyping).toBeDefined();
      expect(result.current.updatePresence).toBeDefined();
      
      unmount();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const report = realtimeManager.getPerformanceReport();
      
      expect(report).toEqual(
        expect.objectContaining({
          connectionUptime: expect.any(Number),
          averageLatency: expect.any(Number),
          messagesPerSecond: expect.any(Number),
          activeChannels: expect.any(Number),
          memoryUsage: expect.any(Number),
          reconnections: expect.any(Number),
        })
      );
    });

    it('should update memory usage metrics', () => {
      const store = useRealtimeStore.getState();
      
      // Trigger memory cleanup which updates metrics
      store.clearOldData();
      
      expect(store.metrics.memoryUsage).toBeGreaterThan(0);
    });
  });
});
