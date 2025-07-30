"use client";

// DELETED: useConversationCounts and useRealTimeNotifications - using unified real-time system instead
import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";
import { FlameGradient } from "@/components/unified-ui/components/flame-gradient";
import { useAuth } from "@/hooks/useAuth";
import {
  ChartBar as BarChart3,
  Bell,
  BookOpen,
  Brain,
  Question as HelpCircle,
  House as Home,
  Tray as Inbox,
  Gear as Settings,
  Ticket,
  User,
  Users,
  Lightning as Zap,
} from "@phosphor-icons/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
// Removed useOrganization import - using AuthProvider directly
import { FadeIn } from "@/lib/telemetry/lightweight-animations";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  isActive?: boolean;
  badge?: number | undefined;
  section: "primary" | "secondary" | "bottom";
}

const navItems: NavItem[] = [
  // Primary Navigation
  { id: "dashboard", label: "Dashboard", icon: Home as any, href: "/dashboard", section: "primary" },
  { id: "inbox", label: "Inbox", icon: Inbox as any, href: "/inbox", section: "primary" },
  { id: "tickets", label: "Tickets", icon: Ticket as any, href: "/dashboard/tickets", section: "primary" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen as any, href: "/dashboard/knowledge", section: "primary" },
  { id: "analytics", label: "Analytics", icon: BarChart3 as any, href: "/dashboard/analytics", section: "primary" },
  { id: "ai-insights", label: "AI Insights", icon: Brain as any, href: "/dashboard/ai-insights", section: "primary" },

  // Secondary Navigation
  { id: "settings", label: "Settings", icon: Settings as any, href: "/dashboard/settings", section: "secondary" },
  { id: "team", label: "Team", icon: Users as any, href: "/dashboard/team", section: "secondary" },
  {
    id: "integrations",
    label: "Integrations",
    icon: Zap as any,
    href: "/dashboard/integrations",
    section: "secondary",
  },

  // Bottom Navigation
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell as any,
    href: "/dashboard/notifications",
    section: "bottom",
  },
  { id: "help", label: "Help", icon: HelpCircle as any, href: "/dashboard/help", section: "bottom" },
  { id: "profile", label: "Profile", icon: User as any, href: "/dashboard/profile", section: "bottom" },
];

