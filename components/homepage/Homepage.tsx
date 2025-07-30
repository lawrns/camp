"use client";

import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";
import { FlameGradient } from "@/components/unified-ui/components/flame-gradient";
// WidgetProvider is now provided at the page level in app/page.tsx
import { Icon } from "@/lib/ui/Icon";
import { ArrowRight, CheckCircle as Check } from "@phosphor-icons/react";
import Link from "next/link";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";

// Lazy load heavy components
const HandoverChatBubble = lazy(() => import("@/components/homepage/HandoverChatBubble"));
const FeatureTabs = lazy(() => import("@/components/homepage/FeatureTabs"));

// Memoized metric data to prevent recreation on each render
const METRICS_DATA = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 3s", label: "Avg Response Time" },
  { value: "95%", label: "Customer Satisfaction" },
  { value: "24/7", label: "Support Available" },
  { value: "50+", label: "Languages Supported" },
  { value: "10M+", label: "Messages Handled" },
];

// Campfire Homepage with Stripe-inspired design
function Homepage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Memoized scroll handler to prevent unnecessary re-renders
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  // Memoized observer options
  const observerOptions = useMemo(
    () => ({
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    }),
    []
  );

  // Memoized observer callback
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer?.unobserve(entry.target);
      }
    });
  }, []);

  // Memoized observer instance
  const observer = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new IntersectionObserver(observerCallback, observerOptions);
  }, [observerCallback, observerOptions]);

  useEffect(() => {
    setIsVisible(true);

    // Throttled scroll handler for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });

    // Observe all elements with reveal-on-scroll class
    if (observer) {
      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => observer.observe(el));
    }

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      observer?.disconnect();
    };
  }, [handleScroll, observer]);

  return (
    <div className="bg-background text-foreground">
      {/* Include the blue flame gradient definition at the root */}
      <FlameGradient />

      {/* Top Navigation Bar - backdrop-blur removed to fix position:fixed bug */}
      <nav className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo on the left */}
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo size={48} className="h-12 w-12" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-blue-700">
                Campfire
              </span>
            </Link>

            {/* Navigation links on the right */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-foreground font-medium transition-colors hover:text-primary-600">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-background to-primary-100 pb-16 pt-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            {/* Left side - Content */}
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Transform Customer Service Into Your{" "}
                <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-primary-700">
                  Competitive Advantage
                </span>
              </h1>
              <p className="leading-relaxed text-foreground mb-8 max-w-xl text-lg">
                AI-powered customer support that combines human expertise with AI intelligence. 
                Deliver exceptional experiences at scale with seamless AI-to-human handover.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl sm:justify-start"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="rounded-xl border-2 border-border px-8 py-4 text-center font-semibold text-primary-600 transition-all duration-300 hover:border-border hover:bg-primary-50"
                >
                  View Features
                </Link>
              </div>
            </div>

            {/* Right side - Visual Demo */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <Suspense
                  fallback={
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-background p-6 shadow-2xl">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  }
                >
                  <HandoverChatBubble />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background py-20">
        <div className="container mx-auto px-6">
          <div className="reveal-on-scroll mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground">
              Everything you need for world-class support
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground">
              Campfire combines AI intelligence with human expertise to deliver exceptional customer experiences
            </p>
          </div>
          <div className="reveal-on-scroll mx-auto max-w-5xl">
            <Suspense
              fallback={
                <div className="flex h-96 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              }
            >
              <FeatureTabs />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Trust Metrics Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold">
              Trusted by thousands of companies worldwide
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-primary-100">
              Our AI handles millions of conversations daily
            </p>
          </div>
          <div className="overflow-hidden py-8">
            <div className="animate-scroll scrollbar-hide flex overflow-x-auto md:justify-center">
              {[0, 1].map((setIndex) => (
                <div key={setIndex} className="flex flex-shrink-0 gap-8 px-4 md:gap-16 md:px-8">
                  {METRICS_DATA.map((metric, index) => (
                    <div key={`${setIndex}-${index}`} className="flex-shrink-0 whitespace-nowrap px-8 text-center">
                      <div className="mb-2 text-3xl font-bold">{metric.value}</div>
                      <div className="text-sm text-primary-200 md:text-base">{metric.label}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-background py-20">
        <div className="container mx-auto px-6">
          <div className="reveal-on-scroll mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground">Simple, transparent pricing</h2>
            <p className="text-lg text-foreground">Start free and scale as you grow</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="reveal-on-scroll rounded-2xl border border-border bg-background p-6 shadow-lg">
              <h3 className="mb-2 text-2xl font-bold">Starter</h3>
              <p className="mb-6 text-foreground">Perfect for small teams</p>
              <div className="mb-6 text-4xl font-bold">
                $0<span className="text-xl font-normal text-foreground">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Up to 100 conversations/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Basic AI capabilities</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Email support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">1 team member</span>
                </li>
              </ul>
              <Link
                className="block w-full rounded-lg bg-muted px-6 py-3 text-center font-semibold text-foreground transition-colors hover:bg-muted/80"
                href="/signup"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="reveal-on-scroll scale-105 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-xl">
              <h3 className="mb-4 text-2xl font-bold">The Campfire Difference</h3>
              <p className="mb-6 text-primary-100">For growing businesses</p>
              <div className="mb-6 text-4xl font-bold">
                $99<span className="text-xl font-normal text-primary-100">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary-300" />
                  <span>Unlimited conversations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary-300" />
                  <span>Advanced AI with learning</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary-300" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary-300" />
                  <span>Up to 10 team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary-300" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <Link
                className="block w-full rounded-lg bg-background px-6 py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                href="/signup"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="reveal-on-scroll rounded-2xl border border-border bg-background p-6 shadow-lg">
              <h3 className="mb-2 text-2xl font-bold">Enterprise</h3>
              <p className="mb-6 text-foreground">For large organizations</p>
              <div className="mb-6 text-4xl font-bold">Custom</div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Dedicated infrastructure</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">SLA guarantees</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">Unlimited team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-foreground">White-label options</span>
                </li>
              </ul>
              <button className="block w-full rounded-lg bg-neutral-900 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-neutral-800">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            Ready to revolutionize your customer support?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-100">
            Join thousands of companies already using Campfire to deliver magical support experiences
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="rounded-xl bg-background px-8 py-4 font-semibold text-primary-600 shadow-lg transition-all duration-300 hover:bg-primary-50 hover:shadow-xl"
              href="/signup"
            >
              Start Free Trial
            </Link>
            <button className="rounded-xl border-2 border-white bg-white/10 px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-white/20">
              Schedule Demo
            </button>
          </div>
          <p className="mt-6 text-primary-100">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}

export default memo(Homepage);
