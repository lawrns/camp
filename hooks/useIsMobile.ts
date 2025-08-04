import { useEffect, useState } from "react";

/**
 * Hook for detecting mobile devices with SSR-safe hydration
 * Prevents hydration mismatches by returning undefined on first render
 * and updating after useEffect runs on the client
 */
export function useIsMobile(breakpoint: number = 768): boolean | undefined {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value after component mounts
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook for detecting mobile devices with immediate value
 * Use this when you need an immediate boolean value and can handle
 * potential hydration mismatches with CSS media queries as fallback
 */
export function useIsMobileImmediate(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Return false during SSR to match desktop-first approach
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Update value after mount to ensure accuracy
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook for responsive layout detection with multiple breakpoints
 * Returns layout type: 'mobile' | 'tablet' | 'desktop'
 */
export function useResponsiveLayout() {
  const [layout, setLayout] = useState<'mobile' | 'tablet' | 'desktop' | undefined>(undefined);

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLayout('mobile');
      } else if (width < 1024) {
        setLayout('tablet');
      } else {
        setLayout('desktop');
      }
    };

    // Set initial value after component mounts
    updateLayout();

    // Listen for resize events
    window.addEventListener("resize", updateLayout);
    
    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return layout;
}
