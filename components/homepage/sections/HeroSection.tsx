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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-info-50 px-4 py-2 text-sm font-medium text-blue-800">
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

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-foreground">
            Campfire powers customer communication with AI that's personal, precise, and powerful. Turn every
            conversation into a moment of delight.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-600"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
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
