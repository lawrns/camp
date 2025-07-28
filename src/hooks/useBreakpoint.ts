"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BreakpointKey,
  BREAKPOINTS,
  getCurrentBreakpoint,
  matchesBreakpoint,
  MEDIA_QUERIES,
  MediaQueryKey,
} from "@/lib/breakpoints";

interface BreakpointState {
  width: number;
  height: number;
  currentBreakpoint: BreakpointKey;

  // Breakpoint checks
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;

  // Semantic checks
  isMobile: boolean;
  isMobileOnly: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isDesktopLarge: boolean;

  // Orientation
  isLandscape: boolean;
  isPortrait: boolean;

  // Features
  isTouch: boolean;
  isRetina: boolean;
  isDarkMode: boolean;
  isReducedMotion: boolean;

  // Helper functions
  matches: (query: MediaQueryKey) => boolean;
  isAbove: (breakpoint: BreakpointKey) => boolean;
  isBelow: (breakpoint: BreakpointKey) => boolean;
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
}

// SSR-safe initial state
const getInitialState = (): BreakpointState => ({
  width: 0,
  height: 0,
  currentBreakpoint: "xs",

  isXs: false,
  isSm: false,
  isMd: false,
  isLg: false,
  isXl: false,
  is2xl: false,

  isMobile: true,
  isMobileOnly: true,
  isTablet: false,
  isDesktop: false,
  isDesktopLarge: false,

  isLandscape: false,
  isPortrait: true,

  isTouch: false,
  isRetina: false,
  isDarkMode: false,
  isReducedMotion: false,

  matches: () => false,
  isAbove: () => false,
  isBelow: () => true,
  isBetween: () => false,
});

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(getInitialState);

  // Media query matchers (memoized for performance)
  const matchers = useMemo(() => {
    if (typeof window === "undefined") return {} as Record<MediaQueryKey, MediaQueryList>;

    return Object.entries(MEDIA_QUERIES).reduce(
      (acc, [key, query]) => {
        try {
          acc[key as MediaQueryKey] = window.matchMedia(query as string);
        } catch (e) {}
        return acc;
      },
      {} as Record<MediaQueryKey, MediaQueryList>
    );
  }, []);

  // Helper functions that use current state
  const matches = useCallback(
    (query: MediaQueryKey): boolean => {
      const matcher = matchers[query];
      return matcher ? matcher.matches : false;
    },
    [matchers]
  );

  const isAbove = useCallback(
    (breakpoint: BreakpointKey): boolean => {
      return matchesBreakpoint(state.width, breakpoint, "min");
    },
    [state.width]
  );

  const isBelow = useCallback(
    (breakpoint: BreakpointKey): boolean => {
      return matchesBreakpoint(state.width, breakpoint, "max");
    },
    [state.width]
  );

  const isBetween = useCallback(
    (min: BreakpointKey, max: BreakpointKey): boolean => {
      return isAbove(min) && isBelow(max);
    },
    [isAbove, isBelow]
  );

  // Update state based on window and media queries
  const updateState = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const currentBreakpoint = getCurrentBreakpoint(width);

    setState({
      width,
      height,
      currentBreakpoint,

      // Breakpoint checks
      isXs: width >= BREAKPOINTS.xs,
      isSm: width >= BREAKPOINTS.sm,
      isMd: width >= BREAKPOINTS.md,
      isLg: width >= BREAKPOINTS.lg,
      isXl: width >= BREAKPOINTS.xl,
      is2xl: width >= BREAKPOINTS["2xl"],

      // Semantic checks
      isMobile: matches("mobile"),
      isMobileOnly: matches("mobileOnly"),
      isTablet: matches("tablet"),
      isDesktop: matches("desktop"),
      isDesktopLarge: matches("desktopLarge"),

      // Orientation
      isLandscape: matches("landscape"),
      isPortrait: matches("portrait"),

      // Features
      isTouch: matches("touch"),
      isRetina: matches("retina"),
      isDarkMode: matches("darkMode"),
      isReducedMotion: matches("reducedMotion"),

      // Helper functions
      matches,
      isAbove,
      isBelow,
      isBetween,
    });
  }, [matches, isAbove, isBelow, isBetween]);

  // Set up listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial update
    updateState();

    // Window resize listener
    const handleResize = () => {
      updateState();
    };

    // Media query change listeners
    const listeners: Array<() => void> = [];

    Object.values(matchers).forEach((matcher: any) => {
      if (!matcher) return;

      const listener = () => updateState();

      if (matcher.addEventListener) {
        matcher.addEventListener("change", listener);
      } else {
        // Fallback for older browsers
        matcher.addListener(listener);
      }

      listeners.push(() => {
        if (matcher.removeEventListener) {
          matcher.removeEventListener("change", listener);
        } else {
          matcher.removeListener(listener);
        }
      });
    });

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      listeners.forEach((cleanup: any) => cleanup());
    };
  }, [matchers, updateState]);

  return state;
}

// Additional hook for specific media queries
export function useMediaQuery(query: MediaQueryKey | string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = typeof query === "string" ? query : MEDIA_QUERIES[query as MediaQueryKey];

    if (!mediaQuery) {
      return;
    }

    const matcher = window.matchMedia(mediaQuery);

    // Set initial value
    setMatches(matcher.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    if (matcher.addEventListener) {
      matcher.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      matcher.addListener(listener);
    }

    // Cleanup
    return () => {
      if (matcher.removeEventListener) {
        matcher.removeEventListener("change", listener);
      } else {
        // Fallback for older browsers
        matcher.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

// Hook for responsive values
export function useResponsive<T>(values: Partial<Record<BreakpointKey, T>>): T | undefined {
  const breakpoint = useBreakpoint();

  // Get all breakpoints in order
  const breakpoints: BreakpointKey[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

  // Find the matching value for current breakpoint or fallback to smaller ones
  for (let i = breakpoints.indexOf(breakpoint.currentBreakpoint); i >= 0; i--) {
    const key = breakpoints[i];
    if (key && key in values) {
      return values[key];
    }
  }

  return undefined;
}
