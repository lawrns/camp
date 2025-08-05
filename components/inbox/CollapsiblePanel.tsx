"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, DotsSixVertical as GripVertical } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string; // For persistent state
  keyboardShortcut?: string; // e.g., "Cmd+1"
}

/**
 * Smart Collapsible Panel Component
 * Implements the collapsible panel system from the inbox improvement proposal
 */
export function CollapsiblePanel({
  title,
  icon,
  children,
  defaultExpanded = true,
  onToggle,
  className,
  headerClassName,
  contentClassName,
  resizable = false,
  minWidth = 200,
  maxWidth = 600,
  storageKey,
  keyboardShortcut,
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [width, setWidth] = useState<number | undefined>();
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  // Load persistent state from localStorage
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const { expanded, width: savedWidth } = JSON.parse(saved);
          setIsExpanded(expanded ?? defaultExpanded);
          if (resizable && savedWidth) {
            setWidth(Math.max(minWidth, Math.min(maxWidth, savedWidth)));
          }
        } catch (error) {}
      }
    }
  }, [storageKey, defaultExpanded, resizable, minWidth, maxWidth]);

  // Save state to localStorage
  const saveState = useCallback(
    (expanded: boolean, panelWidth?: number) => {
      if (storageKey && typeof window !== "undefined") {
        const state = { expanded, ...(panelWidth && { width: panelWidth }) };
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    },
    [storageKey]
  );

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
    saveState(newExpanded, width);
  }, [isExpanded, onToggle, saveState, width]);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!keyboardShortcut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Parse shortcut like "Cmd+1" or "Ctrl+1"
      const [modifier, key] = keyboardShortcut.toLowerCase().split("+");
      const isModifierPressed = modifier === "cmd" ? cmdKey : event.ctrlKey;

      if (isModifierPressed && event.key === key) {
        event.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardShortcut, handleToggle]);

  // Resize functionality
  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      if (!resizable || !panelRef.current) return;

      event.preventDefault();
      setIsResizing(true);

      const rect = panelRef.current.getBoundingClientRect();
      resizeStartRef.current = {
        x: event.clientX,
        width: rect.width,
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [resizable]
  );

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.x;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartRef.current.width + deltaX));

      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth]
  );

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    resizeStartRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    if (width) {
      saveState(isExpanded, width);
    }
  }, [isResizing, width, saveState, isExpanded]);

  // Resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
    return undefined;
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Double-click to auto-fit content
  const handleDoubleClick = useCallback(() => {
    if (!resizable || !panelRef.current) return;

    // Reset to default width or auto-fit logic
    const autoWidth = Math.min(maxWidth, Math.max(minWidth, 320));
    setWidth(autoWidth);
    saveState(isExpanded, autoWidth);
  }, [resizable, minWidth, maxWidth, saveState, isExpanded]);

  const panelStyle = width ? { width: `${width}px` } : undefined;

  return (
    <div
      ref={panelRef}
      className={cn("flex flex-col border-l border-[var(--fl-color-border)] bg-white", className)}
      style={panelStyle}
    >
      {/* Panel Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-[var(--fl-color-border)] bg-gradient-to-r from-gray-50 to-white spacing-4",
          "cursor-pointer transition-colors hover:from-gray-100 hover:to-gray-50",
          headerClassName
        )}
        onClick={handleToggle}
        onDoubleClick={resizable ? handleDoubleClick : undefined}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`panel-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-ds-2">
          {icon && <div className="text-foreground">{icon}</div>}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {keyboardShortcut && <span className="ml-2 text-tiny text-gray-400">{keyboardShortcut}</span>}
        </div>

        <div className="flex items-center gap-1">
          {resizable && (
            <div
              className="cursor-col-resize rounded spacing-1 hover:bg-gray-200"
              onMouseDown={handleResizeStart}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick();
              }}
              title="Drag to resize, double-click to auto-fit"
            >
              <Icon icon={GripVertical} className="h-3 w-3 text-gray-400" />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
          >
            {isExpanded ? (
              <Icon icon={ChevronUp} className="h-3 w-3" />
            ) : (
              <Icon icon={ChevronDown} className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Panel Content with Animation */}
      <OptimizedAnimatePresence initial={false}>
        {isExpanded && (
          <OptimizedMotion.div
            id={`panel-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2, ease: "easeInOut" },
            }}
            className="overflow-hidden"
          >
            <div className={cn("spacing-4", contentClassName)}>{children}</div>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Resize Handle */}
      {resizable && (
        <div
          className={cn(
            "absolute bottom-0 right-0 top-0 w-1 cursor-col-resize",
            "transition-colors hover:bg-brand-blue-500",
            isResizing && "bg-brand-blue-500"
          )}
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
      )}
    </div>
  );
}

/**
 * Hook for managing panel preferences
 */
export function usePanelPreferences(storagePrefix: string = "campfire-panels") {
  const [preferences, setPreferences] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storagePrefix);
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (error) {}
      }
    }
  }, [storagePrefix]);

  const savePreference = useCallback(
    (key: string, value: unknown) => {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      if (typeof window !== "undefined") {
        localStorage.setItem(storagePrefix, JSON.stringify(newPreferences));
      }
    },
    [preferences, storagePrefix]
  );

  const getPreference = useCallback(
    (key: string, defaultValue?: unknown) => {
      return preferences[key] ?? defaultValue;
    },
    [preferences]
  );

  return {
    preferences,
    savePreference,
    getPreference,
  };
}
