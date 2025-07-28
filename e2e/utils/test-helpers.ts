import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Wait for page to be ready
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => document.readyState === 'complete');
  }

  // Wait for widget to load
  async waitForWidgetLoad() {
    await this.page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });
  }

  // Wait for real-time connection
  async waitForRealtimeConnection() {
    await this.page.waitForFunction(() => {
      return window.localStorage.getItem('campfire-realtime-status') === 'connected';
    }, { timeout: 10000 });
  }

  // Check accessibility compliance
  async checkAccessibility() {
    // Check for proper ARIA labels
    const elementsWithoutAria = await this.page.$$('[role]:not([aria-label]):not([aria-labelledby])');
    expect(elementsWithoutAria.length).toBe(0);

    // Check for proper heading structure
    const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      expect(level).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = level;
    }
  }

  // Check design system compliance
  async checkDesignSystem() {
    // Check for design system CSS variables
    const hasDesignSystemVars = await this.page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      return rootStyles.getPropertyValue('--ds-color-primary-600') !== '';
    });
    expect(hasDesignSystemVars).toBe(true);
  }

  // Measure performance metrics
  async measurePerformance() {
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            lcp: entries.find(e => e.name === 'LCP')?.startTime || 0,
            fid: entries.find(e => e.name === 'FID')?.processingStart || 0,
            cls: entries.find(e => e.name === 'CLS')?.value || 0,
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });
    return metrics;
  }
}
