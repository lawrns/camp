"use client";

import { useState } from "react";
import Link from "next/link";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Menu, X } from "@/lib/icons/optimized-icons";

export default function AnimatedNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <OptimizedMotion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-background/80 fixed top-0 z-50 w-full border-b border-[var(--fl-color-border)] backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            🔥 Campfire
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/features" className="text-foreground transition-colors hover:text-blue-600">
              Features
            </Link>
            <Link href="/pricing" className="text-foreground transition-colors hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/about" className="text-foreground transition-colors hover:text-blue-600">
              About
            </Link>
            <Link href="/login" className="text-foreground transition-colors hover:text-blue-600">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="p-spacing-sm md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pb-4 md:hidden"
          >
            <div className="flex flex-col space-y-3">
              <Link href="/features" className="text-foreground transition-colors hover:text-blue-600">
                Features
              </Link>
              <Link href="/pricing" className="text-foreground transition-colors hover:text-blue-600">
                Pricing
              </Link>
              <Link href="/about" className="text-foreground transition-colors hover:text-blue-600">
                About
              </Link>
              <Link href="/login" className="text-foreground transition-colors hover:text-blue-600">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-primary rounded-ds-lg px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </OptimizedMotion.div>
        )}
      </div>
    </OptimizedMotion.nav>
  );
}
