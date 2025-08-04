"use client";

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: () => void | Promise<void>;
  description: string;
  category: "global" | "navigation" | "inbox" | "message" | "editor";
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  when?: () => boolean; // Conditional activation
  sequence?: string[]; // For chord shortcuts like "g then h"
}

interface ShortcutContext {
  activeElement: Element | null;
  isInputFocused: boolean;
  isModalOpen: boolean;
  currentPath: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private sequenceBuffer: string[] = [];
  private sequenceTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(shortcuts: KeyboardShortcut[]) => void> = new Set();
  private customShortcuts: Map<string, KeyboardShortcut> = new Map();
  private platform: "mac" | "windows" | "linux";

  constructor() {
    this.platform = this.detectPlatform();
    this.initializeDefaultShortcuts();
  }

  private detectPlatform(): "mac" | "windows" | "linux" {
    if (typeof window === "undefined") return "windows";
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("mac")) return "mac";
    if (platform.includes("linux")) return "linux";
    return "windows";
  }

  private initializeDefaultShortcuts() {
    // Global shortcuts
    this.register({
      id: "global-command-palette",
      key: "k",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.triggerCommandPalette(),
      description: "Open command palette",
      category: "global",
      preventDefault: true,
    });

    this.register({
      id: "global-help",
      key: "/",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.showKeyboardHelp(),
      description: "Show keyboard shortcuts",
      category: "global",
      preventDefault: true,
    });

    this.register({
      id: "global-help-alt",
      key: "?",
      modifiers: { shift: true },
      action: () => this.showKeyboardHelp(),
      description: "Show keyboard shortcuts",
      category: "global",
      preventDefault: true,
    });

    this.register({
      id: "global-escape",
      key: "Escape",
      action: () => this.handleEscape(),
      description: "Close modals/dialogs",
      category: "global",
    });

    this.register({
      id: "global-toggle-sidebar",
      key: "b",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.toggleSidebar(),
      description: "Toggle sidebar",
      category: "global",
      preventDefault: true,
    });

    this.register({
      id: "global-toggle-theme",
      key: "d",
      modifiers: { cmd: true, ctrl: true, shift: true },
      action: () => this.toggleDarkMode(),
      description: "Toggle dark mode",
      category: "global",
      preventDefault: true,
    });

    // Navigation shortcuts (using sequences)
    this.register({
      id: "nav-home",
      key: "h",
      sequence: ["g"],
      action: () => this.navigate("/"),
      description: "Go to home",
      category: "navigation",
    });

    this.register({
      id: "nav-inbox",
      key: "i",
      sequence: ["g"],
      action: () => this.navigate("/dashboard/inbox"),
      description: "Go to inbox",
      category: "navigation",
    });

    this.register({
      id: "nav-analytics",
      key: "a",
      sequence: ["g"],
      action: () => this.navigate("/dashboard/analytics"),
      description: "Go to analytics",
      category: "navigation",
    });

    this.register({
      id: "nav-team",
      key: "t",
      sequence: ["g"],
      action: () => this.navigate("/dashboard/team"),
      description: "Go to team",
      category: "navigation",
    });

    // Panel navigation
    this.register({
      id: "nav-panel-next",
      key: "ArrowRight",
      modifiers: { alt: true },
      action: () => this.navigatePanel("next"),
      description: "Navigate to next panel",
      category: "navigation",
      preventDefault: true,
    });

    this.register({
      id: "nav-panel-prev",
      key: "ArrowLeft",
      modifiers: { alt: true },
      action: () => this.navigatePanel("prev"),
      description: "Navigate to previous panel",
      category: "navigation",
      preventDefault: true,
    });

    // Inbox shortcuts
    this.register({
      id: "inbox-next",
      key: "j",
      action: () => this.navigateConversation("next"),
      description: "Next conversation",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    this.register({
      id: "inbox-prev",
      key: "k",
      action: () => this.navigateConversation("prev"),
      description: "Previous conversation",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    this.register({
      id: "inbox-open",
      key: "Enter",
      action: () => this.openSelectedConversation(),
      description: "Open selected conversation",
      category: "inbox",
      when: () => this.isInInbox() && !this.isInputFocused(),
    });

    this.register({
      id: "inbox-reply",
      key: "r",
      action: () => this.replyToMessage(),
      description: "Reply to message",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    this.register({
      id: "inbox-archive",
      key: "e",
      action: () => this.archiveConversation(),
      description: "Archive conversation",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    this.register({
      id: "inbox-toggle-read",
      key: "m",
      action: () => this.toggleReadStatus(),
      description: "Mark as read/unread",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    this.register({
      id: "inbox-mark-all-read",
      key: "m",
      modifiers: { shift: true },
      action: () => this.markAllAsRead(),
      description: "Mark all as read",
      category: "inbox",
      when: () => this.isInInbox(),
    });

    // Message shortcuts
    this.register({
      id: "message-send",
      key: "Enter",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.sendMessage(),
      description: "Send message",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-format",
      key: "f",
      modifiers: { cmd: true, ctrl: true, shift: true },
      action: () => this.formatText(),
      description: "Format text",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-bold",
      key: "b",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.applyTextFormat("bold"),
      description: "Bold",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-italic",
      key: "i",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.applyTextFormat("italic"),
      description: "Italic",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-underline",
      key: "u",
      modifiers: { cmd: true, ctrl: true },
      action: () => this.applyTextFormat("underline"),
      description: "Underline",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-indent",
      key: "Tab",
      action: () => this.indent(),
      description: "Indent",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-outdent",
      key: "Tab",
      modifiers: { shift: true },
      action: () => this.outdent(),
      description: "Outdent",
      category: "message",
      preventDefault: true,
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-mention",
      key: "@",
      action: () => this.showMentionPicker(),
      description: "Mention someone",
      category: "message",
      when: () => this.isInMessageInput(),
    });

    this.register({
      id: "message-emoji",
      key: ":",
      action: () => this.checkEmojiTrigger(),
      description: "Emoji picker",
      category: "message",
      when: () => this.isInMessageInput(),
    });
  }

  register(shortcut: KeyboardShortcut) {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
    this.notifyListeners();
  }

  unregister(id: string) {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        this.notifyListeners();
        break;
      }
    }
  }

  customize(id: string, newShortcut: Partial<KeyboardShortcut>) {
    const existing = this.findShortcutById(id);
    if (!existing) return;

    const customized = { ...existing, ...newShortcut };
    const oldKey = this.getShortcutKey(existing);
    const newKey = this.getShortcutKey(customized);

    if (oldKey !== newKey) {
      this.shortcuts.delete(oldKey);
    }

    this.shortcuts.set(newKey, customized);
    this.customShortcuts.set(id, customized);
    this.notifyListeners();
    this.saveCustomShortcuts();
  }

  handleKeyDown(event: KeyboardEvent, context: ShortcutContext) {
    // Handle sequence shortcuts
    if (this.sequenceBuffer.length > 0) {
      const handled = this.handleSequence(event, context);
      if (handled) return;
    }

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (!shortcut) {
      // Check if this could be the start of a sequence
      const hasSequence = Array.from(this.shortcuts.values()).some(
        (s) => s.sequence && s.sequence[0] === event.key.toLowerCase()
      );

      if (hasSequence && !context.isInputFocused) {
        this.startSequence(event.key.toLowerCase());
        event.preventDefault();
      }
      return;
    }

    // Check if shortcut is enabled and conditions are met
    if (shortcut.enabled === false) return;
    if (shortcut.when && !shortcut.when()) return;

    // Don't trigger shortcuts in inputs unless explicitly allowed
    if (context.isInputFocused && !this.isInputAllowed(shortcut)) return;

    // Execute the action
    if (shortcut.preventDefault) event.preventDefault();
    if (shortcut.stopPropagation) event.stopPropagation();

    try {
      shortcut.action();
    } catch (error) {}
  }

  private handleSequence(event: KeyboardEvent, context: ShortcutContext): boolean {
    const sequence = [...this.sequenceBuffer, event.key.toLowerCase()];
    const sequenceKey = sequence.join("+");

    // Look for matching shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.sequence) continue;

      const expectedSequence = shortcut.sequence.concat(shortcut.key.toLowerCase());
      if (this.arraysEqual(sequence, expectedSequence)) {
        // Found a match
        this.clearSequence();

        if (shortcut.enabled === false) return false;
        if (shortcut.when && !shortcut.when()) return false;

        event.preventDefault();
        event.stopPropagation();

        try {
          shortcut.action();
        } catch (error) {}

        return true;
      }
    }

    // Check if this could be part of a longer sequence
    const couldMatch = Array.from(this.shortcuts.values()).some((s) => {
      if (!s.sequence) return false;
      const expected = s.sequence.concat(s.key.toLowerCase());
      return expected.slice(0, sequence.length).every((k, i) => k === sequence[i]);
    });

    if (couldMatch) {
      this.sequenceBuffer = sequence;
      this.resetSequenceTimeout();
      event.preventDefault();
      return true;
    }

    // No match, clear and try as regular shortcut
    this.clearSequence();
    return false;
  }

  private startSequence(key: string) {
    this.sequenceBuffer = [key];
    this.resetSequenceTimeout();
  }

  private clearSequence() {
    this.sequenceBuffer = [];
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }

  private resetSequenceTimeout() {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }
    this.sequenceTimeout = setTimeout(() => this.clearSequence(), 1500);
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.sequence) {
      parts.push(...shortcut.sequence);
    }

    if (shortcut.modifiers?.ctrl) parts.push("ctrl");
    if (shortcut.modifiers?.cmd) parts.push("cmd");
    if (shortcut.modifiers?.alt) parts.push("alt");
    if (shortcut.modifiers?.shift) parts.push("shift");
    if (shortcut.modifiers?.meta) parts.push("meta");

    parts.push(shortcut.key.toLowerCase());

    return parts.join("+");
  }

  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push("ctrl");
    if (event.metaKey) parts.push("cmd");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");

    parts.push(event.key.toLowerCase());

    return parts.join("+");
  }

  private findShortcutById(id: string): KeyboardShortcut | undefined {
    return Array.from(this.shortcuts.values()).find((s) => s.id === id);
  }

  private isInputAllowed(shortcut: KeyboardShortcut): boolean {
    // Allow certain shortcuts in inputs
    const allowedCategories = ["message", "editor"];
    return allowedCategories.includes(shortcut.category);
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private notifyListeners() {
    const shortcuts = Array.from(this.shortcuts.values());
    this.listeners.forEach((listener: unknown) => listener(shortcuts));
  }

  private saveCustomShortcuts() {
    if (typeof window === "undefined") return;

    const customData = Array.from(this.customShortcuts.entries()).map(([id, shortcut]) => ({
      id,
      key: shortcut.key,
      modifiers: shortcut.modifiers,
      sequence: shortcut.sequence,
    }));

    localStorage.setItem("campfire-custom-shortcuts", JSON.stringify(customData));
  }

  loadCustomShortcuts() {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("campfire-custom-shortcuts");
    if (!saved) return;

    try {
      const customData = JSON.parse(saved);
      customData.forEach((data: unknown) => {
        const existing = this.findShortcutById(data.id);
        if (existing) {
          this.customize(data.id, {
            key: data.key,
            modifiers: data.modifiers,
            sequence: data.sequence,
          });
        }
      });
    } catch (error) {}
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: KeyboardShortcut["category"]): KeyboardShortcut[] {
    return this.getShortcuts().filter((s: unknown) => s.category === category);
  }

  getShortcutDisplay(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.sequence) {
      parts.push(shortcut.sequence.map((k: unknown) => k.toUpperCase()).join(" then "));
      parts.push("then");
    }

    const modifiers: string[] = [];
    if (shortcut.modifiers?.cmd && this.platform === "mac") modifiers.push("⌘");
    else if (shortcut.modifiers?.ctrl) modifiers.push("Ctrl");

    if (shortcut.modifiers?.alt) modifiers.push(this.platform === "mac" ? "⌥" : "Alt");
    if (shortcut.modifiers?.shift) modifiers.push(this.platform === "mac" ? "⇧" : "Shift");

    parts.push(...modifiers);
    parts.push(this.getKeyDisplay(shortcut.key));

    return parts.join(shortcut.sequence ? " " : "+");
  }

  private getKeyDisplay(key: string): string {
    const keyMap: Record<string, string> = {
      arrowup: "↑",
      arrowdown: "↓",
      arrowleft: "←",
      arrowright: "→",
      enter: this.platform === "mac" ? "⏎" : "Enter",
      escape: "Esc",
      backspace: "⌫",
      delete: "⌦",
      tab: "⇥",
      " ": "Space",
    };

    return keyMap[key.toLowerCase()] || key.toUpperCase();
  }

  checkForConflicts(shortcut: KeyboardShortcut): KeyboardShortcut[] {
    const key = this.getShortcutKey(shortcut);
    const conflicts: KeyboardShortcut[] = [];

    for (const [existingKey, existingShortcut] of this.shortcuts.entries()) {
      if (existingShortcut.id === shortcut.id) continue;

      // Direct conflict
      if (existingKey === key) {
        conflicts.push(existingShortcut);
        continue;
      }

      // Sequence conflict
      if (shortcut.sequence && existingShortcut.sequence) {
        const newSeq = [...shortcut.sequence, shortcut.key];
        const existingSeq = [...existingShortcut.sequence, existingShortcut.key];

        // Check if one is a prefix of the other
        const minLen = Math.min(newSeq.length, existingSeq.length);
        if (newSeq.slice(0, minLen).every((k, i) => k === existingSeq[i])) {
          conflicts.push(existingShortcut);
        }
      }
    }

    return conflicts;
  }

  subscribe(listener: (shortcuts: KeyboardShortcut[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Action implementations (these would dispatch to actual app logic)
  private triggerCommandPalette() {
    window.dispatchEvent(new CustomEvent("campfire:command-palette:open"));
  }

  private showKeyboardHelp() {
    window.dispatchEvent(new CustomEvent("campfire:keyboard-help:show"));
  }

  private handleEscape() {
    window.dispatchEvent(new CustomEvent("campfire:escape"));
  }

  private toggleSidebar() {
    window.dispatchEvent(new CustomEvent("campfire:sidebar:toggle"));
  }

  private toggleDarkMode() {
    window.dispatchEvent(new CustomEvent("campfire:theme:toggle"));
  }

  private navigate(path: string) {
    window.dispatchEvent(new CustomEvent("campfire:navigate", { detail: { path } }));
  }

  private navigatePanel(direction: "next" | "prev") {
    window.dispatchEvent(new CustomEvent("campfire:panel:navigate", { detail: { direction } }));
  }

  private navigateConversation(direction: "next" | "prev") {
    window.dispatchEvent(new CustomEvent("campfire:inbox:navigate", { detail: { direction } }));
  }

  private openSelectedConversation() {
    window.dispatchEvent(new CustomEvent("campfire:inbox:open-selected"));
  }

  private replyToMessage() {
    window.dispatchEvent(new CustomEvent("campfire:inbox:reply"));
  }

  private archiveConversation() {
    window.dispatchEvent(new CustomEvent("campfire:inbox:archive"));
  }

  private toggleReadStatus() {
    window.dispatchEvent(new CustomEvent("campfire:inbox:toggle-read"));
  }

  private markAllAsRead() {
    window.dispatchEvent(new CustomEvent("campfire:inbox:mark-all-read"));
  }

  private sendMessage() {
    window.dispatchEvent(new CustomEvent("campfire:message:send"));
  }

  private formatText() {
    window.dispatchEvent(new CustomEvent("campfire:message:format"));
  }

  private applyTextFormat(format: "bold" | "italic" | "underline") {
    window.dispatchEvent(new CustomEvent("campfire:message:format", { detail: { format } }));
  }

  private indent() {
    window.dispatchEvent(new CustomEvent("campfire:message:indent"));
  }

  private outdent() {
    window.dispatchEvent(new CustomEvent("campfire:message:outdent"));
  }

  private showMentionPicker() {
    window.dispatchEvent(new CustomEvent("campfire:message:mention"));
  }

  private checkEmojiTrigger() {
    window.dispatchEvent(new CustomEvent("campfire:message:emoji-check"));
  }

  // Context helpers
  private isInInbox(): boolean {
    return window.location.pathname.includes("/dashboard/inbox");
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    return tagName === "input" || tagName === "textarea" || activeElement.getAttribute("contenteditable") === "true";
  }

  private isInMessageInput(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    return (
      activeElement.classList.contains("message-input") || activeElement.closest(".message-input-container") !== null
    );
  }
}

// Singleton instance
export const keyboardShortcutManager = new KeyboardShortcutManager();
