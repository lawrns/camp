/**
 * @fileoverview Animation utilities for consistent UI animations across the application
 * @module utils/animations
 */

/**
 * Base configuration for all animations
 */
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number | "infinite";
}

/**
 * Configuration for fade animations
 * @extends AnimationConfig
 */
export interface FadeConfig extends AnimationConfig {
  /** Starting opacity (0-1) */
  from?: number;
  /** Ending opacity (0-1) */
  to?: number;
}

/**
 * Configuration for slide animations
 * @extends AnimationConfig
 */
export interface SlideConfig extends AnimationConfig {
  /** Direction of the slide animation */
  direction?: "up" | "down" | "left" | "right";
  /** Distance to slide in pixels */
  distance?: number;
}

/**
 * Configuration for scale animations
 * @extends AnimationConfig
 */
export interface ScaleConfig extends AnimationConfig {
  /** Starting scale factor */
  from?: number;
  /** Ending scale factor */
  to?: number;
}

/**
 * Utility class for generating CSS animation strings
 */
export class AnimationUtils {
  /**
   * Generates CSS for a fade-in animation
   * @param config - Fade animation configuration
   * @returns CSS string with animation properties
   */
  static fadeIn(config: FadeConfig = {}): string {
    const { duration = 300, delay = 0, easing = "ease-in-out" } = config;
    return `
      opacity: 0;
      animation: fadeIn ${duration}ms ${easing} ${delay}ms forwards;
      @keyframes fadeIn {
        to { opacity: 1; }
      }
    `;
  }

  /**
   * Generates CSS for a fade-out animation
   * @param config - Fade animation configuration
   * @returns CSS string with animation properties
   */
  static fadeOut(config: FadeConfig = {}): string {
    const { duration = 300, delay = 0, easing = "ease-in-out" } = config;
    return `
      animation: fadeOut ${duration}ms ${easing} ${delay}ms forwards;
      @keyframes fadeOut {
        to { opacity: 0; }
      }
    `;
  }

  /**
   * Generates CSS for a slide-in animation
   * @param config - Slide animation configuration
   * @returns CSS string with animation properties
   */
  static slideIn(config: SlideConfig = {}): string {
    const { duration = 300, delay = 0, easing = "ease-out", direction = "up", distance = 20 } = config;
    const transform = this.getSlideTransform(direction, distance);

    return `
      transform: ${transform};
      animation: slideIn ${duration}ms ${easing} ${delay}ms forwards;
      @keyframes slideIn {
        to { transform: translate3d(0, 0, 0); }
      }
    `;
  }

  /**
   * Generates CSS for a scale animation
   * @param config - Scale animation configuration
   * @returns CSS string with animation properties
   */
  static scale(config: ScaleConfig = {}): string {
    const { duration = 200, delay = 0, easing = "ease-out", from = 0.95, to = 1 } = config;
    return `
      transform: scale(${from});
      animation: scaleAnimation ${duration}ms ${easing} ${delay}ms forwards;
      @keyframes scaleAnimation {
        to { transform: scale(${to}); }
      }
    `;
  }

  /**
   * Calculates the transform string for slide animations
   * @param direction - Direction of the slide
   * @param distance - Distance to slide in pixels
   * @returns Transform string for CSS
   * @private
   */
  private static getSlideTransform(direction: string, distance: number): string {
    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0)`;
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  }
}

/**
 * Predefined CSS animation class names for use with Tailwind or CSS modules
 */
export const animations = {
  fadeIn: "animate-fade-in",
  fadeOut: "animate-fade-out",
  slideUp: "animate-slide-up",
  slideDown: "animate-slide-down",
  slideLeft: "animate-slide-left",
  slideRight: "animate-slide-right",
  scale: "animate-scale",
  bounce: "animate-bounce",
  pulse: "animate-pulse",
  spin: "animate-spin",
};

/**
 * React hook for conditionally applying animation classes
 * @param trigger - Boolean to determine if animation should be applied
 * @param animationType - Type of animation from the animations object
 * @returns Animation class name if triggered, empty string otherwise
 * @example
 * const animationClass = useAnimation(isVisible, 'fadeIn');
 */
export function useAnimation(trigger: boolean, animationType: keyof typeof animations) {
  return trigger ? animations[animationType] : "";
}

export default AnimationUtils;
