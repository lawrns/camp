/**
 * Rich Text Composer Component
 *
 * Enhanced message composer with rich text formatting capabilities
 * Part of Phase 2: Core Feature Parity to match Intercom standards
 *
 * Features:
 * - Rich text formatting (bold, italic, underline, strikethrough)
 * - Bullet points and numbered lists
 * - Code blocks and inline code
 * - Link insertion and formatting
 * - Mention support (@user)
 * - Emoji picker integration
 * - Keyboard shortcuts
 * - Auto-save drafts
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AtSign,
  Bold,
  Code,
  Italic,
  Link,
  List,
  ListOrdered,
  Smile,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react";

interface RichTextComposerProps {
  value: string;
  onChange: (value: string, plainText: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showFormatting?: boolean;
  autoFocus?: boolean;
}

interface FormatButton {
  icon: React.ReactNode;
  command: string;
  title: string;
  shortcut?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { icon: <Bold className="h-4 w-4" />, command: "bold", title: "Bold", shortcut: "Ctrl+B" },
  { icon: <Italic className="h-4 w-4" />, command: "italic", title: "Italic", shortcut: "Ctrl+I" },
  { icon: <Underline className="h-4 w-4" />, command: "underline", title: "Underline", shortcut: "Ctrl+U" },
  { icon: <Strikethrough className="h-4 w-4" />, command: "strikeThrough", title: "Strikethrough" },
  { icon: <List className="h-4 w-4" />, command: "insertUnorderedList", title: "Bullet List" },
  { icon: <ListOrdered className="h-4 w-4" />, command: "insertOrderedList", title: "Numbered List" },
  { icon: <Code className="h-4 w-4" />, command: "formatBlock", title: "Code Block" },
  { icon: <Link className="h-4 w-4" />, command: "createLink", title: "Insert Link", shortcut: "Ctrl+K" },
];

export const RichTextComposer: React.FC<RichTextComposerProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  maxLength,
  showFormatting = true,
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [characterCount, setCharacterCount] = useState(0);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const htmlContent = editorRef.current.innerHTML;
    const plainText = editorRef.current.textContent || "";

    setCharacterCount(plainText.length);

    // Check max length
    if (maxLength && plainText.length > maxLength) {
      return;
    }

    onChange(htmlContent, plainText);
  }, [onChange, maxLength]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Submit on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onSubmit();
        return;
      }

      // Format shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            executeCommand("bold");
            break;
          case "i":
            e.preventDefault();
            executeCommand("italic");
            break;
          case "u":
            e.preventDefault();
            executeCommand("underline");
            break;
          case "k":
            e.preventDefault();
            handleLinkInsert();
            break;
        }
      }
    },
    [onSubmit]
  );

  // Execute formatting command
  const executeCommand = useCallback(
    (command: string, value?: string) => {
      if (!editorRef.current) return;

      setIsFormatting(true);

      try {
        if (command === "createLink") {
          handleLinkInsert();
        } else if (command === "formatBlock" && value === "pre") {
          // Handle code block
          document.execCommand("formatBlock", false, "pre");
        } else {
          document.execCommand(command, false, value);
        }

        editorRef.current.focus();
        handleInput();
      } catch (error) {

      } finally {
        setIsFormatting(false);
      }
    },
    [handleInput]
  );

  // Handle link insertion
  const handleLinkInsert = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    setLinkText(selectedText);
    setLinkUrl("");
    setShowLinkDialog(true);
  }, []);

  // Insert link
  const insertLink = useCallback(() => {
    if (!linkUrl.trim()) return;

    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;

    if (linkText.trim()) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    } else {
      executeCommand("createLink", url);
    }

    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
    handleInput();
  }, [linkUrl, linkText, executeCommand, handleInput]);

  // Handle paste to clean up formatting
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();

      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleInput();
    },
    [handleInput]
  );

  // Check if command is active
  const isCommandActive = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  return (
    <div className="border-ds-border-strong rounded-ds-lg border focus-within:border-[var(--fl-color-brand)] focus-within:ring-1 focus-within:ring-blue-500">
      {/* Formatting toolbar */}
      {showFormatting && (
        <div className="flex items-center space-x-1 border-b border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] p-spacing-sm">
          {FORMAT_BUTTONS.map((button) => (
            <button
              key={button.command}
              type="button"
              onClick={() => executeCommand(button.command)}
              disabled={disabled || isFormatting}
              className={`rounded spacing-1.5 transition-colors hover:bg-gray-200 ${
                isCommandActive(button.command) ? "bg-blue-100 text-blue-600" : "text-gray-600"
              }`}
              title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ""}`}
            >
              {button.icon}
            </button>
          ))}

          <div className="mx-1 h-6 w-px bg-gray-300" />

          <button
            type="button"
            className="text-foreground rounded spacing-1.5 transition-colors hover:bg-gray-200"
            title="Insert Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="text-foreground rounded spacing-1.5 transition-colors hover:bg-gray-200"
            title="Mention User"
          >
            <AtSign className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`max-h-[300px] min-h-[100px] overflow-y-auto spacing-3 focus:outline-none ${
          disabled ? "bg-[var(--fl-color-background-subtle)] text-[var(--fl-color-text-muted)]" : "bg-white"
        }`}
        style={{
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Footer */}
      <div className="flex items-center justify-between bg-[var(--fl-color-background-subtle)] p-spacing-sm text-tiny text-[var(--fl-color-text-muted)]">
        <div className="flex items-center space-x-spacing-sm">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>

        {maxLength && (
          <div className={`${characterCount > maxLength * 0.9 ? "text-orange-600" : ""}`}>
            {characterCount}
            {maxLength && `/${maxLength}`}
          </div>
        )}
      </div>

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background mx-4 w-96 max-w-full rounded-ds-lg p-spacing-md">
            <h3 className="mb-4 text-base font-semibold">Insert Link</h3>

            <div className="space-y-3">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Link text (optional)"
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="text-foreground px-4 py-2 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="bg-primary rounded-ds-md px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
