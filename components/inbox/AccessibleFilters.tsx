"use client";

import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  variant?: "default" | "error" | "secondary";
}

interface AccessibleFiltersProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function AccessibleFilters({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Filter options",
}: AccessibleFiltersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  // Handle keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const buttons = container.querySelectorAll("button");
      const currentIndex = Array.from(buttons).findIndex((btn) => btn === document.activeElement);

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % buttons.length;
          (buttons[nextIndex] as HTMLButtonElement).focus();
          setFocusedIndex(nextIndex);
          break;

        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
          (buttons[prevIndex] as HTMLButtonElement).focus();
          setFocusedIndex(prevIndex);
          break;

        case "Home":
          e.preventDefault();
          (buttons[0] as HTMLButtonElement).focus();
          setFocusedIndex(0);
          break;

        case "End":
          e.preventDefault();
          (buttons[buttons.length - 1] as HTMLButtonElement).focus();
          setFocusedIndex(buttons.length - 1);
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [options.length]);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={cn("flex gap-1 overflow-x-auto pb-1", className)}
    >
      {options.map((option, index) => {
        const isActive = value === option.id;
        const buttonId = `filter-${option.id}`;

        return (
          <button
            key={option.id}
            id={buttonId}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`Filter by ${option.label}${option.count !== undefined ? `, ${option.count} items` : ""}`}
            tabIndex={isActive || (focusedIndex === -1 && index === 0) ? 0 : -1}
            onClick={() => {
              onChange(option.id);
              // Announce change to screen readers
              const announcement = `Filter changed to ${option.label}`;
              announceToScreenReader(announcement);
            }}
            onFocus={() => setFocusedIndex(index)}
            className={cn(
              "text-typography-sm inline-flex items-center gap-2 rounded-ds-md px-3 py-1.5 font-medium",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                : "hover:bg-status-info-light hover:text-status-info-dark border border-[var(--fl-color-border)] bg-white text-neutral-700 hover:border-[var(--fl-color-border-interactive)]"
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <Badge
                variant={option.variant === "error" ? "error" : "secondary"}
                className={cn(
                  "text-typography-xs ml-1 px-1.5 py-0.5",
                  isActive && "border-white/30 bg-white/20 text-white"
                )}
                aria-label={`${option.count} items`}
              >
                {option.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Helper function to announce changes to screen readers
function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Preset filter configurations for common use cases
export const conversationFilterPresets = {
  basic: [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", variant: "destructive" as const },
    { id: "assigned", label: "Assigned" },
    { id: "unassigned", label: "Unassigned" },
  ],

  priority: [
    { id: "all", label: "All" },
    { id: "high", label: "High Priority", variant: "destructive" as const },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ],

  status: [
    { id: "active", label: "Active" },
    { id: "waiting", label: "Waiting" },
    { id: "resolved", label: "Resolved" },
    { id: "archived", label: "Archived" },
  ],
};
