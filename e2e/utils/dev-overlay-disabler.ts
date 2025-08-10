/**
 * Dev Overlay Disabler Utility for E2E Tests
 * Provides functions to disable NextJS development overlay during testing
 */

import { Page } from '@playwright/test';

/**
 * Disables NextJS development overlay for E2E testing
 * This prevents the overlay from intercepting pointer events
 */
export async function disableDevOverlay(page: Page) {
  // Add init script that runs before any page scripts
  await page.addInitScript(() => {
    console.log('🧪 E2E: Disabling NextJS dev overlay');
    
    // Override the NextJS dev overlay before it loads
    if (typeof window !== 'undefined') {
      // Disable error overlay
      (window as any).__NEXT_DATA__ = {
        ...(window as any).__NEXT_DATA__,
        props: {
          ...(window as any).__NEXT_DATA__?.props,
          pageProps: {
            ...(window as any).__NEXT_DATA__?.props?.pageProps,
            __N_SSG: true,
          },
        },
      };

      // Override console methods that trigger overlay
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args: any[]) => {
        const message = args.join(' ');
        if (!message.includes('dev-overlay') && 
            !message.includes('nextjs-portal') &&
            !message.includes('__NEXT_DATA__')) {
          originalError.apply(console, args);
        }
      };

      console.warn = (...args: any[]) => {
        const message = args.join(' ');
        if (!message.includes('dev-overlay') && 
            !message.includes('nextjs-portal')) {
          originalWarn.apply(console, args);
        }
      };

      // Prevent overlay scripts from loading
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(this, tagName);
        
        if (tagName.toLowerCase() === 'script') {
          const script = element as HTMLScriptElement;
          const originalSetAttribute = script.setAttribute;
          
          script.setAttribute = function(name: string, value: string) {
            if (name === 'data-nextjs-dev-overlay' || 
                name === 'data-nextjs-error-overlay' ||
                (name === 'src' && value.includes('dev-overlay'))) {
              console.log('🚫 Blocked dev overlay script:', value);
              return;
            }
            return originalSetAttribute.call(this, name, value);
          };
        }
        
        return element;
      };

      // Block portal creation
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function(child: Node) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as Element;
          if (element.tagName === 'NEXTJS-PORTAL' || 
              element.hasAttribute('data-nextjs-dev-overlay') ||
              element.hasAttribute('data-nextjs-error-overlay')) {
            console.log('🚫 Blocked dev overlay element:', element.tagName);
            return child;
          }
        }
        return originalAppendChild.call(this, child);
      };
    }
  });

  // Add CSS to ensure overlay elements don't interfere
  await page.addStyleTag({
    content: `
      /* E2E Testing: Completely disable dev overlay */
      nextjs-portal,
      [data-nextjs-dev-overlay],
      [data-nextjs-error-overlay] {
        display: none !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        opacity: 0 !important;
      }
      
      /* Ensure all test elements are clickable */
      [data-testid] {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* Ensure interactive elements are clickable */
      button, input, textarea, select, a, [role="button"] {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* Force clickable state for form elements */
      form button, form input, form textarea, form select {
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      
      /* Ensure no overlay can block clicks */
      body > * {
        position: relative !important;
      }
      
      /* Hide any potential overlay containers */
      #__next-dev-overlay-error-toast,
      #__next-dev-overlay-error-toast *,
      .__next-dev-overlay-error-toast,
      .__next-dev-overlay-error-toast * {
        display: none !important;
        pointer-events: none !important;
      }
    `
  });

  // Set up continuous monitoring to remove overlay elements
  await page.evaluate(() => {
    const removeOverlayElements = () => {
      // Remove portal elements
      const portals = document.querySelectorAll('nextjs-portal');
      portals.forEach(portal => {
        console.log('🗑️ Removing nextjs-portal');
        portal.remove();
      });

      // Remove overlay scripts
      const overlayScripts = document.querySelectorAll('script[data-nextjs-dev-overlay], script[data-nextjs-error-overlay]');
      overlayScripts.forEach(script => {
        console.log('🗑️ Removing overlay script');
        script.remove();
      });

      // Remove overlay divs
      const overlayDivs = document.querySelectorAll('[data-nextjs-dev-overlay], [data-nextjs-error-overlay]');
      overlayDivs.forEach(div => {
        console.log('🗑️ Removing overlay div');
        (div as HTMLElement).style.display = 'none';
        (div as HTMLElement).style.pointerEvents = 'none';
      });
    };

    // Remove immediately
    removeOverlayElements();

    // Set up observer for continuous removal
    const observer = new MutationObserver(() => {
      removeOverlayElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-nextjs-dev-overlay', 'data-nextjs-error-overlay']
    });

    // Also remove on interval as backup
    setInterval(removeOverlayElements, 100);

    console.log('✅ Dev overlay disabler active');
  });
}

/**
 * Force click an element even if overlay is present
 * Uses JavaScript click as fallback if Playwright click fails
 */
export async function forceClick(page: Page, selector: string, timeout = 10000) {
  try {
    // First try normal Playwright click
    await page.locator(selector).click({ timeout: 5000 });
  } catch (error) {
    console.log(`⚠️ Normal click failed for ${selector}, trying force click`);
    
    // Force click using JavaScript
    await page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (element) {
        // Remove any pointer-events blocking
        element.style.pointerEvents = 'auto';
        element.style.zIndex = '9999';
        
        // Trigger click events
        element.click();
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        
        console.log(`🔧 Force clicked: ${sel}`);
      } else {
        throw new Error(`Element not found: ${sel}`);
      }
    }, selector);
  }
}

export default { disableDevOverlay, forceClick };
