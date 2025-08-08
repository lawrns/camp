/**
 * WebSocket Helper Utilities for E2E Tests
 * 
 * Provides utilities for testing WebSocket connections and realtime functionality
 * in Playwright E2E tests.
 */

import { Page, expect } from '@playwright/test';

export interface WebSocketTestOptions {
  timeout?: number;
  retries?: number;
  debugMode?: boolean;
}

export interface RealtimeTestResult {
  success: boolean;
  connectionTime?: number;
  error?: string;
  messageCount?: number;
}

/**
 * Wait for WebSocket connection to be established
 */
export async function waitForWebSocketConnection(
  page: Page, 
  options: WebSocketTestOptions = {}
): Promise<RealtimeTestResult> {
  const { timeout = 15000, retries = 3, debugMode = false } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (debugMode) {
        console.log(`🔌 Attempt ${attempt}/${retries}: Waiting for WebSocket connection...`);
      }

      const startTime = Date.now();
      
      // Wait for WebSocket connection event
      const wsPromise = page.waitForEvent('websocket', { timeout });
      const ws = await wsPromise;
      
      const connectionTime = Date.now() - startTime;
      
      if (debugMode) {
        console.log(`✅ WebSocket connected in ${connectionTime}ms to: ${ws.url()}`);
      }

      // Verify the connection is to Supabase realtime
      if (!ws.url().includes('supabase.co') && !ws.url().includes('realtime')) {
        throw new Error(`Unexpected WebSocket URL: ${ws.url()}`);
      }

      return {
        success: true,
        connectionTime,
      };

    } catch (error) {
      if (debugMode) {
        console.warn(`⚠️ Attempt ${attempt}/${retries} failed:`, error);
      }
      
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
      
      // Wait before retry
      await page.waitForTimeout(1500);
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  };
}

/**
 * Test realtime message delivery
 */
export async function testRealtimeMessageDelivery(
  senderPage: Page,
  receiverPage: Page,
  options: WebSocketTestOptions = {}
): Promise<RealtimeTestResult> {
  const { timeout = 15000, debugMode = false } = options;
  
  try {
    const testMessage = `E2E_REALTIME_TEST_${Date.now()}`;
    
    if (debugMode) {
      console.log(`📤 Testing realtime delivery of message: ${testMessage}`);
    }

    // Set up message listener on receiver
    const messagePromise = receiverPage.waitForSelector(
      `[data-testid="message"]:has-text("${testMessage}")`,
      { timeout }
    );

    // Send message from sender
    await senderPage.fill('[data-testid="composer-textarea"]', testMessage);
    await senderPage.click('[data-testid="composer-send-button"]');

    // Wait for message to appear on receiver
    const startTime = Date.now();
    await messagePromise;
    const deliveryTime = Date.now() - startTime;

    if (debugMode) {
      console.log(`✅ Message delivered in ${deliveryTime}ms`);
    }

    return {
      success: true,
      connectionTime: deliveryTime,
      messageCount: 1,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Monitor WebSocket events for debugging
 */
export async function monitorWebSocketEvents(
  page: Page,
  duration: number = 30000
): Promise<void> {
  console.log(`🔍 Monitoring WebSocket events for ${duration}ms...`);
  
  const events: Array<{ timestamp: number; type: string; data: any }> = [];
  
  // Monitor WebSocket connections
  page.on('websocket', ws => {
    events.push({
      timestamp: Date.now(),
      type: 'connection',
      data: { url: ws.url() }
    });
    
    ws.on('framesent', event => {
      events.push({
        timestamp: Date.now(),
        type: 'frame_sent',
        data: { payload: event.payload }
      });
    });
    
    ws.on('framereceived', event => {
      events.push({
        timestamp: Date.now(),
        type: 'frame_received',
        data: { payload: event.payload }
      });
    });
    
    ws.on('close', () => {
      events.push({
        timestamp: Date.now(),
        type: 'close',
        data: { url: ws.url() }
      });
    });
  });

  // Wait for the specified duration
  await page.waitForTimeout(duration);
  
  // Log summary
  console.log(`📊 WebSocket Events Summary (${events.length} events):`);
  const eventTypes = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(eventTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

/**
 * Verify WebSocket connection health
 */
export async function verifyWebSocketHealth(
  page: Page,
  options: WebSocketTestOptions = {}
): Promise<RealtimeTestResult> {
  const { timeout = 5000, debugMode = false } = options;
  
  try {
    const result = await page.evaluate(async (timeoutMs) => {
      // Check if Supabase client is available
      if (typeof window.supabase === 'undefined') {
        return { success: false, error: 'Supabase client not available' };
      }

      // Test channel creation and subscription
      const testChannel = window.supabase.channel(`health-test-${Date.now()}`);
      
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          testChannel.unsubscribe();
          resolve({ success: false, error: 'Health check timeout' });
        }, timeoutMs);

        testChannel
          .on('broadcast', { event: 'health-ping' }, () => {
            clearTimeout(timer);
            testChannel.unsubscribe();
            resolve({ success: true });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Send a test broadcast
              testChannel.send({
                type: 'broadcast',
                event: 'health-ping',
                payload: { test: true }
              });
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timer);
              testChannel.unsubscribe();
              resolve({ success: false, error: 'Channel subscription error' });
            }
          });
      });
    }, timeout);

    if (debugMode) {
      console.log('🏥 WebSocket health check result:', result);
    }

    return result as RealtimeTestResult;

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Enhanced wait for element with WebSocket readiness check
 */
export async function waitForElementWithWebSocketReady(
  page: Page,
  selector: string,
  options: WebSocketTestOptions = {}
): Promise<void> {
  const { timeout = 10000, debugMode = false } = options;
  
  // First ensure WebSocket is connected
  const wsResult = await waitForWebSocketConnection(page, { timeout: 5000, debugMode });
  
  if (!wsResult.success && debugMode) {
    console.warn('⚠️ WebSocket not connected, but continuing with element wait...');
  }
  
  // Then wait for the element
  await page.waitForSelector(selector, { timeout });
  
  if (debugMode) {
    console.log(`✅ Element found: ${selector}`);
  }
}
