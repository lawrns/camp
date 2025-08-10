/**
 * Dev Overlay Disabler Component
 * Disables NextJS development overlay during E2E testing to prevent pointer event interception
 */

'use client';

import { useEffect } from 'react';

export function DevOverlayDisabler() {
  useEffect(() => {
    // Only run in development mode and when E2E testing flag is set
    if (process.env.NODE_ENV === 'development' && 
        (process.env.NEXT_PUBLIC_E2E_TESTING === 'true' || 
         process.env.DISABLE_DEV_OVERLAY === 'true')) {
      
      console.log('🧪 E2E Testing Mode: Disabling NextJS dev overlay to prevent pointer event interception');
      
      // Function to remove dev overlay elements
      const removeDevOverlay = () => {
        // Remove NextJS dev overlay portal
        const devOverlayPortal = document.querySelector('nextjs-portal');
        if (devOverlayPortal) {
          devOverlayPortal.remove();
          console.log('✅ Removed nextjs-portal element');
        }

        // Remove dev overlay scripts
        const devOverlayScripts = document.querySelectorAll('script[data-nextjs-dev-overlay]');
        devOverlayScripts.forEach(script => {
          script.remove();
          console.log('✅ Removed dev overlay script');
        });

        // Remove any elements with pointer-events: auto that might interfere
        const overlayElements = document.querySelectorAll('[data-nextjs-dev-overlay], [data-nextjs-error-overlay]');
        overlayElements.forEach(element => {
          (element as HTMLElement).style.display = 'none';
          (element as HTMLElement).style.pointerEvents = 'none';
          console.log('✅ Disabled overlay element');
        });

        // Disable error overlay
        if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
          try {
            // Disable NextJS error overlay
            (window as any).__NEXT_DATA__.props.pageProps.__N_SSG = true;
          } catch (error) {
            // Ignore errors when trying to modify NextJS data
          }
        }
      };

      // Remove immediately
      removeDevOverlay();

      // Set up observer to remove overlay if it gets re-added
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check if it's a dev overlay element
              if (element.tagName === 'NEXTJS-PORTAL' || 
                  element.hasAttribute('data-nextjs-dev-overlay') ||
                  element.hasAttribute('data-nextjs-error-overlay')) {
                console.log('🚫 Blocking dev overlay element:', element.tagName);
                element.remove();
              }

              // Check for script tags with dev overlay
              if (element.tagName === 'SCRIPT' && 
                  element.hasAttribute('data-nextjs-dev-overlay')) {
                console.log('🚫 Blocking dev overlay script');
                element.remove();
              }
            }
          });
        });
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Override console methods that might trigger overlay
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args) => {
        // Filter out NextJS dev overlay related errors
        const message = args.join(' ');
        if (!message.includes('dev-overlay') && 
            !message.includes('nextjs-portal') &&
            !message.includes('__NEXT_DATA__')) {
          originalError.apply(console, args);
        }
      };

      console.warn = (...args) => {
        // Filter out NextJS dev overlay related warnings
        const message = args.join(' ');
        if (!message.includes('dev-overlay') && 
            !message.includes('nextjs-portal')) {
          originalWarn.apply(console, args);
        }
      };

      // Cleanup function
      return () => {
        observer.disconnect();
        console.error = originalError;
        console.warn = originalWarn;
        console.log('🧹 Cleaned up dev overlay disabler');
      };
    }
  }, []);

  // Add CSS to ensure no overlay interference
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 
        (process.env.NEXT_PUBLIC_E2E_TESTING === 'true' || 
         process.env.DISABLE_DEV_OVERLAY === 'true')) {
      
      const style = document.createElement('style');
      style.textContent = `
        /* E2E Testing: Disable dev overlay pointer events */
        nextjs-portal,
        [data-nextjs-dev-overlay],
        [data-nextjs-error-overlay] {
          display: none !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        
        /* Ensure test elements are clickable */
        [data-testid] {
          pointer-events: auto !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* Ensure buttons and inputs are clickable */
        button, input, textarea, select, a {
          pointer-events: auto !important;
          position: relative !important;
        }
      `;
      
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

export default DevOverlayDisabler;
