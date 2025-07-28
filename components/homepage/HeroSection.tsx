"use client";

import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";
import { Icon } from "@/lib/ui/Icon";
import { ArrowRight, CheckCircle as Check } from "@phosphor-icons/react";
import Link from "next/link";
import { memo } from "react";

// Hero Section Component
export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-background to-primary-100 pb-16 pt-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* Left side - Content */}
          <div className="text-left">
            <h1 className="text-5xl font-bold text-foreground">
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
                href="/login"
                className="bg-background hover:bg-muted inline-flex transform items-center justify-center rounded-lg px-8 py-4 font-semibold text-primary-700 shadow-xl transition-all hover:scale-105"
              >
                Get Started Free
                <Icon icon={ArrowRight} className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="hover:bg-muted inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 font-semibold text-white transition-all hover:text-primary-800"
              >
                View Features
              </Link>
            </div>
          </div>

          {/* Right side - Visual Demo */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="bg-background/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-auto">Campfire Support</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm text-gray-800">Hi! I'm here to help you with any questions about our product.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm text-gray-800">Thanks! I'm having trouble with the login process.</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-bold">U</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm text-gray-800">I can help with that! Let me connect you with a human agent who specializes in authentication issues.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
