/**
 * Improved Memoized Selectors with Memory Management
 *
 * This module provides optimized selectors with proper memory management:
 * - Bounded cache sizes to prevent unbounded growth
 * - LRU (Least Recently Used) eviction strategy
 * - Automatic cleanup of stale data
 * - WeakMap usage where appropriate
 * - React.memo compatible selectors
 */

import type { Message } from "@/types";
import type { Conversation } from "@/types/entities/conversation";
import { useCampfireStore } from "./index";
import type { PhoenixStore } from "./phoenix-store";

// ============================================================================
// MEMORY MANAGEMENT UTILITIES
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

class BoundedCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly maxAge: number; // milliseconds

  constructor(maxSize = 100, maxAge = 5 * 60 * 1000) {
    // 5 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count and timestamp
    entry.accessCount++;
    entry.timestamp = Date.now();
    return entry.value;
  }

  set(key: K, value: V): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const score = entry.timestamp - entry.accessCount * 1000; // Favor frequently accessed
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// SINGLETON CACHES WITH MEMORY BOUNDS
// ============================================================================

// Use WeakMap for React component references
const componentCache = new WeakMap<any, any>();

// Bounded caches for different data types
const conversationCache = new BoundedCache<string, Conversation>(50);
const messagesCache = new BoundedCache<string, Message[]>(50);
const arrayCache = new BoundedCache<string, any[]>(100);

// Phase 9: Memory Management - Proper cleanup interval management
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    conversationCache.cleanup();
    messagesCache.cleanup();
    arrayCache.cleanup();
  }, 60 * 1000); // Clean up every minute
}

export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Auto-start cleanup in browser environment
if (typeof window !== "undefined") {
  startCacheCleanup();

  // Cleanup on page unload
  window.addEventListener("beforeunload", stopCacheCleanup);
}

// ============================================================================
// AUTH SELECTORS - OPTIMIZED
// ============================================================================

export const useAuth = () => useCampfireStore((state: PhoenixStore) => ({ user: state.user }));

export const useIsAuthenticated = () => useCampfireStore((state: PhoenixStore) => !!state.user);

export const useCurrentUser = () => useCampfireStore((state: PhoenixStore) => state.user);

export const useSessionStatus = () =>
  useCampfireStore((state: PhoenixStore) => ({
    isActive: !!state.user,
    expiresAt: null,
  }));

// ============================================================================
// UI SELECTORS - OPTIMIZED
// ============================================================================

export const useUI = () => useCampfireStore((state: PhoenixStore) => ({ loading: state.loading }));

export const useSelectedConversationId = () => useCampfireStore((state: PhoenixStore) => state.currentConversationId);

export const useSelectedKnowledgeId = () => useCampfireStore((state: PhoenixStore) => null);

export const useActiveModal = () => useCampfireStore((state: PhoenixStore) => null);

export const useSidebarState = () =>
  useCampfireStore((state: PhoenixStore) => ({
    isOpen: false,
    isCollapsed: false,
  }));

// ============================================================================
// CONVERSATION SELECTORS - OPTIMIZED WITH CACHING
// ============================================================================

export const useConversations = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "all-conversations";
    const cached = arrayCache.get(cacheKey);

    // Check if conversations array has changed
    if (cached && cached.length === state.conversations.length) {
      return cached;
    }

    const conversations = state.conversations;
    arrayCache.set(cacheKey, conversations);
    return conversations;
  });
};

export const useConversation = (id: string | null) => {
  return useCampfireStore((state: PhoenixStore) => {
    if (!id) return null;

    const cached = conversationCache.get(id);
    const current = state.conversations.find((c: any) => c.id === id) as Conversation | undefined;

    if (cached === current) {
      return cached;
    }

    if (current) {
      conversationCache.set(id, current);
    }

    return current || null;
  });
};

export const useActiveConversations = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "active-conversations";
    const cached = arrayCache.get(cacheKey);

    if (cached) {
      // Quick check if cache is still valid
      const activeCount = state.conversations.filter((c: any) => c.status === "active").length;
      if (cached.length === activeCount) {
        return cached;
      }
    }

    const active = state.conversations.filter((c: any) => c.status === "active");
    arrayCache.set(cacheKey, active);
    return active;
  });
};

export const useSelectedConversation = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const selectedId = state.currentConversationId;
    if (!selectedId) return null;

    const cached = conversationCache.get(selectedId);
    const current = state.conversations.find((c: any) => c.id === selectedId) as Conversation | undefined;

    if (cached === current) {
      return cached;
    }

    if (current) {
      conversationCache.set(selectedId, current);
    }

    return current || null;
  });
};

// ============================================================================
// MESSAGE SELECTORS - OPTIMIZED WITH CACHING
// ============================================================================

export const useMessages = (conversationId: string | null) => {
  return useCampfireStore((state: PhoenixStore) => {
    if (!conversationId) return [];

    const cached = messagesCache.get(conversationId);
    const current = state.messages[conversationId];

    if (cached === current) {
      return cached;
    }

    const messages = (current || []) as unknown as Message[];
    messagesCache.set(conversationId, messages);
    return messages;
  });
};

