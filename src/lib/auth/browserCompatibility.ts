import { checkAuthCompatibility, getBrowserInfo } from "./browser-diagnostics";

/**
 * Browser Compatibility
 *
 * Browser compatibility checks and utilities
 */

// Re-export from browser-diagnostics for backward compatibility
export * from "./browser-diagnostics";

export const isCompatibleBrowser = (): boolean => {
  const { compatible } = checkAuthCompatibility();
  return compatible;
};

export const getCompatibilityReport = () => {
  const browserInfo = getBrowserInfo();
  const authCompatibility = checkAuthCompatibility();

  return {
    browser: browserInfo,
    auth: authCompatibility,
    overall: authCompatibility.compatible,
  };
};
