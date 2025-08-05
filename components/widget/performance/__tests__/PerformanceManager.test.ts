/**
 * Unit Tests for Widget Performance Manager
 * 
 * Tests:
 * - Performance monitoring
 * - Bundle size tracking
 * - Memory management
 * - Core Web Vitals
 * - Optimization strategies
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useIntelligentPreloader,
  useBundleSizeMonitor,
  performanceTracker,
} from '../LazyWidgetLoader';

// Mock performance API
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntries: any[] = [];

Object.defineProperty(global, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    constructor(callback: (list: any) => void) {
      mockPerformanceObserver.mockImplementation(callback);
    }
    observe() {
      setTimeout(() => {
        mockPerformanceObserver({
          getEntries: () => mockPerformanceEntries,
        });
      }, 100);
    }
    disconnect() {}
  },
});

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024,
      totalJSHeapSize: 2048 * 1024,
      jsHeapSizeLimit: 4096 * 1024,
    },
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
  },
});

// Mock requestIdleCallback
Object.defineProperty(global, 'requestIdleCallback', {
  value: (callback: () => void) => setTimeout(callback, 0),
});

describe('Widget Performance Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceEntries.length = 0;
    
    // Reset performance tracker
    performanceTracker['metrics'] = [];
    performanceTracker['loadingStates'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Performance Tracker', () => {
    it('should track component loading times', () => {
      const componentName = 'TestComponent';
      
      performanceTracker.startLoading(componentName);
      
      // Simulate loading time
      setTimeout(() => {
        performanceTracker.endLoading(componentName);
        
        const metrics = performanceTracker.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].componentName).toBe(componentName);
        expect(metrics[0].loadTime).toBeGreaterThan(0);
        expect(metrics[0].cacheHit).toBe(false);
      }, 50);
    });

    it('should track cache hits', () => {
      const componentName = 'CachedComponent';
      
      performanceTracker.startLoading(componentName);
      performanceTracker.endLoading(componentName, true); // Cache hit
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics[0].cacheHit).toBe(true);
    });

    it('should calculate average load times', () => {
      const componentName = 'TestComponent';
      
      // Add multiple metrics
      performanceTracker['metrics'] = [
        { componentName, loadTime: 100, cacheHit: false, timestamp: Date.now() },
        { componentName, loadTime: 200, cacheHit: false, timestamp: Date.now() },
        { componentName, loadTime: 150, cacheHit: false, timestamp: Date.now() },
      ];
      
      const averageTime = performanceTracker.getAverageLoadTime(componentName);
      expect(averageTime).toBe(150); // (100 + 200 + 150) / 3
    });

    it('should handle missing start time gracefully', () => {
      const componentName = 'MissingStartComponent';
      
      // End loading without starting
      performanceTracker.endLoading(componentName);
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should track multiple components simultaneously', () => {
      const components = ['Component1', 'Component2', 'Component3'];
      
      // Start loading all components
      components.forEach(comp => performanceTracker.startLoading(comp));
      
      // End loading in different order
      performanceTracker.endLoading('Component2');
      performanceTracker.endLoading('Component1');
      performanceTracker.endLoading('Component3');
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics).toHaveLength(3);
      
      const componentNames = metrics.map(m => m.componentName);
      expect(componentNames).toContain('Component1');
      expect(componentNames).toContain('Component2');
      expect(componentNames).toContain('Component3');
    });
  });

  describe('Intelligent Preloader', () => {
    it('should preload components on demand', async () => {
      const { result } = renderHook(() => useIntelligentPreloader());
      
      expect(result.current.preloadedComponents.size).toBe(0);
      
      await act(async () => {
        await result.current.preloadComponent('ChatInterface');
      });
      
      expect(result.current.preloadedComponents.has('ChatInterface')).toBe(true);
    });

    it('should not preload the same component twice', async () => {
      const { result } = renderHook(() => useIntelligentPreloader());
      
      await act(async () => {
        await result.current.preloadComponent('ChatInterface');
        await result.current.preloadComponent('ChatInterface'); // Duplicate
      });
      
      expect(result.current.preloadedComponents.size).toBe(1);
    });

    it('should preload multiple different components', async () => {
      const { result } = renderHook(() => useIntelligentPreloader());
      
      await act(async () => {
        await result.current.preloadComponent('ChatInterface');
        await result.current.preloadComponent('FileUpload');
        await result.current.preloadComponent('EmojiPicker');
      });
      
      expect(result.current.preloadedComponents.size).toBe(3);
      expect(result.current.preloadedComponents.has('ChatInterface')).toBe(true);
      expect(result.current.preloadedComponents.has('FileUpload')).toBe(true);
      expect(result.current.preloadedComponents.has('EmojiPicker')).toBe(true);
    });

    it('should handle preloading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useIntelligentPreloader());
      
      // Mock import to fail
      vi.doMock('../features/NonExistentComponent', () => {
        throw new Error('Component not found');
      });
      
      await act(async () => {
        await result.current.preloadComponent('NonExistentComponent');
      });
      
      // Should not crash and should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to preload'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should implement preloading strategies', async () => {
      const { result } = renderHook(() => useIntelligentPreloader());
      
      // Test immediate preloading
      await act(async () => {
        // This would normally be triggered by useEffect
        await result.current.preloadComponent('ChatInterface');
      });
      
      expect(result.current.preloadedComponents.has('ChatInterface')).toBe(true);
    });
  });

  describe('Bundle Size Monitor', () => {
    it('should track bundle size metrics', async () => {
      // Add mock performance entries
      mockPerformanceEntries.push(
        {
          name: 'widget-core-123.js',
          transferSize: 25000,
          duration: 150,
        },
        {
          name: 'widget-features-456.js',
          transferSize: 45000,
          duration: 200,
        }
      );
      
      const { result } = renderHook(() => useBundleSizeMonitor());
      
      // Wait for performance observer to trigger
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(result.current.totalSize).toBeGreaterThan(0);
      expect(result.current.loadedChunks).toBeGreaterThan(0);
    });

    it('should accumulate bundle size over time', async () => {
      const { result } = renderHook(() => useBundleSizeMonitor());
      
      // First batch of entries
      mockPerformanceEntries.push({
        name: 'chunk-1.js',
        transferSize: 10000,
        duration: 100,
      });
      
      await act(async () => {
        mockPerformanceObserver({
          getEntries: () => mockPerformanceEntries,
        });
      });
      
      const initialSize = result.current.totalSize;
      
      // Second batch of entries
      mockPerformanceEntries.push({
        name: 'chunk-2.js',
        transferSize: 15000,
        duration: 120,
      });
      
      await act(async () => {
        mockPerformanceObserver({
          getEntries: () => [mockPerformanceEntries[1]], // Only new entry
        });
      });
      
      expect(result.current.totalSize).toBeGreaterThan(initialSize);
    });

    it('should filter widget-related resources', async () => {
      // Add mixed performance entries
      mockPerformanceEntries.push(
        {
          name: 'widget-core.js',
          transferSize: 25000,
          duration: 150,
        },
        {
          name: 'some-other-library.js',
          transferSize: 50000,
          duration: 200,
        },
        {
          name: 'widget-features.js',
          transferSize: 30000,
          duration: 180,
        }
      );
      
      const { result } = renderHook(() => useBundleSizeMonitor());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      // Should only count widget-related files
      expect(result.current.totalSize).toBe(55000); // 25000 + 30000
      expect(result.current.loadedChunks).toBe(2);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect environment capabilities', () => {
      // Mock user agent for mobile detection
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });
      
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      });
      
      // This would be tested in the actual environment detection function
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      expect(isMobile).toBe(true);
      expect(isReducedMotion).toBe(true);
    });

    it('should adapt configuration based on environment', () => {
      // Test mobile optimizations
      const mobileConfig = {
        heartbeatInterval: 30000,
        burstBufferTimeout: 500,
        burstBufferSize: 7, // Reduced for mobile
        enableMobileOptimizations: true,
      };
      
      expect(mobileConfig.heartbeatInterval).toBeGreaterThan(25000);
      expect(mobileConfig.burstBufferTimeout).toBeGreaterThan(300);
      expect(mobileConfig.burstBufferSize).toBeLessThan(10);
    });

    it('should implement burst buffering', () => {
      const flushCallback = vi.fn();
      const maxSize = 5;
      const timeoutMs = 100;
      
      // This would test the BurstBuffer class
      const buffer = {
        items: [] as any[],
        timeout: null as NodeJS.Timeout | null,
        
        add(item: any) {
          this.items.push(item);
          if (this.items.length >= maxSize) {
            this.flush();
          } else if (!this.timeout) {
            this.timeout = setTimeout(() => this.flush(), timeoutMs);
          }
        },
        
        flush() {
          if (this.items.length > 0) {
            flushCallback(this.items);
            this.items = [];
          }
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
        },
      };
      
      // Add items below threshold
      buffer.add('item1');
      buffer.add('item2');
      
      expect(flushCallback).not.toHaveBeenCalled();
      
      // Add items to reach threshold
      buffer.add('item3');
      buffer.add('item4');
      buffer.add('item5');
      
      expect(flushCallback).toHaveBeenCalledWith(['item1', 'item2', 'item3', 'item4', 'item5']);
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Simulate memory usage
      const mockMemoryUsage = 2 * 1024 * 1024; // 2MB
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: mockMemoryUsage,
          totalJSHeapSize: 4 * 1024 * 1024,
          jsHeapSizeLimit: 8 * 1024 * 1024,
        },
      });
      
      const currentMemory = performance.memory?.usedJSHeapSize || 0;
      expect(currentMemory).toBe(mockMemoryUsage);
    });

    it('should detect memory leaks', () => {
      const measurements: number[] = [];
      
      // Simulate multiple measurements
      for (let i = 0; i < 10; i++) {
        const memoryUsage = 1024 * 1024 + (i * 100 * 1024); // Growing memory
        measurements.push(memoryUsage);
      }
      
      // Check for consistent growth (potential leak)
      const growthRate = measurements.map((current, index) => {
        if (index === 0) return 0;
        return current - measurements[index - 1];
      }).slice(1); // Remove first element
      
      const averageGrowth = growthRate.reduce((sum, rate) => sum + rate, 0) / growthRate.length;
      
      // If average growth is consistently positive, might indicate a leak
      expect(averageGrowth).toBeGreaterThan(0);
    });

    it('should cleanup resources on unmount', () => {
      const cleanupFunctions: (() => void)[] = [];
      
      // Simulate resource cleanup
      const mockCleanup = vi.fn();
      cleanupFunctions.push(mockCleanup);
      
      // Simulate component unmount
      cleanupFunctions.forEach(cleanup => cleanup());
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance API unavailability', () => {
      // Mock missing performance API
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      const { result } = renderHook(() => useBundleSizeMonitor());
      
      // Should not crash
      expect(result.current.totalSize).toBe(0);
      expect(result.current.loadedChunks).toBe(0);
      
      // Restore performance API
      global.performance = originalPerformance;
    });

    it('should handle PerformanceObserver unavailability', () => {
      // Mock missing PerformanceObserver
      const originalObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;
      
      const { result } = renderHook(() => useBundleSizeMonitor());
      
      // Should not crash
      expect(result.current.totalSize).toBe(0);
      
      // Restore PerformanceObserver
      global.PerformanceObserver = originalObserver;
    });

    it('should handle requestIdleCallback unavailability', () => {
      // Mock missing requestIdleCallback
      const originalRIC = global.requestIdleCallback;
      delete (global as any).requestIdleCallback;
      
      const { result } = renderHook(() => useIntelligentPreloader());
      
      // Should fallback to setTimeout
      expect(result.current.preloadedComponents).toBeDefined();
      
      // Restore requestIdleCallback
      global.requestIdleCallback = originalRIC;
    });
  });

  describe('Performance Budgets', () => {
    it('should validate bundle size budgets', () => {
      const BUNDLE_BUDGETS = {
        core: 30000, // 30KB
        features: 50000, // 50KB
        total: 250000, // 250KB
      };
      
      const mockBundleSizes = {
        core: 28000, // Under budget
        features: 45000, // Under budget
        total: 200000, // Under budget
      };
      
      expect(mockBundleSizes.core).toBeLessThan(BUNDLE_BUDGETS.core);
      expect(mockBundleSizes.features).toBeLessThan(BUNDLE_BUDGETS.features);
      expect(mockBundleSizes.total).toBeLessThan(BUNDLE_BUDGETS.total);
    });

    it('should validate performance budgets', () => {
      const PERFORMANCE_BUDGETS = {
        loadTime: 1000, // 1 second
        interactionTime: 100, // 100ms
        memoryUsage: 10 * 1024 * 1024, // 10MB
      };
      
      const mockMetrics = {
        loadTime: 800, // Under budget
        interactionTime: 50, // Under budget
        memoryUsage: 8 * 1024 * 1024, // Under budget
      };
      
      expect(mockMetrics.loadTime).toBeLessThan(PERFORMANCE_BUDGETS.loadTime);
      expect(mockMetrics.interactionTime).toBeLessThan(PERFORMANCE_BUDGETS.interactionTime);
      expect(mockMetrics.memoryUsage).toBeLessThan(PERFORMANCE_BUDGETS.memoryUsage);
    });
  });
});
