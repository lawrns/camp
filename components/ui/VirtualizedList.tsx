"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle, memo } from "react";
import { cn } from "@/lib/utils";

// Performance monitoring utilities
interface PerformanceMetrics {
  renderTime: number;
  scrollFps: number;
  memoryUsage: number;
  visibleItems: number;
  totalItems: number;
}

interface VirtualizedListItem {
  id: string | number;
  data: any;
  height?: number;
}

interface VirtualizedListProps<T = any> {
  items: VirtualizedListItem[];
  itemHeight?: number | ((index: number, item: VirtualizedListItem) => number);
  containerHeight: number;
  renderItem: (props: {
    index: number;
    item: VirtualizedListItem;
    style: React.CSSProperties;
    isVisible: boolean;
  }) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasNextPage?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  filterFn?: (item: VirtualizedListItem, query: string) => boolean;
  className?: string;
  overscan?: number;
  threshold?: number;
  onPerformanceMetrics?: (metrics: PerformanceMetrics) => void;
  enableKeyboardNavigation?: boolean;
  onItemSelect?: (item: VirtualizedListItem, index: number) => void;
  selectedIndex?: number;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  enableVirtualization?: boolean;
  itemKey?: (item: VirtualizedListItem, index: number) => string;
}

interface VirtualizedListRef {
  scrollToIndex: (index: number, align?: "start" | "center" | "end") => void;
  scrollToTop: () => void;
  getVisibleRange: () => { start: number; end: number };
  refresh: () => void;
}

// Custom hook for performance monitoring
const usePerformanceMonitor = (onMetrics?: (metrics: PerformanceMetrics) => void, enabled = true) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    scrollFps: 0,
    memoryUsage: 0,
    visibleItems: 0,
    totalItems: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  const measureRenderTime = useCallback(
    (fn: () => void) => {
      if (!enabled) {
        fn();
        return;
      }

      const start = performance.now();
      fn();
      const end = performance.now();
      metricsRef.current.renderTime = end - start;
    },
    [enabled]
  );

  const trackScrollPerformance = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    if (lastFrameTimeRef.current) {
      const frameDuration = now - lastFrameTimeRef.current;
      frameTimesRef.current.push(frameDuration);

      // Keep only last 60 frames for FPS calculation
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate FPS
      const avgFrameDuration = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      metricsRef.current.scrollFps = 1000 / avgFrameDuration;
    }
    lastFrameTimeRef.current = now;
  }, [enabled]);

  const updateMetrics = useCallback(
    (visibleItems: number, totalItems: number) => {
      if (!enabled) return;

      metricsRef.current.visibleItems = visibleItems;
      metricsRef.current.totalItems = totalItems;

      // Memory usage (if available)
      if ("memory" in performance) {
        metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }

      onMetrics?.(metricsRef.current);
    },
    [enabled, onMetrics]
  );

  return { measureRenderTime, trackScrollPerformance, updateMetrics };
};

// Custom hook for item height caching
const useItemHeightCache = () => {
  const heightCacheRef = useRef<Map<string | number, number>>(new Map());
  const estimatedHeightRef = useRef<number>(50);

  const getItemHeight = useCallback(
    (
      index: number,
      item: VirtualizedListItem,
      itemHeight?: number | ((index: number, item: VirtualizedListItem) => number)
    ) => {
      const cached = heightCacheRef.current.get(item.id);
      if (cached !== undefined) return cached;

      if (item.height !== undefined) return item.height;

      if (typeof itemHeight === "function") {
        return itemHeight(index, item);
      }

      return itemHeight || estimatedHeightRef.current;
    },
    []
  );

  const setItemHeight = useCallback((id: string | number, height: number) => {
    heightCacheRef.current.set(id, height);

    // Update estimated height based on measured heights
    const heights = Array.from(heightCacheRef.current.values());
    if (heights.length > 0) {
      estimatedHeightRef.current = heights.reduce((a, b) => a + b, 0) / heights.length;
    }
  }, []);

  const clearCache = useCallback(() => {
    heightCacheRef.current.clear();
  }, []);

  return { getItemHeight, setItemHeight, clearCache, estimatedHeight: estimatedHeightRef.current };
};

// Custom hook for keyboard navigation
const useKeyboardNavigation = (
  enabled: boolean,
  itemCount: number,
  selectedIndex: number,
  onItemSelect?: (item: VirtualizedListItem, index: number) => void,
  items?: VirtualizedListItem[],
  scrollToIndex?: (index: number) => void
) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      let newIndex = currentIndex;
      let handled = false;

      switch (event.key) {
        case "ArrowDown":
          newIndex = Math.min(currentIndex + 1, itemCount - 1);
          handled = true;
          break;
        case "ArrowUp":
          newIndex = Math.max(currentIndex - 1, 0);
          handled = true;
          break;
        case "Home":
          newIndex = 0;
          handled = true;
          break;
        case "End":
          newIndex = itemCount - 1;
          handled = true;
          break;
        case "PageDown":
          newIndex = Math.min(currentIndex + 10, itemCount - 1);
          handled = true;
          break;
        case "PageUp":
          newIndex = Math.max(currentIndex - 10, 0);
          handled = true;
          break;
        case "Enter":
        case " ":
          if (items && items[currentIndex] && onItemSelect) {
            onItemSelect(items[currentIndex], currentIndex);
            handled = true;
          }
          break;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();

        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
          scrollToIndex?.(newIndex);
          if (items && items[newIndex] && onItemSelect) {
            onItemSelect(items[newIndex], newIndex);
          }
        }
      }
    },
    [enabled, itemCount, currentIndex, onItemSelect, items, scrollToIndex]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return currentIndex;
};

