/**
 * Cross-browser Compatibility Utilities
 *
 * Comprehensive browser detection and feature support for widget consolidation:
 * - Browser detection (Chrome, Firefox, Safari, Edge)
 * - Feature detection (WebRTC, WebSockets, CSS features)
 * - Mobile device detection and optimization
 * - Network adaptation and offline support
 * - Polyfill loading for legacy browsers
 */

// Browser detection utilities
export interface BrowserInfo {
  name: string;
  version: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportsWebRTC: boolean;
  supportsWebSockets: boolean;
  supportsServiceWorker: boolean;
  supportsIntersectionObserver: boolean;
  supportsResizeObserver: boolean;
  supportsWebP: boolean;
  supportsAvif: boolean;
  supportsCSSGrid: boolean;
  supportsCSSStickyPosition: boolean;
  supportsES6: boolean;
}

// Detect browser information
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;

  // Browser name detection
  let name = "Unknown";
  let version = "0";

  if (userAgent.includes("Chrome") && vendor.includes("Google")) {
    name = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (userAgent.includes("Firefox")) {
    name = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (userAgent.includes("Safari") && vendor.includes("Apple")) {
    name = "Safari";
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : "0";
  } else if (userAgent.includes("Edge")) {
    name = "Edge";
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : "0";
  }

  // Device type detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*(?:\bTablet\b|\bTab\b))/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // Feature detection
  const supportsWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const supportsWebSockets = "WebSocket" in window;
  const supportsServiceWorker = "serviceWorker" in navigator;
  const supportsIntersectionObserver = "IntersectionObserver" in window;
  const supportsResizeObserver = "ResizeObserver" in window;

  // Image format support
  const supportsWebP = checkImageFormatSupport("webp");
  const supportsAvif = checkImageFormatSupport("avif");

  // CSS feature support
  const supportsCSSGrid = CSS.supports("display", "grid");
  const supportsCSSStickyPosition = CSS.supports("position", "sticky");

  // ES6 support
  const supportsES6 = checkES6Support();

  return {
    name,
    version,
    isMobile,
    isTablet,
    isDesktop,
    supportsWebRTC,
    supportsWebSockets,
    supportsServiceWorker,
    supportsIntersectionObserver,
    supportsResizeObserver,
    supportsWebP,
    supportsAvif,
    supportsCSSGrid,
    supportsCSSStickyPosition,
    supportsES6,
  };
}

// Check image format support
function checkImageFormatSupport(format: "webp" | "avif"): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  try {
    const dataURL = canvas.toDataURL(`image/${format}`);
    return dataURL.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
}

// Check ES6 support
function checkES6Support(): boolean {
  try {
    // Test arrow functions, const/let, template literals
    eval("const test = () => `ES6 ${true}`;");
    return true;
  } catch {
    return false;
  }
}

// Network information and adaptation
export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
}

export function getNetworkInfo(): NetworkInfo {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  const effectiveType = connection?.effectiveType || "unknown";
  const downlink = connection?.downlink || 0;
  const rtt = connection?.rtt || 0;
  const saveData = connection?.saveData || false;
  const isOnline = navigator.onLine;

  // Consider connection slow if it's 2G or has high RTT
  const isSlowConnection = effectiveType === "slow-2g" || effectiveType === "2g" || rtt > 1000;

  return {
    effectiveType,
    downlink,
    rtt,
    saveData,
    isOnline,
    isSlowConnection,
  };
}

// Mobile optimization utilities
export function getMobileOptimizations(browserInfo: BrowserInfo, networkInfo: NetworkInfo) {
  const optimizations = {
    // Reduce animations on slow connections or low-end devices
    reduceAnimations: networkInfo.isSlowConnection || networkInfo.saveData,

    // Use smaller images on mobile
    useSmallImages: browserInfo.isMobile,

    // Prefer WebP on supported browsers
    preferWebP: browserInfo.supportsWebP,

    // Lazy load images on mobile
    lazyLoadImages: browserInfo.isMobile,

    // Reduce polling frequency on slow connections
    reducedPolling: networkInfo.isSlowConnection,

    // Use touch-friendly UI on mobile
    touchFriendlyUI: browserInfo.isMobile || browserInfo.isTablet,

    // Preload critical resources
    preloadCritical: !networkInfo.isSlowConnection,
  };

  return optimizations;
}

