"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Robot as Bot,
  CreditCard,
  Question as HelpCircle,
  Tray as Inbox,
  List as Menu,
  Gear as Settings,
  Users,
  X,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Button } from "@/components/ui/Button-unified";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/unified-ui/components/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const navigation = [
  { name: "Inbox", href: "/dashboard", icon: Inbox },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Bot },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Help", href: "/help", icon: HelpCircle },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
];

export function MobileSidebar({ className, isOpen = false, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(isOpen);
  const { user } = useAuth();

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
        <Icon icon={sheetOpen ? X : Menu} className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[280px] p-0">
          <SheetHeader className="p-spacing-md pb-4">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-ds-lg bg-gradient-to-br from-orange-500 to-pink-500" />
              <span className="text-lg font-bold">Campfire</span>
            </SheetTitle>
          </SheetHeader>

          <div className="px-3">
            {/* User Profile Section */}
            <div className="mb-6 px-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {user?.user_metadata?.avatar_url && <AvatarImage src={user.user_metadata.avatar_url} />}
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="truncate text-tiny text-muted-foreground">{user?.email || "No email"}</p>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Main Navigation */}
            <nav className="space-y-1">
              {navigation.map((item: any) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn("h-12 w-full justify-start gap-3 whitespace-nowrap overflow-hidden", isActive(item.href) && "bg-secondary font-medium")}
                  onClick={() => handleNavigate(item.href)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Button>
              ))}
            </nav>

            <Separator className="my-6" />

            {/* Bottom Navigation */}
            <nav className="space-y-1">
              {bottomNavigation.map((item: any) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn("h-12 w-full justify-start gap-3 whitespace-nowrap overflow-hidden", isActive(item.href) && "bg-secondary font-medium")}
                  onClick={() => handleNavigate(item.href)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Button>
              ))}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-spacing-md">
            <div className="rounded-ds-lg bg-muted spacing-3">
              <p className="mb-1 text-sm font-medium">Need help?</p>
              <p className="mb-3 text-tiny text-muted-foreground">Chat with our support team</p>
              <Button size="sm" className="w-full">
                Start Chat
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
