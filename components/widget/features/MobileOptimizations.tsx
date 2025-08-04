/**
 * Mobile Optimizations for Widget Consolidation
 *
 * Comprehensive mobile device support and optimization:
 * - Touch-friendly interface adaptations
 * - Viewport handling for iOS Safari
 * - Network-aware loading strategies
 * - Performance optimizations for mobile devices
 * - Responsive design enhancements
 */

import React, { useEffect, useState, useCallback } from "react";
import { detectBrowser, getNetworkInfo, type BrowserInfo, type NetworkInfo } from "@/lib/browser-compatibility";

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: "portrait" | "landscape";
  viewportHeight: number;
  isKeyboardOpen: boolean;
  touchSupport: boolean;
  networkType: string;
  isSlowConnection: boolean;
}

// Hook for mobile device detection and state management
export function useMobileOptimizations() {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    orientation: "portrait",
    viewportHeight: window.innerHeight,
    isKeyboardOpen: false,
    touchSupport: false,
    networkType: "unknown",
    isSlowConnection: false,
  });

  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Initialize mobile detection
  useEffect(() => {
    const browser = detectBrowser();
    const network = getNetworkInfo();

    setBrowserInfo(browser);
    setNetworkInfo(network);

    setMobileState((prev) => ({
      ...prev,
      isMobile: browser.isMobile,
      isTablet: browser.isTablet,
      touchSupport: "ontouchstart" in window,
      networkType: network.effectiveType,
      isSlowConnection: network.isSlowConnection,
    }));
  }, []);

  // Handle viewport changes (especially for iOS Safari)
  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight;
      const heightDifference = mobileState.viewportHeight - newHeight;

      // Detect keyboard open on mobile (significant height reduction)
      const isKeyboardOpen = mobileState.isMobile && heightDifference > 150;

      setMobileState((prev) => ({
        ...prev,
        viewportHeight: newHeight,
        isKeyboardOpen,
      }));

      // Update CSS custom property for viewport height
      document.documentElement.style.setProperty("--vh", `${newHeight * 0.01}px`);
    };

    const handleOrientationChange = () => {
      // Delay to allow viewport to settle
      setTimeout(() => {
        const orientation = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
        setMobileState((prev) => ({ ...prev, orientation }));
        handleResize();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    // Initial setup
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [mobileState.isMobile, mobileState.viewportHeight]);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => {
      const network = getNetworkInfo();
      setNetworkInfo(network);
      setMobileState((prev) => ({
        ...prev,
        networkType: network.effectiveType,
        isSlowConnection: network.isSlowConnection,
      }));
    };

    const handleOffline = () => {
      setMobileState((prev) => ({
        ...prev,
        networkType: "offline",
        isSlowConnection: true,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    mobileState,
    browserInfo,
    networkInfo,
  };
}

// Touch gesture handling
export function useTouchGestures(onSwipe?: (direction: "up" | "down" | "left" | "right") => void) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart || !onSwipe) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          onSwipe(deltaX > 0 ? "right" : "left");
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          onSwipe(deltaY > 0 ? "down" : "up");
        }
      }

      setTouchStart(null);
    },
    [touchStart, onSwipe]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// Performance optimization for mobile
export function useMobilePerformance() {
  const { mobileState, networkInfo } = useMobileOptimizations();

  const optimizations = {
    // Reduce animations on slow connections or low-end devices
    shouldReduceAnimations: mobileState.isSlowConnection || networkInfo?.saveData,

    // Use smaller images on mobile
    shouldUseSmallImages: mobileState.isMobile,

    // Lazy load content on mobile
    shouldLazyLoad: mobileState.isMobile,

    // Reduce polling frequency on slow connections
    pollingInterval: mobileState.isSlowConnection ? 5000 : 1000,

    // Debounce input on mobile for better performance
    inputDebounceMs: mobileState.isMobile ? 300 : 150,
  };

  return optimizations;
}

// Mobile-specific CSS classes
export function getMobileClasses(mobileState: MobileState) {
  const classes = [];

  if (mobileState.isMobile) {
    classes.push("is-mobile");
  }

  if (mobileState.isTablet) {
    classes.push("is-tablet");
  }

  if (mobileState.isKeyboardOpen) {
    classes.push("keyboard-open");
  }

  if (mobileState.orientation === "landscape") {
    classes.push("landscape");
  } else {
    classes.push("portrait");
  }

  if (mobileState.touchSupport) {
    classes.push("touch-device");
  }

  if (mobileState.isSlowConnection) {
    classes.push("slow-connection");
  }

  return classes.join(" ");
}

