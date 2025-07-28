import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const separatorVariants = cva(
  // Base styles
  "shrink-0",
  {
    variants: {
      orientation: {
        horizontal: "h-[1px] w-full",
        vertical: "h-full w-[1px]",
      },
      variant: {
        default: "bg-[var(--fl-color-border)]",
        strong: "bg-[var(--fl-color-border-strong)]",
        subtle: "bg-[var(--fl-color-border-subtle)]",
        brand: "bg-[var(--fl-color-brand)]",
        gradient: "bg-gradient-to-r from-transparent via-[var(--fl-color-border)] to-transparent",
        dashed: "border-dashed",
        dotted: "border-dotted",
      },
      size: {
        default: "",
        thick: "",
        thin: "",
      },
    },
    compoundVariants: [
      {
        orientation: "horizontal",
        size: "thick",
        class: "h-[2px]",
      },
      {
        orientation: "horizontal",
        size: "thin",
        class: "h-[0.5px]",
      },
      {
        orientation: "vertical",
        size: "thick",
        class: "w-[2px]",
      },
      {
        orientation: "vertical",
        size: "thin",
        class: "w-[0.5px]",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "horizontal",
        class: "h-0 border-t bg-transparent",
      },
      {
        variant: ["dashed", "dotted"],
        orientation: "vertical",
        class: "w-0 border-l bg-transparent",
      },
    ],
    defaultVariants: {
      orientation: "horizontal",
      variant: "default",
      size: "default",
    },
  }
);

export interface SeparatorProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>, "orientation">,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {
  /**
   * Add spacing around the separator
   */
  spacing?: "none" | "sm" | "default" | "lg" | undefined;
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(
  ({ className, orientation, variant, size, spacing = "none", decorative = true, ...props }, ref) => {
    const actualOrientation = orientation || "horizontal";
    const spacingClasses = {
      none: "",
      sm: actualOrientation === "horizontal" ? "my-[var(--fl-space-2)]" : "mx-[var(--fl-space-2)]",
      default: actualOrientation === "horizontal" ? "my-[var(--fl-space-4)]" : "mx-[var(--fl-space-4)]",
      lg: actualOrientation === "horizontal" ? "my-[var(--fl-space-6)]" : "mx-[var(--fl-space-6)]",
    };

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={actualOrientation}
        className={cn(
          separatorVariants({ orientation: actualOrientation, variant, size }),
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

// Separator with label component
export interface SeparatorWithLabelProps extends SeparatorProps {
  label: string;
  labelPosition?: "start" | "center" | "end";
  labelClassName?: string;
}

const SeparatorWithLabel = React.forwardRef<HTMLDivElement, SeparatorWithLabelProps>(
  (
    { label, labelPosition = "center", labelClassName, className, orientation = "horizontal", ...separatorProps },
    ref
  ) => {
    if (orientation === "vertical") {
      // SeparatorWithLabel only supports horizontal orientation
      return <Separator orientation={orientation} {...separatorProps} />;
    }

    const positionClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center", className)}
        role="separator"
        aria-orientation={orientation || "horizontal"}
      >
        <div className="flex-1">
          <Separator orientation={orientation} {...separatorProps} />
        </div>
        <span
          className={cn(
            "absolute flex bg-[var(--fl-color-background)] px-[var(--fl-space-2)]",
            "text-[var(--fl-color-text-muted)] text-[var(--fl-font-size-sm)]",
            positionClasses[labelPosition],
            labelClassName
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);
SeparatorWithLabel.displayName = "SeparatorWithLabel";

// Section separator with optional icon
export interface SectionSeparatorProps extends Omit<SeparatorProps, "orientation"> {
  icon?: React.ReactNode;
  iconPosition?: "start" | "center" | "end";
  iconClassName?: string;
}

const SectionSeparator = React.forwardRef<HTMLDivElement, SectionSeparatorProps>(
  ({ icon, iconPosition = "center", iconClassName, className, ...separatorProps }, ref) => {
    const positionClasses = {
      start: "mr-auto",
      center: "mx-auto",
      end: "ml-auto",
    };

    return (
      <div ref={ref} className={cn("relative w-full", className)} role="separator" aria-orientation="horizontal">
        <Separator orientation="horizontal" {...separatorProps} />
        {icon && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2",
              "flex items-center justify-center",
              "bg-[var(--fl-color-background)] px-[var(--fl-space-3)]",
              positionClasses[iconPosition],
              iconClassName
            )}
          >
            {icon}
          </div>
        )}
      </div>
    );
  }
);
SectionSeparator.displayName = "SectionSeparator";

export { Separator, SeparatorWithLabel, SectionSeparator, separatorVariants };
