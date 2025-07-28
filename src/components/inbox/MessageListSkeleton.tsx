"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MessageListSkeletonProps {
  count?: number;
  className?: string;
}

export function MessageListSkeleton({ count = 5, className }: MessageListSkeletonProps) {
  return (
    <div className={cn("space-y-4 spacing-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageItemSkeleton
          key={index}
          isAgent={index % 3 === 1} // Mix agent and customer messages
          delay={index * 100} // Stagger animations
        />
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

interface MessageItemSkeletonProps {
  isAgent?: boolean;
  delay?: number;
  className?: string;
}

export function MessageItemSkeleton({ isAgent = false, delay = 0, className }: MessageItemSkeletonProps) {
  const showLongMessage = Math.random() > 0.5;

  return (
    <div
      className={cn("flex items-end gap-3", isAgent ? "justify-end" : "justify-start", className)}
      style={{
        animationDelay: `${delay}ms`,
        animation: "fadeIn 0.5s ease-out forwards",
        opacity: 0,
      }}
    >
      {/* Customer avatar */}
      {!isAgent && (
        <div
          className="h-8 w-8 flex-shrink-0 rounded-ds-full"
          style={{
            background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}

      {/* Message bubble */}
      <div className={cn("max-w-md space-y-2", isAgent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "radius-2xl px-4 py-3",
            isAgent ? "bg-[var(--fl-color-info-subtle)]" : "border border-[var(--fl-color-border)] bg-white"
          )}
        >
          {/* Message content lines */}
          <div className="space-y-spacing-sm">
            <div
              className={cn("h-3 rounded", isAgent ? "w-48" : "w-52")}
              style={{
                background: isAgent
                  ? "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%)"
                  : "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: "0.1s",
              }}
            />
            <div
              className={cn("h-3 rounded", isAgent ? "w-36" : "w-40")}
              style={{
                background: isAgent
                  ? "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%)"
                  : "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: "0.2s",
              }}
            />
            {showLongMessage && (
              <div
                className={cn("h-3 rounded", isAgent ? "w-44" : "w-32")}
                style={{
                  background: isAgent
                    ? "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%)"
                    : "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s ease-in-out infinite",
                  animationDelay: "0.3s",
                }}
              />
            )}
          </div>

          {/* Timestamp */}
          <div
            className="mt-2 h-2 w-16 rounded"
            style={{
              background: isAgent
                ? "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%)"
                : "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          />
        </div>
      </div>

      {/* Agent avatar */}
      {isAgent && (
        <div
          className="h-8 w-8 flex-shrink-0 rounded-ds-full"
          style={{
            background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #93c5fd 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// Full conversation skeleton including header
export function ConversationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      {/* Header skeleton */}
      <div className="bg-background border-b border-[var(--fl-color-border)] spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-10 w-10 rounded-ds-full" />
            <div>
              <div
                className="mb-1 h-4 w-32 rounded"
                style={{
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s ease-in-out infinite",
                  animationDelay: "0.1s",
                }}
              />
              <div
                className="h-3 w-24 rounded"
                style={{
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s ease-in-out infinite",
                  animationDelay: "0.2s",
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-ds-2">
            <div
              className="h-8 w-20 rounded"
              style={{
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: "0.3s",
              }}
            />
            <div
              className="h-8 w-20 rounded"
              style={{
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: "0.4s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto bg-[var(--fl-color-background-subtle)]">
        <MessageListSkeleton count={4} />
      </div>

      {/* Input skeleton */}
      <div className="bg-background border-t border-[var(--fl-color-border)] p-spacing-md">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div
              className="h-12 rounded-ds-xl"
              style={{
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            />
            <div
              className="absolute right-2 top-2 h-8 w-8 rounded"
              style={{
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: "0.2s",
              }}
            />
          </div>
          <div
            className="h-12 w-12 rounded-ds-lg"
            style={{
              background: "linear-gradient(90deg, #93c5fd 0%, #60a5fa 50%, #93c5fd 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
