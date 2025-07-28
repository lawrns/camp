import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva(
  // Base styles
  ["bg-[var(--fl-color-background-muted)]", "relative overflow-hidden"],
  {
    variants: {
      variant: {
        default: "",
        shimmer: [
          "bg-gradient-to-r",
          "from-[var(--fl-color-background-muted)]",
          "via-[var(--fl-color-background-subtle)]",
          "to-[var(--fl-color-background-muted)]",
          "bg-[length:200%_100%]",
        ],
        pulse: "",
        glass: ["bg-white/5", "backdrop-blur-sm", "border border-white/10"],
      },
      animation: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "shimmer",
        animation: true,
        class: "animate-[shimmer_1.5s_ease-in-out_infinite]",
      },
      {
        variant: "pulse",
        animation: true,
        class: "animate-pulse",
      },
      {
        variant: "default",
        animation: true,
        class: "animate-pulse",
      },
    ],
    defaultVariants: {
      variant: "shimmer",
      animation: true,
    },
  }
);

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className, variant, animation, ...props }, ref) => {
  return <div ref={ref} className={cn(skeletonVariants({ variant, animation }), className)} {...props} />;
});
Skeleton.displayName = "Skeleton";

// Text skeleton with realistic line heights
export interface SkeletonTextProps {
  lines?: number | undefined;
  className?: string | undefined;
  lineClassName?: string | undefined;
  variant?: VariantProps<typeof skeletonVariants>["variant"] | undefined;
  animation?: boolean | undefined;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 1, className, lineClassName, variant, animation }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-[var(--fl-space-2)]", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            animation={animation}
            className={cn(
              "h-[var(--fl-space-4)]",
              i === lines - 1 && lines > 1 && "w-3/4", // Last line shorter for realism
              lineClassName
            )}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = "SkeletonText";

// Avatar skeleton
export interface SkeletonAvatarProps {
  size?: "xs" | "sm" | "default" | "lg" | "xl" | undefined;
  className?: string | undefined;
  variant?: VariantProps<typeof skeletonVariants>["variant"] | undefined;
  animation?: boolean | undefined;
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = "default", className, variant, animation }, ref) => {
    const sizeClasses = {
      xs: "h-[var(--fl-space-6)] w-[var(--fl-space-6)]",
      sm: "h-[var(--fl-space-8)] w-[var(--fl-space-8)]",
      default: "h-[var(--fl-space-10)] w-[var(--fl-space-10)]",
      lg: "h-[var(--fl-space-12)] w-[var(--fl-space-12)]",
      xl: "h-[var(--fl-space-16)] w-[var(--fl-space-16)]",
    };

    return (
      <Skeleton
        ref={ref}
        variant={variant}
        animation={animation}
        className={cn("rounded-ds-full", sizeClasses[size], className)}
      />
    );
  }
);
SkeletonAvatar.displayName = "SkeletonAvatar";

// Button skeleton
export interface SkeletonButtonProps {
  size?: "sm" | "default" | "lg" | undefined;
  className?: string | undefined;
  variant?: VariantProps<typeof skeletonVariants>["variant"] | undefined;
  animation?: boolean | undefined;
}

const SkeletonButton = React.forwardRef<HTMLDivElement, SkeletonButtonProps>(
  ({ size = "default", className, variant, animation }, ref) => {
    const sizeClasses = {
      sm: "h-[var(--fl-space-8)] w-[var(--fl-space-20)]",
      default: "h-[var(--fl-space-10)] w-24",
      lg: "h-[var(--fl-space-12)] w-32",
    };

    return <Skeleton ref={ref} variant={variant} animation={animation} className={cn(sizeClasses[size], className)} />;
  }
);
SkeletonButton.displayName = "SkeletonButton";

// Card skeleton with composition
export interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
  showImage?: boolean;
  lines?: number;
  variant?: VariantProps<typeof skeletonVariants>["variant"];
  animation?: boolean;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, showAvatar = true, showActions = false, showImage = false, lines = 3, variant, animation }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border border-[var(--fl-color-border)]",
          "bg-[var(--fl-color-surface)]",
          "p-[var(--fl-space-6)]",
          "space-y-[var(--fl-space-4)]",
          className
        )}
      >
        {showImage && (
          <Skeleton variant={variant} animation={animation} className="h-48 w-full" />
        )}
        <div className="flex items-start gap-[var(--fl-space-3)]">
          {showAvatar && <SkeletonAvatar variant={variant} animation={animation} />}
          <div className="flex-1 space-y-[var(--fl-space-2)]">
            <Skeleton variant={variant} animation={animation} className="h-[var(--fl-space-5)] w-1/3" />
            <SkeletonText lines={lines} variant={variant} animation={animation} />
          </div>
        </div>
        {showActions && (
          <div className="flex justify-end gap-[var(--fl-space-2)] pt-[var(--fl-space-2)]">
            <SkeletonButton size="sm" variant={variant} animation={animation} />
            <SkeletonButton size="sm" variant={variant} animation={animation} />
          </div>
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = "SkeletonCard";

// Table skeleton
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  variant?: VariantProps<typeof skeletonVariants>["variant"];
  animation?: boolean;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 5, columns = 4, showHeader = true, className, variant, animation }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        {showHeader && (
          <div className="flex gap-[var(--fl-space-4)] border-b border-[var(--fl-color-border)] p-[var(--fl-space-4)]">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} variant={variant} animation={animation} className="h-[var(--fl-space-4)] flex-1" />
            ))}
          </div>
        )}
        <div className="divide-y divide-[var(--fl-color-border)]">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-[var(--fl-space-4)] p-[var(--fl-space-4)]">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant={variant}
                  animation={animation}
                  className={cn("h-[var(--fl-space-4)]", colIndex === 0 ? "w-1/4" : "flex-1")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
SkeletonTable.displayName = "SkeletonTable";

// Add shimmer animation styles
const skeletonStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Inject styles if needed
if (typeof window !== "undefined" && !document.getElementById("flame-skeleton-styles")) {
  const style = document.createElement("style");
  style.id = "flame-skeleton-styles";
  style.textContent = skeletonStyles;
  document.head.appendChild(style);
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard, SkeletonTable, skeletonVariants };
