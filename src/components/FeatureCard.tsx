"use client";

import React from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
}

export default function FeatureCard({ icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="feature-card group"
    >
      {/* Morphing Icon Container */}
      <OptimizedMotion.div
        className="to-accent-purple/10 relative mb-6 flex h-16 w-16 items-center justify-center overflow-hidden radius-2xl bg-gradient-to-br from-comrad-blue-50 transition-transform duration-300 group-hover:scale-110"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <div className="to-accent-purple/10 absolute inset-0 bg-gradient-to-br from-comrad-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative z-10 text-3xl transition-colors duration-300 group-hover:text-comrad-blue-500">
          {icon}
        </div>
      </OptimizedMotion.div>

      {/* Title */}
      <h3 className="mb-4 text-lg font-semibold text-comrad-neutral-900 transition-colors duration-300 group-hover:text-comrad-blue-500">
        {title}
      </h3>

      {/* Description */}
      <p className="leading-relaxed text-comrad-neutral-600">{description}</p>

      {/* Animated underline */}
      <OptimizedMotion.div className="to-accent-aqua mt-4 h-1 w-0 rounded-ds-full bg-gradient-to-r from-comrad-blue-500 transition-all duration-500 group-hover:w-full" />
    </OptimizedMotion.div>
  );
}
