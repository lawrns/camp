/**
 * Lightweight Animation Components
 * Provides performant animations without heavy dependencies
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface AnimationProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
}

/**
 * Scale In Animation
 */
export const ScaleIn: React.FC<AnimationProps> = ({
  children,
  className,
  duration = 200,
  delay = 0,
  easing = "ease-out",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transform-gpu transition-all",
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Slide In Animation
 */
export const SlideIn: React.FC<
  AnimationProps & {
    direction?: "left" | "right" | "up" | "down";
  }
> = ({ children, className, duration = 300, delay = 0, easing = "ease-out", direction = "left" }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = (visible: boolean) => {
    if (visible) return "translate3d(0, 0, 0)";

    switch (direction) {
      case "left":
        return "translate3d(-100%, 0, 0)";
      case "right":
        return "translate3d(100%, 0, 0)";
      case "up":
        return "translate3d(0, -100%, 0)";
      case "down":
        return "translate3d(0, 100%, 0)";
      default:
        return "translate3d(-100%, 0, 0)";
    }
  };

  return (
    <div
      className={cn("transform-gpu transition-all", isVisible ? "opacity-100" : "opacity-0", className)}
      style={{
        transform: getTransform(isVisible),
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Fade In Animation
 */
export const FadeIn: React.FC<AnimationProps> = ({
  children,
  className,
  duration = 300,
  delay = 0,
  easing = "ease-out",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn("transform-gpu transition-opacity", isVisible ? "opacity-100" : "opacity-0", className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Bounce In Animation
 */
export const BounceIn: React.FC<AnimationProps> = ({ children, className, duration = 500, delay = 0 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transform-gpu transition-all",
        isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0",
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      }}
    >
      {children}
    </div>
  );
};

/**
 * Stagger Animation for lists
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 100 }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

/**
 * Pulse Animation
 */
export const Pulse: React.FC<{
  children: React.ReactNode;
  className?: string;
  duration?: number;
}> = ({ children, className, duration = 1000 }) => {
  return (
    <div
      className={cn("animate-pulse", className)}
      style={{
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Spin Animation
 */
export const Spin: React.FC<{
  children: React.ReactNode;
  className?: string;
  duration?: number;
}> = ({ children, className, duration = 1000 }) => {
  return (
    <div
      className={cn("animate-spin", className)}
      style={{
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Export all animations
export const Animations = {
  ScaleIn,
  SlideIn,
  FadeIn,
  BounceIn,
  StaggerContainer,
  Pulse,
  Spin,
};

export default Animations;
