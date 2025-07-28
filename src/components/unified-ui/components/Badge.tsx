import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  // Base styles with design tokens
  [
    "inline-flex items-center",
    "px-[var(--ds-spacing-3)] py-[var(--ds-spacing-1)]",
    "font-[var(--ds-font-weight-semibold)] text-[var(--ds-font-size-xs)]",
    "duration-[var(--ds-duration-200)] ease-[var(--ds-ease-out)] transition-all",
    "focus:outline-none focus:ring-2 focus:ring-[var(--ds-color-focus)] focus:ring-offset-2",
    "select-none",
  ],
  {
    variants: {
      variant: {
        // Solid variants with improved contrast
        default: [
          "bg-[var(--ds-color-brand)] text-[var(--ds-color-text-inverse)]",
          "hover:bg-[var(--ds-color-brand-hover)]",
          "shadow-[var(--ds-shadow-sm)]",
        ],
        secondary: [
          "bg-[var(--ds-color-background-subtle)] text-[var(--ds-color-text)]",
          "hover:bg-[var(--ds-color-background-muted)]",
          "border border-[var(--ds-color-border)]",
        ],
        success: [
          "bg-[var(--ds-color-success)] text-[var(--ds-color-text-inverse)]",
          "hover:bg-[var(--ds-color-success-hover)]",
          "shadow-[var(--ds-shadow-sm)]",
        ],
        warning: [
          "bg-[var(--ds-color-warning)] text-[var(--ds-color-text-inverse)]",
          "hover:bg-[var(--ds-color-warning-hover)]",
          "shadow-[var(--ds-shadow-sm)]",
        ],
        error: [
          "bg-[var(--ds-color-error)] text-[var(--ds-color-text-inverse)]",
          "hover:bg-[var(--ds-color-error-hover)]",
          "shadow-[var(--ds-shadow-sm)]",
        ],
        info: [
          "bg-[var(--ds-color-info)] text-[var(--ds-color-text-inverse)]",
          "hover:bg-[var(--ds-color-info-hover)]",
          "shadow-[var(--ds-shadow-sm)]",
        ],

        // Subtle variants
        "default-subtle": [
          "bg-[var(--ds-color-brand-subtle)] text-[var(--ds-color-brand)]",
          "hover:bg-[var(--ds-color-brand-muted)]",
        ],
        "success-subtle": [
          "bg-[var(--ds-color-success-subtle)] text-[var(--ds-color-success-hover)]",
          "hover:bg-[var(--ds-color-success-subtle)]/80",
        ],
        "warning-subtle": [
          "bg-[var(--ds-color-warning-subtle)] text-[var(--ds-color-warning-hover)]",
          "hover:bg-[var(--ds-color-warning-subtle)]/80",
        ],
        "error-subtle": [
          "bg-[var(--ds-color-error-subtle)] text-[var(--ds-color-error-hover)]",
          "hover:bg-[var(--ds-color-error-subtle)]/80",
        ],
        "info-subtle": [
          "bg-[var(--ds-color-info-subtle)] text-[var(--ds-color-info-hover)]",
          "hover:bg-[var(--ds-color-info-subtle)]/80",
        ],

        // Special variants
        outline: [
          "border border-[var(--ds-color-border-strong)]",
          "text-[var(--ds-color-text)]",
          "hover:bg-[var(--ds-color-background-subtle)]",
        ],
        ghost: [
          "text-[var(--ds-color-text-muted)]",
          "hover:bg-[var(--ds-color-background-subtle)]",
          "hover:text-[var(--ds-color-text)]",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md",
          "text-[var(--ds-color-text)]",
          "border border-white/20",
          "shadow-[var(--ds-shadow-lg)]",
          "hover:bg-white/20",
        ],
        gradient: [
          "bg-gradient-to-r from-[var(--ds-color-brand)] to-[var(--ds-color-info)]",
          "text-[var(--ds-color-text-inverse)]",
          "shadow-[var(--ds-shadow-md)]",
          "hover:shadow-[var(--ds-shadow-lg)]",
        ],

        // Status variants (for presence indicators)
        online: [
          "bg-[var(--ds-color-success)] text-[var(--ds-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--ds-color-background),0_0_0_3px_var(--ds-color-success-subtle)]",
        ],
        away: [
          "bg-[var(--ds-color-warning)] text-[var(--ds-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--ds-color-background),0_0_0_3px_var(--ds-color-warning-subtle)]",
        ],
        busy: [
          "bg-[var(--ds-color-error)] text-[var(--ds-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--ds-color-background),0_0_0_3px_var(--ds-color-error-subtle)]",
        ],
        offline: [
          "bg-[var(--ds-color-text-subtle)] text-[var(--ds-color-text-inverse)]",
          "shadow-[0_0_0_2px_var(--ds-color-background),0_0_0_3px_var(--ds-color-border)]",
        ],
      },
      size: {
        sm: "px-[var(--ds-space-2)] py-[0.125rem] text-[0.625rem]",
        default: "px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[var(--ds-font-size-xs)]",
        lg: "px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[var(--ds-font-size-sm)]",
      },
      interactive: {
        true: ["cursor-pointer", "hover:scale-105 active:scale-95", "transform-gpu will-change-transform"],
        false: "",
      },
      removable: {
        true: "pr-[var(--ds-space-2)]",
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
        {icon && <span className="mr-[var(--ds-space-1)] flex items-center">{icon}</span>}
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            className={cn(
              "-mr-[var(--ds-space-1)] ml-[var(--ds-space-2)]",
              "flex items-center justify-center",
              "h-[var(--ds-space-4)] w-[var(--ds-space-4)]",
              "rounded-ds-full",
              "hover:bg-black/10 dark:hover:bg-white/10",
              "focus:outline-none focus:ring-1 focus:ring-[var(--ds-color-focus)]",
              "duration-[var(--ds-duration-150)] transition-colors"
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
    sm: "gap-[var(--ds-space-1)]",
    default: "gap-[var(--ds-space-2)]",
    lg: "gap-[var(--ds-space-3)]",
  };

  return <div ref={ref} className={cn("flex flex-wrap items-center", gapClasses[gap], className)} {...props} />;
});
BadgeGroup.displayName = "BadgeGroup";

export { Badge, BadgeGroup, badgeVariants };
