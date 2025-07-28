"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Brain, Lightning, Shield, Target } from "@/lib/icons/optimized-icons";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Smart automation that learns from every interaction to provide better customer experiences.",
  },
  {
    icon: Lightning,
    title: "Instant Responses",
    description: "Real-time communication with intelligent routing and instant response suggestions.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with end-to-end encryption and compliance certifications.",
  },
  {
    icon: Target,
    title: "Precision Targeting",
    description: "Deliver the right message to the right customer at the right time, every time.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-[var(--fl-color-background-subtle)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Everything You Need to Delight Customers
          </h2>
          <p className="text-foreground mx-auto max-w-2xl text-lg">
            Built for modern teams who demand both power and simplicity in their customer communication.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <OptimizedMotion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-ds-xl p-spacing-md shadow-card-base transition-shadow hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--fl-color-info-subtle)]">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-foreground">{feature.description}</p>
            </OptimizedMotion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
