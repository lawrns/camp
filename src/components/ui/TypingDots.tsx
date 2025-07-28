"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TypingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function TypingDots({ size = "md", className, ...props }: TypingDotsProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const dotClass = sizeClasses[size];

  return (
    <div className={cn("flex items-center space-x-1", className)} {...props}>
      <span className={cn(dotClass, "animate-bounce rounded-ds-full bg-neutral-400", "[animation-delay:-0.3s]")} />
      <span className={cn(dotClass, "animate-bounce rounded-ds-full bg-neutral-400", "[animation-delay:-0.15s]")} />
      <span className={cn(dotClass, "animate-bounce rounded-ds-full bg-neutral-400")} />
    </div>
  );
}

export interface TypingBubbleProps extends TypingDotsProps {
  variant?: "default" | "message";
}

export function TypingBubble({ size = "md", variant = "default", className, ...props }: TypingBubbleProps) {
  const bubbleClasses =
    variant === "message"
      ? "bg-gray-100 rounded-ds-lg px-3 py-2"
      : "bg-[var(--fl-color-background-subtle)] rounded-ds-full px-2 py-1";

  return (
    <div className={cn(bubbleClasses, className)} {...props}>
      <TypingDots size={size} />
    </div>
  );
}
