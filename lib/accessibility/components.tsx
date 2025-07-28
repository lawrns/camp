import React, { ButtonHTMLAttributes, forwardRef, HTMLAttributes, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAriaExpanded, useFocusVisible, useSkipLinks } from "./hooks";

// Simple fallback for missing useFocusTrap hook
const useFocusTrap = (isActive: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  return { ref };
};

// Skip Navigation Component
export const SkipNavigation = () => {
  const { isVisible, showOnFocus, hideOnBlur } = useSkipLinks();

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 bg-background spacing-4 transition-transform",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <a
        href="#main-content"
        className="text-foreground underline focus:outline-none focus:ring-2 focus:ring-primary"
        onFocus={showOnFocus}
        onBlur={hideOnBlur}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="ml-4 text-foreground underline focus:outline-none focus:ring-2 focus:ring-primary"
        onFocus={showOnFocus}
        onBlur={hideOnBlur}
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Accessible Icon Button
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "ghost" | "outline";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, variant = "default", className, ...props }, ref) => {
    const { ref: focusRef, isFocusVisible } = useFocusVisible();

    return (
      <button
        ref={(node) => {
          // Handle both refs
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          if (focusRef.current !== node) focusRef.current = node;
        }}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center radius-md spacing-2 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
          },
          isFocusVisible && "ring-2 ring-primary ring-offset-2",
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
