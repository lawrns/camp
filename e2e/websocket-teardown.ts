/**
 * WebSocket Teardown for E2E Tests
 * 
 * Cleans up WebSocket connections and realtime resources
 * after E2E test completion.
 */

import { test as teardown } from '@playwright/test';

teardown('cleanup websocket environment', async ({ page }) => {
  console.log('🧹 Cleaning up WebSocket environment after E2E tests...');

  try {
    // Clean up any remaining WebSocket connections on current page first
    await page.evaluate(() => {
      // Close any open WebSocket connections
      if (window.WebSocket) {
        const originalWebSocket = window.WebSocket;
        window.WebSocket = class extends originalWebSocket {
          constructor(url: string | URL, protocols?: string | string[]) {
            super(url, protocols);
            // Immediately close any new connections during teardown
            setTimeout(() => this.close(), 100);
          }
        };
      }

      // Clear any timers that might be keeping connections alive
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }

      const highestIntervalId = setInterval(() => {}, 1000);
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
      }
      clearInterval(highestIntervalId);

      // Clear any service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
      }

      // Clear local storage and session storage (with error handling)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn('Could not clear storage (likely on about:blank):', error.message);
      }

      console.log('✅ WebSocket cleanup completed');
    });

    // Wait a moment for cleanup to complete
    await page.waitForTimeout(1000);

  } catch (error) {
    console.warn('⚠️ Error during WebSocket cleanup:', error);
  }

  console.log('✅ WebSocket environment teardown complete');
});
