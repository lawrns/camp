/**
 * Adaptive Micro-animations System
 *
 * Network-aware animation system with device capability detection:
 * - Automatic animation quality adjustment based on network speed
 * - Device performance-based animation complexity
 * - Accessibility-aware animation controls
 * - Battery-conscious animation management
 * - Smooth fallbacks for low-end devices
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";

// Animation quality levels
export enum AnimationQuality {
  DISABLED = "disabled",
  MINIMAL = "minimal",
  REDUCED = "reduced",
  STANDARD = "standard",
  ENHANCED = "enhanced",
  PREMIUM = "premium",
}

// Network conditions
export enum NetworkCondition {
  OFFLINE = "offline",
  SLOW_2G = "slow-2g",
  SLOW_3G = "2g",
  FAST_3G = "3g",
  FAST_4G = "4g",
  WIFI = "wifi",
  UNKNOWN = "unknown",
}

// Device performance tiers
export enum DevicePerformance {
  LOW_END = "low_end",
  MID_RANGE = "mid_range",
  HIGH_END = "high_end",
  PREMIUM = "premium",
}

// Animation configuration
export interface AnimationConfig {
  quality: AnimationQuality;
  duration: {
    micro: number; // 50-150ms for micro-interactions
    short: number; // 150-300ms for transitions
    medium: number; // 300-500ms for complex animations
    long: number; // 500ms+ for dramatic effects
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
    bounce: string;
  };
  effects: {
    blur: boolean;
    scale: boolean;
    rotate: boolean;
    parallax: boolean;
    particles: boolean;
    morphing: boolean;
  };
  performance: {
    useTransform3d: boolean;
    useWillChange: boolean;
    enableGPUAcceleration: boolean;
    maxConcurrentAnimations: number;
  };
}

// Animation configurations by quality level
const ANIMATION_CONFIGS: Record<AnimationQuality, AnimationConfig> = {
  [AnimationQuality.DISABLED]: {
    quality: AnimationQuality.DISABLED,
    duration: { micro: 0, short: 0, medium: 0, long: 0 },
    easing: {
      ease: "linear",
      easeIn: "linear",
      easeOut: "linear",
      easeInOut: "linear",
      spring: "linear",
      bounce: "linear",
    },
    effects: {
      blur: false,
      scale: false,
      rotate: false,
      parallax: false,
      particles: false,
      morphing: false,
    },
    performance: {
      useTransform3d: false,
      useWillChange: false,
      enableGPUAcceleration: false,
      maxConcurrentAnimations: 0,
    },
  },

  [AnimationQuality.MINIMAL]: {
    quality: AnimationQuality.MINIMAL,
    duration: { micro: 50, short: 100, medium: 150, long: 200 },
    easing: {
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
      spring: "ease-out",
      bounce: "ease-out",
    },
    effects: {
      blur: false,
      scale: true,
      rotate: false,
      parallax: false,
      particles: false,
      morphing: false,
    },
    performance: {
      useTransform3d: false,
      useWillChange: false,
      enableGPUAcceleration: false,
      maxConcurrentAnimations: 2,
    },
  },

  [AnimationQuality.REDUCED]: {
    quality: AnimationQuality.REDUCED,
    duration: { micro: 75, short: 150, medium: 200, long: 250 },
    easing: {
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "ease-out",
    },
    effects: {
      blur: false,
      scale: true,
      rotate: true,
      parallax: false,
      particles: false,
      morphing: false,
    },
    performance: {
      useTransform3d: true,
      useWillChange: true,
      enableGPUAcceleration: true,
      maxConcurrentAnimations: 3,
    },
  },

  [AnimationQuality.STANDARD]: {
    quality: AnimationQuality.STANDARD,
    duration: { micro: 100, short: 200, medium: 300, long: 400 },
    easing: {
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
    effects: {
      blur: true,
      scale: true,
      rotate: true,
      parallax: false,
      particles: false,
      morphing: true,
    },
    performance: {
      useTransform3d: true,
      useWillChange: true,
      enableGPUAcceleration: true,
      maxConcurrentAnimations: 5,
    },
  },

  [AnimationQuality.ENHANCED]: {
    quality: AnimationQuality.ENHANCED,
    duration: { micro: 120, short: 250, medium: 350, long: 500 },
    easing: {
      ease: "ease",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
    effects: {
      blur: true,
      scale: true,
      rotate: true,
      parallax: true,
      particles: false,
      morphing: true,
    },
    performance: {
      useTransform3d: true,
      useWillChange: true,
      enableGPUAcceleration: true,
      maxConcurrentAnimations: 8,
    },
  },

  [AnimationQuality.PREMIUM]: {
    quality: AnimationQuality.PREMIUM,
    duration: { micro: 150, short: 300, medium: 500, long: 800 },
    easing: {
      ease: "ease",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
    effects: {
      blur: true,
      scale: true,
      rotate: true,
      parallax: true,
      particles: true,
      morphing: true,
    },
    performance: {
      useTransform3d: true,
      useWillChange: true,
      enableGPUAcceleration: true,
      maxConcurrentAnimations: 12,
    },
  },
};

// Device performance detection
export function detectDevicePerformance(): DevicePerformance {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;

  // Check device memory (if available)
  const memory = (navigator as unknown).deviceMemory || 4;

  // Check GPU capabilities
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  const hasWebGL = !!gl;

  // Check for high-end features
  const hasWebGL2 = !!canvas.getContext("webgl2");
  const hasOffscreenCanvas = "OffscreenCanvas" in window;

  // Performance scoring
  let score = 0;

  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else if (cores >= 2) score += 1;

  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else if (memory >= 2) score += 1;

  if (hasWebGL2) score += 2;
  else if (hasWebGL) score += 1;

  if (hasOffscreenCanvas) score += 1;

  // Classify device performance
  if (score >= 8) return DevicePerformance.PREMIUM;
  if (score >= 6) return DevicePerformance.HIGH_END;
  if (score >= 4) return DevicePerformance.MID_RANGE;
  return DevicePerformance.LOW_END;
}

// Network condition detection
export function detectNetworkCondition(): NetworkCondition {
  if (!navigator.onLine) return NetworkCondition.OFFLINE;

  const connection =
    (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;

  if (!connection) return NetworkCondition.UNKNOWN;

  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink || 0;

  // Map effective types to our conditions
  switch (effectiveType) {
    case "slow-2g":
      return NetworkCondition.SLOW_2G;
    case "2g":
      return NetworkCondition.SLOW_3G;
    case "3g":
      return downlink > 1.5 ? NetworkCondition.FAST_3G : NetworkCondition.SLOW_3G;
    case "4g":
      return downlink > 10 ? NetworkCondition.WIFI : NetworkCondition.FAST_4G;
    default:
      return NetworkCondition.UNKNOWN;
  }
}

// Battery status detection
export function detectBatteryStatus(): Promise<{
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}> {
  return new Promise((resolve) => {
    if ("getBattery" in navigator) {
      (navigator as unknown)
        .getBattery()
        .then((battery: unknown) => {
          resolve({
            charging: battery.charging,
            level: battery.level,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
          });
        })
        .catch(() => {
          resolve({ charging: true, level: 1, chargingTime: 0, dischargingTime: Infinity });
        });
    } else {
      resolve({ charging: true, level: 1, chargingTime: 0, dischargingTime: Infinity });
    }
  });
}

// Determine optimal animation quality
export async function determineAnimationQuality(
  userPreference?: AnimationQuality,
  respectReducedMotion: boolean = true
): Promise<AnimationQuality> {
  // Check for reduced motion preference
  if (respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return AnimationQuality.MINIMAL;
  }

  // Use user preference if provided
  if (userPreference) {
    return userPreference;
  }

  // Detect device and network conditions
  const devicePerformance = detectDevicePerformance();
  const networkCondition = detectNetworkCondition();
  const batteryStatus = await detectBatteryStatus();

  // Battery-conscious adjustments
  const lowBattery = !batteryStatus.charging && batteryStatus.level < 0.2;

  // Determine quality based on conditions
  if (networkCondition === NetworkCondition.OFFLINE || networkCondition === NetworkCondition.SLOW_2G || lowBattery) {
    return AnimationQuality.DISABLED;
  }

  if (networkCondition === NetworkCondition.SLOW_3G || devicePerformance === DevicePerformance.LOW_END) {
    return AnimationQuality.MINIMAL;
  }

  if (networkCondition === NetworkCondition.FAST_3G || devicePerformance === DevicePerformance.MID_RANGE) {
    return AnimationQuality.REDUCED;
  }

  if (networkCondition === NetworkCondition.FAST_4G || devicePerformance === DevicePerformance.HIGH_END) {
    return AnimationQuality.ENHANCED;
  }

  if (networkCondition === NetworkCondition.WIFI && devicePerformance === DevicePerformance.PREMIUM) {
    return AnimationQuality.PREMIUM;
  }

  return AnimationQuality.STANDARD;
}

// React hook for adaptive animations
export function useAdaptiveAnimations(userPreference?: AnimationQuality) {
  const [animationQuality, setAnimationQuality] = useState<AnimationQuality>(AnimationQuality.STANDARD);
  const [config, setConfig] = useState<AnimationConfig>(ANIMATION_CONFIGS[AnimationQuality.STANDARD]);
  const [isLoading, setIsLoading] = useState(true);

  // Update animation quality
  const updateAnimationQuality = useCallback(async () => {
    const quality = await determineAnimationQuality(userPreference);
    setAnimationQuality(quality);
    setConfig(ANIMATION_CONFIGS[quality]);
    setIsLoading(false);
  }, [userPreference]);

  // Initialize and listen for changes
  useEffect(() => {
    updateAnimationQuality();

    // Listen for network changes
    const handleOnline = () => updateAnimationQuality();
    const handleOffline = () => {
      setAnimationQuality(AnimationQuality.DISABLED);
      setConfig(ANIMATION_CONFIGS[AnimationQuality.DISABLED]);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for reduced motion changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleReducedMotionChange = () => updateAnimationQuality();
    mediaQuery.addListener(handleReducedMotionChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      mediaQuery.removeListener(handleReducedMotionChange);
    };
  }, [updateAnimationQuality]);

  // Animation utilities
  const getTransition = useCallback(
    (type: "micro" | "short" | "medium" | "long", easing: keyof AnimationConfig["easing"] = "ease") => {
      return `${config.duration[type]}ms ${config.easing[easing]}`;
    },
    [config]
  );

  const shouldUseEffect = useCallback(
    (effect: keyof AnimationConfig["effects"]) => {
      return config.effects[effect];
    },
    [config]
  );

  const getPerformanceStyle = useCallback(
    (element: HTMLElement) => {
      const styles: Partial<CSSStyleDeclaration> = {};

      if (config.performance.useWillChange) {
        styles.willChange = "transform, opacity";
      }

      if (config.performance.enableGPUAcceleration) {
        styles.transform = "translateZ(0)";
      }

      return styles;
    },
    [config]
  );

  return {
    quality: animationQuality,
    config,
    isLoading,
    getTransition,
    shouldUseEffect,
    getPerformanceStyle,
    updateQuality: updateAnimationQuality,
  };
}

// CSS-in-JS animation utilities
export function createAnimationStyles(config: AnimationConfig) {
  return {
    // Micro-interactions
    buttonHover: {
      transition: `transform ${config.duration.micro}ms ${config.easing.easeOut}`,
      transform: config.effects.scale ? "scale(1.02)" : "none",
    },

    buttonPress: {
      transition: `transform ${config.duration.micro}ms ${config.easing.easeIn}`,
      transform: config.effects.scale ? "scale(0.98)" : "none",
    },

    // Panel animations
    panelEnter: {
      transition: `all ${config.duration.medium}ms ${config.easing.spring}`,
      transform: config.effects.scale ? "scale(1)" : "translateY(0)",
      opacity: 1,
      filter: config.effects.blur ? "blur(0px)" : "none",
    },

    panelExit: {
      transition: `all ${config.duration.short}ms ${config.easing.easeIn}`,
      transform: config.effects.scale ? "scale(0.95)" : "translateY(20px)",
      opacity: 0,
      filter: config.effects.blur ? "blur(4px)" : "none",
    },

    // Message animations
    messageSlideIn: {
      transition: `all ${config.duration.short}ms ${config.easing.easeOut}`,
      transform: "translateX(0)",
      opacity: 1,
    },

    // Loading animations
    pulse:
      config.quality !== AnimationQuality.DISABLED
        ? {
            animation: `pulse ${config.duration.long}ms ${config.easing.easeInOut} infinite`,
          }
        : {},

    // Bounce effect
    bounce: config.effects.morphing
      ? {
          animation: `bounce ${config.duration.medium}ms ${config.easing.bounce}`,
        }
      : {},
  };
}

export default {
  AnimationQuality,
  NetworkCondition,
  DevicePerformance,
  detectDevicePerformance,
  detectNetworkCondition,
  detectBatteryStatus,
  determineAnimationQuality,
  useAdaptiveAnimations,
  createAnimationStyles,
  ANIMATION_CONFIGS,
};
