/**
 * Production Monitoring Initialization
 * Sets up error reporting, performance monitoring, and health checks
 */

import { errorReporter } from './error-reporter';
import { ProductionMonitor } from '../telemetry/production-monitor';

let isInitialized = false;

export function initializeMonitoring() {
  if (isInitialized) return;

  try {
    // Initialize error reporting
    // errorReporter is already the singleton instance
    
    // Initialize production monitoring
    const monitor = ProductionMonitor.getInstance();
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        errorReporter.reportError(event.error, {
          feature: 'global',
          action: 'unhandled_error',
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        errorReporter.reportError(event.reason, {
          feature: 'global',
          action: 'unhandled_promise_rejection',
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      // Monitor performance
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              monitor.recordPageLoad(entry.duration);
            }
          }
        });
        
        try {
          observer.observe({ entryTypes: ['navigation'] });
        } catch (e) {
          // Ignore if not supported
        }
      }
    }

    isInitialized = true;
    console.log('✅ Monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
  }
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  initializeMonitoring();
}
