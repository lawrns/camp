"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 as BarChart3, Bell, Bot as Bot, Brain, FileText, Home as Home, Inbox, LogOut as LogOut, Mail as Mail, Package, Plus, Search as Search, Settings as Settings, Shield, Sparkles as Sparkles, Ticket, User, Users, Zap as Zap,  } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/unified-ui/components/command";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { OptionalAuth, RequireAuth } from "./AuthBoundary";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  category: "navigation" | "actions" | "settings" | "help";
}

/**
 * Command Palette component that requires authentication
 * Follows proper auth boundary patterns
 */
function CommandPaletteWithAuth() {
  const { user, signOut, isAuthenticated } = useAuth();
  const organizationId = user?.organizationId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Register keyboard shortcuts
  useHotkeys("cmd+k", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  useHotkeys("ctrl+k", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const handleAction = useCallback((action: () => void) => {
    setOpen(false);
    setSearch("");
    // Small delay to allow dialog to close smoothly
    setTimeout(action, 100);
  }, []);

  // Build authenticated user commands
  const buildAuthenticatedCommands = (): CommandItem[] => {
    if (!isAuthenticated || !user || !organizationId) {
      return [];
    }

    return [
      // Navigation
      {
        id: "nav-dashboard",
        title: "Dashboard",
        subtitle: "View main dashboard",
        icon: <Icon icon={Home} className="h-4 w-4" />,
        shortcut: "⌘D",
        action: () => router.push("/dashboard"),
        keywords: ["home", "overview", "main"],
        category: "navigation",
      },
      {
        id: "nav-inbox",
        title: "Inbox",
        subtitle: "View all conversations",
        icon: <Icon icon={Inbox} className="h-4 w-4" />,
        shortcut: "⌘I",
        action: () => router.push("/dashboard/inbox"),
        keywords: ["messages", "conversations", "chat"],
        category: "navigation",
      },
      {
        id: "nav-tickets",
        title: "Tickets",
        subtitle: "Manage support tickets",
        icon: <Icon icon={Ticket} className="h-4 w-4" />,
        action: () => router.push("/tickets"),
        keywords: ["issues", "support", "tasks"],
        category: "navigation",
      },
      {
        id: "nav-customers",
        title: "Customers",
        subtitle: "View customer profiles",
        icon: <Icon icon={Users} className="h-4 w-4" />,
        action: () => router.push("/customers"),
        keywords: ["contacts", "users", "people"],
        category: "navigation",
      },
      {
        id: "nav-knowledge",
        title: "Knowledge Base",
        subtitle: "Browse help articles",
        icon: <Icon icon={Brain} className="h-4 w-4" />,
        shortcut: "⌘K",
        action: () => router.push("/knowledge"),
        keywords: ["help", "docs", "articles", "faq"],
        category: "navigation",
      },
      {
        id: "nav-analytics",
        title: "Analytics",
        subtitle: "View reports and insights",
        icon: <Icon icon={BarChart3} className="h-4 w-4" />,
        action: () => router.push("/analytics"),
        keywords: ["reports", "stats", "metrics", "data"],
        category: "navigation",
      },
      {
        id: "nav-integrations",
        title: "Integrations",
        subtitle: "Manage third-party connections",
        icon: <Icon icon={Package} className="h-4 w-4" />,
        action: () => router.push("/integrations"),
        keywords: ["apps", "connections", "webhooks", "api"],
        category: "navigation",
      },

      // Actions
      {
        id: "action-new-conversation",
        title: "New Conversation",
        subtitle: "Start a new conversation",
        icon: <Icon icon={Plus} className="h-4 w-4" />,
        shortcut: "⌘N",
        action: () => router.push("/dashboard/inbox?new=true"),
        keywords: ["create", "start", "compose", "message"],
        category: "actions",
      },
      {
        id: "action-new-ticket",
        title: "Create Ticket",
        subtitle: "Create a new support ticket",
        icon: <Icon icon={FileText} className="h-4 w-4" />,
        action: () => router.push("/tickets?new=true"),
        keywords: ["create", "issue", "task"],
        category: "actions",
      },
      {
        id: "action-ai-assist",
        title: "AI Assistant",
        subtitle: "Get AI-powered help",
        icon: <Icon icon={Bot} className="h-4 w-4" />,
        shortcut: "⌘A",
        action: () => router.push("/ai-assistant"),
        keywords: ["help", "bot", "assistant", "ai"],
        category: "actions",
      },
      {
        id: "action-search",
        title: "Search Everything",
        subtitle: "Search across all data",
        icon: <Icon icon={Search} className="h-4 w-4" />,
        shortcut: "⌘F",
        action: () => router.push("/search"),
        keywords: ["find", "look", "query"],
        category: "actions",
      },

      // Settings
      {
        id: "settings-profile",
        title: "Profile Settings",
        subtitle: "Manage your profile",
        icon: <Icon icon={User} className="h-4 w-4" />,
        action: () => router.push("/profile"),
        keywords: ["account", "personal", "me"],
        category: "settings",
      },
      {
        id: "settings-preferences",
        title: "Preferences",
        subtitle: "Customize your experience",
        icon: <Icon icon={Settings} className="h-4 w-4" />,
        shortcut: "⌘,",
        action: () => router.push("/settings"),
        keywords: ["config", "options", "customize"],
        category: "settings",
      },
      {
        id: "settings-notifications",
        title: "Notifications",
        subtitle: "Manage notification settings",
        icon: <Icon icon={Bell} className="h-4 w-4" />,
        action: () => router.push("/settings/notifications"),
        keywords: ["alerts", "sounds", "emails"],
        category: "settings",
      },
      {
        id: "settings-security",
        title: "Security",
        subtitle: "Security and privacy settings",
        icon: <Icon icon={Shield} className="h-4 w-4" />,
        action: () => router.push("/settings/security"),
        keywords: ["password", "privacy", "2fa"],
        category: "settings",
      },
      {
        id: "settings-logout",
        title: "Sign Out",
        subtitle: "Sign out of your account",
        icon: <Icon icon={LogOut} className="h-4 w-4" />,
        action: () => signOut(),
        keywords: ["logout", "exit", "leave"],
        category: "settings",
      },

      // Help
      {
        id: "help-docs",
        title: "Documentation",
        subtitle: "View help documentation",
        icon: <Icon icon={FileText} className="h-4 w-4" />,
        action: () => window.open("/docs", "_blank"),
        keywords: ["guide", "manual", "tutorial"],
        category: "help",
      },
      {
        id: "help-support",
        title: "Contact Support",
        subtitle: "Get help from our team",
        icon: <Icon icon={Mail} className="h-4 w-4" />,
        action: () => router.push("/support"),
        keywords: ["contact", "email", "help"],
        category: "help",
      },
      {
        id: "help-shortcuts",
        title: "Keyboard Shortcuts",
        subtitle: "View all shortcuts",
        icon: <Icon icon={Zap} className="h-4 w-4" />,
        shortcut: "?",
        action: () => router.push("/help/shortcuts"),
        keywords: ["keys", "hotkeys", "commands"],
        category: "help",
      },
      {
        id: "help-tour",
        title: "Product Tour",
        subtitle: "Take a guided tour",
        icon: <Icon icon={Sparkles} className="h-4 w-4" />,
        action: () => router.push("/tour"),
        keywords: ["onboarding", "guide", "intro"],
        category: "help",
      },
    ];
  };

  const commands = buildAuthenticatedCommands();

  const filteredCommands = commands.filter((cmd: unknown) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((keyword: string) => keyword.toLowerCase().includes(searchLower))
    );
  });

  const groupedCommands = {
    navigation: filteredCommands.filter((cmd: unknown) => cmd.category === "navigation"),
    actions: filteredCommands.filter((cmd: unknown) => cmd.category === "actions"),
    settings: filteredCommands.filter((cmd: unknown) => cmd.category === "settings"),
    help: filteredCommands.filter((cmd: unknown) => cmd.category === "help"),
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-ds-lg border shadow-card-hover">
        <CommandInput
          ref={inputRef}
          placeholder="Type a command or search..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {groupedCommands.navigation.length > 0 && (
            <CommandGroup heading="Navigation">
              {groupedCommands.navigation.map((cmd: unknown) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd.action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-ds-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="font-medium">{cmd.title}</div>
                      {cmd.subtitle && <div className="text-sm text-muted-foreground">{cmd.subtitle}</div>}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groupedCommands.actions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                {groupedCommands.actions.map((cmd: unknown) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleAction(cmd.action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-semantic-success-dark flex h-9 w-9 items-center justify-center rounded-ds-lg bg-gradient-to-r from-green-50 to-emerald-50">
                        {cmd.icon}
                      </div>
                      <div>
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.subtitle && <div className="text-sm text-muted-foreground">{cmd.subtitle}</div>}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {groupedCommands.settings.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                {groupedCommands.settings.map((cmd: unknown) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleAction(cmd.action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-ds-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600">
                        {cmd.icon}
                      </div>
                      <div>
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.subtitle && <div className="text-sm text-muted-foreground">{cmd.subtitle}</div>}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {groupedCommands.help.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Help">
                {groupedCommands.help.map((cmd: unknown) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleAction(cmd.action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-ds-lg bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600">
                        {cmd.icon}
                      </div>
                      <div>
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.subtitle && <div className="text-sm text-muted-foreground">{cmd.subtitle}</div>}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/**
 * Safe Command Palette that uses proper auth boundaries
 * This is the main export that should be used
 */
export const CommandPalette = () => {
  return (
    <RequireAuth fallback={null}>
      <CommandPaletteWithAuth />
    </RequireAuth>
  );
};

/**
 * Command Palette Provider that wraps the app
 * Uses OptionalAuth to only render when auth context is available
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OptionalAuth>
        <CommandPalette />
      </OptionalAuth>
    </>
  );
}
