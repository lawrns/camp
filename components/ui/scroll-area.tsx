import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const scrollBarVariants = cva(
  // Base styles
  "flex touch-none select-none transition-colors",
  {
    variants: {
      variant: {
        default: "",
        overlay: "absolute",
        hover: "opacity-0 hover:opacity-100",
      },
      size: {
        default: "",
        thin: "",
        thick: "",
      },
      orientation: {
        vertical: "h-full border-l border-l-transparent p-[1px]",
        horizontal: "flex-col border-t border-t-transparent p-[1px]",
      },
    },
    compoundVariants: [
      {
        orientation: "vertical",
        size: "default",
        class: "w-2.5",
      },
      {
        orientation: "vertical",
        size: "thin",
        class: "w-1.5",
      },
      {
        orientation: "vertical",
        size: "thick",
        class: "w-3",
      },
      {
        orientation: "horizontal",
        size: "default",
        class: "h-2.5",
      },
      {
        orientation: "horizontal",
        size: "thin",
        class: "h-1.5",
      },
      {
        orientation: "horizontal",
        size: "thick",
        class: "h-3",
      },
      {
        variant: "overlay",
        orientation: "vertical",
        class: "right-0 top-0",
      },
      {
        variant: "overlay",
        orientation: "horizontal",
        class: "bottom-0 left-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      orientation: "vertical",
    },
  }
);

const scrollBarThumbVariants = cva(
  // Base styles
  "relative flex-1 rounded-full bg-border",
  {
    variants: {
      variant: {
        default: "bg-border",
        brand: "bg-primary",
        subtle: "bg-border/50",
        strong: "bg-border",
        glass: "bg-white/20 backdrop-blur-sm",
      },
      interactive: {
        true: [
          "hover:bg-border/80",
          "active:bg-border",
          "transition-colors",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: true,
    },
  }
);

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /**
   * Scrollbar visibility behavior
   */
  scrollbarVisibility?: "auto" | "always" | "hover" | "hidden";
  /**
   * Scrollbar variant style
   */
  scrollbarVariant?: VariantProps<typeof scrollBarVariants>["variant"];
  /**
   * Scrollbar size
   */
  scrollbarSize?: VariantProps<typeof scrollBarVariants>["size"];
  /**
   * Thumb variant style
   */
  thumbVariant?: VariantProps<typeof scrollBarThumbVariants>["variant"];
  /**
   * Show horizontal scrollbar
   */
  showHorizontal?: boolean;
  /**
   * Show vertical scrollbar
   */
  showVertical?: boolean;
  /**
   * Callback fired when scroll position changes
   */
  onScrollPositionChange?: (position: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void;
}

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  (
    {
      className,
      children,
      scrollbarVisibility = "auto",
      scrollbarVariant = "default",
      scrollbarSize = "default",
      thumbVariant = "default",
      showHorizontal = false,
      showVertical = true,
      onScrollPositionChange,
      ...props
    },
    ref
  ) => {
    const viewportRef = React.useRef<HTMLDivElement>(null);

    const scrollbarClass = React.useMemo(() => {
      switch (scrollbarVisibility) {
        case "always":
          return "";
        case "hover":
          return "opacity-0 hover:opacity-100";
        case "hidden":
          return "hidden";
        default:
          return "";
      }
    }, [scrollbarVisibility]);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport || !onScrollPositionChange) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        onScrollPositionChange({ scrollTop, scrollHeight, clientHeight });
      };

      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, [onScrollPositionChange]);

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport 
          ref={viewportRef}
          className="h-full w-full rounded-[inherit]"
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showVertical && (
          <ScrollBar
            className={scrollbarClass}
            orientation="vertical"
            variant={scrollbarVariant}
            size={scrollbarSize}
            thumbVariant={thumbVariant}
          />
        )}
        {showHorizontal && (
          <ScrollBar
            className={scrollbarClass}
            orientation="horizontal"
            variant={scrollbarVariant}
            size={scrollbarSize}
            thumbVariant={thumbVariant}
          />
        )}
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

interface ScrollBarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, "orientation">,
    Omit<VariantProps<typeof scrollBarVariants>, "orientation"> {
  thumbVariant?: VariantProps<typeof scrollBarThumbVariants>["variant"];
  orientation?: "horizontal" | "vertical";
}

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, ScrollBarProps>(
  ({ className, orientation = "vertical", variant, size, thumbVariant, ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(scrollBarVariants({ variant, size, orientation }), className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn(scrollBarThumbVariants({ variant: thumbVariant, interactive: true }))}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar, scrollBarVariants, scrollBarThumbVariants };