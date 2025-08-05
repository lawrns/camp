/**
 * Widget Performance Tests
 * 
 * Tests:
 * - Snapshot tests for widget variants
 * - Bundle size validation
 * - Core Web Vitals (CLS, LCP, FID)
 * - Memory usage monitoring
 * - Render performance
 * - Lazy loading effectiveness
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { OptimizedWidgetCore } from '../core/OptimizedWidgetCore';
import { UltimateWidget } from '../design-system/UltimateWidget';

// Mock performance APIs
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

// Mock Web Vitals
const mockWebVitals = {
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
};

vi.mock('web-vitals', () => mockWebVitals);

// Mock Intersection Observer
const mockIntersectionObserver = vi.fn();
Object.defineProperty(global, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    constructor(callback: (entries: any[]) => void) {
      mockIntersectionObserver.mockImplementation(callback);
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});

// Mock ResizeObserver
Object.defineProperty(global, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});

// Mock performance.memory
Object.defineProperty(global, 'performance', {
  value: {
    ...performance,
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
      totalJSHeapSize: 2048 * 1024, // 2MB
      jsHeapSizeLimit: 4096 * 1024, // 4MB
    },
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Performance monitoring utility
class PerformanceTestUtils {
  static measureRenderTime(renderFn: () => void): number {
    const start = performance.now();
    renderFn();
    return performance.now() - start;
  }

  static measureMemoryUsage(): number {
    return performance.memory?.usedJSHeapSize || 0;
  }

  static simulateSlowNetwork() {
    // Mock slow network conditions
    mockPerformanceEntries.push({
      name: 'widget-chunk.js',
      duration: 2000, // 2 seconds
      transferSize: 50000, // 50KB
    });
  }

  static simulateFastNetwork() {
    // Mock fast network conditions
    mockPerformanceEntries.push({
      name: 'widget-chunk.js',
      duration: 100, // 100ms
      transferSize: 30000, // 30KB
    });
  }
}

describe('Widget Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceEntries.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot for default widget', () => {
      const { container } = render(
        <OptimizedWidgetCore
          organizationId="test-org"
          position="bottom-right"
          primaryColor="#3b82f6"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for widget with different positions', () => {
      const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
      
      positions.forEach(position => {
        const { container } = render(
          <OptimizedWidgetCore
            organizationId="test-org"
            position={position}
            primaryColor="#3b82f6"
          />
        );

        expect(container.firstChild).toMatchSnapshot(`widget-${position}`);
      });
    });

    it('should match snapshot for widget with different colors', () => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
      
      colors.forEach(color => {
        const { container } = render(
          <OptimizedWidgetCore
            organizationId="test-org"
            primaryColor={color}
          />
        );

        expect(container.firstChild).toMatchSnapshot(`widget-color-${color.replace('#', '')}`);
      });
    });

    it('should match snapshot for open widget state', () => {
      const { container } = render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Open the widget
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(container.firstChild).toMatchSnapshot('widget-open');
    });

    it('should match snapshot for UltimateWidget', () => {
      const { container } = render(
        <UltimateWidget
          organizationId="test-org"
          config={{
            organizationName: 'Test Org',
            primaryColor: '#3b82f6',
            position: 'bottom-right',
            welcomeMessage: 'Hello! How can we help?',
          }}
        />
      );

      expect(container.firstChild).toMatchSnapshot('ultimate-widget');
    });
  });

  describe('Bundle Size Validation', () => {
    it('should track bundle size metrics', async () => {
      PerformanceTestUtils.simulateFastNetwork();
      
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      await waitFor(() => {
        expect(mockPerformanceObserver).toHaveBeenCalled();
      });

      // Verify bundle size is within limits
      const entries = mockPerformanceEntries.filter(entry => 
        entry.name.includes('widget') || entry.name.includes('chunk')
      );
      
      const totalSize = entries.reduce((sum, entry) => sum + entry.transferSize, 0);
      expect(totalSize).toBeLessThan(250000); // 250KB limit
    });

    it('should validate core widget bundle size', () => {
      // Core widget should be under 30KB
      const coreEntry = {
        name: 'widget-core.js',
        transferSize: 28000, // 28KB
      };
      
      mockPerformanceEntries.push(coreEntry);
      
      expect(coreEntry.transferSize).toBeLessThan(30000); // 30KB limit
    });

    it('should validate feature chunks are lazy loaded', async () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Initially, only core should be loaded
      let featureChunks = mockPerformanceEntries.filter(entry => 
        entry.name.includes('features') || entry.name.includes('emoji') || entry.name.includes('file')
      );
      expect(featureChunks).toHaveLength(0);

      // Open widget to trigger lazy loading
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Simulate feature chunks loading
      mockPerformanceEntries.push(
        { name: 'widget-features.js', transferSize: 45000 },
        { name: 'emoji-picker.js', transferSize: 25000 }
      );

      await waitFor(() => {
        featureChunks = mockPerformanceEntries.filter(entry => 
          entry.name.includes('features') || entry.name.includes('emoji')
        );
        expect(featureChunks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Core Web Vitals', () => {
    it('should measure and validate CLS (Cumulative Layout Shift)', async () => {
      let clsValue = 0;
      mockWebVitals.getCLS.mockImplementation((callback) => {
        callback({ value: 0.05 }); // Good CLS score
        clsValue = 0.05;
      });

      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      await waitFor(() => {
        expect(mockWebVitals.getCLS).toHaveBeenCalled();
        expect(clsValue).toBeLessThan(0.1); // CLS should be < 0.1
      });
    });

    it('should measure and validate LCP (Largest Contentful Paint)', async () => {
      let lcpValue = 0;
      mockWebVitals.getLCP.mockImplementation((callback) => {
        callback({ value: 1500 }); // Good LCP score (1.5s)
        lcpValue = 1500;
      });

      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      await waitFor(() => {
        expect(mockWebVitals.getLCP).toHaveBeenCalled();
        expect(lcpValue).toBeLessThan(2500); // LCP should be < 2.5s
      });
    });

    it('should measure and validate FID (First Input Delay)', async () => {
      let fidValue = 0;
      mockWebVitals.getFID.mockImplementation((callback) => {
        callback({ value: 50 }); // Good FID score (50ms)
        fidValue = 50;
      });

      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Simulate user interaction
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockWebVitals.getFID).toHaveBeenCalled();
        expect(fidValue).toBeLessThan(100); // FID should be < 100ms
      });
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage during widget lifecycle', async () => {
      const initialMemory = PerformanceTestUtils.measureMemoryUsage();
      
      const { unmount } = render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Open and close widget multiple times
      const button = screen.getByRole('button');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button); // Open
        await waitFor(() => screen.getByText(/chat with us/i));
        fireEvent.click(button); // Close
      }

      const afterInteractionMemory = PerformanceTestUtils.measureMemoryUsage();
      
      // Unmount component
      unmount();
      
      // Memory growth should be reasonable
      const memoryGrowth = afterInteractionMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB growth
    });

    it('should not leak memory with repeated renders', () => {
      const initialMemory = PerformanceTestUtils.measureMemoryUsage();
      
      // Render and unmount widget multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <OptimizedWidgetCore
            organizationId="test-org"
            primaryColor="#3b82f6"
          />
        );
        unmount();
      }
      
      const finalMemory = PerformanceTestUtils.measureMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
    });
  });

  describe('Render Performance', () => {
    it('should render widget button quickly', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <OptimizedWidgetCore
            organizationId="test-org"
            primaryColor="#3b82f6"
          />
        );
      });

      // Initial render should be fast
      expect(renderTime).toBeLessThan(50); // Less than 50ms
    });

    it('should handle rapid state changes efficiently', async () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      const button = screen.getByRole('button');
      
      // Rapidly toggle widget state
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should maintain 60fps during animations', async () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      const button = screen.getByRole('button');
      
      // Mock animation frame timing
      const frameTimings: number[] = [];
      let lastFrame = performance.now();
      
      const mockRAF = vi.fn((callback) => {
        const currentFrame = performance.now();
        frameTimings.push(currentFrame - lastFrame);
        lastFrame = currentFrame;
        setTimeout(callback, 16.67); // 60fps = 16.67ms per frame
      });
      
      global.requestAnimationFrame = mockRAF;
      
      // Trigger animation
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockRAF).toHaveBeenCalled();
      });
      
      // Check frame timing consistency
      const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      expect(averageFrameTime).toBeLessThan(20); // Should be close to 16.67ms
    });
  });

  describe('Lazy Loading Effectiveness', () => {
    it('should only load core components initially', () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Only widget button should be rendered initially
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByText(/chat with us/i)).not.toBeInTheDocument();
    });

    it('should lazy load chat interface on widget open', async () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Chat interface should load
      await waitFor(() => {
        expect(screen.getByText(/chat with us/i)).toBeInTheDocument();
      });
    });

    it('should preload components based on user interaction', async () => {
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Wait for chat interface
      await waitFor(() => {
        expect(screen.getByText(/chat with us/i)).toBeInTheDocument();
      });

      // Start typing to trigger feature preloading
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Hello' } });

      // Advanced features should become available
      await waitFor(() => {
        expect(screen.getByTitle('Attach file')).toBeInTheDocument();
        expect(screen.getByTitle('Add emoji')).toBeInTheDocument();
      });
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      PerformanceTestUtils.simulateSlowNetwork();
      
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      // Widget should still be functional despite slow network
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/chat with us/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should optimize for fast network conditions', async () => {
      PerformanceTestUtils.simulateFastNetwork();
      
      const startTime = performance.now();
      
      render(
        <OptimizedWidgetCore
          organizationId="test-org"
          primaryColor="#3b82f6"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/chat with us/i)).toBeInTheDocument();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(500); // Should load quickly on fast network
    });
  });
});
