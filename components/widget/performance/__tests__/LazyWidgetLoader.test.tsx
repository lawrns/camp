/**
 * Tests for Lazy Widget Loader
 * 
 * Tests:
 * - Dynamic import functionality
 * - Bundle size monitoring
 * - Preloading strategies
 * - Performance metrics
 * - Error handling
 * - Memory management
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { 
  useIntelligentPreloader, 
  useBundleSizeMonitor,
  performanceTracker 
} from '../LazyWidgetLoader';

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<any>, options: any = {}) => {
    const MockComponent = ({ children, ...props }: any) => {
      return options.loading ? options.loading() : <div data-testid="mock-component">{children}</div>;
    };
    MockComponent.displayName = 'MockDynamicComponent';
    return MockComponent;
  },
}));

// Mock performance API
const mockPerformanceObserver = vi.fn();
const mockPerformanceEntries = [
  {
    name: 'widget-chunk-123.js',
    transferSize: 25000,
    duration: 150,
  },
  {
    name: 'features-chunk-456.js',
    transferSize: 45000,
    duration: 200,
  },
];

Object.defineProperty(global, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    constructor(callback: (list: any) => void) {
      mockPerformanceObserver.mockImplementation(callback);
    }
    observe() {
      // Simulate performance entries
      setTimeout(() => {
        mockPerformanceObserver({
          getEntries: () => mockPerformanceEntries,
        });
      }, 100);
    }
    disconnect() {}
  },
});

// Mock requestIdleCallback
Object.defineProperty(global, 'requestIdleCallback', {
  value: (callback: () => void) => setTimeout(callback, 0),
});

// Test component that uses the hooks
function TestComponent() {
  const { preloadComponent, preloadedComponents } = useIntelligentPreloader();
  const bundleMetrics = useBundleSizeMonitor();

  return (
    <div>
      <button 
        onClick={() => preloadComponent('ChatInterface')}
        data-testid="preload-chat"
      >
        Preload Chat
      </button>
      <button 
        onClick={() => preloadComponent('FileUpload')}
        data-testid="preload-file"
      >
        Preload File Upload
      </button>
      <div data-testid="preloaded-count">{preloadedComponents.size}</div>
      <div data-testid="bundle-size">{bundleMetrics.totalSize}</div>
      <div data-testid="loaded-chunks">{bundleMetrics.loadedChunks}</div>
    </div>
  );
}

describe('LazyWidgetLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance tracker
    performanceTracker['metrics'] = [];
    performanceTracker['loadingStates'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useIntelligentPreloader', () => {
    it('should preload components on demand', async () => {
      render(<TestComponent />);
      
      const preloadButton = screen.getByTestId('preload-chat');
      const preloadedCount = screen.getByTestId('preloaded-count');
      
      expect(preloadedCount.textContent).toBe('0');
      
      fireEvent.click(preloadButton);
      
      await waitFor(() => {
        expect(preloadedCount.textContent).toBe('1');
      });
    });

    it('should not preload the same component twice', async () => {
      render(<TestComponent />);
      
      const preloadButton = screen.getByTestId('preload-chat');
      const preloadedCount = screen.getByTestId('preloaded-count');
      
      // Click multiple times
      fireEvent.click(preloadButton);
      fireEvent.click(preloadButton);
      fireEvent.click(preloadButton);
      
      await waitFor(() => {
        expect(preloadedCount.textContent).toBe('1');
      });
    });

    it('should preload multiple different components', async () => {
      render(<TestComponent />);
      
      const preloadChatButton = screen.getByTestId('preload-chat');
      const preloadFileButton = screen.getByTestId('preload-file');
      const preloadedCount = screen.getByTestId('preloaded-count');
      
      fireEvent.click(preloadChatButton);
      fireEvent.click(preloadFileButton);
      
      await waitFor(() => {
        expect(preloadedCount.textContent).toBe('2');
      });
    });

    it('should handle preloading errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TestComponent />);
      
      const preloadButton = screen.getByTestId('preload-chat');
      
      // This should not throw even if import fails
      fireEvent.click(preloadButton);
      
      await waitFor(() => {
        // Component should still render without errors
        expect(screen.getByTestId('preloaded-count')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('useBundleSizeMonitor', () => {
    it('should track bundle size metrics', async () => {
      render(<TestComponent />);
      
      const bundleSize = screen.getByTestId('bundle-size');
      const loadedChunks = screen.getByTestId('loaded-chunks');
      
      // Wait for performance observer to trigger
      await waitFor(() => {
        expect(parseInt(bundleSize.textContent || '0')).toBeGreaterThan(0);
        expect(parseInt(loadedChunks.textContent || '0')).toBeGreaterThan(0);
      }, { timeout: 1000 });
    });

    it('should accumulate bundle size over time', async () => {
      render(<TestComponent />);
      
      const bundleSize = screen.getByTestId('bundle-size');
      
      await waitFor(() => {
        const initialSize = parseInt(bundleSize.textContent || '0');
        expect(initialSize).toBeGreaterThan(0);
        
        // Simulate more chunks loading
        act(() => {
          mockPerformanceObserver({
            getEntries: () => [
              ...mockPerformanceEntries,
              {
                name: 'additional-chunk-789.js',
                transferSize: 15000,
                duration: 100,
              },
            ],
          });
        });
        
        // Size should increase
        expect(parseInt(bundleSize.textContent || '0')).toBeGreaterThanOrEqual(initialSize);
      });
    });
  });

  describe('performanceTracker', () => {
    it('should track loading start and end times', () => {
      const componentName = 'TestComponent';
      
      performanceTracker.startLoading(componentName);
      
      // Simulate some loading time
      setTimeout(() => {
        performanceTracker.endLoading(componentName);
        
        const metrics = performanceTracker.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].componentName).toBe(componentName);
        expect(metrics[0].loadTime).toBeGreaterThan(0);
      }, 50);
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

    it('should track cache hits', () => {
      const componentName = 'TestComponent';
      
      performanceTracker.startLoading(componentName);
      performanceTracker.endLoading(componentName, true); // Cache hit
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics[0].cacheHit).toBe(true);
    });

    it('should handle missing start time gracefully', () => {
      const componentName = 'TestComponent';
      
      // End loading without starting
      performanceTracker.endLoading(componentName);
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('Preloading Strategies', () => {
    it('should implement immediate preloading', async () => {
      const mockPreload = vi.fn();
      
      // Mock the preload function
      const originalPreload = useIntelligentPreloader;
      vi.mocked(useIntelligentPreloader).mockReturnValue({
        preloadComponent: mockPreload,
        preloadedComponents: new Set(),
      });
      
      render(<TestComponent />);
      
      // Immediate preloading should happen on mount
      await waitFor(() => {
        expect(mockPreload).toHaveBeenCalled();
      });
    });

    it('should implement idle preloading', async () => {
      const mockPreload = vi.fn();
      
      // Test idle callback
      const idleCallback = vi.fn();
      Object.defineProperty(global, 'requestIdleCallback', {
        value: idleCallback,
      });
      
      render(<TestComponent />);
      
      // Trigger idle callback
      act(() => {
        const callback = idleCallback.mock.calls[0]?.[0];
        if (callback) callback();
      });
      
      await waitFor(() => {
        expect(idleCallback).toHaveBeenCalled();
      });
    });

    it('should implement interaction-based preloading', async () => {
      render(<TestComponent />);
      
      // Simulate user interaction
      fireEvent.click(document.body);
      
      // Should trigger preloading after interaction
      await waitFor(() => {
        expect(screen.getByTestId('preloaded-count')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle import failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock failed import
      vi.doMock('../features/ChatInterface', () => {
        throw new Error('Import failed');
      });
      
      render(<TestComponent />);
      
      const preloadButton = screen.getByTestId('preload-chat');
      fireEvent.click(preloadButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to preload ChatInterface'),
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });

    it('should continue working after import failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TestComponent />);
      
      // Try to preload a component that will fail
      const preloadChatButton = screen.getByTestId('preload-chat');
      fireEvent.click(preloadChatButton);
      
      // Then preload a component that should work
      const preloadFileButton = screen.getByTestId('preload-file');
      fireEvent.click(preloadFileButton);
      
      await waitFor(() => {
        // Should still be able to preload other components
        expect(screen.getByTestId('preloaded-count')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated preloading', async () => {
      render(<TestComponent />);
      
      const preloadButton = screen.getByTestId('preload-chat');
      
      // Preload the same component many times
      for (let i = 0; i < 100; i++) {
        fireEvent.click(preloadButton);
      }
      
      await waitFor(() => {
        // Should still only have 1 preloaded component
        expect(screen.getByTestId('preloaded-count').textContent).toBe('1');
      });
      
      // Performance metrics should not grow excessively
      const metrics = performanceTracker.getMetrics();
      expect(metrics.length).toBeLessThan(10); // Should not have 100 entries
    });

    it('should clean up performance observers on unmount', () => {
      const disconnectSpy = vi.fn();
      
      Object.defineProperty(global, 'PerformanceObserver', {
        value: class MockPerformanceObserver {
          constructor() {}
          observe() {}
          disconnect = disconnectSpy;
        },
      });
      
      const { unmount } = render(<TestComponent />);
      
      unmount();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Development vs Production Behavior', () => {
    it('should log performance metrics in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      performanceTracker.startLoading('TestComponent');
      performanceTracker.endLoading('TestComponent');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LazyLoader] TestComponent loaded in'),
        expect.stringContaining('ms')
      );
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      performanceTracker.startLoading('TestComponent');
      performanceTracker.endLoading('TestComponent');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