// Polyfill loading for legacy browsers
export async function loadPolyfills(browserInfo: BrowserInfo): Promise<void> {
  const polyfillPromises: Promise<any>[] = [];

  // IntersectionObserver polyfill
  if (!browserInfo.supportsIntersectionObserver) {
    polyfillPromises.push(
      import("intersection-observer").catch((error) => {

      })
    );
  }

  // ResizeObserver polyfill
  if (!browserInfo.supportsResizeObserver) {
    polyfillPromises.push(
      import("resize-observer-polyfill").catch((error) => {

      })
    );
  }

  // ES6 polyfills for older browsers
  if (!browserInfo.supportsES6) {
    polyfillPromises.push(
      import("core-js/stable").catch((error) => {

      }),
      import("regenerator-runtime/runtime").catch((error) => {

      })
    );
  }

  // Wait for all polyfills to load
  await Promise.allSettled(polyfillPromises);
}

// CSS feature detection and fallbacks
export function applyCSSFallbacks(browserInfo: BrowserInfo): void {
  const root = document.documentElement;

  // Add browser-specific classes
  root.classList.add(`browser-${browserInfo.name.toLowerCase()}`);
  root.classList.add(`browser-version-${browserInfo.version}`);

  if (browserInfo.isMobile) {
    root.classList.add("is-mobile");
  }

  if (browserInfo.isTablet) {
    root.classList.add("is-tablet");
  }

  if (browserInfo.isDesktop) {
    root.classList.add("is-desktop");
  }

  // CSS Grid fallback
  if (!browserInfo.supportsCSSGrid) {
    root.classList.add("no-css-grid");
  }

  // Sticky position fallback
  if (!browserInfo.supportsCSSStickyPosition) {
    root.classList.add("no-sticky-position");
  }
}

// Performance monitoring for different browsers
export function setupPerformanceMonitoring(browserInfo: BrowserInfo): void {
  // Use different performance strategies based on browser
  if (browserInfo.name === "Safari" && browserInfo.isMobile) {
    // Safari on iOS has specific performance considerations
    setupSafariOptimizations();
  } else if (browserInfo.name === "Firefox") {
    // Firefox-specific optimizations
    setupFirefoxOptimizations();
  } else if (browserInfo.name === "Chrome") {
    // Chrome-specific optimizations
    setupChromeOptimizations();
  }
}

function setupSafariOptimizations(): void {
  // Disable momentum scrolling issues
  document.addEventListener("touchstart", () => {}, { passive: true });

  // Handle viewport height issues on iOS Safari
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVH();
  window.addEventListener("resize", setVH);
  window.addEventListener("orientationchange", setVH);
}

function setupFirefoxOptimizations(): void {
  // Firefox-specific performance optimizations
  // Disable smooth scrolling for better performance
  if (document.documentElement.style.scrollBehavior !== undefined) {
    document.documentElement.style.scrollBehavior = "auto";
  }
}

function setupChromeOptimizations(): void {
  // Chrome-specific optimizations
  // Use passive event listeners for better scrolling performance
  const passiveEvents = ["touchstart", "touchmove", "wheel"];

  passiveEvents.forEach((event) => {
    document.addEventListener(event, () => {}, { passive: true });
  });
}

// Network adaptation strategies
export function adaptToNetwork(networkInfo: NetworkInfo): void {
  if (networkInfo.isSlowConnection) {
    // Reduce update frequency
    document.documentElement.style.setProperty("--animation-duration", "0ms");

    // Disable non-critical features
    document.documentElement.classList.add("slow-connection");
  }

  if (networkInfo.saveData) {
    // Enable data saver mode
    document.documentElement.classList.add("save-data");
  }

  // Listen for network changes
  window.addEventListener("online", () => {
    document.documentElement.classList.remove("offline");
    document.documentElement.classList.add("online");
  });

  window.addEventListener("offline", () => {
    document.documentElement.classList.remove("online");
    document.documentElement.classList.add("offline");
  });
}

// Main initialization function
export async function initializeBrowserCompatibility(): Promise<BrowserInfo> {
  const browserInfo = detectBrowser();
  const networkInfo = getNetworkInfo();

  // Load necessary polyfills
  await loadPolyfills(browserInfo);

  // Apply CSS fallbacks
  applyCSSFallbacks(browserInfo);

  // Setup performance monitoring
  setupPerformanceMonitoring(browserInfo);

  // Adapt to network conditions
  adaptToNetwork(networkInfo);

  // Apply mobile optimizations
  const optimizations = getMobileOptimizations(browserInfo, networkInfo);

  // Store browser info globally for other components
  (window as any).__BROWSER_INFO__ = browserInfo;
  (window as any).__NETWORK_INFO__ = networkInfo;
  (window as any).__OPTIMIZATIONS__ = optimizations;

  return browserInfo;
}

// Utility to check if a feature is supported
export function isFeatureSupported(feature: keyof BrowserInfo): boolean {
  const browserInfo = (window as any).__BROWSER_INFO__ || detectBrowser();
  return browserInfo[feature] as boolean;
}

// Utility to get current optimizations
export function getCurrentOptimizations() {
  return (window as any).__OPTIMIZATIONS__ || {};
}
