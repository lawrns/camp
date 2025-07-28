"use client";

import Link from "next/link";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { ArrowRight, Rocket } from "@/lib/icons/optimized-icons";

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <OptimizedMotion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Transform Your Customer Communication?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            Join thousands of teams already using Campfire to create exceptional customer experiences.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="bg-background hover:bg-background inline-flex items-center justify-center gap-ds-2 rounded-ds-lg px-8 py-4 text-base font-semibold text-blue-600 transition-colors"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/contact"
              className="hover:bg-background/10 inline-flex items-center justify-center gap-ds-2 rounded-ds-lg border border-white/20 bg-transparent px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              <Rocket className="h-5 w-5" />
              Schedule Demo
            </Link>
          </div>
        </OptimizedMotion.div>
      </div>
    </section>
  );
}
