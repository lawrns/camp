"use client";

import { Suspense } from 'react';
import { SafeClientOnly } from '@/components/SafeClientOnly';
import { EnhancedWidgetProvider } from '@/components/widget/enhanced';
import { OptimizedNav } from '@/components/homepage/OptimizedNav';
import { OptimizedHero } from '@/components/homepage/OptimizedHero';
import { InteractiveChatDemo } from '@/components/homepage/InteractiveChatDemo';
import { FeaturesShowcase } from '@/components/homepage/FeaturesShowcase';
import { SocialProof } from '@/components/homepage/SocialProof';
import { FinalCTA } from '@/components/homepage/FinalCTA';

// Performance-optimized loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-xl font-semibold text-gray-700">Loading Campfire...</div>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Optimized Navigation */}
      <OptimizedNav />
      
      <Suspense fallback={<LoadingSpinner />}>
        {/* Optimized Hero Section */}
        <OptimizedHero />

        {/* Interactive Chat Demo */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                See Campfire in Action
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Watch how our AI handles real customer conversations with human-like responses and seamless handoffs.
              </p>
            </div>
            <InteractiveChatDemo />
          </div>
        </section>

        {/* Features Showcase */}
        <FeaturesShowcase />

        {/* Social Proof */}
        <SocialProof />

        {/* Final CTA */}
        <FinalCTA />

        {/* Enhanced Widget */}
        <SafeClientOnly>
          <EnhancedWidgetProvider
            organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd"
            debug={true}
            config={{
              organizationName: "Campfire Support",
              primaryColor: "#3b82f6",
              position: "bottom-right",
              welcomeMessage: "Hi! How can we help you today?",
              showWelcomeMessage: true,
              enableFAQ: true,
              enableHelp: true,
              contactInfo: {
                email: "support@campfire.com",
                businessHours: {
                  monday: "9:00 AM - 6:00 PM",
                  tuesday: "9:00 AM - 6:00 PM",
                  wednesday: "9:00 AM - 6:00 PM",
                  thursday: "9:00 AM - 6:00 PM",
                  friday: "9:00 AM - 6:00 PM",
                  saturday: "Closed",
                  sunday: "Closed"
                }
              }
            }}
          />
        </SafeClientOnly>
      </Suspense>
    </main>
  );
}