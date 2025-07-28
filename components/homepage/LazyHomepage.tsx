"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Minimal loading component
const HomepageLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      <div className="text-foreground text-2xl font-semibold">Loading Campfire...</div>
      <div className="mt-2 text-sm text-muted-foreground">Preparing your workspace...</div>
    </div>
  </div>
);

// Lazy load heavy components
const HeroSection = dynamic(() => import("./sections/HeroSection"), {
  loading: () => <div className="h-screen animate-pulse bg-gradient-to-br from-blue-50 to-purple-50" />,
  ssr: false,
});

const FeaturesSection = dynamic(() => import("./sections/FeaturesSection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
});

// const TestimonialsSection = dynamic(() => import("./sections/TestimonialsSection"), {
//   loading: () => <div className="h-64 bg-background animate-pulse" />,
//   ssr: false,
// }); // Component doesn't exist

const CTASection = dynamic(() => import("./sections/CTASection"), {
  loading: () => <div className="h-48 animate-pulse bg-primary-50" />,
  ssr: false,
});

const AnimatedNavigation = dynamic(() => import("./sections/AnimatedNavigation"), {
  loading: () => (
    <nav className="bg-background/80 fixed top-0 z-50 w-full border-b border-border backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="text-2xl font-bold text-primary-600">Campfire</div>
          <div className="flex gap-3">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="bg-primary-600 h-8 w-16 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </nav>
  ),
  ssr: false,
});

export default function LazyHomepage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<HomepageLoading />}>
        <AnimatedNavigation />

        <Suspense fallback={<div className="h-screen animate-pulse bg-gradient-to-br from-blue-50 to-purple-50" />}>
          <HeroSection />
        </Suspense>

        <Suspense fallback={<div className="h-96 animate-pulse bg-muted" />}>
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<div className="bg-background h-64 animate-pulse" />}>
          {/* <TestimonialsSection /> Component doesn't exist */}
        </Suspense>

        <Suspense fallback={<div className="h-48 animate-pulse bg-primary-50" />}>
          <CTASection />
        </Suspense>
      </Suspense>
    </div>
  );
}
