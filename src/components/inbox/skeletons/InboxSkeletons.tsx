"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Fixed-dimension skeleton components to prevent layout shift (CLS)
 * All dimensions are based on actual component measurements
 */

interface SkeletonProps {
  className?: string;
}

export function ConversationListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-[var(--fl-color-border-subtle)] spacing-4",
        "h-[72px] w-full", // Fixed height to prevent CLS
        className
      )}
    >
      {/* Avatar skeleton */}
      <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-ds-full bg-gray-200" />

      <div className="min-w-0 flex-1">
        {/* Name and timestamp row */}
        <div className="mb-1 flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Message preview */}
        <div className="mb-1 h-3 w-48 animate-pulse rounded bg-gray-200" />

        {/* Status indicators */}
        <div className="flex items-center gap-ds-2">
          <div className="h-2 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-2 w-8 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Unread badge */}
      <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded-ds-full bg-gray-200" />
    </div>
  );
}

export function MessageItemSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex gap-3 spacing-4",
        "min-h-[60px] w-full", // Fixed minimum height
        className
      )}
    >
      {/* Avatar skeleton */}
      <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-ds-full bg-gray-200" />

      <div className="min-w-0 flex-1">
        {/* Sender and timestamp */}
        <div className="mb-2 flex items-center gap-ds-2">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Message content */}
        <div className="space-y-1">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function ChatHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-[var(--fl-color-border)] bg-white spacing-4",
        "h-[64px] w-full", // Fixed height
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 animate-pulse rounded-ds-full bg-gray-200" />

        <div>
          {/* Customer name */}
          <div className="mb-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
          {/* Status */}
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-ds-2">
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function StatusDropdownSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        "h-[32px] w-[120px]", // Fixed dimensions
        className
      )}
    >
      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
      <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function MessageInputSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--fl-color-border)] bg-white spacing-4",
        "h-[80px] w-full", // Fixed height
        className
      )}
    >
      <div className="flex items-end gap-ds-2">
        {/* Text input area */}
        <div className="h-10 flex-1 animate-pulse rounded-ds-lg bg-gray-200" />

        {/* Send button */}
        <div className="h-10 w-10 animate-pulse rounded-ds-lg bg-gray-200" />
      </div>
    </div>
  );
}

export function TypingIndicatorSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2",
        "h-[40px] w-full", // Fixed height
        className
      )}
    >
      <div className="h-6 w-6 animate-pulse rounded-ds-full bg-gray-200" />
      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-pulse rounded-ds-full bg-gray-200" />
        <div className="h-2 w-2 animate-pulse rounded-ds-full bg-gray-200" />
        <div className="h-2 w-2 animate-pulse rounded-ds-full bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * Complete inbox skeleton with proper layout structure
 */
export function InboxDashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex h-screen bg-neutral-50", className)}>
      {/* Conversation list skeleton */}
      <div className="bg-background w-80 border-r border-[var(--fl-color-border)]">
        {/* Header */}
        <div className="h-16 border-b border-[var(--fl-color-border)] spacing-3">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Conversation items */}
        <div className="overflow-y-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <ConversationListItemSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Message panel skeleton */}
      <div className="flex flex-1 flex-col">
        <ChatHeaderSkeleton />

        {/* Status bar */}
        <div className="flex h-12 items-center gap-3 border-b border-[var(--fl-color-border)] px-4">
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
          <StatusDropdownSkeleton />
        </div>

        {/* Messages area */}
        <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MessageItemSkeleton key={i} />
          ))}
        </div>

        <MessageInputSkeleton />
      </div>
    </div>
  );
}
