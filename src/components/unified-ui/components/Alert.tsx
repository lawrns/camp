import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  // Base styles using design tokens
  [
    "relative w-full p-[var(--fl-space-4)]",
    "transition-all duration-200 ease-out",
    "[&>svg~*]:pl-[var(--fl-space-8)]",
    "[&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-[var(--fl-space-4)] [&>svg]:top-[var(--fl-space-4)]",
    "[&>svg]:text-foreground",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--fl-color-background)]",
          "border-[var(--fl-color-border)]",
          "text-[var(--fl-color-text)]",
          "[&>svg]:text-[var(--fl-color-text)]",
        ],
        info: [
          "bg-[var(--fl-color-info-subtle)]",
          "border-[var(--fl-color-info)]/20",
          "text-[var(--fl-color-info-hover)]",
          "[&>svg]:text-[var(--fl-color-info)]",
        ],
        success: [
          "bg-[var(--fl-color-success-subtle)]",
          "border-[var(--fl-color-success)]/20",
          "text-[var(--fl-color-success-hover)]",
          "[&>svg]:text-[var(--fl-color-success)]",
        ],
        warning: [
          "bg-[var(--fl-color-warning-subtle)]",
          "border-[var(--fl-color-warning)]/20",
          "text-[var(--fl-color-warning-hover)]",
          "[&>svg]:text-[var(--fl-color-warning)]",
        ],
        error: [
          "bg-[var(--fl-color-error-subtle)]",
          "border-[var(--fl-color-error)]/20",
          "text-[var(--fl-color-error-hover)]",
          "[&>svg]:text-[var(--fl-color-error)]",
        ],
        brand: [
          "bg-[var(--fl-color-brand-subtle)]",
          "border-[var(--fl-color-brand)]/20",
          "text-[var(--fl-color-brand)]",
          "[&>svg]:text-[var(--fl-color-brand)]",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md",
          "border-white/20",
          "text-[var(--fl-color-text)]",
          "[&>svg]:text-[var(--fl-color-text)]",
          "shadow-[var(--fl-shadow-lg)]",
        ],
      },
      size: {
        sm: "p-[var(--fl-space-3)] text-[var(--fl-font-size-sm)]",
        default: "p-[var(--fl-space-4)] text-[var(--fl-font-size-sm)]",
        lg: "p-[var(--fl-space-6)] text-[var(--fl-font-size-base)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const alertIconVariants = cva("h-[var(--fl-space-5)] w-[var(--fl-space-5)]", {
  variants: {
    size: {
      sm: "h-[var(--fl-space-4)] w-[var(--fl-space-4)]",
      default: "h-[var(--fl-space-5)] w-[var(--fl-space-5)]",
      lg: "h-[var(--fl-space-6)] w-[var(--fl-space-6)]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  /**
   * Icon to display in the alert
   */
  icon?: React.ReactNode;
  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;
  /**
   * Callback when the alert is dismissed
   */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, icon, dismissible, onDismiss, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss?.();
      }, 200); // Wait for animation to complete
    };

    if (!isVisible) return null;

    // Default icons for each variant
    const defaultIcons = {
      info: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(alertIconVariants({ size }))}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      ),
      success: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(alertIconVariants({ size }))}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      warning: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(alertIconVariants({ size }))}
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      ),
      error: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(alertIconVariants({ size }))}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      ),
    };

    const displayIcon =
      icon || (variant && variant in defaultIcons ? defaultIcons[variant as keyof typeof defaultIcons] : null);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant, size }),
          isVisible ? "animate-in fade-in-0 slide-in-from-top-1" : "animate-out fade-out-0 slide-out-to-top-1",
          className
        )}
        {...props}
      >
        {displayIcon}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              "absolute right-[var(--fl-space-2)] top-[var(--fl-space-2)]",
              "inline-flex items-center justify-center",
              "transition-all duration-200 ease-out",
              "opacity-70 hover:opacity-100",
              "duration-[var(--fl-duration-150)] transition-opacity",
              "focus:outline-none focus:ring-2 focus:ring-[var(--fl-color-focus)] focus:ring-offset-2"
            )}
            aria-label="Dismiss alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[var(--fl-space-4)] w-[var(--fl-space-4)]"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "mb-[var(--fl-space-2)] font-[var(--fl-font-weight-semibold)] leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("[&_p]:leading-relaxed text-[var(--fl-font-size-sm)]", className)}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

// Alert Stack for managing multiple alerts
export interface AlertStackProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom" | "top-right" | "top-left" | "bottom-right" | "bottom-left";
  spacing?: "tight" | "default" | "loose";
}

const AlertStack = React.forwardRef<HTMLDivElement, AlertStackProps>(
  ({ className, position = "top", spacing = "default", ...props }, ref) => {
    const positionClasses = {
      top: "top-[var(--fl-space-4)] left-1/2 -translate-x-1/2",
      bottom: "bottom-[var(--fl-space-4)] left-1/2 -translate-x-1/2",
      "top-right": "top-[var(--fl-space-4)] right-[var(--fl-space-4)]",
      "top-left": "top-[var(--fl-space-4)] left-[var(--fl-space-4)]",
      "bottom-right": "bottom-[var(--fl-space-4)] right-[var(--fl-space-4)]",
      "bottom-left": "bottom-[var(--fl-space-4)] left-[var(--fl-space-4)]",
    };

    const spacingClasses = {
      tight: "space-y-[var(--fl-space-2)]",
      default: "space-y-[var(--fl-space-3)]",
      loose: "space-y-[var(--fl-space-4)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-[var(--fl-z-toast)] flex flex-col",
          "min-w-[320px] max-w-[420px]",
          positionClasses[position],
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
AlertStack.displayName = "AlertStack";

export { Alert, AlertTitle, AlertDescription, AlertStack, alertVariants };
