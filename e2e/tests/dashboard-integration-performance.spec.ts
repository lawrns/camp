/**
 * Comprehensive E2E Tests for Dashboard Integration & Performance
 * Tests database queries, real-time subscriptions, error handling, and memory management
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Integration & Performance', () => {
  
  // Helper function to login and navigate to dashboard
  const loginToDashboard = async (page: any) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
  };

  test('should test database query performance for conversation loading', async ({ page }) => {
    await loginToDashboard(page);
    
    // Monitor network requests for database queries
    const dbQueries = [];
    const queryTimes = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/conversations') || url.includes('/api/dashboard')) {
        const timing = response.timing();
        dbQueries.push({
          url,
          status: response.status(),
          timing: timing.responseEnd - timing.requestStart,
        });
        queryTimes.push(timing.responseEnd - timing.requestStart);
      }
    });
    
    // Reload to trigger fresh queries
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for all queries to complete
    await page.waitForTimeout(3000);
    
    console.log(`📊 Database queries executed: ${dbQueries.length}`);
    
    if (queryTimes.length > 0) {
      const avgTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxTime = Math.max(...queryTimes);
      
      console.log(`⏱️ Average query time: ${avgTime.toFixed(2)}ms`);
      console.log(`⏱️ Slowest query time: ${maxTime.toFixed(2)}ms`);
      
      // Performance thresholds
      const avgThreshold = 1000; // 1 second
      const maxThreshold = 3000; // 3 seconds
      
      console.log(`${avgTime < avgThreshold ? '✅' : '⚠️'} Average performance: ${avgTime < avgThreshold ? 'good' : 'needs optimization'}`);
      console.log(`${maxTime < maxThreshold ? '✅' : '⚠️'} Max performance: ${maxTime < maxThreshold ? 'acceptable' : 'too slow'}`);
    }
    
    // Check for failed queries
    const failedQueries = dbQueries.filter(q => q.status >= 400);
    console.log(`${failedQueries.length === 0 ? '✅' : '⚠️'} Query success rate: ${failedQueries.length === 0 ? '100%' : `${((dbQueries.length - failedQueries.length) / dbQueries.length * 100).toFixed(1)}%`}`);
    
    if (failedQueries.length > 0) {
      console.log('❌ Failed queries:');
      failedQueries.forEach(q => console.log(`  - ${q.status} ${q.url}`));
    }
  });

  test('should test real-time subscription management', async ({ page }) => {
    await loginToDashboard(page);
    
    // Monitor WebSocket connections
    const wsConnections = [];
    
    page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        created: Date.now(),
      });
      
      ws.on('close', () => {
        console.log(`🔌 WebSocket closed: ${ws.url()}`);
      });
      
      ws.on('framereceived', event => {
        console.log(`📨 WebSocket message received: ${event.payload.slice(0, 100)}...`);
      });
    });
    
    // Wait for WebSocket connections to establish
    await page.waitForTimeout(3000);
    
    console.log(`🔌 WebSocket connections established: ${wsConnections.length}`);
    
    // Test subscription cleanup on page navigation
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential new connections
    await page.waitForTimeout(2000);
    
    console.log(`🔌 Total WebSocket connections after navigation: ${wsConnections.length}`);
    
    // Check for connection leaks (too many connections)
    const maxExpectedConnections = 3; // Reasonable limit
    console.log(`${wsConnections.length <= maxExpectedConnections ? '✅' : '⚠️'} Connection management: ${wsConnections.length <= maxExpectedConnections ? 'good' : 'potential leaks'}`);
  });

  test('should test error handling for network failures', async ({ page }) => {
    await loginToDashboard(page);
    
    // Test offline scenario
    await page.setOffline(true);
    
    // Try to perform actions that require network
    const conversationCount = await page.locator('[data-testid="conversation"]').count();
    
    if (conversationCount > 0) {
      await page.locator('[data-testid="conversation"]').first().click();
    }
    
    // Check for offline indicators or error messages
    const offlineIndicators = await page.locator('text=offline, text=connection, text=network').count();
    console.log(`${offlineIndicators > 0 ? '✅' : '⚠️'} Offline detection: ${offlineIndicators > 0 ? 'working' : 'not detected'}`);
    
    // Restore connection
    await page.setOffline(false);
    await page.waitForTimeout(2000);
    
    // Check for reconnection
    const reconnectionIndicators = await page.locator('text=connected, text=online').count();
    console.log(`${reconnectionIndicators > 0 ? '✅' : '⚠️'} Reconnection detection: ${reconnectionIndicators > 0 ? 'working' : 'not detected'}`);
    
    // Test API timeout handling
    await page.route('**/api/**', route => {
      // Delay response to simulate timeout
      setTimeout(() => {
        route.continue();
      }, 10000); // 10 second delay
    });
    
    // Try to reload conversations
    await page.reload();
    
    // Should show loading state or timeout error
    const loadingIndicators = await page.locator('text=loading, [data-testid*="loading"]').count();
    console.log(`${loadingIndicators > 0 ? '✅' : '⚠️'} Loading states: ${loadingIndicators > 0 ? 'shown' : 'not shown'}`);
    
    // Clear route to restore normal behavior
    await page.unroute('**/api/**');
  });

  test('should test memory leak prevention', async ({ page }) => {
    await loginToDashboard(page);
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsEventListeners: document.querySelectorAll('*').length,
      };
    });
    
    console.log(`📊 Initial memory usage: ${(initialMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Simulate heavy usage - navigate between pages multiple times
    const pages = ['/dashboard/inbox', '/dashboard/analytics', '/dashboard/settings'];
    
    for (let i = 0; i < 3; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsEventListeners: document.querySelectorAll('*').length,
      };
    });
    
    console.log(`📊 Final memory usage: ${(finalMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
    const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
    const memoryIncreasePercent = (memoryIncrease / initialMetrics.usedJSHeapSize) * 100;
    
    console.log(`📈 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%)`);
    
    // Memory leak thresholds
    const maxIncreasePercent = 50; // 50% increase is concerning
    console.log(`${memoryIncreasePercent < maxIncreasePercent ? '✅' : '⚠️'} Memory management: ${memoryIncreasePercent < maxIncreasePercent ? 'good' : 'potential leaks'}`);
  });

  test('should test component cleanup and unmounting', async ({ page }) => {
    await loginToDashboard(page);
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate between different dashboard sections
    const sections = [
      '/dashboard/inbox',
      '/dashboard/analytics', 
      '/dashboard/settings',
      '/dashboard/team',
    ];
    
    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Check for React/component errors
    const componentErrors = consoleErrors.filter(error => 
      error.includes('Warning') || 
      error.includes('memory leak') || 
      error.includes('unmounted component') ||
      error.includes('setState')
    );
    
    console.log(`${componentErrors.length === 0 ? '✅' : '⚠️'} Component cleanup: ${componentErrors.length === 0 ? 'clean' : `${componentErrors.length} warnings`}`);
    
    if (componentErrors.length > 0) {
      console.log('⚠️ Component warnings:');
      componentErrors.forEach(error => console.log(`  - ${error.slice(0, 100)}...`));
    }
  });

  test('should test large dataset handling', async ({ page }) => {
    await loginToDashboard(page);
    
    // Monitor performance during large data loads
    const performanceMetrics = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/conversations')) {
        const timing = response.timing();
        performanceMetrics.push({
          url: response.url(),
          size: response.headers()['content-length'] || 0,
          time: timing.responseEnd - timing.requestStart,
        });
      }
    });
    
    // Test scrolling performance (if virtualization is working)
    const conversationList = page.locator('[data-testid="conversation-list-container"]');
    const hasConversationList = await conversationList.isVisible().catch(() => false);
    
    if (hasConversationList) {
      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        await conversationList.evaluate(el => {
          el.scrollTop = Math.random() * el.scrollHeight;
        });
        await page.waitForTimeout(100);
      }
      
      console.log('✅ Scroll performance test completed');
    }
    
    // Check for performance issues
    if (performanceMetrics.length > 0) {
      const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + m.time, 0) / performanceMetrics.length;
      const largeResponses = performanceMetrics.filter(m => parseInt(m.size) > 1024 * 1024); // > 1MB
      
      console.log(`📊 Average API response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`📦 Large responses (>1MB): ${largeResponses.length}`);
      
      console.log(`${avgResponseTime < 2000 ? '✅' : '⚠️'} API performance: ${avgResponseTime < 2000 ? 'good' : 'needs optimization'}`);
      console.log(`${largeResponses.length === 0 ? '✅' : '⚠️'} Response sizes: ${largeResponses.length === 0 ? 'reasonable' : 'some large responses'}`);
    }
  });

  test('should test concurrent user simulation', async ({ page, context }) => {
    // Simulate multiple concurrent sessions
    const sessions = [];
    
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage();
      sessions.push(newPage);
      
      // Login each session
      await newPage.goto('/login');
      await newPage.fill('[data-testid="email-input"]', 'jam@jam.com');
      await newPage.fill('[data-testid="password-input"]', 'password123');
      await newPage.click('[data-testid="login-button"]');
      await newPage.waitForLoadState('networkidle');
      await newPage.goto('/dashboard/inbox');
      await newPage.waitForLoadState('networkidle');
    }
    
    console.log(`👥 Created ${sessions.length} concurrent sessions`);
    
    // Perform actions simultaneously
    const actions = sessions.map(async (sessionPage, index) => {
      // Simulate user activity
      const conversationCount = await sessionPage.locator('[data-testid="conversation"]').count();
      
      if (conversationCount > 0) {
        await sessionPage.locator('[data-testid="conversation"]').first().click();
        await sessionPage.waitForTimeout(1000);
      }
      
      console.log(`✅ Session ${index + 1} completed actions`);
    });
    
    // Wait for all actions to complete
    await Promise.all(actions);
    
    // Clean up sessions
    for (const sessionPage of sessions) {
      await sessionPage.close();
    }
    
    console.log('✅ Concurrent user simulation completed');
  });

  test('should test API rate limiting and throttling', async ({ page }) => {
    await loginToDashboard(page);
    
    // Monitor API calls for rate limiting
    const apiCalls = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now(),
        });
      }
    });
    
    // Make rapid API calls by refreshing quickly
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForTimeout(200);
    }
    
    // Check for rate limiting responses
    const rateLimitedCalls = apiCalls.filter(call => call.status === 429);
    const tooManyRequests = apiCalls.filter(call => call.status === 429).length;
    
    console.log(`📊 Total API calls: ${apiCalls.length}`);
    console.log(`🚦 Rate limited calls: ${tooManyRequests}`);
    
    if (tooManyRequests > 0) {
      console.log('✅ Rate limiting is working');
    } else {
      console.log('⚠️ Rate limiting not detected - may need implementation');
    }
    
    // Check for proper error handling of rate limits
    if (rateLimitedCalls.length > 0) {
      const errorMessages = await page.locator('text=rate limit, text=too many requests').count();
      console.log(`${errorMessages > 0 ? '✅' : '⚠️'} Rate limit error handling: ${errorMessages > 0 ? 'working' : 'needs improvement'}`);
    }
  });
});
