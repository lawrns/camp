import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center",
    "rounded-[var(--fl-rounded-ds-lg)]",
    "p-[var(--fl-space-1)]",
    "text-[var(--fl-color-text-muted)]",
  ],
  {
    variants: {
      variant: {
        default: ["bg-[var(--fl-color-background-muted)]", "border border-[var(--fl-color-border)]"],
        solid: ["bg-[var(--fl-color-background-subtle)]"],
        ghost: ["bg-transparent"],
        underline: ["bg-transparent", "border-b border-[var(--fl-color-border)]", "radius-none p-0"],
        pills: ["bg-transparent", "gap-[var(--fl-space-2)]"],
      },
      size: {
        sm: "h-[var(--fl-space-8)]",
        default: "h-[var(--fl-space-10)]",
        lg: "h-[var(--fl-space-12)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant, size }), className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "px-[var(--fl-space-3)] py-[var(--fl-space-1)]",
    "font-[var(--fl-font-weight-medium)] text-[var(--fl-font-size-sm)]",
    "ring-offset-background",
    "duration-[var(--fl-duration-200)] transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fl-color-focus)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "rounded-[var(--fl-rounded-ds-md)]",
          "data-[state=active]:bg-[var(--fl-color-background)]",
          "data-[state=active]:text-[var(--fl-color-text)]",
          "data-[state=active]:shadow-[var(--fl-shadow-sm)]",
          "hover:bg-[var(--fl-color-background)]/50",
          "hover:text-[var(--fl-color-text)]",
        ],
        solid: [
          "rounded-[var(--fl-rounded-ds-md)]",
          "data-[state=active]:bg-[var(--fl-color-brand)]",
          "data-[state=active]:text-[var(--fl-color-text-inverse)]",
          "hover:bg-[var(--fl-color-background-muted)]",
          "hover:text-[var(--fl-color-text)]",
        ],
        ghost: [
          "rounded-[var(--fl-rounded-ds-md)]",
          "data-[state=active]:bg-[var(--fl-color-background-subtle)]",
          "data-[state=active]:text-[var(--fl-color-text)]",
          "hover:bg-[var(--fl-color-background-subtle)]/50",
          "hover:text-[var(--fl-color-text)]",
        ],
        underline: [
          "radius-none",
          "border-b-2 border-transparent",
          "pb-[var(--fl-space-3)]",
          "data-[state=active]:border-[var(--fl-color-brand)]",
          "data-[state=active]:text-[var(--fl-color-brand)]",
          "hover:text-[var(--fl-color-text)]",
        ],
        pills: [
          "rounded-ds-full",
          "px-[var(--fl-space-4)]",
          "data-[state=active]:bg-[var(--fl-color-brand)]",
          "data-[state=active]:text-[var(--fl-color-text-inverse)]",
          "data-[state=active]:shadow-[var(--fl-shadow-md)]",
          "hover:bg-[var(--fl-color-background-subtle)]",
          "hover:text-[var(--fl-color-text)]",
        ],
      },
      size: {
        sm: "text-[var(--fl-font-size-xs)]",
        default: "text-[var(--fl-font-size-sm)]",
        lg: "text-[var(--fl-font-size-base)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({ variant, size }), className)} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-[var(--fl-space-4)]",
      "ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fl-color-focus)] focus-visible:ring-offset-2",
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-bottom-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Additional compound components for improved functionality
export interface TabsWithIconsProps {
  tabs: {
    value: string;
    label: string;
    icon?: React.ReactNode | undefined;
    content: React.ReactNode;
    disabled?: boolean | undefined;
  }[];
  defaultValue?: string | undefined;
  variant?: VariantProps<typeof tabsListVariants>["variant"] | undefined;
  size?: VariantProps<typeof tabsListVariants>["size"] | undefined;
  className?: string | undefined;
  onValueChange?: (value: string) => void;
}

const TabsWithIcons = React.forwardRef<HTMLDivElement, TabsWithIconsProps>(
  ({ tabs, defaultValue, variant, size, className, onValueChange }, ref) => {
    return (
      <Tabs
        ref={ref}
        defaultValue={defaultValue || tabs[0]?.value || ""}
        className={className}
        {...(onValueChange && { onValueChange })}
      >
        <TabsList variant={variant} size={size}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              variant={variant}
              size={size}
              className="gap-[var(--fl-space-2)]"
            >
              {tab.icon && <span className="flex items-center flex-shrink-0">{tab.icon}</span>}
              <span className="whitespace-nowrap truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    );
  }
);
TabsWithIcons.displayName = "TabsWithIcons";

// Vertical tabs variant
const VerticalTabs = React.forwardRef<HTMLDivElement, TabsWithIconsProps & { contentClassName?: string }>(
  ({ tabs, defaultValue, variant = "ghost", size, className, contentClassName, onValueChange }, ref) => {
    return (
      <Tabs
        ref={ref}
        defaultValue={defaultValue || tabs[0]?.value || ""}
        className={cn("flex gap-[var(--fl-space-6)]", className)}
        orientation="vertical"
        {...(onValueChange && { onValueChange })}
      >
        <TabsList
          variant={variant}
          size={size}
          className="h-auto flex-col items-stretch justify-start p-[var(--fl-space-2)]"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              variant={variant}
              size={size}
              className="w-full justify-start gap-[var(--fl-space-2)]"
            >
              {tab.icon && <span className="flex items-center flex-shrink-0">{tab.icon}</span>}
              <span className="whitespace-nowrap truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className={cn("flex-1", contentClassName)}>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    );
  }
);
VerticalTabs.displayName = "VerticalTabs";

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsWithIcons, VerticalTabs, tabsListVariants, tabsTriggerVariants };
