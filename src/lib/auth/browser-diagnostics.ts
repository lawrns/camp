/**
 * Browser Diagnostics
 *
 * Utilities for diagnosing browser compatibility and capabilities
 */

export interface BrowserCapabilities {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  webSockets: boolean;
  cookies: boolean;
  thirdPartyCookies: boolean;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  capabilities: BrowserCapabilities;
}

export const detectBrowserCapabilities = (): BrowserCapabilities => {
  const capabilities: BrowserCapabilities = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorkers: false,
    serviceWorkers: false,
    webSockets: false,
    cookies: false,
    thirdPartyCookies: false,
  };

  // Check localStorage
  try {
    const test = "test";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    capabilities.localStorage = true;
  } catch (e) {
    capabilities.localStorage = false;
  }

  // Check sessionStorage
  try {
    const test = "test";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    capabilities.sessionStorage = true;
  } catch (e) {
    capabilities.sessionStorage = false;
  }

  // Check IndexedDB
  capabilities.indexedDB = "indexedDB" in window;

  // Check Web Workers
  capabilities.webWorkers = "Worker" in window;

  // Check Service Workers
  capabilities.serviceWorkers = "serviceWorker" in navigator;

  // Check WebSockets
  capabilities.webSockets = "WebSocket" in window;

  // Check cookies
  capabilities.cookies = navigator.cookieEnabled;

  // Check third-party cookies (simplified check)
  capabilities.thirdPartyCookies = capabilities.cookies;

  return capabilities;
};

export const getBrowserInfo = (): BrowserInfo => {
  const userAgent = navigator.userAgent;

  // Simple browser detection
  let name = "Unknown";
  let version = "Unknown";
  let engine = "Unknown";

  if (userAgent.includes("Chrome")) {
    name = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match?.[1] || "Unknown";
    engine = "Blink";
  } else if (userAgent.includes("Firefox")) {
    name = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match?.[1] || "Unknown";
    engine = "Gecko";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    name = "Safari";
    const match = userAgent.match(/Version\/(\d+)/);
    version = match?.[1] || "Unknown";
    engine = "WebKit";
  } else if (userAgent.includes("Edge")) {
    name = "Edge";
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match?.[1] || "Unknown";
    engine = "EdgeHTML";
  }

  return {
    name,
    version,
    engine,
    platform: navigator.platform,
    mobile: /Mobi|Android/i.test(userAgent),
    capabilities: detectBrowserCapabilities(),
  };
};

export const checkAuthCompatibility = (): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const capabilities = detectBrowserCapabilities();
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!capabilities.localStorage) {
    issues.push("Local storage is not available");
    recommendations.push("Enable local storage in browser settings");
  }

  if (!capabilities.cookies) {
    issues.push("Cookies are disabled");
    recommendations.push("Enable cookies for authentication to work");
  }

  if (!capabilities.sessionStorage) {
    issues.push("Session storage is not available");
    recommendations.push("Update to a modern browser version");
  }

  const compatible = issues.length === 0;

  return {
    compatible,
    issues,
    recommendations,
  };
};

export const runBrowserDiagnostics = () => {
  const browserInfo = getBrowserInfo();
  const authCompatibility = checkAuthCompatibility();

  return {
    browserInfo,
    authCompatibility,
    timestamp: new Date(),
  };
};
