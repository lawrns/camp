/**
 * List Animations
 * Beautiful animations for lists including stagger, drag to reorder, filtering, and infinite scroll
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo, Reorder, useMotionValue, useTransform } from "framer-motion";
import { Icon, Icons } from '@/lib/icons/standardized-icons';

import { cn } from "@/lib/utils";

// Stagger list animation
interface StaggerListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  staggerDelay = 0.05,
}: StaggerListProps<T>) {
  return (
    <motion.ul
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {items.map((item, index) => (
        <motion.li
          key={keyExtractor(item)}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          {renderItem(item, index)}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Drag to reorder list
interface DragReorderListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function DragReorderList<T>({ items, onReorder, renderItem, keyExtractor, className }: DragReorderListProps<T>) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className={className}>
      {items.map((item, index) => (
        <Reorder.Item
          key={keyExtractor(item)}
          value={item}
          className="relative"
          whileDrag={{
            scale: 1.02,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 1,
          }}
        >
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

// Swipeable list item
interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  className?: string;
}

export function SwipeableListItem({ children, onDelete, onArchive, className }: SwipeableListItemProps) {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const backgroundOpacity = useTransform(x, [-200, -100, 0, 100, 200], [1, 0.5, 0, 0.5, 1]);

  const deleteOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);

  const archiveOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x < -threshold && onDelete) {
      setIsDeleting(true);
      onDelete();
    } else if (info.offset.x > threshold && onArchive) {
      setIsDeleting(true);
      onArchive();
    }
  };

  if (isDeleting) {
    return (
      <motion.div
        initial={{ height: "auto", opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{ opacity: backgroundOpacity }}
      >
        <motion.div className="flex items-center gap-ds-2 text-white" style={{ opacity: deleteOpacity }}>
          <Icon icon={Icons.delete} className="h-5 w-5" />
          <span>Delete</span>
        </motion.div>

        <motion.div className="flex items-center gap-ds-2 text-white" style={{ opacity: archiveOpacity }}>
          <Icon icon={Icons.archive} className="h-5 w-5" />
          <span>Archive</span>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="bg-background relative"
        animate={{ x: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Filter animation list
interface FilterAnimationListProps<T> {
  items: T[];
  filter: string;
  filterFn: (item: T, filter: string) => boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function FilterAnimationList<T>({
  items,
  filter,
  filterFn,
  renderItem,
  keyExtractor,
  className,
}: FilterAnimationListProps<T>) {
  const filteredItems = items.filter((item) => filterFn(item, filter));

  return (
    <motion.div className={className} layout>
      <AnimatePresence mode="popLayout">
        {filteredItems.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              opacity: { duration: 0.2 },
              layout: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// Infinite scroll list
interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  className?: string;
  threshold?: number;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  keyExtractor,
  loadMore,
  hasMore,
  className,
  threshold = 100,
}: InfiniteScrollListProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          await loadMore();
          setIsLoading(false);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore, threshold]);

  return (
    <div className={className}>
      <motion.div layout>
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </motion.div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-ds-2">
              <motion.div
                className="bg-primary h-2 w-2 rounded-ds-full"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 0.2,
                }}
              />
              <motion.div
                className="bg-primary h-2 w-2 rounded-ds-full"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.2,
                  repeatDelay: 0.2,
                }}
              />
              <motion.div
                className="bg-primary h-2 w-2 rounded-ds-full"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.4,
                  repeatDelay: 0.2,
                }}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// Sort animation list
interface SortAnimationListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function SortAnimationList<T>({ items, renderItem, keyExtractor, className }: SortAnimationListProps<T>) {
  return (
    <motion.div className={className} layout>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              layout: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
