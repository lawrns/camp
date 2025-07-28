/**
 * Gesture Animations
 * Interactive animations for swipe, pull to refresh, pinch to zoom, long press, and drag & drop
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, PanInfo, useAnimation, useDragControls, useMotionValue, useTransform } from "framer-motion";
import { ArrowsOut as Maximize2, ArrowsOutCardinal as Move, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, className, threshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const pullOpacity = useTransform(y, [0, threshold / 2], [0, 1]);
  const iconRotation = useTransform(y, [0, threshold], [0, 180]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center py-4"
        style={{ opacity: pullOpacity, y: -60 }}
      >
        <motion.div
          className="flex items-center gap-ds-2"
          animate={isRefreshing ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.6, repeat: isRefreshing ? Infinity : 0 }}
        >
          <motion.div style={{ rotate: iconRotation }}>
            <Icon icon={RefreshCw} className="h-5 w-5 text-blue-600" />
          </motion.div>
          <span className="text-foreground text-sm font-medium">
            {isRefreshing ? "Refreshing..." : "Pull to refresh"}
          </span>
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        style={{ y }}
        animate={isRefreshing ? { y: threshold } : { y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pinch to zoom image
interface PinchZoomImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PinchZoomImage({ src, alt, className }: PinchZoomImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta), 3);
      setScale(newScale);
    },
    [scale]
  );

  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)} onWheel={handleWheel}>
      <motion.img
        src={src}
        alt={alt}
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        onDoubleClick={handleDoubleClick}
        animate={{ scale, x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-auto max-w-full cursor-move"
        style={{ touchAction: "none" }}
      />

      {/* Zoom indicator */}
      <motion.div
        className="absolute right-4 top-4 rounded bg-black/50 px-2 py-1 text-sm text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: scale !== 1 ? 1 : 0 }}
      >
        {Math.round(scale * 100)}%
      </motion.div>
    </div>
  );
}

// Long press action
interface LongPressActionProps {
  onLongPress: () => void;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}

export function LongPressAction({ onLongPress, duration = 500, children, className }: LongPressActionProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const progressRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handlePressStart = useCallback(() => {
    setIsPressed(true);
    setProgress(0);

    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        clearInterval(progressRef.current);
      }
    }, 10);

    timeoutRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, duration);
  }, [duration, onLongPress]);

  const handlePressEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    setIsPressed(false);
    setProgress(0);
  }, []);

  return (
    <motion.div
      className={cn("relative", className)}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      {children}

      {/* Progress indicator */}
      {isPressed && (
        <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <svg className="absolute inset-0 h-full w-full">
            <motion.rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="3"
              strokeDasharray="100%"
              strokeDashoffset={`${(1 - progress) * 100}%`}
              className="opacity-50"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}

// Drag and drop with physics
interface DragDropItem {
  id: string;
  content: React.ReactNode;
}

interface DragDropZoneProps {
  items: DragDropItem[];
  onReorder: (items: DragDropItem[]) => void;
  className?: string;
}

export function DragDropZone({ items, onReorder, className }: DragDropZoneProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const dragControls = useDragControls();

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newItems = [...items];
    const draggedIndex = newItems.findIndex((item) => item.id === draggedItem);
    const targetIndex = newItems.findIndex((item) => item.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newItems.splice(draggedIndex, 1);
      if (removed) {
        newItems.splice(targetIndex, 0, removed);
      }
      onReorder(newItems);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          drag
          dragControls={dragControls}
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, item.id)}
          whileDrag={{
            scale: 1.05,
            rotate: 2,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 1,
          }}
          animate={draggedItem === item.id ? { opacity: 0.5 } : { opacity: 1 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 300,
              damping: 30,
            },
          }}
          className="relative"
        >
          <div className="bg-background cursor-move rounded-ds-lg border border-[var(--fl-color-border)] spacing-3">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Move} className="h-4 w-4 text-gray-400" />
              {item.content}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Swipe actions menu
interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export function SwipeActions({ children, leftActions = [], rightActions = [], className }: SwipeActionsProps) {
  const x = useMotionValue(0);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold && leftActions.length > 0) {
      const actionIndex = Math.min(Math.floor(Math.abs(info.offset.x) / threshold) - 1, leftActions.length - 1);
      leftActions[actionIndex]?.action();
    } else if (info.offset.x < -threshold && rightActions.length > 0) {
      const actionIndex = Math.min(Math.floor(Math.abs(info.offset.x) / threshold) - 1, rightActions.length - 1);
      rightActions[actionIndex]?.action();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute bottom-0 left-0 top-0 flex">
          {leftActions.map((action, index) => (
            <motion.div
              key={index}
              className={cn("flex items-center justify-center px-6", action.color)}
              style={{
                opacity: useTransform(x, [index * 100, (index + 1) * 100], [0, 1]),
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-tiny text-white">{action.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute bottom-0 right-0 top-0 flex">
          {rightActions.map((action, index) => (
            <motion.div
              key={index}
              className={cn("flex items-center justify-center px-6", action.color)}
              style={{
                opacity: useTransform(x, [-(index + 1) * 100, -index * 100], [1, 0]),
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-tiny text-white">{action.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: -rightActions.length * 100,
          right: leftActions.length * 100,
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="bg-background relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
