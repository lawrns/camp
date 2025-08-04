/**
 * Responsive Design System
 *
 * Comprehensive mobile-first design system for superior mobile experience
 * Part of Phase 3: Advanced Features & Polish
 *
 * Features:
 * - Mobile-first responsive breakpoints
 * - Touch-optimized component sizing
 * - Performance-optimized animations
 * - Accessibility-compliant interactions
 * - Cross-platform compatibility
 */

// Mobile-first breakpoints (following industry best practices)
export const breakpoints = {
  xs: "320px", // Small phones
  sm: "375px", // Standard phones
  md: "768px", // Tablets
  lg: "1024px", // Small laptops
  xl: "1280px", // Large laptops
  "2xl": "1536px", // Desktop
} as const;

// Touch-optimized sizing (following Apple/Google guidelines)
export const touchTargets = {
  minimum: "44px", // iOS minimum
  comfortable: "48px", // Android recommended
  large: "56px", // Large touch targets
  icon: "24px", // Icon size within touch targets
} as const;

// Mobile-optimized spacing system
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
} as const;

// Typography scale optimized for mobile readability
export const typography = {
  mobile: {
    xs: { fontSize: "12px", lineHeight: "16px" },
    sm: { fontSize: "14px", lineHeight: "20px" },
    base: { fontSize: "16px", lineHeight: "24px" }, // iOS base size
    lg: { fontSize: "18px", lineHeight: "28px" },
    xl: { fontSize: "20px", lineHeight: "32px" },
    "2xl": { fontSize: "24px", lineHeight: "36px" },
  },
  desktop: {
    xs: { fontSize: "12px", lineHeight: "16px" },
    sm: { fontSize: "14px", lineHeight: "20px" },
    base: { fontSize: "14px", lineHeight: "20px" }, // Smaller for desktop
    lg: { fontSize: "16px", lineHeight: "24px" },
    xl: { fontSize: "18px", lineHeight: "28px" },
    "2xl": { fontSize: "20px", lineHeight: "32px" },
  },
} as const;

// Mobile-optimized animation durations
export const animations = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  // Reduced motion for accessibility
  reducedMotion: {
    fast: "0ms",
    normal: "0ms",
    slow: "0ms",
  },
} as const;

// Z-index scale for mobile layering
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

/**
 * Device detection utilities
 */
export class DeviceDetection {
  static isMobile(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  static isTouchDevice(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  static getViewportSize(): { width: number; height: number } {
    return {
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight,
    };
  }

  static isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }
}

/**
 * Responsive utilities for dynamic styling
 */
export class ResponsiveUtils {
  static getBreakpointValue(breakpoint: keyof typeof breakpoints): number {
    return parseInt(breakpoints[breakpoint].replace("px", ""));
  }

  static isBreakpointActive(breakpoint: keyof typeof breakpoints): boolean {
    return window.innerWidth >= this.getBreakpointValue(breakpoint);
  }

  static getCurrentBreakpoint(): keyof typeof breakpoints {
    const width = window.innerWidth;

    if (width >= this.getBreakpointValue("2xl")) return "2xl";
    if (width >= this.getBreakpointValue("xl")) return "xl";
    if (width >= this.getBreakpointValue("lg")) return "lg";
    if (width >= this.getBreakpointValue("md")) return "md";
    if (width >= this.getBreakpointValue("sm")) return "sm";
    return "xs";
  }

  static getResponsiveValue<T>(values: Partial<Record<keyof typeof breakpoints, T>>): T | undefined {
    const currentBreakpoint = this.getCurrentBreakpoint();
    const breakpointOrder: (keyof typeof breakpoints)[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

    // Find the largest breakpoint that has a value and is <= current breakpoint
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

    for (let i = currentIndex; i >= 0; i--) {
      const breakpoint = breakpointOrder[i];
      if (values[breakpoint] !== undefined) {
        return values[breakpoint];
      }
    }

    return undefined;
  }
}

/**
 * Touch gesture utilities
 */
export class TouchGestureUtils {
  static calculateSwipeDirection(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    threshold: number = 50
  ): "up" | "down" | "left" | "right" | null {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return null; // Not enough movement
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? "right" : "left";
    } else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  static calculateSwipeVelocity(distance: number, timeMs: number): number {
    return distance / timeMs; // pixels per millisecond
  }

