// HardDrives Component - no animations, pure HTML/CSS
import React from "react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

export function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="bg-background group radius-2xl border border-[var(--fl-color-border-subtle)] p-spacing-lg shadow-card-deep transition-all duration-300 hover:shadow-xl">
      <div
        className={`h-16 w-16 bg-gradient-to-r ${color} mb-6 flex items-center justify-center rounded-ds-xl transition-transform group-hover:scale-110`}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="leading-relaxed text-foreground">{description}</p>
    </div>
  );
}
