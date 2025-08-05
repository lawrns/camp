// ShortcutsModal component for keyboard shortcuts

import * as React from "react";
import { Command, Keyboard, X } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center ds-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-labelledby="shortcuts-modal-title"
      aria-describedby="shortcuts-modal-description"
      tabIndex={-1}
    >
      <div className="ds-modal mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="ds-modal-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Keyboard className="h-6 w-6" />
              <h2 id="shortcuts-modal-title" className="text-lg font-semibold">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="hover:text-foreground text-gray-400 transition-colors"
              aria-label="Close shortcuts modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div id="shortcuts-modal-description" className="ds-modal-body max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="mb-4 flex items-center text-base font-medium">
                  <Command className="mr-2 h-5 w-5" />
                  {category}
                </h3>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.key.split(" + ").map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && <span className="mx-1 text-tiny text-gray-400">+</span>}
                            <kbd className="border-ds-border-strong bg-background rounded border px-2 py-1 text-tiny font-semibold">
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
          <div className="mt-8 ds-warning-message">
            <h4 className="mb-2 text-sm font-medium">💡 Pro Tips</h4>
            <ul className="space-y-1 text-sm">
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
        <div className="ds-modal-footer">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Press{" "}
              <kbd className="border-ds-border-strong bg-background rounded border px-2 py-1 text-tiny font-semibold">
                Esc
              </kbd>{" "}
              to close
            </p>
            <button
              onClick={onClose}
              className="ds-button-primary"
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
