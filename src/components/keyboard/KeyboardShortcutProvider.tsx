"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

interface KeyboardShortcutProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isHelpOpen, hideHelp } = useKeyboardShortcuts();

  useEffect(() => {
    // Handle navigation events
    const handleNavigate = (event: CustomEvent<{ path: string }>) => {
      router.push(event.detail.path);
    };

    // Handle theme toggle
    const handleThemeToggle = () => {
      setTheme(theme === "dark" ? "light" : "dark");
    };

    // Handle sidebar toggle
    const handleSidebarToggle = () => {
      // This would typically dispatch to your sidebar state management
      // For now, we'll dispatch a custom event that the sidebar can listen to
      window.dispatchEvent(new CustomEvent("sidebar:toggle"));
    };

    // Handle command palette open
    const handleCommandPaletteOpen = () => {
      // This is handled by the CommandPalette component itself
      // which listens for the keyboard shortcut
    };

    // Add event listeners
    window.addEventListener("campfire:navigate", handleNavigate as any);
    window.addEventListener("campfire:theme:toggle", handleThemeToggle);
    window.addEventListener("campfire:sidebar:toggle", handleSidebarToggle);

    return () => {
      window.removeEventListener("campfire:navigate", handleNavigate as any);
      window.removeEventListener("campfire:theme:toggle", handleThemeToggle);
      window.removeEventListener("campfire:sidebar:toggle", handleSidebarToggle);
    };
  }, [router, theme, setTheme]);

  return (
    <>
      {children}
      <KeyboardShortcutsModal open={isHelpOpen} onClose={hideHelp} />
    </>
  );
}
