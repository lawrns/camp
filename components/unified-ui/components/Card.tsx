import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const cardVariants = cva(
  // Base styles using design tokens
  [
    "rounded-[var(--fl-radius-lg)]",
    "bg-[var(--fl-color-surface)]",
    "text-[var(--fl-color-text)]",
    "transition-all duration-200 ease-out",
  ],
  {
    variants: {
      variant: {
        default: [
          "border border-[var(--fl-color-border)]",
          "shadow-[var(--fl-shadow-sm)]",
          "hover:shadow-[var(--fl-shadow-md)]",
          "hover:border-[var(--fl-color-border-strong)]",
        ],
        elevated: [
          "border border-[var(--fl-color-border)]",
          "shadow-[var(--fl-shadow-md)]",
          "hover:shadow-[var(--fl-shadow-lg)]",
        ],
        outlined: [
          "border border-[var(--fl-color-border-strong)]",
          "shadow-none",
          "hover:border-[var(--fl-color-border-interactive)]",
          "hover:shadow-[var(--fl-shadow-sm)]",
        ],
        ghost: [
          "border border-transparent",
          "bg-transparent shadow-none",
          "hover:bg-[var(--fl-color-background-subtle)]",
          "hover:border-[var(--fl-color-border)]",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md",
          "border border-white/20",
          "shadow-[var(--fl-shadow-lg)]",
          "hover:shadow-[var(--fl-shadow-xl)]",
          "hover:bg-white/15",
        ],
        gradient: [
          "bg-gradient-to-br from-blue-50 to-indigo-100",
          "border border-[var(--fl-color-border)]",
          "shadow-[var(--fl-shadow-md)]",
          "hover:shadow-[var(--fl-shadow-lg)]",
        ],
      },
      padding: {
        none: "p-0",
        sm: "p-[var(--fl-spacing-4)]",
        default: "p-[var(--fl-spacing-6)]",
        lg: "p-[var(--fl-spacing-8)]",
        xl: "p-[var(--fl-spacing-10)]",
      },
      interactive: {
        true: ["cursor-pointer", "hover:scale-[1.02] active:scale-[0.98]", "transform-gpu will-change-transform"],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false,
    },
  }
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /**
   * Whether to render as an article element
   */
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, asChild = false, ...props }, ref) => {
    if (asChild) {
      return <React.Fragment {...props} />;
    }

    return <div ref={ref} className={cn(cardVariants({ variant, padding, interactive }), className)} {...props} />;
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: "none" | "sm" | "default" | "lg";
  }
>(({ className, padding = "default", ...props }, ref) => {
  const paddingClasses = {
    none: "p-0",
    sm: "px-[var(--fl-spacing-4)] py-[var(--fl-spacing-3)]",
    default: "px-[var(--fl-spacing-6)] py-[var(--fl-spacing-4)]",
    lg: "px-[var(--fl-spacing-8)] py-[var(--fl-spacing-6)]",
  };

  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-[var(--fl-spacing-2)]", paddingClasses[padding], className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    size?: "sm" | "default" | "lg" | "xl";
  }
>(({ className, as: Comp = "h3", size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-base font-medium",
    default: "text-lg font-semibold",
    lg: "text-xl font-semibold",
    xl: "text-2xl font-bold",
  };

  return (
    <Comp
      ref={ref}
      className={cn(
        "leading-tight tracking-tight text-[var(--fl-color-text)]",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "default" | "lg";
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  };

  return (
    <p
      ref={ref}
      className={cn(
        "leading-relaxed text-[var(--fl-color-text-muted)]",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: "none" | "sm" | "default" | "lg";
  }
>(({ className, padding = "default", ...props }, ref) => {
  const paddingClasses = {
    none: "p-0",
    sm: "px-[var(--fl-spacing-4)] pb-[var(--fl-spacing-3)]",
    default: "px-[var(--fl-spacing-6)] pb-[var(--fl-spacing-4)]",
    lg: "px-[var(--fl-spacing-8)] pb-[var(--fl-spacing-6)]",
  };

  return <div ref={ref} className={cn(paddingClasses[padding], className)} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: "none" | "sm" | "default" | "lg";
    justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  }
>(({ className, padding = "default", justify = "start", ...props }, ref) => {
  const paddingClasses = {
    none: "p-0",
    sm: "px-[var(--fl-spacing-4)] py-[var(--fl-spacing-3)]",
    default: "px-[var(--fl-spacing-6)] py-[var(--fl-spacing-4)]",
    lg: "px-[var(--fl-spacing-8)] py-[var(--fl-spacing-6)]",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center",
        "border-t border-[var(--fl-color-border)]",
        "bg-[var(--fl-color-background-subtle)]/50",
        paddingClasses[padding],
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

// Improved card variants for specific use cases
const StatCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      label: string;
      direction: "up" | "down" | "neutral";
    };
  }
>(({ title, value, description, icon, trend, className, ...props }, ref) => {
  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-[var(--fl-color-success)]";
      case "down":
        return "text-[var(--fl-color-error)]";
      case "neutral":
        return "text-[var(--fl-color-text-muted)]";
    }
  };

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      case "neutral":
        return "→";
    }
  };

  return (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardContent className="p-[var(--fl-spacing-6)]">
        <div className="flex items-center justify-between">
          <div className="space-y-[var(--fl-spacing-2)]">
            <p className="font-medium text-[var(--fl-color-text-muted)] text-sm">
              {title}
            </p>
            <p className="font-bold text-[var(--fl-color-text)] text-2xl">
              {value}
            </p>
            {description && (
              <p className="text-[var(--fl-color-text-subtle)] text-xs">{description}</p>
            )}
          </div>
          {icon && <div className="text-[var(--fl-color-text-subtle)] opacity-80">{icon}</div>}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-[var(--fl-spacing-2)] flex items-center gap-[var(--fl-spacing-1)] text-xs",
              getTrendColor(trend.direction)
            )}
          >
            <span>{getTrendIcon(trend.direction)}</span>
            <span>{trend.value}%</span>
            <span className="text-[var(--fl-color-text-subtle)]">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
StatCard.displayName = "StatCard";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants, StatCard };
