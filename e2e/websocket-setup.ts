/**
 * WebSocket Setup for E2E Tests
 * 
 * Configures WebSocket connections and realtime communication
 * for optimal E2E test performance and reliability.
 */

import { test as setup, expect } from '@playwright/test';

setup('configure websocket environment', async ({ page, context }) => {
  console.log('🔌 Configuring WebSocket environment for E2E tests...');

  // Set up WebSocket event listeners for debugging
  page.on('websocket', ws => {
    console.log(`🔌 WebSocket connection: ${ws.url()}`);
    
    ws.on('framesent', event => {
      if (process.env.DEBUG_WEBSOCKET) {
        console.log(`📤 WebSocket frame sent: ${event.payload}`);
      }
    });
    
    ws.on('framereceived', event => {
      if (process.env.DEBUG_WEBSOCKET) {
        console.log(`📥 WebSocket frame received: ${event.payload}`);
      }
    });
    
    ws.on('close', () => {
      console.log(`🔌 WebSocket connection closed: ${ws.url()}`);
    });
  });

  // Set up console logging for WebSocket errors
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('WebSocket')) {
      console.error(`🚨 WebSocket error in browser: ${msg.text()}`);
    }
  });

  // Set up page error handling for WebSocket issues
  page.on('pageerror', error => {
    if (error.message.includes('WebSocket') || error.message.includes('realtime')) {
      console.error(`🚨 Page error related to WebSocket/realtime: ${error.message}`);
    }
  });

  // Navigate to the app to initialize WebSocket connections
  await page.goto('/');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');

  // Inject WebSocket debugging utilities
  await page.addInitScript(() => {
    // Store original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Enhanced WebSocket with better error handling and logging
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        console.log(`🔌 Creating WebSocket connection to: ${url}`);
        super(url, protocols);
        
        // Enhanced error handling
        this.addEventListener('error', (event) => {
          console.error('🚨 WebSocket error:', event);
        });
        
        this.addEventListener('open', () => {
          console.log(`✅ WebSocket connected to: ${url}`);
        });
        
        this.addEventListener('close', (event) => {
          console.log(`🔌 WebSocket closed: ${url}, code: ${event.code}, reason: ${event.reason}`);
        });
      }
    };

    // Disable service workers that might interfere with WebSocket connections
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }

    // Prevent page visibility API from throttling WebSocket connections
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: false
    });
    
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: false
    });

    // Override setTimeout/setInterval to prevent throttling
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback: Function, delay: number = 0, ...args: any[]) {
      // Reduce minimum delay for WebSocket-related timeouts
      const adjustedDelay = delay < 100 ? Math.max(delay, 1) : delay;
      return originalSetTimeout.call(this, callback, adjustedDelay, ...args);
    };
    
    window.setInterval = function(callback: Function, delay: number = 0, ...args: any[]) {
      // Reduce minimum delay for WebSocket-related intervals
      const adjustedDelay = delay < 100 ? Math.max(delay, 1) : delay;
      return originalSetInterval.call(this, callback, adjustedDelay, ...args);
    };
  });

  // Test WebSocket connectivity to Supabase
  const wsConnectivity = await page.evaluate(async (envVars) => {
    try {
      // Test connection to Supabase realtime
      const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'wss://') + '/realtime/v1/websocket';
      const testWs = new WebSocket(supabaseUrl + '?apikey=' + envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testWs.close();
          resolve({ success: false, error: 'Connection timeout' });
        }, 5000);
        
        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve({ success: true });
        };
        
        testWs.onerror = (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.toString() });
        };
      });
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  }, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  if (wsConnectivity.success) {
    console.log('✅ WebSocket connectivity test passed');
  } else {
    console.warn('⚠️ WebSocket connectivity test failed:', wsConnectivity.error);
  }

  // Set up context-level WebSocket handling
  await context.addInitScript(() => {
    // Ensure WebSocket connections are not blocked by CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss:; connect-src 'self' https: wss:;";
    document.head.appendChild(meta);
  });

  console.log('✅ WebSocket environment configuration complete');
});
