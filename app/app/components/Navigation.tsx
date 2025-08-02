"use client";

import { cn } from "@/lib/utils";
import { ChatCircle, House, Gear as Settings, TestTube, User, List, X } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { PremiumHeader } from "@/src/components/ui/PremiumHeader";
import { NavigationCard } from "@/src/components/ui/NavigationCard";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: House,
    description: "Overview and analytics"
  },
  {
    name: "Live Chat",
    href: "/app/chat",
    icon: ChatCircle,
    description: "Real-time conversations"
  },
  {
    name: "Auth Test",
    href: "/auth-test",
    icon: TestTube,
    description: "Authentication testing"
  },
  {
    name: "Auth Debug",
    href: "/app/auth-debug",
    icon: TestTube,
    description: "Debug authentication"
  },
  {
    name: "Profile",
    href: "/app/profile",
    icon: User,
    description: "Account settings"
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
    description: "Configuration"
  },
];

// Enhanced Sidebar content component
function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      {/* Enhanced Logo */}
      <div className="ds-flex ds-items-center ds-gap-3 ds-mb-8 ds-px-2">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-red-500 rounded-full blur-sm opacity-30" />
          <Image 
            src="/images/flamey.png" 
            alt="Campfire logo" 
            width={42} 
            height={42} 
            className="flex-shrink-0 relative z-10" 
          />
        </motion.div>
        <div>
          <h1 className="ds-text-xl ds-font-bold ds-text-foreground">Campfire</h1>
          <p className="ds-text-xs ds-text-muted-foreground">Customer Support</p>
        </div>
      </div>

      {/* Enhanced Navigation Items */}
      <div className="space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavigationCard
                item={item}
                isActive={isActive}
                onClick={() => {
                  // Navigation will be handled by Link component
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="ds-mt-8 ds-p-4 ds-bg-gradient-to-r ds-from-success-50 ds-to-green-50 ds-rounded-xl ds-border ds-border-success-200 ds-shadow-sm"
      >
        <div className="ds-flex ds-items-center ds-gap-2 ds-mb-2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ds-h-2 ds-w-2 ds-bg-success-500 ds-rounded-full"
          />
          <span className="ds-text-sm ds-font-medium ds-text-success-800">System Status</span>
        </div>
        <p className="ds-text-xs ds-text-success-600">All systems operational</p>
      </motion.div>
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
      {/* Enhanced Mobile Menu Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        <button
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all duration-200"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <List size={20} className="text-gray-700" />
        </button>
      </motion.div>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block ds-bg-surface ds-border-r ds-border-border ds-w-64 ds-min-h-screen ds-p-4 ds-shadow-md">
        <SidebarContent />
      </nav>

      {/* Enhanced Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Premium Mobile Menu Sidebar */}
      <motion.nav
        initial={{ x: "-100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-orange-50 to-red-50 shadow-2xl z-50 md:hidden"
      >
        <PremiumHeader onClose={() => setIsMobileMenuOpen(false)} />
        
        <div className="p-4 space-y-3">
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
                <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <NavigationCard
                    item={item}
                    isActive={pathname === item.href}
                    onClick={() => {}} // Link handles navigation
                  />
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
      </motion.nav>
    </>
  );
}
