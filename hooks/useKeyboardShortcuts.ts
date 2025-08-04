"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyboardShortcut,
  KeyboardShortcutManager,
  keyboardShortcutManager,
} from "@/lib/keyboard/KeyboardShortcutManager";

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  customShortcuts?: KeyboardShortcut[];
  category?: KeyboardShortcut["category"];
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, customShortcuts = [], category } = options;
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    // Load custom shortcuts on mount
    keyboardShortcutManager.loadCustomShortcuts();

    // Subscribe to shortcut changes
    const unsubscribe = keyboardShortcutManager.subscribe((updatedShortcuts) => {
      if (category) {
        setShortcuts(updatedShortcuts.filter((s: unknown) => s.category === category));
      } else {
        setShortcuts(updatedShortcuts);
      }
    });

    // Initial load
    if (category) {
      setShortcuts(keyboardShortcutManager.getShortcutsByCategory(category));
    } else {
      setShortcuts(keyboardShortcutManager.getShortcuts());
    }

    return () => {
      unsubscribe();
    };
  }, [category]);

  useEffect(() => {
    // Register custom shortcuts
    customShortcuts.forEach((shortcut: unknown) => {
      keyboardShortcutManager.register(shortcut);
    });

    // Cleanup
    return () => {
      customShortcuts.forEach((shortcut: unknown) => {
        keyboardShortcutManager.unregister(shortcut.id);
      });
    };
  }, [customShortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const context = {
        activeElement: document.activeElement,
        isInputFocused: isInputElement(document.activeElement),
        isModalOpen: isModalOpen(),
        currentPath: window.location.pathname,
      };

      keyboardShortcutManager.handleKeyDown(event, context);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);

  // Listen for help modal events
  useEffect(() => {
    const handleShowHelp = () => setIsHelpOpen(true);
    const handleHideHelp = () => setIsHelpOpen(false);

    window.addEventListener("campfire:keyboard-help:show", handleShowHelp);
    window.addEventListener("campfire:keyboard-help:hide", handleHideHelp);

    return () => {
      window.removeEventListener("campfire:keyboard-help:show", handleShowHelp);
      window.removeEventListener("campfire:keyboard-help:hide", handleHideHelp);
    };
  }, []);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardShortcutManager.register(shortcut);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    keyboardShortcutManager.unregister(id);
  }, []);

  const customizeShortcut = useCallback((id: string, newShortcut: Partial<KeyboardShortcut>) => {
    keyboardShortcutManager.customize(id, newShortcut);
  }, []);

  const getShortcutDisplay = useCallback((shortcut: KeyboardShortcut) => {
    return keyboardShortcutManager.getShortcutDisplay(shortcut);
  }, []);

  const checkConflicts = useCallback((shortcut: KeyboardShortcut) => {
    return keyboardShortcutManager.checkForConflicts(shortcut);
  }, []);

  const showHelp = useCallback(() => {
    setIsHelpOpen(true);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  return {
    shortcuts,
    isHelpOpen,
    registerShortcut,
    unregisterShortcut,
    customizeShortcut,
    getShortcutDisplay,
    checkConflicts,
    showHelp,
    hideHelp,
  };
}

// Helper functions
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || element.getAttribute("contenteditable") === "true";
}

function isModalOpen(): boolean {
  // Check for common modal indicators
  return !!(
    document.querySelector('[role="dialog"]') ||
    document.querySelector('[data-state="open"]') ||
    document.querySelector(".modal-open") ||
    document.body.classList.contains("modal-open")
  );
}
