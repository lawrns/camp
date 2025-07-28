"use client";

import Link from "next/link";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { ArrowRight, Rocket, Sparkle } from "@/lib/icons/optimized-icons";

export default function HeroSection() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <OptimizedMotion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="mb-6 inline-flex items-center gap-ds-2 rounded-ds-full bg-[var(--fl-color-info-subtle)] px-4 py-2 text-sm font-medium text-blue-800">
            <Sparkle className="h-4 w-4" />
            AI-Native Customer Communication
          </div>

          <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-7xl">
            Transform Every
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Customer{" "}
            </span>
            Interaction
          </h1>

          <p className="leading-relaxed text-foreground mx-auto mb-8 max-w-2xl text-lg">
            Campfire powers customer communication with AI that's personal, precise, and powerful. Turn every
            conversation into a moment of delight.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="bg-primary inline-flex items-center justify-center gap-ds-2 rounded-ds-lg px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/demo"
              className="bg-background inline-flex items-center justify-center gap-ds-2 rounded-ds-lg border border-[var(--fl-color-border)] px-8 py-4 text-base font-semibold text-gray-900 transition-colors hover:bg-[var(--fl-color-background-subtle)]"
            >
              <Rocket className="h-5 w-5" />
              See It In Action
            </Link>
          </div>
        </OptimizedMotion.div>
      </div>
    </section>
  );
}
