// ShortcutsModal component for keyboard shortcuts

import * as React from "react";
import { Command, Keyboard, X } from "@phosphor-icons/react";
import { keyboardShortcuts } from "../constants/messageTemplates";

interface ShortcutsModalProps {
  onClose: () => void;
}

/**
 * Modal component displaying keyboard shortcuts
 */
export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  // Group shortcuts by category
  const shortcutCategories = {
    Navigation: [
      { key: "Cmd/Ctrl + K", description: "Focus search" },
      { key: "Alt + ↑/↓", description: "Navigate conversations" },
      { key: "Esc", description: "Close modals" },
    ],
    Messaging: [
      { key: "Cmd/Ctrl + Enter", description: "Send message" },
      { key: "Cmd/Ctrl + E", description: "Toggle emoji picker" },
      { key: "Cmd/Ctrl + T", description: "Toggle templates" },
      { key: "Cmd/Ctrl + U", description: "Upload file" },
    ],
    "AI Features": [
      { key: "Cmd/Ctrl + Shift + K", description: "AI Suggestions" },
      { key: "Cmd/Ctrl + H", description: "Toggle AI handover" },
      { key: "Cmd/Ctrl + Shift + A", description: "AI handover (alternative)" },
    ],
    General: [{ key: "?", description: "Show shortcuts" }],
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-background mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-ds-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] spacing-4">
          <div className="flex items-center space-x-3">
            <Keyboard className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:text-foreground text-gray-400 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto spacing-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="mb-4 flex items-center text-base font-medium text-gray-900">
                  <Command className="mr-2 h-5 w-5 text-[var(--fl-color-text-muted)]" />
                  {category}
                </h3>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-foreground text-sm">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.key.split(" + ").map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && <span className="mx-1 text-tiny text-gray-400">+</span>}
                            <kbd className="border-ds-border-strong bg-background rounded border px-2 py-1 text-tiny font-semibold text-gray-800">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 rounded-ds-lg border border-[var(--fl-color-info-muted)] bg-[var(--fl-color-info-subtle)] spacing-3">
            <h4 className="mb-2 text-sm font-medium text-blue-900">💡 Pro Tips</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                • Use <kbd className="rounded bg-blue-100 px-1 py-0.5 text-tiny">Tab</kbd> to navigate between elements
              </li>
              <li>
                • Hold <kbd className="rounded bg-blue-100 px-1 py-0.5 text-tiny">Shift</kbd> while pressing{" "}
                <kbd className="rounded bg-blue-100 px-1 py-0.5 text-tiny">Enter</kbd> to add line breaks
              </li>
              <li>• Most shortcuts work globally within the inbox interface</li>
              <li>
                • Press <kbd className="rounded bg-blue-100 px-1 py-0.5 text-tiny">?</kbd> anytime to see this help
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">
              Press{" "}
              <kbd className="border-ds-border-strong bg-background rounded border px-2 py-1 text-tiny font-semibold text-gray-800">
                Esc
              </kbd>{" "}
              to close
            </p>
            <button
              onClick={onClose}
              className="bg-primary rounded-ds-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
