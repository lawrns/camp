"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import React from "react";

/**
 * Base skeleton component with shimmer animation
 */
const SkeletonBase: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <div className={`relative overflow-hidden rounded bg-gray-200 ${className}`}>
      <OptimizedMotion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {children}
    </div>
  );
};

/**
 * Skeleton for MessageInput component
 */
export const MessageInputSkeleton: React.FC = () => {
  return (
    <div className="border-t border-[var(--fl-color-border)] spacing-3">
      <div className="flex items-end space-x-spacing-sm">
        <div className="flex-1">
          <SkeletonBase className="h-10 w-full" />
        </div>
        <SkeletonBase className="h-10 w-16" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex space-x-spacing-sm">
          <SkeletonBase className="h-6 w-6 rounded-ds-full" />
          <SkeletonBase className="h-6 w-6 rounded-ds-full" />
        </div>
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
  );
};

// PreChatFormSkeleton removed - no longer needed

/**
 * Skeleton for TypingIndicator component
 */
export const TypingIndicatorSkeleton: React.FC = () => {
  return (
    <div className="flex justify-start spacing-3">
      <div className="bg-background max-w-[80%] radius-2xl px-4 py-3">
        <div className="flex items-center space-x-spacing-sm">
          <SkeletonBase className="h-4 w-4 rounded-ds-full" />
          <SkeletonBase className="h-3 w-20" />
          <div className="flex space-x-1">
            <SkeletonBase className="h-1 w-1 rounded-ds-full" />
            <SkeletonBase className="h-1 w-1 rounded-ds-full" />
            <SkeletonBase className="h-1 w-1 rounded-ds-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for general message content
 */
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 spacing-3">
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-spacing-sm">
          <SkeletonBase className="h-4 w-48" />
          <SkeletonBase className="h-4 w-32" />
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-spacing-sm">
          <SkeletonBase className="h-4 w-56" />
          <SkeletonBase className="h-4 w-40" />
          <SkeletonBase className="h-4 w-44" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for the entire chat panel
 */
export const ChatPanelSkeleton: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--fl-color-border)] spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-spacing-sm">
            <SkeletonBase className="h-2 w-2 rounded-ds-full" />
            <SkeletonBase className="h-5 w-32" />
          </div>
          <SkeletonBase className="h-6 w-6" />
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-6">
          <SkeletonBase className="h-4 w-12" />
          <SkeletonBase className="h-4 w-8" />
          <SkeletonBase className="h-4 w-10" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageSkeleton />
        <MessageSkeleton />
      </div>

      {/* Input area */}
      <MessageInputSkeleton />
    </div>
  );
};

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <OptimizedMotion.div
      className={`${sizeClasses[size]} rounded-ds-full border-2 border-[var(--fl-color-border-strong)] border-t-blue-500 ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

/**
 * Error boundary fallback component
 */
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="spacing-3 text-center">
      <div className="mb-2 text-[var(--fl-color-danger)]">⚠️ Something went wrong</div>
      {error && <div className="mb-3 text-tiny text-[var(--fl-color-text-muted)]">{error.message}</div>}
      {resetError && (
        <button
          onClick={resetError}
          className="bg-primary hover:bg-primary rounded px-3 py-1 text-tiny text-white transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default {
  MessageInputSkeleton,
  TypingIndicatorSkeleton,
  MessageSkeleton,
  ChatPanelSkeleton,
  LoadingSpinner,
  ErrorFallback,
};
