"use client";

import { Icon } from "@/lib/ui/Icon";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

// CTA Section Component
export const CTASection = memo(function CTASection() {
  return (
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
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 inline-flex transform items-center justify-center rounded-lg px-8 py-4 font-semibold text-white transition-all hover:scale-105"
          >
            Start Free Trial
            <Icon icon={ArrowRight} className="ml-2 h-5 w-5" />
          </Link>
          <button className="rounded-lg border-2 border-white bg-white/10 px-8 py-4 font-semibold text-white transition-all hover:bg-white/20">
            Schedule Demo
          </button>
        </div>
        <p className="mt-6 text-primary-100">No credit card required • 14-day free trial • Cancel anytime</p>
      </div>
    </section>
  );
});
