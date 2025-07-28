"use client";

// Utility functions and hooks for accessibility
import { useEffect, useState } from "react";

/**
 * Hook to detect if the user prefers reduced motion
 * This allows us to disable animations for users who have this preference
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect if the user prefers dark mode
 */
export function usePrefersDarkMode() {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDarkMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDarkMode(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersDarkMode;
}

/**
 * Helper functions for ARIA attributes
 */

// Use this to hide elements visually but keep them accessible to screen readers
export const srOnly = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

// Generate a unique ID with a prefix for ARIA purposes
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Keyboard interaction helpers
export const KEYS = {
  TAB: "Tab",
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
};

// Parse ARIA boolean attributes properly
export function parseAriaBool(value: boolean | "true" | "false"): "true" | "false" {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return value;
}