export const useSelectedConversationMessages = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const selectedId = state.currentConversationId;
    if (!selectedId) return [];

    const cached = messagesCache.get(selectedId);
    const current = state.messages[selectedId];

    if (cached === current) {
      return cached;
    }

    const messages = (current || []) as unknown as Message[];
    messagesCache.set(selectedId, messages);
    return messages;
  });
};

// ============================================================================
// AGENT SELECTORS - OPTIMIZED
// ============================================================================

export const useAgents = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "all-agents";
    const cached = arrayCache.get(cacheKey);

    if (cached && cached.length === 0) {
      return cached;
    }

    const agents: any[] = [];
    arrayCache.set(cacheKey, agents);
    return agents;
  });
};

export const useAgent = (id: string | null) => {
  return useCampfireStore((state: PhoenixStore) => {
    if (!id) return null;
    return null;
  });
};

export const useOnlineAgents = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "online-agents";
    const cached = arrayCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const online: any[] = [];
    arrayCache.set(cacheKey, online);
    return online;
  });
};

// ============================================================================
// REAL-TIME SELECTORS - OPTIMIZED
// ============================================================================

export const useRealtime = () => useCampfireStore((state: PhoenixStore) => ({ isConnected: false }));

export const useRealtimeConnection = () =>
  useCampfireStore((state: PhoenixStore) => ({
    isConnected: false,
    status: "disconnected",
    lastConnectedAt: null,
  }));

export const useActiveChannels = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "active-channels";
    const cached = arrayCache.get(cacheKey);

    if (cached && cached.length === 0) {
      return cached;
    }

    const channels: any[] = [];
    arrayCache.set(cacheKey, channels);
    return channels;
  });
};

export const useOnlineUsers = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "online-users";
    const cached = arrayCache.get(cacheKey);

    if (cached && cached.length === 0) {
      return cached;
    }

    const users: any[] = [];
    arrayCache.set(cacheKey, users);
    return users;
  });
};

export const useTypingUsers = (conversationId: string) => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = `typing-${conversationId}`;
    const cached = arrayCache.get(cacheKey);

    if (cached && cached.length === 0) {
      return cached;
    }

    // Return properly typed empty array for now
    // This should be connected to actual typing state from realtime
    const users: Array<{
      userId: string;
      userName: string;
      userAvatar?: string;
      userType: "agent" | "visitor" | "ai";
      timestamp: string;
    }> = [];
    arrayCache.set(cacheKey, users);
    return users;
  });
};

// ============================================================================
// KNOWLEDGE BASE SELECTORS - OPTIMIZED
// ============================================================================

export const useKnowledge = () => useCampfireStore((state: PhoenixStore) => ({ items: [] }));

export const useKnowledgeItems = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "knowledge-items";
    const cached = arrayCache.get(cacheKey);

    if (cached && cached.length === 0) {
      return cached;
    }

    const items: any[] = [];
    arrayCache.set(cacheKey, items);
    return items;
  });
};

// ============================================================================
// ANALYTICS SELECTORS - OPTIMIZED
// ============================================================================

export const useAnalytics = () => useCampfireStore((state: PhoenixStore) => state.analytics);

export const usePerformanceMetrics = () => useCampfireStore((state: PhoenixStore) => ({}));

export const useUsageStats = () => useCampfireStore((state: PhoenixStore) => ({}));

// ============================================================================
// SETTINGS SELECTORS
// ============================================================================

export const useSettings = () => useCampfireStore((state: PhoenixStore) => ({ theme: "light", notifications: {} }));

export const useTheme = () => useCampfireStore((state: PhoenixStore) => "light");

export const useNotificationSettings = () => useCampfireStore((state: PhoenixStore) => ({}));

// ============================================================================
// COMPLEX SELECTORS WITH MEMOIZATION
// ============================================================================

export const useConversationStats = () => {
  return useCampfireStore((state: PhoenixStore) => {
    const cacheKey = "conversation-stats";
    const cached = arrayCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const conversations = state.conversations;
    const stats = {
      total: conversations.length,
      active: conversations.filter((c: any) => c.status === "active").length,
      resolved: conversations.filter((c: any) => c.status === "resolved").length,
      pending: conversations.filter((c: any) => c.status === "pending").length,
    };

    // Note: Cache expects arrays, but this is an object. Skip caching for now.
    // arrayCache.set(cacheKey, stats);
    return stats;
  });
};

// ============================================================================
// MEMORY CLEANUP UTILITIES
// ============================================================================

export const cleanupMemory = () => {
  // Stop cleanup interval to prevent memory leaks
  stopCacheCleanup();

  // Clear all caches
  conversationCache.clear();
  messagesCache.clear();
  arrayCache.clear();

  // Restart cleanup interval
  startCacheCleanup();
};

// Expose for testing and manual cleanup
export const getCacheStats = () => ({
  conversationCacheSize: conversationCache["cache"].size,
  messagesCacheSize: messagesCache["cache"].size,
  arrayCacheSize: arrayCache["cache"].size,
});