function Sidebar({ isExpanded: controlledExpanded, onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(controlledExpanded ?? false);
  const [hovering, setHovering] = useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);

  // CONSOLIDATED: Use unified real-time system instead of polling
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const organization = { id: organizationId }; // Simplified organization object

  // TODO: Connect to unified real-time notification system
  const notificationCount = 0; // Will be provided by unified real-time system
  const notificationError = null;

  // TEMPORARY: Static counts until unified system provides real-time counts
  // TODO: Connect to UnifiedInboxStore for real-time conversation counts
  const inboxUnreadCount = 0; // Will be provided by unified real-time system
  const ticketUnreadCount = 0; // Will be provided by unified real-time system
  const [expandTimeout, setExpandTimeout] = useState<NodeJS.Timeout | null>(null);
  const [collapseTimeout, setCollapseTimeout] = useState<NodeJS.Timeout | null>(null);

  const effectiveExpanded = controlledExpanded !== undefined ? controlledExpanded : isExpanded || hovering;

  useEffect(() => {
    // Load expanded preference from localStorage
    const stored = localStorage.getItem("sidebar-expanded");
    if (stored !== null) {
      setIsExpanded(JSON.parse(stored));
    }
  }, []);

  // Update CSS variable when sidebar width changes
  useEffect(() => {
    if (sidebarRef.current) {
      const width = effectiveExpanded ? 240 : 64;
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    }
  }, [effectiveExpanded]);

  const handleMouseEnter = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
      setCollapseTimeout(null);
    }

    if (!isExpanded) {
      const timeout = setTimeout(() => {
        setHovering(true);
      }, 150);
      setExpandTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (expandTimeout) {
      clearTimeout(expandTimeout);
      setExpandTimeout(null);
    }

    if (!isExpanded) {
      const timeout = setTimeout(() => {
        setHovering(false);
      }, 300);
      setCollapseTimeout(timeout);
    }
  };

  // Organize navigation items by section and add real unread counts
  const primaryItems = navItems
    .filter((item: any) => item.section === "primary")
    .map((item: any) => ({
      ...item,
      badge:
        item.id === "inbox"
          ? inboxUnreadCount > 0
            ? inboxUnreadCount
            : undefined
          : item.id === "tickets"
            ? ticketUnreadCount > 0
              ? ticketUnreadCount
              : undefined
            : item.badge,
    }));
  const secondaryItems = navItems.filter((item: any) => item.section === "secondary");
  const bottomItems = navItems
    .filter((item: any) => item.section === "bottom")
    .map((item: any) => ({
      ...item,
      badge: item.id === "notifications" ? (notificationCount > 0 ? notificationCount : undefined) : item.badge,
    }));

  return (
    <section
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex h-full w-full flex-shrink-0 flex-col overflow-hidden bg-white transition-all duration-300 ease-out dark:bg-neutral-900 md:w-auto md:border-r md:border-[var(--fl-color-border)] md:dark:border-gray-800 ${effectiveExpanded ? "sidebar-shadow" : "sidebar-shadow-collapsed"
        }`}
      style={{
        width: effectiveExpanded ? 240 : 64,
      }}
      data-expanded={effectiveExpanded}
      role="navigation"
      aria-label="Main navigation"
    >
      <FlameGradient />
      {/* FIXED: Brand Logo - NO border, shadow, background, or line */}
      <div
        className={`flex min-h-[73px] items-center bg-white dark:bg-neutral-900 ${effectiveExpanded ? "spacing-4" : "justify-center spacing-2"}`}
      >
        {/* FIXED: Brand logo image */}
        <BrandLogo size={36} className="flex-shrink-0" />

        {effectiveExpanded && (
          <div className="ml-3 flex-1 overflow-hidden">
            <FadeIn delay={effectiveExpanded ? 0.1 : 0} duration={0.2} className="whitespace-nowrap">
              <div className="text-base font-bold text-gray-900 dark:text-neutral-100">Campfire</div>
              <div className="text-tiny font-medium text-[var(--fl-color-text-muted)] dark:text-gray-400">
                AI Platform
              </div>
            </FadeIn>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="bg-background flex-1 pt-4 dark:bg-neutral-900">
        {/* FIXED: Consistent padding in both states */}
        <div className="px-3">
          {/* FIXED: Always reserve space for header, use opacity for visibility */}
          <div className="mb-3 flex h-6 items-center">
            <div
              className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[var(--fl-color-text-muted)] transition-opacity duration-200 dark:text-gray-400 ${effectiveExpanded ? "opacity-100" : "opacity-0"
                }`}
            >
              Primary
            </div>
          </div>

          <div className="space-y-1">
            {primaryItems.map((item: any) => (
              <SidebarItem key={item.id} item={item} isExpanded={effectiveExpanded} />
            ))}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="mt-8 px-3">
          {/* FIXED: Always reserve space for header, use opacity for visibility */}
          <div className="mb-3 flex h-6 items-center">
            <div
              className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[var(--fl-color-text-muted)] transition-opacity duration-200 dark:text-gray-400 ${effectiveExpanded ? "opacity-100" : "opacity-0"
                }`}
            >
              Tools
            </div>
          </div>

          <div className="space-y-1">
            {secondaryItems.map((item: any) => (
              <SidebarItem key={item.id} item={item} isExpanded={effectiveExpanded} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="bg-background border-t border-[var(--fl-color-border)] spacing-3 dark:border-gray-800 dark:bg-neutral-900">
        <div className="space-y-1">
          {bottomItems.map((item: any) => (
            <SidebarItem key={item.id} item={item} isExpanded={effectiveExpanded} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface SidebarItemProps {
  item: NavItem;
  isExpanded: boolean;
}

function SidebarItem({ item, isExpanded }: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <Link
        href={item.href}
        data-active={item.isActive ? "true" : "false"}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative flex h-12 items-center overflow-hidden rounded-ds-lg transition-all duration-200 whitespace-nowrap",
          item.isActive
            ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-level-2)]"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        )}
      >
        {/* Active Indicator */}
        {item.isActive && (
          <div className="bg-background absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 transform rounded-r-full" />
        )}

        {/* FIXED: Icon container with EXACT same positioning in both states */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
          {item.icon ? (
            <item.icon
              size={20}
              className={cn(
                "transition-colors duration-200",
                item.isActive ? "text-white" : "text-neutral-500 group-hover:text-[var(--color-primary)]"
              )}
            />
          ) : (
            <div className="h-5 w-5 rounded bg-gray-300" />
          )}
        </div>

        {/* FIXED: Label with consistent spacing */}
        <div
          className={cn(
            "flex flex-1 items-center justify-between overflow-hidden transition-all duration-300 min-w-0",
            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          <span className="truncate text-sm font-medium">{item.label}</span>

          {item.badge && isExpanded && (
            <span
              className={`ml-auto rounded-ds-full px-2 py-1 text-xs font-semibold ${item.isActive ? "bg-white/20 text-white" : "bg-[var(--color-primary)] text-white"
                }`}
            >
              {item.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Badge indicator for collapsed state */}
      {!isExpanded && item.badge && (
        <div className="bg-brand-mahogany-500 absolute -right-1 -top-1 h-2 w-2 rounded-ds-full"></div>
      )}

      {/* Tooltip for collapsed state */}
      {!isExpanded && isHovered && (
        <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 transform animate-fade-in whitespace-nowrap rounded-ds-lg bg-neutral-900 px-3 py-2 text-sm text-white opacity-0 shadow-card-deep">
          {item.label}
          {item.badge && (
            <span className="ml-2 rounded-ds-full bg-[var(--color-primary)] px-2 py-1 text-tiny text-white">
              {item.badge}
            </span>
          )}
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1 -translate-y-1/2 rotate-45 transform bg-neutral-900" />
        </div>
      )}
    </div>
  );
}

export default Sidebar;
