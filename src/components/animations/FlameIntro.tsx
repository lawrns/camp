"use client";

import Image from "next/image";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";

interface FlameIntroProps {
  className?: string;
}

/**
 * FlameIntro – animated mascot intro using flamey.png
 *
 * Single Framer Motion timeline ensures synchronized playback.
 * GPU-friendly: only transform, filter, and box-shadow properties animated.
 */
export const FlameIntro = ({ className }: FlameIntroProps) => (
  <OptimizedMotion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate="animate"
    variants={{
      animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, ease: "easeOut" },
      },
    }}
    className={cn("relative mx-auto h-32 w-32", className)}
  >
    {/* Flame PNG with subtle flicker */}
    <OptimizedMotion.div
      variants={{
        animate: {
          skewY: [0, 2, -2, 0],
          filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"],
          transition: { delay: 0.2, duration: 0.6, times: [0, 0.3, 0.7, 1] },
        },
      }}
      style={{ originY: "100%" }}
      className="h-full w-full"
    >
      <Image src="/images/flamey.png" alt="Campfire mascot" fill priority />
    </OptimizedMotion.div>

    {/* Circuit spark / chat bubble outline */}
    <svg width="72" height="56" viewBox="0 0 72 56" className="absolute -right-4 top-4">
      <path
        d="M8 8h48v24H24l-16 16V8z"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    {/* Bloom glow behind logo */}
    <OptimizedMotion.div
      variants={{
        animate: {
          boxShadow: [
            "0 0 0 rgba(124, 58, 237, 0)",
            "0 0 24px rgba(124, 58, 237, 0.35)",
            "0 0 12px rgba(124, 58, 237, 0.15)",
          ],
          transition: { delay: 1.2, duration: 0.6, times: [0, 0.5, 1] },
        },
      }}
      className="absolute inset-0 rounded-ds-full"
    />
  </OptimizedMotion.div>
);

export default FlameIntro;
