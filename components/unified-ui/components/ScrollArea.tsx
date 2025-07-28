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
  "relative flex-1 rounded-ds-full",
  {
    variants: {
      variant: {
        default: "bg-[var(--fl-color-border)]",
        brand: "bg-[var(--fl-color-brand)]",
        subtle: "bg-[var(--fl-color-border-subtle)]",
        strong: "bg-[var(--fl-color-border-strong)]",
        glass: "bg-white/20 backdrop-blur-sm",
      },
      interactive: {
        true: [
          "hover:bg-[var(--fl-color-border-strong)]",
          "active:bg-[var(--fl-color-border-interactive)]",
          "duration- [var(--fl-duration-150) ] transition-colors",
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
   * Scrollbar thumb variant
   */
  thumbVariant?: VariantProps<typeof scrollBarThumbVariants>["variant"];
  /**
   * Whether to show horizontal scrollbar
   */
  showHorizontal?: boolean;
  /**
   * Whether to show vertical scrollbar
   */
  showVertical?: boolean;
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
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const showScrollbars =
      scrollbarVisibility !== "hidden" &&
      (scrollbarVisibility === "always" ||
        (scrollbarVisibility === "hover" && isHovered) ||
        scrollbarVisibility === "auto");

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showScrollbars && showVertical && (
          <ScrollBar
            orientation="vertical"
            variant={scrollbarVariant}
            size={scrollbarSize}
            thumbVariant={thumbVariant}
          />
        )}
        {showScrollbars && showHorizontal && (
          <ScrollBar
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

// Improved scroll area with custom styling
export interface CustomScrollAreaProps extends ScrollAreaProps {
  /**
   * Show scroll indicators at edges
   */
  showEdgeIndicators?: boolean;
  /**
   * Custom scrollbar colors
   */
  scrollbarColors?: {
    track?: string;
    thumb?: string;
    thumbHover?: string;
  };
}

const CustomScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, CustomScrollAreaProps>(
  ({ showEdgeIndicators = false, scrollbarColors, children, className, ...props }, ref) => {
    const [scrollState, setScrollState] = React.useState({
      canScrollUp: false,
      canScrollDown: false,
      canScrollLeft: false,
      canScrollRight: false,
    });

    const viewportRef = React.useRef<HTMLDivElement>(null);

    const updateScrollState = React.useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = viewport;

      setScrollState({
        canScrollUp: scrollTop > 0,
        canScrollDown: scrollTop < scrollHeight - clientHeight - 1,
        canScrollLeft: scrollLeft > 0,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
      });
    }, []);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      updateScrollState();
      viewport.addEventListener("scroll", updateScrollState);
      window.addEventListener("resize", updateScrollState);

      return () => {
        viewport.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }, [updateScrollState]);

    return (
      <div className={cn("relative", className)}>
        <ScrollArea ref={ref} {...props}>
          <div ref={viewportRef}>{children}</div>
        </ScrollArea>
        {showEdgeIndicators && (
          <>
            {/* Top edge indicator */}
            <div
              className={cn(
                "absolute left-0 right-0 top-0 h-6",
                "bg-gradient-to-b from-[var(--fl-color-background)] to-transparent",
                "pointer-events-none transition-opacity duration-200",
                scrollState.canScrollUp ? "opacity-100" : "opacity-0"
              )}
            />
            {/* Bottom edge indicator */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-6",
                "bg-gradient-to-t from-[var(--fl-color-background)] to-transparent",
                "pointer-events-none transition-opacity duration-200",
                scrollState.canScrollDown ? "opacity-100" : "opacity-0"
              )}
            />
          </>
        )}
      </div>
    );
  }
);
CustomScrollArea.displayName = "CustomScrollArea";

export { ScrollArea, ScrollBar, CustomScrollArea, scrollBarVariants, scrollBarThumbVariants };
