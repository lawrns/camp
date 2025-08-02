"use client";

import { motion } from "framer-motion";
import { Fire } from "@phosphor-icons/react";

export const AnimatedFlameIcon = () => (
  <motion.div
    className="relative"
    animate={{
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-red-500 rounded-full blur-sm opacity-50" />
    <Fire className="h-12 w-12 text-orange-500 relative z-10" />
  </motion.div>
); 