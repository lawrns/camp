"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ConversationListSkeletonProps {
  count?: number;
  className?: string;
}

export function ConversationListSkeleton({ count = 5, className }: ConversationListSkeletonProps) {
  return (
    <div
      className={cn("space-y-1 spacing-2", className)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-background rounded-ds-lg border border-transparent spacing-3"
          style={{
            animationDelay: `${index * 50}ms`,
            animation: "fadeIn 0.5s ease-out forwards",
            opacity: 0,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <div
                className="h-12 w-12 rounded-ds-full bg-gradient-to-br from-gray-100 to-gray-200"
                style={{
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s ease-in-out infinite",
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Header with name and time */}
              <div className="mb-1 flex items-center justify-between">
                <div
                  className="h-4 w-32 rounded"
                  style={{
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: "0.1s",
                  }}
                />
                <div className="flex items-center gap-ds-2">
                  <div
                    className="h-3 w-12 rounded"
                    style={{
                      background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s ease-in-out infinite",
                      animationDelay: "0.2s",
                    }}
                  />
                  <div
                    className="h-5 w-5 rounded-ds-full"
                    style={{
                      background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s ease-in-out infinite",
                      animationDelay: "0.3s",
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div
                className="mb-2 h-3 w-40 rounded"
                style={{
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s ease-in-out infinite",
                  animationDelay: "0.15s",
                }}
              />

              {/* Message preview */}
              <div className="space-y-1">
                <div
                  className="h-3 w-full rounded"
                  style={{
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: "0.25s",
                  }}
                />
                <div
                  className="h-3 w-3/4 rounded"
                  style={{
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: "0.3s",
                  }}
                />
              </div>

              {/* Status badges */}
              <div className="mt-2 flex items-center gap-ds-2">
                <div
                  className="h-5 w-16 rounded-ds-full"
                  style={{
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: "0.35s",
                  }}
                />
                <div
                  className="h-5 w-20 rounded-ds-full"
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
        </div>
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

// Single conversation item skeleton for loading individual items
export function ConversationItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-ds-lg border border-[var(--fl-color-border-subtle)] bg-white spacing-4", className)}>
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 animate-pulse rounded-ds-full bg-gray-200" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header with name and time */}
          <div className="mb-1 flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="flex items-center gap-ds-2">
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-5 animate-pulse rounded-ds-full bg-gray-200" />
            </div>
          </div>

          {/* Email */}
          <div className="mb-2 h-3 w-40 animate-pulse rounded bg-gray-200" />

          {/* Message preview */}
          <div className="space-y-1">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Status badges */}
          <div className="mt-2 flex items-center gap-ds-2">
            <div className="h-5 w-16 animate-pulse rounded-ds-full bg-gray-200" />
            <div className="h-5 w-20 animate-pulse rounded-ds-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
