"use client";

import { useEffect } from "react";
import { applyLightModeOverrides } from "@/lib/theme-config";

/**
 * LightModeEnforcer Component
 *
 * This component runs on the client side to ensure light mode is maintained
 * across page navigation, dynamic content loading, and any theme conflicts.
 */
export function LightModeEnforcer() {
  useEffect(() => {
    // Apply light mode overrides immediately
    applyLightModeOverrides();

    // Create a more comprehensive MutationObserver
    const observer = new MutationObserver((mutations: any) => {
      mutations.forEach((mutation: any) => {
        if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
          const target = mutation.target;

          // Watch for class changes on html and body elements
          if (
            (target.tagName === "HTML" || target.tagName === "BODY") &&
            (mutation.attributeName === "class" || mutation.attributeName === "data-theme")
          ) {
            // Check for any dark mode indicators
            const hasDarkClass =
              target.classList.contains("dark") ||
              target.classList.contains("dark-mode") ||
              target.classList.contains("theme-dark");

            const hasDarkAttribute =
              target.getAttribute("data-theme") === "dark" || target.getAttribute("data-mode") === "dark";

            if (hasDarkClass || hasDarkAttribute) {
              // Force remove all dark variants and ensure light mode
              target.classList.remove("dark", "dark-mode", "theme-dark");
              target.classList.add("light");
              target.setAttribute("data-theme", "light");
              target.setAttribute("data-mode", "light");
              applyLightModeOverrides();
            }
          }
        }
      });
    });

    // Observe both html and body elements
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"],
    });

    // Listen for system theme changes and prevent them
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      // Ensure light mode is maintained regardless of system preference
      applyLightModeOverrides();
    };

    // Check if addEventListener exists before using it
    if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    }

    // Periodic check to ensure light mode is maintained
    const intervalCheck = setInterval(() => {
      const html = document.documentElement;
      const body = document.body;

      if (
        html.classList.contains("dark") ||
        body.classList.contains("dark") ||
        html.getAttribute("data-theme") === "dark" ||
        body.getAttribute("data-theme") === "dark"
      ) {
        applyLightModeOverrides();
      }
    }, 1000); // Check every second

    // Cleanup function
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      clearInterval(intervalCheck);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default LightModeEnforcer;
