"use client";

import { useEffect } from "react";

interface HotkeyConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

const defaultHotkeys: HotkeyConfig[] = [
  {
    key: "r",
    ctrlKey: true,
    action: () => {
      // Refresh conversations
      const refreshButton = document.querySelector('[data-hotkey="refresh"]') as HTMLButtonElement;
      if (refreshButton) {
        refreshButton.click();
      }
    },
    description: "Refresh conversations",
  },
  {
    key: "n",
    ctrlKey: true,
    action: () => {
      // New conversation
      const newButton = document.querySelector('[data-hotkey="new"]') as HTMLButtonElement;
      if (newButton) {
        newButton.click();
      }
    },
    description: "New conversation",
  },
  {
    key: "Enter",
    ctrlKey: true,
    action: () => {
      // Send message
      const sendButton = document.querySelector('[data-hotkey="send"]') as HTMLButtonElement;
      if (sendButton) {
        sendButton.click();
      }
    },
    description: "Send message",
  },
  {
    key: "Escape",
    action: () => {
      // Close modals or deselect
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    },
    description: "Escape/Close",
  },
];

export function useHotkeys(customHotkeys: HotkeyConfig[] = []) {
  useEffect(() => {
    const hotkeys = [...defaultHotkeys, ...customHotkeys];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
        return;
      }

      for (const hotkey of hotkeys) {
        const keyMatches = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatches = !!hotkey.ctrlKey === event.ctrlKey;
        const metaMatches = !!hotkey.metaKey === event.metaKey;
        const shiftMatches = !!hotkey.shiftKey === event.shiftKey;
        const altMatches = !!hotkey.altKey === event.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          event.preventDefault();
          event.stopPropagation();
          hotkey.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [customHotkeys]);

  return {
    hotkeys: [...defaultHotkeys, ...customHotkeys],
  };
}
