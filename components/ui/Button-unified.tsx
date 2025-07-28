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
  // Base styles using only valid Tailwind classes
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-white border border-primary",
          "hover:bg-primary-600 hover:border-primary-600 hover:shadow-md",
          "active:bg-primary-700 active:border-primary-700",
          "shadow-sm",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground border border-border",
          "hover:bg-secondary-100 hover:border-border",
          "active:bg-secondary-200",
        ],
        outline: [
          "text-foreground border border-border bg-transparent",
          "hover:bg-secondary hover:border-border",
          "active:bg-secondary-100",
        ],
        ghost: [
          "text-foreground border-transparent bg-transparent",
          "hover:bg-secondary",
          "active:bg-secondary-100"
        ],
        destructive: [
          "bg-red-600 text-white border border-red-600",
          "hover:bg-red-700 hover:border-red-700 hover:shadow-md",
          "active:bg-red-800 active:border-red-800",
        ],
        success: [
          "bg-green-600 text-white border border-green-600",
          "hover:bg-green-700 hover:border-green-700 hover:shadow-md",
          "active:bg-green-800 active:border-green-800",
        ],
        link: [
          "text-primary border-transparent bg-transparent underline-offset-4",
          "hover:text-primary-600 hover:underline",
          "active:text-primary-700",
        ],
      },
      size: {
        sm: ["h-8 px-3 rounded-md text-sm", "gap-1"],
        md: ["h-10 px-4 rounded-md text-sm", "gap-2"],
        lg: ["h-12 px-6 rounded-md text-base", "gap-2"],
        icon: ["h-10 w-10 rounded-md", "p-0"],
        "icon-sm": ["h-8 w-8 rounded-md", "p-0"],
        "icon-lg": ["h-12 w-12 rounded-md", "p-0"],
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
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        )}

        {/* Content wrapper - hidden when loading */}
        <span className={cn("flex items-center", loading && "opacity-0")}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

          {children && <span className="flex-1">{children}</span>}

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
          "[&>button]:rounded-none",
          "[&>button:first-child]:rounded-l-md",
          "[&>button:last-child]:rounded-r-md",
          orientation === "vertical" && [
            "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none",
            "[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-l-none",
          ],
          "[&>button:not(:first-child)]:border-l-0",
          orientation === "vertical" && "[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: size || (child.props as ButtonProps).size,
              variant: variant || (child.props as ButtonProps).variant,
            } as ButtonProps);
          }
          return child;
        })}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { Button, ButtonGroup, buttonVariants, IconButton, LinkButton, LoadingButton, type ButtonProps };
