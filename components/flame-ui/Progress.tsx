import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  // Base styles for the progress container
  [
    "relative overflow-hidden",
    "bg-[var(--fl-color-background-subtle)]",
    "rounded-ds-full",
    "duration- [var(--fl-duration-300) ] transition-all",
  ],
  {
    variants: {
      variant: {
        default: "bg-[var(--fl-color-brand-subtle)]",
        secondary: "bg-[var(--fl-color-background-muted)]",
        success: "bg-[var(--fl-color-success-subtle)]",
        warning: "bg-[var(--fl-color-warning-subtle)]",
        error: "bg-[var(--fl-color-error-subtle)]",
        info: "bg-[var(--fl-color-info-subtle)]",
        gradient: "bg-gradient-to-r from-[var(--fl-color-brand-subtle)] to-[var(--fl-color-info-subtle)]",
      },
      size: {
        sm: "h-[var(--fl-space-1)]",
        default: "h-[var(--fl-space-2)]",
        lg: "h-[var(--fl-space-3)]",
        xl: "h-[var(--fl-space-4)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  // Base styles for the progress indicator
  ["h-full w-full flex-1", "duration-[var(--fl-duration-500)] ease-[var(--fl-ease-out)] transition-transform"],
  {
    variants: {
      variant: {
        default: "bg-[var(--fl-color-brand)]",
        secondary: "bg-[var(--fl-color-text-muted)]",
        success: "bg-[var(--fl-color-success)]",
        warning: "bg-[var(--fl-color-warning)]",
        error: "bg-[var(--fl-color-error)]",
        info: "bg-[var(--fl-color-info)]",
        gradient: "bg-gradient-to-r from-[var(--fl-color-brand)] to-[var(--fl-color-info)]",
      },
      animated: {
        true: "relative overflow-hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /**
   * Whether to show a loading animation
   */
  showAnimation?: boolean;
  /**
   * Whether to show the percentage text
   */
  showValue?: boolean;
  /**
   * Custom label for the progress
   */
  label?: string;
  /**
   * Whether the progress is in an indeterminate state
   */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      variant,
      size,
      animated,
      showAnimation = false,
      showValue = false,
      label,
      value = 0,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const progressValue = indeterminate ? null : value;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="mb-[var(--fl-space-2)] flex items-center justify-between">
            {label && (
              <span className="font-[var(--fl-font-weight-medium)] text-[var(--fl-color-text-muted)] text-[var(--fl-font-size-sm)]">
                {label}
              </span>
            )}
            {showValue && !indeterminate && (
              <span className="font-[var(--fl-font-weight-medium)] text-[var(--fl-color-text-muted)] text-[var(--fl-font-size-sm)]">
                {Math.round(value || 0)}%
              </span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ variant, size }), className)}
          value={progressValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(progressIndicatorVariants({ variant, animated: showAnimation || indeterminate }))}
            style={{
              transform: indeterminate ? undefined : `translateX(-${100 - (value || 0)}%)`,
            }}
          >
            {(showAnimation || indeterminate) && (
              <>
                {/* Shimmer effect */}
                <div
                  className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                    "animate-[shimmer_1.5s_ease-in-out_infinite]"
                  )}
                  style={{
                    backgroundSize: "200% 100%",
                  }}
                />
                {/* Pulse effect for indeterminate */}
                {indeterminate && (
                  <div
                    className={cn(
                      "absolute inset-0",
                      "bg-gradient-to-r from-transparent via-white/10 to-transparent",
                      "animate-[indeterminate_1.5s_ease-in-out_infinite]"
                    )}
                  />
                )}
              </>
            )}
          </ProgressPrimitive.Indicator>
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular progress variant
export interface CircularProgressProps extends VariantProps<typeof progressIndicatorVariants> {
  value?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  className?: string;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ value = 0, size = 48, strokeWidth = 4, showValue = false, label, variant = "default", className }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const getStrokeColor = () => {
      switch (variant) {
        case "success":
          return "var(--fl-color-success)";
        case "warning":
          return "var(--fl-color-warning)";
        case "error":
          return "var(--fl-color-error)";
        case "info":
          return "var(--fl-color-info)";
        case "secondary":
          return "var(--fl-color-text-muted)";
        case "gradient":
          return "var(--fl-color-brand)"; // Fallback for gradient
        case "default":
        case null:
        default:
          return "var(--fl-color-brand)";
      }
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg width={size} height={size} className="-rotate-90 transform">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--fl-color-border)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="duration-\ [var(--fl-duration-500)\ ] ease-\ [var(--fl-ease-out)\ ] transition-all"
          />
        </svg>
        {(showValue || label) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showValue && (
              <span className="font-[var(--fl-font-weight-semibold)] text-[var(--fl-color-text)] text-[var(--fl-font-size-sm)]">
                {Math.round(value)}%
              </span>
            )}
            {label && <span className="text-[var(--fl-color-text-muted)] text-[var(--fl-font-size-xs)]">{label}</span>}
          </div>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Add the shimmer animation to globals.css or include it here
const progressStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;

// You can inject these styles if needed or add them to your global CSS
if (typeof window !== "undefined" && !document.getElementById("flame-progress-styles")) {
  const style = document.createElement("style");
  style.id = "flame-progress-styles";
  style.textContent = progressStyles;
  document.head.appendChild(style);
}

export { Progress, CircularProgress, progressVariants, progressIndicatorVariants };
