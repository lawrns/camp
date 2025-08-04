"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { keyboardShortcutManager } from "@/lib/keyboard/KeyboardShortcutManager";
import { cn } from "@/lib/utils";

interface KeyboardShortcutTooltipProps {
  children: React.ReactNode;
  shortcutId?: string;
  shortcutKey?: string;
  shortcutModifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

export function KeyboardShortcutTooltip({
  children,
  shortcutId,
  shortcutKey,
  shortcutModifiers,
  description,
  side = "bottom",
  align = "center",
  className,
}: KeyboardShortcutTooltipProps) {
  // Get shortcut from manager if ID provided
  const shortcut = shortcutId
    ? keyboardShortcutManager.getShortcuts().find((s) => s.id === shortcutId)
    : shortcutKey
      ? {
          key: shortcutKey,
          modifiers: shortcutModifiers,
          description: description || "",
        }
      : null;

  if (!shortcut) {
    return <>{children}</>;
  }

  const display = shortcutId
    ? keyboardShortcutManager.getShortcutDisplay(shortcut as unknown)
    : formatShortcut(shortcutKey!, shortcutModifiers);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("text-typography-xs flex items-center gap-2", className)}
        >
          {description || shortcut.description}
          <kbd className="inline-flex items-center gap-0.5 rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-100 dark:bg-gray-200 dark:text-gray-900">
            {display}
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatShortcut(
  key: string,
  modifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
  }
): string {
  const platform =
    typeof window !== "undefined" ? (window.navigator.platform.toLowerCase().includes("mac") ? "mac" : "pc") : "pc";

  const parts: string[] = [];

  if (modifiers?.cmd && platform === "mac") parts.push("⌘");
  else if (modifiers?.ctrl) parts.push("Ctrl");

  if (modifiers?.alt) parts.push(platform === "mac" ? "⌥" : "Alt");
  if (modifiers?.shift) parts.push(platform === "mac" ? "⇧" : "Shift");

  parts.push(key.toUpperCase());

  return parts.join(platform === "mac" ? "" : "+");
}
