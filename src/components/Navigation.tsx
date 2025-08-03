"use client";

import { cn } from "@/lib/utils";
import { Icons } from '@/lib/icons/standardized-icons';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Icons.home,
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: Icons.chat,
  },
  {
    name: "Testing",
    href: "/testing",
    icon: Icons.beaker,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: Icons.user,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Icons.settings,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="ds-bg-surface ds-border-r ds-border-border ds-w-64 ds-min-h-screen ds-p-4 ds-shadow-md">
      {/* Enhanced Logo with Design System */}
      <div className="ds-flex ds-items-center ds-gap-3 ds-mb-8 ds-px-2">
        <Image src="/images/flamey.png" alt="Campfire logo" width={42} height={42} className="flex-shrink-0" />
        <div>
          <h1 className="ds-text-xl ds-font-bold ds-text-foreground">Campfire</h1>
          <p className="ds-text-xs ds-text-muted-foreground">Customer Support</p>
        </div>
      </div>

      {/* Enhanced Navigation Items with Design System */}
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} className="flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Enhanced Status with Design System */}
      <div className="ds-mt-8 ds-p-3 ds-bg-success-50 ds-rounded-lg ds-border ds-border-success-200">
        <div className="ds-flex ds-items-center ds-gap-2 ds-mb-2">
          <div className="ds-h-2 ds-w-2 ds-bg-success-500 ds-rounded-full"></div>
          <span className="ds-text-sm ds-font-medium ds-text-success-800">System Status</span>
        </div>
        <p className="ds-text-xs ds-text-success-600">All systems operational</p>
      </div>
    </nav>
  );
}
