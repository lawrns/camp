"use client";

import { Suspense } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { FeatureCard } from '@/components/FeatureCard';
import { SafeClientOnly } from '@/components/SafeClientOnly';
import { Robot, Users, ChatCircle } from '@phosphor-icons/react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={<div>Loading...</div>}>
        <HeroSection />
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI-Powered Support"
              description="Instant responses with human-like conversation quality"
              icon={<Robot size={24} />}
            />
            <FeatureCard
              title="Seamless Handoffs"
              description="Context-preserving transitions between AI and human agents"
              icon={<Users size={24} />}
            />
            <FeatureCard
              title="Real-time Collaboration"
              description="Live chat with typing indicators and instant delivery"
              icon={<ChatCircle size={24} />}
            />
          </div>
        </section>
        <SafeClientOnly>
          <div className="fixed bottom-4 right-4">
            {/* Widget will be rendered here */}
          </div>
        </SafeClientOnly>
      </Suspense>
    </main>
  );
}