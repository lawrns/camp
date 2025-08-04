/**
 * Micro-animation Components
 *
 * Adaptive micro-animations for enhanced user experience:
 * - Network-aware animation quality
 * - Accessibility-compliant animations
 * - Battery-conscious performance
 * - Smooth fallbacks for all devices
 */

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion";
import { useAdaptiveAnimations, AnimationQuality } from "@/lib/animations/adaptive-animations";

// Animated button with adaptive micro-interactions
export function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  disabled = false,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  const { config, getTransition, shouldUseEffect } = useAdaptiveAnimations();

  const baseClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  const variants = {
    initial: { scale: 1 },
    hover: {
      scale: shouldUseEffect("scale") ? 1.02 : 1,
      transition: { duration: config.duration.micro / 1000 },
    },
    tap: {
      scale: shouldUseEffect("scale") ? 0.98 : 1,
      transition: { duration: config.duration.micro / 1000 },
    },
  };

  return (
    <motion.button
      className={`rounded-ds-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${baseClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} `}
      variants={variants}
      initial="initial"
      whileHover={!disabled ? "hover" : "initial"}
      whileTap={!disabled ? "tap" : "initial"}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Animated panel with entrance/exit animations
export function AnimatedPanel({
  children,
  isVisible,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: "up" | "down" | "left" | "right" | "scale";
  className?: string;
}) {
  const { config, shouldUseEffect } = useAdaptiveAnimations();

  const getVariants = () => {
    const baseTransition = {
      duration: config.duration.medium / 1000,
      ease: config.easing.spring,
    };

    switch (direction) {
      case "up":
        return {
          hidden: {
            opacity: 0,
            y: shouldUseEffect("scale") ? 20 : 0,
            filter: shouldUseEffect("blur") ? "blur(4px)" : "blur(0px)",
          },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: baseTransition,
          },
          exit: {
            opacity: 0,
            y: shouldUseEffect("scale") ? -20 : 0,
            filter: shouldUseEffect("blur") ? "blur(4px)" : "blur(0px)",
            transition: { duration: config.duration.short / 1000 },
          },
        };

      case "scale":
        return {
          hidden: {
            opacity: 0,
            scale: shouldUseEffect("scale") ? 0.95 : 1,
            filter: shouldUseEffect("blur") ? "blur(4px)" : "blur(0px)",
          },
          visible: {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: baseTransition,
          },
          exit: {
            opacity: 0,
            scale: shouldUseEffect("scale") ? 0.95 : 1,
            filter: shouldUseEffect("blur") ? "blur(4px)" : "blur(0px)",
            transition: { duration: config.duration.short / 1000 },
          },
        };

      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: baseTransition },
          exit: { opacity: 0, transition: { duration: config.duration.short / 1000 } },
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div className={className} variants={getVariants()} initial="hidden" animate="visible" exit="exit">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated message with slide-in effect
export function AnimatedMessage({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}) {
  const { config, shouldUseEffect } = useAdaptiveAnimations();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const variants = {
    hidden: {
      opacity: 0,
      x: shouldUseEffect("scale") ? (direction === "left" ? -20 : 20) : 0,
      filter: shouldUseEffect("blur") ? "blur(2px)" : "blur(0px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: config.duration.short / 1000,
        delay: delay / 1000,
        ease: config.easing.easeOut,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

// Animated typing indicator
export function TypingIndicator({ isVisible }: { isVisible: boolean }) {
  const { config, quality } = useAdaptiveAnimations();

  if (quality === AnimationQuality.DISABLED) {
    return isVisible ? (
      <div className="text-foreground-muted flex items-center space-x-1">
        <span>•••</span>
        <span className="text-sm">typing</span>
      </div>
    ) : null;
  }

  const dotVariants = {
    initial: { opacity: 0.3, scale: 1 },
    animate: {
      opacity: [0.3, 1, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: config.duration.long / 1000,
        repeat: Infinity,
        ease: config.easing.easeInOut,
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="text-foreground-muted flex items-center space-x-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: config.duration.short / 1000 }}
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="h-2 w-2 rounded-ds-full bg-gray-400"
                variants={dotVariants}
                initial="initial"
                animate="animate"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              />
            ))}
          </div>
          <span className="ml-2 text-sm">typing</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated progress bar
export function AnimatedProgressBar({
  progress,
  className = "",
  showPercentage = false,
}: {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}) {
  const { config, shouldUseEffect } = useAdaptiveAnimations();

  return (
    <div className={`h-2 w-full rounded-ds-full bg-gray-200 ${className}`}>
      <motion.div
        className="bg-primary h-2 rounded-ds-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{
          duration: config.duration.medium / 1000,
          ease: config.easing.easeOut,
        }}
      />
      {showPercentage && (
        <motion.div
          className="text-foreground mt-1 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  );
}

// Animated notification toast
export function AnimatedToast({
  message,
  type = "info",
  isVisible,
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  isVisible: boolean;
  onClose?: () => void;
}) {
  const { config, shouldUseEffect } = useAdaptiveAnimations();

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-500 text-white",
  };

  const variants = {
    hidden: {
      opacity: 0,
      y: shouldUseEffect("scale") ? -50 : 0,
      scale: shouldUseEffect("scale") ? 0.95 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: config.duration.medium / 1000,
        ease: config.easing.spring,
      },
    },
    exit: {
      opacity: 0,
      y: shouldUseEffect("scale") ? -50 : 0,
      scale: shouldUseEffect("scale") ? 0.95 : 1,
      transition: {
        duration: config.duration.short / 1000,
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-ds-lg px-4 py-2 shadow-lg ${typeStyles[type]} `}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-center justify-between">
            <span>{message}</span>
            {onClose && (
              <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated loading spinner
export function AnimatedSpinner({
  size = "medium",
  className = "",
}: {
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  const { config, quality } = useAdaptiveAnimations();

  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };

  if (quality === AnimationQuality.DISABLED) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="border-ds-border-strong h-full w-full rounded-ds-full border-2 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: config.duration.long / 1000,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="border-ds-border-strong h-full w-full rounded-ds-full border-2 border-t-blue-600"></div>
    </motion.div>
  );
}

// Staggered list animation
export function AnimatedList({
  children,
  staggerDelay = 100,
  className = "",
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}) {
  const { config, shouldUseEffect } = useAdaptiveAnimations();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay / 1000,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldUseEffect("scale") ? 20 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: config.duration.short / 1000,
        ease: config.easing.easeOut,
      },
    },
  };

  return (
    <motion.div className={className} variants={containerVariants} initial="hidden" animate="visible">
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default {
  AnimatedButton,
  AnimatedPanel,
  AnimatedMessage,
  TypingIndicator,
  AnimatedProgressBar,
  AnimatedToast,
  AnimatedSpinner,
  AnimatedList,
};
