import { test, expect } from '@playwright/test';

test.describe('Performance - Core Web Vitals', () => {
  test('should meet LCP threshold', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries.find(e => e.name === 'LCP');
          resolve(lcpEntry?.startTime || 0);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCP should be under 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });

  test('should meet FID threshold', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fidEntry = entries.find(e => e.name === 'FID');
          resolve(fidEntry?.processingStart || 0);
        }).observe({ entryTypes: ['first-input'] });
      });
    });
    
    // FID should be under 100ms
    expect(fid).toBeLessThan(100);
  });

  test('should meet CLS threshold', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const clsEntry = entries.find(e => e.name === 'CLS');
          resolve(clsEntry?.value || 0);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
    
    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('should load widget quickly', async ({ page }) => {
    const startTime = Date.now();
    // FIXED: Use homepage instead of /app/widget-test
    await page.goto('/');
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Widget should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid interactions', async ({ page }) => {
    // FIXED: Use homepage instead of /app/widget-test
    await page.goto('/');
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });

    const startTime = Date.now();

    // Perform rapid interactions
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="widget-button"]');
      await page.waitForTimeout(100);
      await page.click('[data-testid="widget-button"]');
      await page.waitForTimeout(100);
    }

    const totalTime = Date.now() - startTime;

    // Should handle rapid interactions without significant delay
    expect(totalTime).toBeLessThan(5000);
  });

  test('should maintain performance under load', async ({ page }) => {
    // FIXED: Use homepage instead of /app/widget-test
    await page.goto('/');
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });

    // Simulate load by opening multiple elements
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(page.click('[data-testid="widget-button"]'));
    }

    const startTime = Date.now();
    await Promise.all(promises);
    const loadTime = Date.now() - startTime;

    // Should handle multiple simultaneous interactions
    expect(loadTime).toBeLessThan(2000);
  });
});
