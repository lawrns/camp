"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Sparkle } from "@/lib/icons/optimized-icons";

import { cn } from "@/lib/utils";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 spacing-4">
      <div className="relative z-10 w-full max-w-md rounded-ds-xl bg-white spacing-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-blue-600">
              <path
                d="M12 2L2 7v10c0 .55.45 1 1 1h5v-4a1 1 0 011-1h6a1 1 0 011 1v4h5c.55 0 1-.45 1-1V7L12 2z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Campfire</h1>
          <p className="mt-2 text-sm text-gray-600">AI-Powered Customer Support</p>
        </div>
        {children}
        <div className="mt-6 text-center text-xs text-gray-500">
          <Sparkle className="mr-1 inline h-3 w-3" />
          Secured with 256-bit encryption
        </div>
      </div>
    </div>
  );
}
