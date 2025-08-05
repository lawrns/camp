"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Tray,
  Ticket,
  BookOpen,
  ChartBar,
  Lightbulb,
  Gear,
  Users,
  Plug,
  Bell,
  Question,
  User,
  Fire,
  List as Menu,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/unified-ui/components/sheet";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";

interface MobileSidebarProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  section: "primary" | "secondary";
}

const navigationItems: NavItem[] = [
  // Primary Navigation
  { id: "dashboard", label: "Dashboard", icon: House, href: "/dashboard", section: "primary" },
  { id: "inbox", label: "Inbox", icon: Tray, href: "/inbox", section: "primary" },
  { id: "tickets", label: "Tickets", icon: Ticket, href: "/tickets", section: "primary" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, href: "/knowledge", section: "primary" },
  { id: "analytics", label: "Analytics", icon: ChartBar, href: "/analytics", section: "primary" },
  { id: "ai-insights", label: "AI Insights", icon: Lightbulb, href: "/ai-insights", section: "primary" },

  // Secondary Navigation
  { id: "settings", label: "Settings", icon: Gear, href: "/settings", section: "secondary" },
  { id: "team", label: "Team", icon: Users, href: "/team", section: "secondary" },
  { id: "integrations", label: "Integrations", icon: Plug, href: "/integrations", section: "secondary" },
];

export function MobileSidebar({ className, isOpen = false, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(isOpen);

  useEffect(() => {
    setSheetOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open);
    onOpenChange?.(open);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    handleOpenChange(false);
  };

  const isActive = (href: string) => {
    return pathname === href || (href === "/dashboard" && pathname.startsWith("/dashboard"));
  };

  const primaryItems = navigationItems.filter(item => item.section === "primary");
  const secondaryItems = navigationItems.filter(item => item.section === "secondary");

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("fixed left-4 top-4 z-50 md:hidden", className)}
        onClick={() => handleOpenChange(!sheetOpen)}
      >
        {sheetOpen ? <Icon icon={X} className="h-5 w-5" /> : <Icon icon={Menu} className="h-5 w-5" />}
      </Button>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[280px] p-0 !left-0 !right-auto">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-3">
              <BrandLogo size={32} />
              <div>
                <div className="text-lg font-bold text-gray-900">Campfire</div>
                <div className="text-sm text-gray-500">AI Platform</div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="px-3 pb-6">
            {/* Primary Navigation */}
            <div className="mb-6">
              <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Primary
              </div>
              <nav className="space-y-1">
                {primaryItems.map((item) => (
                  <MobileSidebarItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={() => handleNavigate(item.href)}
                  />
                ))}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div>
              <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tools
              </div>
              <nav className="space-y-1">
                {secondaryItems.map((item) => (
                  <MobileSidebarItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={() => handleNavigate(item.href)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface MobileSidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function MobileSidebarItem({ item, isActive, onClick }: MobileSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-12 w-full items-center overflow-hidden rounded-lg transition-all duration-200 px-3",
        isActive
          ? "bg-blue-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
        <item.icon
          size={20}
          className={cn(
            "transition-colors duration-200",
            isActive ? "text-white" : "text-gray-500 group-hover:text-blue-500"
          )}
        />
      </div>

      {/* Label */}
      <div className="flex flex-1 items-center">
        <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>
      </div>
    </button>
  );
}