// Main Mobile Optimizations Provider
export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const { mobileState, browserInfo, networkInfo } = useMobileOptimizations();
  const performance = useMobilePerformance();

  // Apply mobile-specific CSS classes
  useEffect(() => {
    const root = document.documentElement;
    const mobileClasses = getMobileClasses(mobileState);

    // Remove existing mobile classes
    root.classList.remove(
      "is-mobile",
      "is-tablet",
      "keyboard-open",
      "landscape",
      "portrait",
      "touch-device",
      "slow-connection"
    );

    // Add current mobile classes
    if (mobileClasses) {
      root.classList.add(...mobileClasses.split(" "));
    }

    // Set CSS custom properties for mobile optimizations
    root.style.setProperty("--mobile-vh", `${mobileState.viewportHeight}px`);
    root.style.setProperty("--is-mobile", mobileState.isMobile ? "1" : "0");
    root.style.setProperty("--is-keyboard-open", mobileState.isKeyboardOpen ? "1" : "0");

    // Performance-based CSS properties
    if (performance.shouldReduceAnimations) {
      root.style.setProperty("--animation-duration", "0ms");
      root.style.setProperty("--transition-duration", "0ms");
    }
  }, [mobileState, performance]);

  // iOS Safari specific fixes
  useEffect(() => {
    if (browserInfo?.name === "Safari" && mobileState.isMobile) {
      // Fix iOS Safari viewport height issues
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
        );
      }

      // Prevent zoom on input focus
      const inputs = document.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        input.addEventListener("focus", () => {
          if (input instanceof HTMLElement) {
            input.style.fontSize = "16px";
          }
        });
      });

      // Handle safe area insets
      document.documentElement.style.setProperty("--safe-area-inset-top", "env(safe-area-inset-top, 0px)");
      document.documentElement.style.setProperty("--safe-area-inset-bottom", "env(safe-area-inset-bottom, 0px)");
    }
  }, [browserInfo, mobileState.isMobile]);

  // Network adaptation
  useEffect(() => {
    if (networkInfo?.isSlowConnection) {
      // Reduce image quality
      document.documentElement.style.setProperty("--image-quality", "0.7");

      // Disable non-critical animations
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.style.setProperty("--image-quality", "1");
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [networkInfo]);

  return (
    <div
      className={`mobile-optimizations ${getMobileClasses(mobileState)}`}
      data-mobile={mobileState.isMobile}
      data-tablet={mobileState.isTablet}
      data-orientation={mobileState.orientation}
      data-keyboard-open={mobileState.isKeyboardOpen}
      data-network={mobileState.networkType}
    >
      {children}
    </div>
  );
}

// Utility component for responsive images
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

export function ResponsiveImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  loading = "lazy",
}: ResponsiveImageProps) {
  const { mobileState, browserInfo } = useMobileOptimizations();

  // Generate responsive image sources
  const generateSrcSet = (baseSrc: string) => {
    const extension = baseSrc.split(".").pop();
    const baseName = baseSrc.replace(`.${extension}`, "");

    const sizes = [320, 640, 768, 1024, 1280];
    const format = browserInfo?.supportsWebP ? "webp" : extension;

    return sizes.map((size) => `${baseName}-${size}w.${format} ${size}w`).join(", ");
  };

  return (
    <img
      src={src}
      srcSet={generateSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      className={`responsive-image ${className}`}
      style={{
        maxWidth: "100%",
        height: "auto",
        objectFit: "cover",
      }}
    />
  );
}

// Utility hook for mobile-friendly input handling
export function useMobileInput() {
  const { mobileState } = useMobileOptimizations();
  const performance = useMobilePerformance();

  const getInputProps = useCallback(
    (baseProps: unknown = {}) => {
      const mobileProps: unknown = { ...baseProps };

      if (mobileState.isMobile) {
        // Prevent zoom on iOS
        mobileProps.style = {
          ...mobileProps.style,
          fontSize: "16px",
        };

        // Add mobile-specific attributes
        mobileProps.autoComplete = mobileProps.autoComplete || "off";
        mobileProps.autoCorrect = "off";
        mobileProps.autoCapitalize = "off";
        mobileProps.spellCheck = false;
      }

      return mobileProps;
    },
    [mobileState.isMobile]
  );

  const debounceMs = performance.inputDebounceMs;

  return {
    getInputProps,
    debounceMs,
    isMobile: mobileState.isMobile,
    isKeyboardOpen: mobileState.isKeyboardOpen,
  };
}

export default MobileOptimizations;
