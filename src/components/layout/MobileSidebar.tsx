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
import { Button } from "@/components/ui/Button-unified";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/unified-ui/components/sheet";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: House },
  { name: "Inbox", href: "/inbox", icon: Tray },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Knowledge", href: "/knowledge", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: ChartBar },
  { name: "AI Insights", href: "/ai-insights", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Gear },
  { name: "Team", href: "/team", icon: Users },
  { name: "Integrations", href: "/integrations", icon: Plug },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Help", href: "/help", icon: Question },
  { name: "Profile", href: "/profile", icon: User },
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
              <Icon icon={Fire} className="h-8 w-8 text-orange-500" />
              <span className="text-lg font-bold">Campfire</span>
            </SheetTitle>
          </SheetHeader>

          <div className="px-3 pb-6">
            {/* Navigation */}
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "h-12 w-full flex items-center gap-3 justify-start",
                    isActive(item.href) && "bg-secondary font-medium"
                  )}
                  onClick={() => handleNavigate(item.href)}
                >
                  <Icon icon={item.icon} className="h-5 w-5" />
                  {item.name}
                </Button>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