// Virtualized item component with height measurement
const VirtualizedItem = memo<{
  index: number;
  item: VirtualizedListItem;
  style: React.CSSProperties;
  renderItem: VirtualizedListProps["renderItem"];
  onHeightChange: (id: string | number, height: number) => void;
  isVisible: boolean;
}>(({ index, item, style, renderItem, onHeightChange, isVisible }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    if (itemRef.current && !measured) {
      const height = itemRef.current.offsetHeight;
      onHeightChange(item.id, height);
      setMeasured(true);
    }
  }, [item.id, onHeightChange, measured]);

  return (
    <div ref={itemRef} style={style}>
      {renderItem({ index, item, style: {}, isVisible })}
    </div>
  );
});

VirtualizedItem.displayName = "VirtualizedItem";

export const VirtualizedList = memo(
  forwardRef<VirtualizedListRef, VirtualizedListProps>(
    (
      {
        items,
        itemHeight = 50,
        containerHeight,
        renderItem,
        onLoadMore,
        hasNextPage = false,
        isLoading = false,
        searchQuery = "",
        filterFn,
        className,
        overscan = 5,
        threshold = 0.8,
        onPerformanceMetrics,
        enableKeyboardNavigation = true,
        onItemSelect,
        selectedIndex = 0,
        loadingComponent,
        emptyComponent,
        errorComponent,
        enableVirtualization = true,
        itemKey,
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const scrollElementRef = useRef<HTMLDivElement>(null);
      const [scrollTop, setScrollTop] = useState(0);
      const [isScrolling, setIsScrolling] = useState(false);
      const scrollTimeoutRef = useRef<NodeJS.Timeout>();
      const loadingRef = useRef(false);

      // Performance monitoring
      const { measureRenderTime, trackScrollPerformance, updateMetrics } = usePerformanceMonitor(
        onPerformanceMetrics,
        !!onPerformanceMetrics
      );

      // Item height management
      const { getItemHeight, setItemHeight, clearCache } = useItemHeightCache();

      // Filter items based on search query
      const filteredItems = useMemo(() => {
        if (!searchQuery || !filterFn) return items;
        return items.filter((item) => filterFn(item, searchQuery));
      }, [items, searchQuery, filterFn]);

      // Calculate visible range
      const { visibleRange, totalHeight } = useMemo(() => {
        if (!enableVirtualization) {
          return {
            visibleRange: { start: 0, end: filteredItems.length },
            totalHeight: filteredItems.length * (typeof itemHeight === "number" ? itemHeight : 50),
          };
        }

        let height = 0;
        let start = 0;
        let end = 0;
        let startOffset = 0;

        // Find start index
        for (let i = 0; i < filteredItems.length; i++) {
          const itemHeightValue = getItemHeight(i, filteredItems[i], itemHeight);
          if (height + itemHeightValue > scrollTop) {
            start = Math.max(0, i - overscan);
            startOffset = height - (i - start) * (typeof itemHeight === "number" ? itemHeight : 50);
            break;
          }
          height += itemHeightValue;
        }

        // Find end index
        height = startOffset;
        for (let i = start; i < filteredItems.length; i++) {
          const itemHeightValue = getItemHeight(i, filteredItems[i], itemHeight);
          height += itemHeightValue;
          end = i;
          if (height > scrollTop + containerHeight + overscan * (typeof itemHeight === "number" ? itemHeight : 50)) {
            break;
          }
        }

        // Calculate total height
        let totalHeight = 0;
        for (let i = 0; i < filteredItems.length; i++) {
          totalHeight += getItemHeight(i, filteredItems[i], itemHeight);
        }

        return {
          visibleRange: { start, end: Math.min(end + overscan, filteredItems.length - 1) },
          totalHeight,
        };
      }, [filteredItems, scrollTop, containerHeight, overscan, itemHeight, getItemHeight, enableVirtualization]);

      // Keyboard navigation
      const currentKeyboardIndex = useKeyboardNavigation(
        enableKeyboardNavigation,
        filteredItems.length,
        selectedIndex,
        onItemSelect,
        filteredItems,
        (index) => scrollToIndex(index)
      );

      // Scroll handler with performance tracking
      const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
          const target = event.currentTarget;
          const newScrollTop = target.scrollTop;

          measureRenderTime(() => {
            setScrollTop(newScrollTop);
            setIsScrolling(true);
          });

          trackScrollPerformance();

          // Clear scroll timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Set scroll end timeout
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 150);

          // Infinite scroll logic
          if (
            onLoadMore &&
            hasNextPage &&
            !loadingRef.current &&
            target.scrollHeight - target.scrollTop <= target.clientHeight * (1 + threshold)
          ) {
            loadingRef.current = true;
            onLoadMore().finally(() => {
              loadingRef.current = false;
            });
          }
        },
        [measureRenderTime, trackScrollPerformance, onLoadMore, hasNextPage, threshold]
      );

      // Scroll to index function
      const scrollToIndex = useCallback(
        (index: number, align: "start" | "center" | "end" = "start") => {
          if (!scrollElementRef.current || index < 0 || index >= filteredItems.length) return;

          let offset = 0;
          for (let i = 0; i < index; i++) {
            offset += getItemHeight(i, filteredItems[i], itemHeight);
          }

          const itemHeightValue = getItemHeight(index, filteredItems[index], itemHeight);

          switch (align) {
            case "center":
              offset -= (containerHeight - itemHeightValue) / 2;
              break;
            case "end":
              offset -= containerHeight - itemHeightValue;
              break;
          }

          scrollElementRef.current.scrollTop = Math.max(0, offset);
        },
        [filteredItems, getItemHeight, itemHeight, containerHeight]
      );

      // Expose ref methods
      useImperativeHandle(
        ref,
        () => ({
          scrollToIndex,
          scrollToTop: () => {
            if (scrollElementRef.current) {
              scrollElementRef.current.scrollTop = 0;
            }
          },
          getVisibleRange: () => visibleRange,
          refresh: () => {
            clearCache();
            setScrollTop(0);
          },
        }),
        [scrollToIndex, visibleRange, clearCache]
      );

      // Update performance metrics
      useEffect(() => {
        updateMetrics(visibleRange.end - visibleRange.start + 1, filteredItems.length);
      }, [visibleRange, filteredItems.length, updateMetrics]);

      // Render visible items
      const visibleItems = useMemo(() => {
        if (!enableVirtualization) {
          return filteredItems.map((item, index) => {
            const key = itemKey ? itemKey(item, index) : item.id;
            return (
              <VirtualizedItem
                key={key}
                index={index}
                item={item}
                style={{}}
                renderItem={renderItem}
                onHeightChange={setItemHeight}
                isVisible={true}
              />
            );
          });
        }

        const items = [];
        let offset = 0;

        // Calculate offset for items before visible range
        for (let i = 0; i < visibleRange.start; i++) {
          offset += getItemHeight(i, filteredItems[i], itemHeight);
        }

        // Render visible items
        for (let i = visibleRange.start; i <= visibleRange.end && i < filteredItems.length; i++) {
          const item = filteredItems[i];
          const itemHeightValue = getItemHeight(i, item, itemHeight);
          const key = itemKey ? itemKey(item, i) : item.id;

          items.push(
            <VirtualizedItem
              key={key}
              index={i}
              item={item}
              style={{
                position: "absolute",
                top: offset,
                left: 0,
                right: 0,
                height: itemHeightValue,
              }}
              renderItem={renderItem}
              onHeightChange={setItemHeight}
              isVisible={!isScrolling}
            />
          );

          offset += itemHeightValue;
        }

        return items;
      }, [
        enableVirtualization,
        filteredItems,
        visibleRange,
        getItemHeight,
        itemHeight,
        renderItem,
        setItemHeight,
        isScrolling,
        itemKey,
      ]);

      // Handle empty state
      if (filteredItems.length === 0 && !isLoading) {
        return (
          <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
            {emptyComponent || <div className="text-muted-foreground">No items found</div>}
          </div>
        );
      }

      return (
        <div
          ref={containerRef}
          className={cn("relative overflow-hidden", className)}
          style={{ height: containerHeight }}
          tabIndex={enableKeyboardNavigation ? 0 : -1}
          role="listbox"
          aria-label="Virtualized list"
        >
          <div
            ref={scrollElementRef}
            className="h-full overflow-auto"
            onScroll={handleScroll}
            style={{
              // Mobile optimization
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            <div
              className="relative"
              style={{
                height: enableVirtualization ? totalHeight : "auto",
                minHeight: enableVirtualization ? totalHeight : containerHeight,
              }}
            >
              {visibleItems}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center justify-center spacing-3">
                  {loadingComponent || (
                    <div className="flex items-center space-x-spacing-sm">
                      <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keyboard navigation indicator */}
          {enableKeyboardNavigation &&
            currentKeyboardIndex >= visibleRange.start &&
            currentKeyboardIndex <= visibleRange.end && (
              <div
                className="pointer-events-none absolute left-0 right-0 border-2 border-primary"
                style={{
                  top: (() => {
                    let offset = 0;
                    for (let i = visibleRange.start; i < currentKeyboardIndex; i++) {
                      offset += getItemHeight(i, filteredItems[i], itemHeight);
                    }
                    return offset;
                  })(),
                  height: getItemHeight(currentKeyboardIndex, filteredItems[currentKeyboardIndex], itemHeight),
                }}
              />
            )}
        </div>
      );
    }
  )
);

VirtualizedList.displayName = "VirtualizedList";

export type { VirtualizedListProps, VirtualizedListRef, VirtualizedListItem, PerformanceMetrics };
