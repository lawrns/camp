/**
 * Hook to detect if user prefers reduced motion
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Check if user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(QUERY);

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener (using addEventListener for better browser support)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that returns animation duration based on reduced motion preference
 * @param duration - The desired animation duration in ms
 * @returns 0 if reduced motion is preferred, otherwise the duration
 */
export function useAnimationDuration(duration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : duration;
}

/**
 * Hook that returns CSS classes based on reduced motion preference
 * @param animatedClass - The class to apply when animations are enabled
 * @param staticClass - The class to apply when animations are disabled
 * @returns The appropriate class string
 */
export function useMotionClass(animatedClass: string, staticClass: string = ""): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? staticClass : animatedClass;
}

/**
 * Hook for conditionally enabling animations
 * @param enableAnimation - Whether to enable the animation
 * @returns boolean indicating if animation should be shown
 */
export function useAnimation(enableAnimation: boolean = true): boolean {
  const prefersReducedMotion = useReducedMotion();
  return enableAnimation && !prefersReducedMotion;
}
