"use client";

import React, { useEffect, useState } from "react";
import { Icon as StandardizedIcon, Icons } from '@/lib/icons/standardized-icons';
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcut } from "@/lib/keyboard/KeyboardShortcutManager";

import { cn } from "@/lib/utils";

interface KeyboardShortcutsModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function KeyboardShortcutsModal({ open: controlledOpen, onClose }: KeyboardShortcutsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { shortcuts, getShortcutDisplay, hideHelp } = useKeyboardShortcuts();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  useEffect(() => {
    const handleShowHelp = () => setInternalOpen(true);
    const handleHideHelp = () => setInternalOpen(false);
    const handleEscape = () => {
      if (isOpen) {
        handleClose();
      }
    };

    window.addEventListener("campfire:keyboard-help:show", handleShowHelp);
    window.addEventListener("campfire:keyboard-help:hide", handleHideHelp);
    window.addEventListener("campfire:escape", handleEscape);

    return () => {
      window.removeEventListener("campfire:keyboard-help:show", handleShowHelp);
      window.removeEventListener("campfire:keyboard-help:hide", handleHideHelp);
      window.removeEventListener("campfire:escape", handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
      hideHelp();
    }
  };

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category]?.push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const categoryTitles: Record<string, string> = {
    global: "Global Shortcuts",
    navigation: "Navigation",
    inbox: "Inbox",
    message: "Message Composition",
    editor: "Text Editor",
  };

  const categoryOrder = ["global", "navigation", "inbox", "message", "editor"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center spacing-3">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="bg-background relative max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-ds-lg shadow-xl dark:bg-neutral-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
      >
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b border-[var(--color-border)] px-6 py-4 dark:border-gray-700 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={handleClose}
              className="hover:bg-background rounded-ds-lg p-spacing-sm transition-colors dark:hover:bg-neutral-800"
              aria-label="Close"
            >
              <StandardizedIcon icon={Icons.close} className="h-5 w-5 text-[var(--color-text-muted)] dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {categoryOrder.map((category: unknown) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {categoryTitles[category]}
                  </h3>
                  <div className="space-y-spacing-sm">
                    {categoryShortcuts.map((shortcut: unknown) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between rounded-ds-lg px-3 py-2 transition-colors hover:bg-[var(--color-background-subtle)] dark:hover:bg-neutral-800"
                      >
                        <span className="text-foreground text-sm dark:text-neutral-300">{shortcut.description}</span>
                        <kbd
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-1",
                            "bg-neutral-100 dark:bg-neutral-800",
                            "border border-neutral-300 dark:border-gray-700",
                            "text-typography-xs font-mono text-neutral-600 dark:text-neutral-400"
                          )}
                        >
                          {getShortcutDisplay(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips section */}
          <div className="mt-8 border-t border-[var(--color-border)] pt-6 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-neutral-100">Tips</h3>
            <ul className="text-foreground space-y-spacing-sm text-sm dark:text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Press{" "}
                  <kbd className="bg-background rounded px-1 py-0.5 text-tiny dark:bg-neutral-800">?</kbd>{" "}
                  anytime to view these shortcuts
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Shortcuts starting with{" "}
                  <kbd className="bg-background rounded px-1 py-0.5 text-tiny dark:bg-neutral-800">G</kbd> are
                  two-key sequences (press G, then the second key)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Most shortcuts work globally, but some are context-specific</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You can customize shortcuts in Settings → Preferences → Keyboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
