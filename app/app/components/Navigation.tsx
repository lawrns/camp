"use client";

import { cn } from "@/lib/utils";
import { ChatCircle, House, Gear as Settings, TestTube, User, List, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: House,
  },
  {
    name: "Live Chat",
    href: "/app/chat",
    icon: ChatCircle,
  },
  {
    name: "Auth Test",
    href: "/auth-test",
    icon: TestTube,
  },
  {
    name: "Auth Debug",
    href: "/app/auth-debug",
    icon: TestTube,
  },
  {
    name: "Profile",
    href: "/app/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
];

// Sidebar content component that will be reused for both desktop and mobile
function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="ds-flex ds-items-center ds-gap-3 ds-mb-8 ds-px-2">
        <BrandLogo size={42} />
        <div>
          <h1 className="ds-text-xl ds-font-bold ds-text-foreground">Campfire</h1>
          <p className="ds-text-xs ds-text-muted-foreground">AI Platform</p>
        </div>
      </div>

      {/* Navigation Items */}
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

      {/* Status */}
      <div className="ds-mt-8 ds-p-3 ds-bg-success-50 ds-rounded-lg ds-border ds-border-success-200">
        <div className="ds-flex ds-items-center ds-gap-2 ds-mb-2">
          <div className="ds-h-2 ds-w-2 ds-bg-success-500 ds-rounded-full"></div>
          <span className="ds-text-sm ds-font-medium ds-text-success-800">System Status</span>
        </div>
        <p className="ds-text-xs ds-text-success-600">All systems operational</p>
      </div>
    </>
  );
}

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Open navigation menu"
      >
        <List size={20} className="text-gray-700" />
      </button>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block ds-bg-surface ds-border-r ds-border-border ds-w-64 ds-min-h-screen ds-p-4 ds-shadow-md">
        <SidebarContent />
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <nav
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <div>
              <div className="text-lg font-bold text-gray-900">Campfire</div>
              <div className="text-sm text-gray-500">AI Platform</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close navigation menu"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          <SidebarContent />
        </div>
      </nav>
    </>
  );
}
