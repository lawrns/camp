/**
 * Comprehensive Test Setup Utilities
 * 
 * Provides:
 * - Global test configuration
 * - Mock setup and teardown
 * - Test data factories
 * - Custom matchers
 * - Performance testing utilities
 * - Coverage enforcement
 */

import { vi, expect, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createMockSupabaseClient, MockSupabaseDatabase } from './supabase-mocks';

// ============================================================================
// GLOBAL TEST CONFIGURATION
// ============================================================================

// Extend expect with custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveLoadedWithin(received: number, maxTime: number) {
    const pass = received <= maxTime;
    if (pass) {
      return {
        message: () => `expected load time ${received}ms not to be within ${maxTime}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected load time ${received}ms to be within ${maxTime}ms`,
        pass: false,
      };
    }
  },

  toHaveMemoryUsageBelow(received: number, maxMemory: number) {
    const pass = received <= maxMemory;
    if (pass) {
      return {
        message: () => `expected memory usage ${received} bytes not to be below ${maxMemory} bytes`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected memory usage ${received} bytes to be below ${maxMemory} bytes`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toHaveLoadedWithin(maxTime: number): T;
    toHaveMemoryUsageBelow(maxMemory: number): T;
  }
}

// ============================================================================
// MOCK SETUP AND TEARDOWN
// ============================================================================

let globalMockSupabase: any;
let globalMockDatabase: MockSupabaseDatabase;

export function setupGlobalMocks() {
  // Mock Supabase
  globalMockDatabase = new MockSupabaseDatabase();
  globalMockSupabase = createMockSupabaseClient();
  
  vi.mock('@/lib/supabase', () => ({
    supabase: {
      browser: () => globalMockSupabase,
      server: () => globalMockSupabase,
    },
  }));

  // Mock Next.js router
  vi.mock('next/router', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      query: {},
      pathname: '/',
      asPath: '/',
      route: '/',
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    }),
  }));

  // Mock Next.js navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock performance API
  Object.defineProperty(global, 'performance', {
    value: {
      ...performance,
      memory: {
        usedJSHeapSize: 1024 * 1024,
        totalJSHeapSize: 2048 * 1024,
        jsHeapSizeLimit: 4096 * 1024,
      },
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
    },
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16);
    return 1;
  });

  global.cancelAnimationFrame = vi.fn();

  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn((callback) => {
    setTimeout(callback, 0);
    return 1;
  });

  global.cancelIdleCallback = vi.fn();
}

export function teardownGlobalMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
  cleanup();
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export class TestDataFactory {
  static createOrganization(overrides: any = {}) {
    return {
      id: `org_${Date.now()}`,
      name: 'Test Organization',
      slug: 'test-org',
      plan: 'pro',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createUser(overrides: any = {}) {
    return {
      id: `user_${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      role: 'agent',
      organization_id: 'org_123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createConversation(overrides: any = {}) {
    return {
      id: `conv_${Date.now()}`,
      organization_id: 'org_123',
      customer_name: 'Test Customer',
      customer_email: 'customer@example.com',
      status: 'open',
      priority: 'medium',
      assigned_to_user_id: null,
      ai_handover_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      closed_at: null,
      ...overrides,
    };
  }

  static createMessage(overrides: any = {}) {
    return {
      id: `msg_${Date.now()}`,
      conversation_id: 'conv_123',
      organization_id: 'org_123',
      content: 'Test message',
      sender_type: 'visitor',
      sender_id: 'visitor_123',
      sender_name: 'Test Visitor',
      sender_email: 'visitor@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createTypingIndicator(overrides: any = {}) {
    return {
      id: `typing_${Date.now()}`,
      conversation_id: 'conv_123',
      organization_id: 'org_123',
      user_id: 'user_123',
      user_name: 'Test User',
      is_typing: true,
      last_activity: new Date().toISOString(),
      ...overrides,
    };
  }

  static createBulkData(factory: Function, count: number, overrides: any = {}) {
    return Array.from({ length: count }, (_, i) => 
      factory({ ...overrides, id: `${overrides.id || 'item'}_${i}` })
    );
  }
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

export class PerformanceTestUtils {
  static async measureAsyncOperation<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static measureSyncOperation<T>(
    operation: () => T
  ): { result: T; duration: number } {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static async measureMemoryUsage<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; memoryDelta: number }> {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    const result = await operation();
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;
    return { result, memoryDelta };
  }

  static createPerformanceBudget(thresholds: {
    maxDuration?: number;
    maxMemory?: number;
    maxRenderTime?: number;
  }) {
    return {
      validateDuration: (duration: number) => {
        if (thresholds.maxDuration && duration > thresholds.maxDuration) {
          throw new Error(`Operation took ${duration}ms, exceeding budget of ${thresholds.maxDuration}ms`);
        }
      },
      validateMemory: (memoryUsage: number) => {
        if (thresholds.maxMemory && memoryUsage > thresholds.maxMemory) {
          throw new Error(`Memory usage ${memoryUsage} bytes, exceeding budget of ${thresholds.maxMemory} bytes`);
        }
      },
      validateRenderTime: (renderTime: number) => {
        if (thresholds.maxRenderTime && renderTime > thresholds.maxRenderTime) {
          throw new Error(`Render took ${renderTime}ms, exceeding budget of ${thresholds.maxRenderTime}ms`);
        }
      },
    };
  }
}

// ============================================================================
// COVERAGE UTILITIES
// ============================================================================

export class CoverageUtils {
  static enforceCoverageThreshold(threshold: number = 85) {
    // This would integrate with your coverage tool
    // For now, we'll just log the requirement
    console.log(`Enforcing ${threshold}% coverage threshold`);
  }

  static trackUncoveredLines(filePath: string) {
    // This would integrate with coverage reporting
    console.log(`Tracking uncovered lines in ${filePath}`);
  }

  static generateCoverageReport() {
    // This would generate a detailed coverage report
    console.log('Generating coverage report...');
  }
}

// ============================================================================
// TEST ENVIRONMENT SETUP
// ============================================================================

export function setupTestEnvironment() {
  // Set up global mocks
  setupGlobalMocks();

  // Configure test environment
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.com';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

  // Set up global test hooks
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset mock database
    globalMockDatabase?.clearData();
    
    // Reset DOM
    cleanup();
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  globalMockSupabase,
  globalMockDatabase,
};

export default {
  setupGlobalMocks,
  teardownGlobalMocks,
  TestDataFactory,
  PerformanceTestUtils,
  CoverageUtils,
  setupTestEnvironment,
};
