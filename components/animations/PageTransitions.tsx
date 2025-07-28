/**
 * Page Transitions Component
 * Smooth route transitions with OptimizedAnimatePresence
 */

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

export const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.3,
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <OptimizedAnimatePresence mode="wait" initial={false}>
      <OptimizedMotion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}

// Shared layout animation wrapper
interface SharedLayoutTransitionProps {
  children: React.ReactNode;
  layoutId: string;
  className?: string;
}

export function SharedLayoutTransition({ children, layoutId, className }: SharedLayoutTransitionProps) {
  return (
    <OptimizedMotion.div
      layoutId={layoutId}
      layout
      transition={{
        layout: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      }}
      className={className}
    >
      {children}
    </OptimizedMotion.div>
  );
}

// Loading state transition
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loader?: React.ReactNode;
}

export function LoadingTransition({ isLoading, children, loader }: LoadingTransitionProps) {
  return (
    <OptimizedAnimatePresence mode="wait">
      {isLoading ? (
        <OptimizedMotion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loader || (
            <div className="flex items-center justify-center p-spacing-lg">
              <OptimizedMotion.div
                className="h-12 w-12 rounded-ds-full border-4 border-[var(--color-border)] border-t-blue-600"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
          )}
        </OptimizedMotion.div>
      ) : (
        <OptimizedMotion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </OptimizedMotion.div>
      )}
    </OptimizedAnimatePresence>
  );
}

// Error page animation
interface ErrorPageAnimationProps {
  statusCode?: number;
  message?: string;
  onRetry?: () => void;
}

export function ErrorPageAnimation({ statusCode = 404, message = "Page not found", onRetry }: ErrorPageAnimationProps) {
  return (
    <OptimizedMotion.div
      className="flex min-h-[400px] flex-col items-center justify-center text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      <OptimizedMotion.div
        className="mb-4 text-8xl font-bold text-neutral-200"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.1,
        }}
      >
        <h1>{statusCode}</h1>
      </OptimizedMotion.div>

      <OptimizedMotion.div
        className="text-foreground mb-8 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p>{message}</p>
      </OptimizedMotion.div>

      {onRetry && (
        <OptimizedMotion.button
          onClick={onRetry}
          className="bg-primary rounded-ds-lg px-6 py-3 text-white transition-colors hover:bg-blue-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Try Again
        </OptimizedMotion.button>
      )}
    </OptimizedMotion.div>
  );
}

// Stagger children animation wrapper
interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerChildren({ children, className, staggerDelay = 0.1, delayChildren = 0 }: StaggerChildrenProps) {
  return (
    <OptimizedMotion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <OptimizedMotion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            },
          }}
        >
          {child}
        </OptimizedMotion.div>
      ))}
    </OptimizedMotion.div>
  );
}
