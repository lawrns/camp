/**
 * UNIFIED BUTTON COMPONENT
 *
 * Consolidates all button implementations into a single, consistent component
 * Replaces: unified-ui/Button, flame-ui/Button, phoenix-ui/Button
 * Uses unified design tokens for consistent styling
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
  // Base styles using unified design tokens
  "focus-visible:ring-ds-focus touch-target inline-flex items-center justify-center font-medium transition-all duration-normal ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-foreground-inverse border-ds-brand border",
          "hover:bg-primary hover:border-ds-brand-hover hover:-translate-y-0.5 hover:shadow-card-hover",
          "active:bg-primary active:border-ds-brand-active active:translate-y-0",
          "shadow-card-base",
        ],
        secondary: [
          "bg-background text-foreground border-ds-border border",
          "hover:bg-ds-hover hover:border-ds-border-hover",
          "active:bg-ds-active",
        ],
        outline: [
          "text-foreground border-ds-border border bg-transparent",
          "hover:bg-ds-hover hover:border-ds-border-interactive",
          "active:bg-ds-active",
        ],
        ghost: ["text-foreground border-transparent bg-transparent", "hover:bg-ds-hover", "active:bg-ds-active"],
        destructive: [
          "bg-ds-error text-foreground-inverse border-ds-error border",
          "hover:opacity-90 hover:shadow-card-hover",
          "active:opacity-80",
        ],
        success: [
          "bg-ds-success text-foreground-inverse border-ds-success border",
          "hover:opacity-90 hover:shadow-card-hover",
          "active:opacity-80",
        ],
        link: [
          "text-ds-brand border-transparent bg-transparent underline-offset-4",
          "hover:text-ds-brand-hover hover:underline",
          "active:text-ds-brand-active",
        ],
      },
      size: {
        sm: ["h-button-sm px-spacing-sm rounded-button text-sm", "gap-1"],
        md: ["h-button-md px-spacing-md rounded-button text-body", "gap-2"],
        lg: ["h-button-lg px-spacing-lg rounded-button text-lg", "gap-2"],
        icon: ["h-button-md w-button-md rounded-button", "p-0"],
        "icon-sm": ["h-button-sm w-button-sm rounded-button", "p-0"],
        "icon-lg": ["h-button-lg w-button-lg rounded-button", "p-0"],
      },
      loading: {
        true: "relative cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, leftIcon, rightIcon, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-ds-full border-2 border-current border-t-transparent" />
          </span>
        )}

        {/* Content wrapper - hidden when loading */}
        <span className={cn("flex items-center whitespace-nowrap", loading && "opacity-0")}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

          {children && <span className="flex-1 truncate">{children}</span>}

          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </Comp>
    );
  }
);

Button.displayName = "Button";

// Specialized button variants for common use cases
const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, loading, ...props }, ref) => {
  return (
    <Button ref={ref} loading={loading} {...props}>
      {children}
    </Button>
  );
});
LoadingButton.displayName = "LoadingButton";

const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "size"> & { size?: "sm" | "md" | "lg" }>(
  ({ size = "md", children, ...props }, ref) => {
    const iconSize = size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon";

    return (
      <Button ref={ref} size={iconSize} {...props}>
        {children}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

const LinkButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "link", ...props }, ref) => {
  return <Button ref={ref} variant={variant} {...props} />;
});
LinkButton.displayName = "LinkButton";

// Button group component for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, orientation = "horizontal", size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          "[&>button]:radius-none",
          "[&>button:first-child]:rounded-l-button",
          "[&>button:last-child]:rounded-r-button",
          orientation === "vertical" && [
            "[&>button:first-child]:rounded-t-button [&>button:first-child]:rounded-l-none",
            "[&>button:last-child]:rounded-b-button [&>button:last-child]:rounded-l-none",
          ],
          "[&>button:not(:first-child)]:border-l-0",
          orientation === "vertical" && "[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ButtonProps>(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: size || child.props.size,
              variant: variant || child.props.variant,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { Button, ButtonGroup, buttonVariants, IconButton, LinkButton, LoadingButton };
