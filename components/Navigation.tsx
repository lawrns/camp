"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[var(--ds-color-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[var(--ds-color-primary-600)]">
                🔥 Campfire
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/features"
                className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Docs
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <Link
                href="/login"
                className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-[var(--ds-color-primary-600)] hover:bg-[var(--ds-color-primary-700)] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-background-muted)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--ds-color-primary-500)]"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-[var(--ds-color-border)]">
            <Link
              href="/features"
              className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Docs
            </Link>
            <div className="pt-4 pb-3 border-t border-[var(--ds-color-border)]">
              <div className="flex items-center px-3 space-x-3">
                <Link
                  href="/login"
                  className="text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[var(--ds-color-primary-600)] hover:bg-[var(--ds-color-primary-700)] text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
