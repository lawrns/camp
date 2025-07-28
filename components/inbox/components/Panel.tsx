"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PanelHeader, type PanelHeaderAction } from "./PanelHeader";

interface PanelProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "error" | "outline";
  };
  actions?: PanelHeaderAction[];
  children: React.ReactNode;

  // Layout
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;

  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  noPadding?: boolean;

  // State persistence
  storageKey?: string;
}

export function Panel({
  title,
  icon,
  subtitle,
  badge,
  actions,
  children,
  collapsible = false,
  collapsed = false,
  onToggle,
  resizable = false,
  width,
  minWidth = 280,
  maxWidth = 600,
  onResize,
  className,
  headerClassName,
  contentClassName,
  noPadding = false,
  storageKey,
}: PanelProps) {
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable || !onResize) return;

    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width || panelRef.current?.offsetWidth || minWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Save width to localStorage if storageKey is provided
      if (storageKey && width) {
        localStorage.setItem(`panel-width-${storageKey}`, width.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Load saved width from localStorage
  React.useEffect(() => {
    if (storageKey && onResize) {
      const savedWidth = localStorage.getItem(`panel-width-${storageKey}`);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          onResize(parsedWidth);
        }
      }
    }
  }, [storageKey, onResize, minWidth, maxWidth]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "panel",
        "inbox-panel-layout",
        "bg-white",
        "relative",
        "mobile-scroll-optimized",
        "touch-action-manipulation",
        "panel-overflow-guard",
        className
      )}
      style={width ? { width: `${width}px` } : undefined}
    >
      <PanelHeader
        title={title}
        icon={icon}
        {...(subtitle && { subtitle })}
        {...(badge && { badge })}
        {...(actions && { actions })}
        collapsible={collapsible}
        isExpanded={!collapsed}
        {...(onToggle && { onToggleExpand: onToggle })}
        className={cn("inbox-panel-header", headerClassName)}
      />

      {!collapsed && (
        <div
          className={cn(
            "panel-content",
            "inbox-panel-body",
            "panel-content-overflow",
            "scrollbar-thin",
            "scroll-smooth-native",
            "keyboard-aware",
            !noPadding && "spacing-4",
            contentClassName
          )}
        >
          {children}
        </div>
      )}

      {/* Resize Handle */}
      {resizable && (
        <div
          className={cn(
            "panel-resize-handle",
            "absolute bottom-0 right-0 top-0",
            "w-1 cursor-col-resize",
            "transition-colors hover:bg-brand-blue-500",
            isResizing && "bg-brand-blue-500"
          )}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
