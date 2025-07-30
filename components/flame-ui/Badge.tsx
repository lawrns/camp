import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../src/lib/utils";

const badgeVariants = cva(
  // Base styles with design tokens
  [
    "inline-flex items-center",
    "px-[var(--fl-space-3)] py-[var(--fl-space-1)]",
    "text-[var(--fl-font-size-xs)] font-[var(--fl-font-weight-semibold)]",
    "rounded-[var(--fl-rounded-ds-full)]",
    "transition-all duration-[var(--fl-duration-200)] ease-[var(--fl-ease-out)]",
    "focus:outline-none focus:ring-2 focus:ring-[var(--fl-color-focus)] focus:ring-offset-2",
    "select-none",
  ],
  {
    variants: {
      variant: {
        // Solid variants with improved contrast
        default: [
          "bg-[var(--fl-color-brand)] text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-brand-hover)]",
          "shadow-[var(--fl-shadow-sm)]",
        ],
        secondary: [
          "bg-[var(--fl-color-background-subtle)] text-[var(--fl-color-text)]",
          "hover:bg-[var(--fl-color-background-muted)]",
          "border border-[var(--fl-color-border)]",
        ],
        success: [
          "bg-[var(--fl-color-success)] text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-success-hover)]",
          "shadow-[var(--fl-shadow-sm)]",
        ],
        warning: [
          "bg-[var(--fl-color-warning)] text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-warning-hover)]",
          "shadow-[var(--fl-shadow-sm)]",
        ],
        error: [
          "bg-[var(--fl-color-error)] text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-error-hover)]",
          "shadow-[var(--fl-shadow-sm)]",
        ],
        info: [
          "bg-[var(--fl-color-info)] text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-info-hover)]",
          "shadow-[var(--fl-shadow-sm)]",
        ],

        // Subtle variants
        "default-subtle": [
          "bg-[var(--fl-color-brand-subtle)] text-[var(--fl-color-brand)]",
          "hover:bg-[var(--fl-color-brand-muted)]",
        ],
        "success-subtle": [
          "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success-hover)]",
          "hover:bg-[var(--fl-color-success-subtle)]/80",
        ],
        "warning-subtle": [
          "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning-hover)]",
          "hover:bg-[var(--fl-color-warning-subtle)]/80",
        ],
        "error-subtle": [
          "bg-[var(--fl-color-error-subtle)] text-[var(--fl-color-error-hover)]",
          "hover:bg-[var(--fl-color-error-subtle)]/80",
        ],
        "info-subtle": [
          "bg-[var(--fl-color-info-subtle)] text-[var(--fl-color-info-hover)]",
          "hover:bg-[var(--fl-color-info-subtle)]/80",
        ],

        // Special variants
        outline: [
          "border border-[var(--fl-color-border-strong)]",
          "text-[var(--fl-color-text)]",
          "hover:bg-[var(--fl-color-background-subtle)]",
        ],
        ghost: [
          "text-[var(--fl-color-text-muted)]",
          "hover:bg-[var(--fl-color-background-subtle)]",
          "hover:text-[var(--fl-color-text)]",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md",
          "text-[var(--fl-color-text)]",
          "border border-white/20",
          "shadow-[var(--fl-shadow-lg)]",
          "hover:bg-white/20",
        ],
        gradient: [
          "bg-gradient-to-r from-[var(--fl-color-brand)] to-[var(--fl-color-info)]",
          "text-[var(--fl-color-text-inverse)]",
          "shadow-[var(--fl-shadow-md)]",
          "hover:shadow-[var(--fl-shadow-lg)]",
        ],

        // Status variants (for presence indicators)
        online: [
          "bg-[var(--fl-color-success)] text-[var(--fl-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--fl-color-background),0_0_0_3px_var(--fl-color-success-subtle)]",
        ],
        away: [
          "bg-[var(--fl-color-warning)] text-[var(--fl-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--fl-color-background),0_0_0_3px_var(--fl-color-warning-subtle)]",
        ],
        busy: [
          "bg-[var(--fl-color-error)] text-[var(--fl-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--fl-color-background),0_0_0_3px_var(--fl-color-error-subtle)]",
        ],
        offline: [
          "bg-[var(--fl-color-text-subtle)] text-[var(--fl-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--fl-color-background),0_0_0_3px_var(--fl-color-border)]",
        ],
      },
      size: {
        sm: "px-[var(--fl-space-2)] py-[0.125rem] text-[0.625rem]",
        default: "px-[var(--fl-space-3)] py-[var(--fl-space-1)] text-[var(--fl-font-size-xs)]",
        lg: "px-[var(--fl-space-4)] py-[var(--fl-space-2)] text-[var(--fl-font-size-sm)]",
      },
      interactive: {
        true: ["cursor-pointer", "hover:scale-105 active:scale-95", "transform-gpu will-change-transform"],
        false: "",
      },
      removable: {
        true: "pr-[var(--fl-space-2)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
      removable: false,
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  /**
   * Icon to display before the badge text
   */
  icon?: React.ReactNode;
  /**
   * Whether the badge can be removed (shows X button)
   */
  onRemove?: () => void;
  /**
   * Additional content to render inside the badge
   */
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, interactive, icon, onRemove, children, ...props }, ref) => {
    const isRemovable = Boolean(onRemove);
    const isInteractive = interactive || Boolean(props.onClick) || isRemovable;

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, interactive: isInteractive, removable: isRemovable }), className)}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={props.onClick}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            // Trigger onClick if it exists
            props.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
          props.onKeyDown?.(e);
        }}
        {...props}
      >
        {icon && <span className="mr-[var(--fl-space-1)] flex items-center flex-shrink-0">{icon}</span>}
        <span className="whitespace-nowrap truncate">{children}</span>
        {onRemove && (
          <button
            type="button"
            className={cn(
              "ml-[var(--fl-space-2)] -mr-[var(--fl-space-1)]",
              "flex items-center justify-center",
              "w-[var(--fl-space-4)] h-[var(--fl-space-4)]",
              "rounded-ds-full",
              "hover:bg-black/10 dark:hover:bg-white/10",
              "focus:outline-none focus:ring-1 focus:ring-[var(--fl-color-focus)]",
              "transition-colors duration-[var(--fl-duration-150)]"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove badge"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-70"
            >
              <path d="M9 1L1 9M1 1L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Compound component for badge groups
const BadgeGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gap?: "sm" | "default" | "lg";
  }
>(({ className, gap = "default", ...props }, ref) => {
  const gapClasses = {
    sm: "gap-[var(--fl-space-1)]",
    default: "gap-[var(--fl-space-2)]",
    lg: "gap-[var(--fl-space-3)]",
  };

  return <div ref={ref} className={cn("flex flex-wrap items-center", gapClasses[gap], className)} {...props} />;
});
BadgeGroup.displayName = "BadgeGroup";

export { Badge, BadgeGroup, badgeVariants };
