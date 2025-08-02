"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  List as Menu,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Sheet, SheetContent } from "@/components/unified-ui/components/sheet";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { PremiumHeader } from "../ui/PremiumHeader";
import { NavigationCard } from "../ui/NavigationCard";

interface MobileSidebarProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: House,
    description: "Overview and analytics"
  },
  { 
    name: "Inbox", 
    href: "/inbox", 
    icon: Tray,
    description: "Manage conversations"
  },
  { 
    name: "Tickets", 
    href: "/tickets", 
    icon: Ticket,
    description: "Support tickets"
  },
  { 
    name: "Knowledge", 
    href: "/knowledge", 
    icon: BookOpen,
    description: "Documentation & guides"
  },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: ChartBar,
    description: "Performance insights"
  },
  { 
    name: "AI Insights", 
    href: "/ai-insights", 
    icon: Lightbulb,
    description: "AI-powered recommendations"
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Gear,
    description: "Configuration & preferences"
  },
  { 
    name: "Team", 
    href: "/team", 
    icon: Users,
    description: "Manage team members"
  },
  { 
    name: "Integrations", 
    href: "/integrations", 
    icon: Plug,
    description: "Third-party connections"
  },
  { 
    name: "Notifications", 
    href: "/notifications", 
    icon: Bell,
    description: "Alerts & updates"
  },
  { 
    name: "Help", 
    href: "/help", 
    icon: Question,
    description: "Support & documentation"
  },
  { 
    name: "Profile", 
    href: "/profile", 
    icon: User,
    description: "Account settings"
  },
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
      {/* Enhanced Mobile Menu Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed left-4 top-4 z-50 md:hidden"
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50",
            "hover:bg-white/95 transition-all duration-200",
            className
          )}
          onClick={() => handleOpenChange(!sheetOpen)}
        >
          {sheetOpen ? <Icon icon={X} className="h-5 w-5" /> : <Icon icon={Menu} className="h-5 w-5" />}
        </Button>
      </motion.div>

      {/* Premium Mobile Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[320px] p-0 !left-0 !right-auto bg-gradient-to-b from-orange-50 to-red-50">
          <PremiumHeader onClose={() => handleOpenChange(false)} />
          
          <div className="px-4 pb-6 space-y-3">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <NavigationCard
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={() => handleNavigate(item.href)}
                  />
                </motion.div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
