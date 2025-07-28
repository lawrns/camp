/**
 * Lightweight Animations - CSS-based animations to replace framer-motion
 *
 * This module provides lightweight CSS-based animations and transitions
 * to reduce bundle size while maintaining smooth user experience.
 */

import React from "react";

// CSS animation classes
export const animationClasses = {
  fadeIn: "animate-fade-in",
  slideIn: "animate-slide-in",
  slideInLeft: "animate-slide-in-left",
  slideInRight: "animate-slide-in-right",
  scaleIn: "animate-scale-in",
  bounceIn: "animate-bounce-in",
  rotateIn: "animate-rotate-in",
};

// Animation component props
interface AnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  // DOM props that should be passed through
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  "data-testid"?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  tabIndex?: number;
}

// Framer Motion props that should NOT be passed to DOM elements
const FRAMER_MOTION_PROPS = [
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "whileDrag",
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "layout",
  "layoutId",
  "layoutDependency",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDrag",
  "onDragStart",
  "onDragEnd",
  "onHoverStart",
  "onHoverEnd",
  "onTap",
  "onTapStart",
  "onTapCancel",
  "onPan",
  "onPanStart",
  "onPanEnd",
  "onViewportEnter",
  "onViewportLeave",
];

// Filter out Framer Motion props to prevent React warnings
const filterDOMProps = (props: any) => {
  const filteredProps: any = {};
  Object.keys(props).forEach((key: any) => {
    if (!FRAMER_MOTION_PROPS.includes(key)) {
      filteredProps[key] = props[key];
    }
  });
  return filteredProps;
};

// Fade In Animation Component
export const FadeIn: React.FC<AnimationProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.3,
  style = {},
  ...props
}) => {
  const animationStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  // Filter out Framer Motion props to prevent React warnings
  const domProps = filterDOMProps(props);

  return (
    <div className={`animate-fade-in ${className}`} style={animationStyle} {...domProps}>
      {children}
    </div>
  );
};

// Slide In Animation Component
export const SlideIn: React.FC<AnimationProps & { direction?: "left" | "right" | "up" | "down" }> = ({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.3,
  style = {},
  ...props
}) => {
  const animationClass =
    direction === "left"
      ? "animate-slide-in-left"
      : direction === "right"
        ? "animate-slide-in-right"
        : "animate-slide-in";

  const animationStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  // Filter out Framer Motion props to prevent React warnings
  const domProps = filterDOMProps(props);

  return (
    <div className={`${animationClass} ${className}`} style={animationStyle} {...domProps}>
      {children}
    </div>
  );
};

// Scale In Animation Component
export const ScaleIn: React.FC<AnimationProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.3,
  style = {},
  ...props
}) => {
  const animationStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  // Filter out Framer Motion props to prevent React warnings
  const domProps = filterDOMProps(props);

  return (
    <div className={`animate-scale-in ${className}`} style={animationStyle} {...domProps}>
      {children}
    </div>
  );
};

// Bounce In Animation Component
export const BounceIn: React.FC<AnimationProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  style = {},
  ...props
}) => {
  const animationStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  // Filter out Framer Motion props to prevent React warnings
  const domProps = filterDOMProps(props);

  return (
    <div className={`animate-bounce-in ${className}`} style={animationStyle} {...domProps}>
      {children}
    </div>
  );
};

// Rotate In Animation Component
export const RotateIn: React.FC<AnimationProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  style = {},
  ...props
}) => {
  const animationStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    ...style,
  };

  // Filter out Framer Motion props to prevent React warnings
  const domProps = filterDOMProps(props);

  return (
    <div className={`animate-rotate-in ${className}`} style={animationStyle} {...domProps}>
      {children}
    </div>
  );
};

// Stagger Animation Hook
export const useStaggerAnimation = (itemCount: number, baseDelay = 0, staggerDelay = 0.1) => {
  return Array.from({ length: itemCount }, (_, index) => ({
    animationDelay: `${baseDelay + index * staggerDelay}s`,
  }));
};

// Animation utilities
export const animations = {
  fadeIn: (delay = 0, duration = 0.3) => ({
    className: "animate-fade-in",
    style: { animationDelay: `${delay}s`, animationDuration: `${duration}s` },
  }),
  slideIn: (delay = 0, duration = 0.3) => ({
    className: "animate-slide-in",
    style: { animationDelay: `${delay}s`, animationDuration: `${duration}s` },
  }),
  scaleIn: (delay = 0, duration = 0.3) => ({
    className: "animate-scale-in",
    style: { animationDelay: `${delay}s`, animationDuration: `${duration}s` },
  }),
};

// Export default for backward compatibility
export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  RotateIn,
  animations,
  animationClasses,
  useStaggerAnimation,
};
