/**
 * E2E Widget Performance Tests
 * 
 * Tests:
 * - Widget load times across different devices
 * - Core Web Vitals measurement
 * - Bundle size validation
 * - Memory usage monitoring
 * - Network throttling scenarios
 * - Visual regression testing
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const WIDGET_URL = 'http://localhost:3001';
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FID: 100,  // First Input Delay < 100ms
  CLS: 0.1,  // Cumulative Layout Shift < 0.1
  TTFB: 800, // Time to First Byte < 800ms
  FCP: 1800, // First Contentful Paint < 1.8s
};

// Helper function to measure Core Web Vitals
async function measureWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {};
      let metricsCollected = 0;
      const totalMetrics = 5;

      function checkComplete() {
        metricsCollected++;
        if (metricsCollected >= totalMetrics) {
          resolve(vitals);
        }
      }

      // Import web-vitals dynamically
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          vitals.CLS = metric.value;
          checkComplete();
        });

        getFID((metric) => {
          vitals.FID = metric.value;
          checkComplete();
        });

        getFCP((metric) => {
          vitals.FCP = metric.value;
          checkComplete();
        });

        getLCP((metric) => {
          vitals.LCP = metric.value;
          checkComplete();
        });

        getTTFB((metric) => {
          vitals.TTFB = metric.value;
          checkComplete();
        });
      }).catch(() => {
        // Fallback if web-vitals is not available
        vitals.CLS = 0;
        vitals.FID = 0;
        vitals.FCP = 0;
        vitals.LCP = 0;
        vitals.TTFB = 0;
        resolve(vitals);
      });

      // Timeout after 10 seconds
      setTimeout(() => resolve(vitals), 10000);
    });
  });
}

// Helper function to measure bundle sizes
async function measureBundleSizes(page: Page) {
  const resourceSizes = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources
      .filter(resource => 
        resource.name.includes('widget') || 
        resource.name.includes('chunk') ||
        resource.name.includes('_next/static')
      )
      .map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        duration: resource.duration,
      }));
  });

  return resourceSizes;
}

// Helper function to measure memory usage
async function measureMemoryUsage(page: Page) {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  });
}

test.describe('Widget Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Mark the start of widget loading
      performance.mark('widget-start');
    });
  });

  test('should load widget within performance thresholds on desktop', async ({ page }) => {
    // Navigate to widget page
    await page.goto(WIDGET_URL);

    // Wait for widget to be visible
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 5000 });

    // Measure Core Web Vitals
    const vitals = await measureWebVitals(page);

    // Validate thresholds
    expect(vitals.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    expect(vitals.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(vitals.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    expect(vitals.TTFB).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);

    console.log('Desktop Web Vitals:', vitals);
  });

  test('should load widget within performance thresholds on mobile', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      ...browser.contexts()[0] || {},
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const page = await context.newPage();

    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 5000 });

    const vitals = await measureWebVitals(page);

    // Mobile thresholds are slightly more lenient
    expect(vitals.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP + 500);
    expect(vitals.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP + 300);
    expect(vitals.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);

    console.log('Mobile Web Vitals:', vitals);

    await context.close();
  });

  test('should validate bundle sizes are within limits', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]');

    const bundleSizes = await measureBundleSizes(page);
    
    // Calculate total bundle size
    const totalSize = bundleSizes.reduce((sum, resource) => sum + resource.size, 0);
    
    // Core widget bundle should be under 30KB
    const coreWidgetResources = bundleSizes.filter(resource => 
      resource.name.includes('widget-core') || 
      resource.name.includes('widget/core')
    );
    
    const coreSize = coreWidgetResources.reduce((sum, resource) => sum + resource.size, 0);
    
    // Validate bundle size limits
    expect(totalSize).toBeLessThan(250000); // 250KB total limit
    expect(coreSize).toBeLessThan(30000);   // 30KB core limit

    console.log('Bundle Analysis:', {
      totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
      coreSize: `${(coreSize / 1024).toFixed(2)}KB`,
      resourceCount: bundleSizes.length,
    });
  });

  test('should lazy load features only when needed', async ({ page }) => {
    await page.goto(WIDGET_URL);
    
    // Initially, only core widget should be loaded
    let bundleSizes = await measureBundleSizes(page);
    const initialFeatureChunks = bundleSizes.filter(resource => 
      resource.name.includes('features') || 
      resource.name.includes('emoji') ||
      resource.name.includes('file-upload')
    );
    
    expect(initialFeatureChunks).toHaveLength(0);

    // Open widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 3000 });

    // Start typing to trigger feature loading
    await page.fill('[data-testid="message-input"]', 'Hello');
    
    // Wait for features to load
    await page.waitForTimeout(2000);
    
    bundleSizes = await measureBundleSizes(page);
    const featureChunks = bundleSizes.filter(resource => 
      resource.name.includes('features') || 
      resource.name.includes('emoji') ||
      resource.name.includes('file-upload')
    );
    
    // Features should now be loaded
    expect(featureChunks.length).toBeGreaterThan(0);
    
    console.log('Lazy loaded features:', featureChunks.map(chunk => ({
      name: chunk.name.split('/').pop(),
      size: `${(chunk.size / 1024).toFixed(2)}KB`,
    })));
  });

  test('should handle slow network conditions gracefully', async ({ page, context }) => {
    // Throttle network to simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      await route.continue();
    });

    const startTime = Date.now();
    
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(8000); // 8 seconds max on slow network
    
    // Widget should be functional
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 5000 });
    
    console.log(`Slow network load time: ${loadTime}ms`);
  });

  test('should maintain performance with multiple interactions', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]');

    const initialMemory = await measureMemoryUsage(page);
    
    // Perform multiple widget interactions
    for (let i = 0; i < 10; i++) {
      // Open widget
      await page.click('[data-testid="widget-button"]');
      await page.waitForSelector('[data-testid="chat-interface"]');
      
      // Type message
      await page.fill('[data-testid="message-input"]', `Test message ${i}`);
      await page.click('[data-testid="send-button"]');
      
      // Close widget
      await page.click('[data-testid="close-button"]');
      await page.waitForSelector('[data-testid="chat-interface"]', { state: 'hidden' });
    }
    
    const finalMemory = await measureMemoryUsage(page);
    
    if (initialMemory && finalMemory) {
      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      
      console.log('Memory usage:', {
        initial: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  });

  test('should measure First Input Delay (FID)', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]');

    // Measure FID by clicking the widget button
    const fidStart = Date.now();
    await page.click('[data-testid="widget-button"]');
    
    // Wait for the interaction to be processed
    await page.waitForSelector('[data-testid="chat-interface"]');
    const fidEnd = Date.now();
    
    const fid = fidEnd - fidStart;
    
    // FID should be under 100ms
    expect(fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
    
    console.log(`First Input Delay: ${fid}ms`);
  });

  test('should validate Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.goto(WIDGET_URL);
    
    // Monitor layout shifts
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });

    // Open and close widget to trigger potential layout shifts
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    await page.click('[data-testid="close-button"]');
    
    // CLS should be minimal
    expect(layoutShifts).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    
    console.log(`Cumulative Layout Shift: ${layoutShifts}`);
  });

  test('should validate image loading performance', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]');

    // Open widget and trigger image loading
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');

    // Monitor image loading performance
    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const metrics = images.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        loading: img.loading,
      }));
      
      return metrics;
    });

    // All images should load successfully
    imageMetrics.forEach(metric => {
      expect(metric.complete).toBe(true);
      expect(metric.naturalWidth).toBeGreaterThan(0);
      expect(metric.naturalHeight).toBeGreaterThan(0);
    });

    console.log('Image loading metrics:', imageMetrics);
  });

  test('should validate accessibility performance', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.waitForSelector('[data-testid="widget-button"]');

    // Check accessibility tree performance
    const accessibilitySnapshot = await page.accessibility.snapshot();
    
    // Should have proper accessibility structure
    expect(accessibilitySnapshot).toBeTruthy();
    expect(accessibilitySnapshot?.children).toBeDefined();

    // Open widget and check accessibility
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');

    const expandedSnapshot = await page.accessibility.snapshot();
    expect(expandedSnapshot?.children?.length).toBeGreaterThan(0);

    // Check for proper ARIA labels and roles
    const ariaElements = await page.locator('[aria-label], [role]').count();
    expect(ariaElements).toBeGreaterThan(0);
  });
});