  static isValidSwipe(
    distance: number,
    velocity: number,
    minDistance: number = 50,
    minVelocity: number = 0.3
  ): boolean {
    return distance >= minDistance && velocity >= minVelocity;
  }
}

/**
 * Performance optimization utilities for mobile
 */
export class MobilePerformanceUtils {
  static debounce<T extends (...args: unknown[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: unknown[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static requestIdleCallback(callback: () => void): void {
    if ("requestIdleCallback" in window) {
      (window as unknown).requestIdleCallback(callback);
    } else {
      setTimeout(callback, 1);
    }
  }

  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  static optimizeImageForMobile(canvas: HTMLCanvasElement, maxWidth: number = 800, quality: number = 0.8): string {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Calculate new dimensions
    const ratio = Math.min(maxWidth / canvas.width, maxWidth / canvas.height);
    const newWidth = canvas.width * ratio;
    const newHeight = canvas.height * ratio;

    // Create optimized canvas
    const optimizedCanvas = document.createElement("canvas");
    optimizedCanvas.width = newWidth;
    optimizedCanvas.height = newHeight;

    const optimizedCtx = optimizedCanvas.getContext("2d");
    if (!optimizedCtx) return "";

    optimizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

    return optimizedCanvas.toDataURL("image/jpeg", quality);
  }
}

/**
 * Accessibility utilities for mobile
 */
export class MobileAccessibilityUtils {
  static announceToScreenReader(message: string): void {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.overflow = "hidden";

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static addTouchFeedback(element: HTMLElement): void {
    element.style.webkitTapHighlightColor = "rgba(0, 0, 0, 0.1)";
    element.style.webkitUserSelect = "none";
    element.style.userSelect = "none";
  }

  static ensureMinimumTouchTarget(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const minSize = parseInt(touchTargets.minimum);

    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = touchTargets.minimum;
      element.style.minHeight = touchTargets.minimum;
      element.style.display = "inline-flex";
      element.style.alignItems = "center";
      element.style.justifyContent = "center";
    }
  }

  static addFocusManagement(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    container.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }
}

/**
 * CSS-in-JS utilities for responsive design
 */
export const responsiveStyles = {
  // Container queries for component-based responsive design
  container: (maxWidth: keyof typeof breakpoints) => ({
    width: "100%",
    maxWidth: breakpoints[maxWidth],
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),

  // Mobile-first media queries
  mediaQuery: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]})`,

  // Touch-optimized button styles
  touchButton: {
    minHeight: touchTargets.comfortable,
    minWidth: touchTargets.comfortable,
    padding: `${spacing.sm} ${spacing.md}`,
    border: "none",
    borderRadius: "8px",
    fontSize: typography.mobile.base.fontSize,
    lineHeight: typography.mobile.base.lineHeight,
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition: `all ${animations.fast} ease-in-out`,
  },

  // Mobile-optimized input styles
  touchInput: {
    minHeight: touchTargets.comfortable,
    padding: `${spacing.sm} ${spacing.md}`,
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: typography.mobile.base.fontSize,
    lineHeight: typography.mobile.base.lineHeight,
    WebkitAppearance: "none",
    appearance: "none",
  },

  // Safe area handling for iOS
  safeArea: {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  },
};

// Export all utilities as a single object for easy importing
export const MobileDesignSystem = {
  breakpoints,
  touchTargets,
  spacing,
  typography,
  animations,
  zIndex,
  DeviceDetection,
  ResponsiveUtils,
  TouchGestureUtils,
  MobilePerformanceUtils,
  MobileAccessibilityUtils,
  responsiveStyles,
};
