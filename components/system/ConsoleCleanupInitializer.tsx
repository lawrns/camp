"use client";

import { cleanConsole, silenceConsole } from "@/lib/console-cleanup";
import { useEffect } from "react";

/**
 * Console Cleanup Initializer
 * Initializes console cleanup based on environment
 */
export function ConsoleCleanupInitializer() {
  useEffect(() => {
    // Check for early initialization flags
    if (typeof window !== "undefined") {
      if ((window as any).__silenceConsole) {
        silenceConsole();
      } else if ((window as any).__cleanConsole) {
        cleanConsole();
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
