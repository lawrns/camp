"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Parallax Background Component
export const ParallaxBackground = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      <OptimizedMotion.div
        style={{ y: y1 }}
        className="absolute -left-20 -top-20 h-96 w-96 rounded-ds-full bg-gradient-to-r from-blue-600/10 to-blue-800/10 blur-3xl"
      />
      <OptimizedMotion.div
        style={{ y: y2 }}
        className="absolute -right-20 top-1/3 h-64 w-64 rounded-ds-full bg-gradient-to-l from-blue-500/10 to-transparent blur-2xl"
      />
      <OptimizedMotion.div
        style={{ y: y1 }}
        className="from-blue-400/8 absolute bottom-1/4 left-1/3 h-80 w-80 rounded-ds-full bg-gradient-to-r to-transparent blur-3xl"
      />
    </div>
  );
};
