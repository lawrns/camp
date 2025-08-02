"use client";

import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { AnimatedFlameIcon } from "./AnimatedFlameIcon";

interface PremiumHeaderProps {
  onClose: () => void;
}

export const PremiumHeader = ({ onClose }: PremiumHeaderProps) => (
  <div className="relative overflow-hidden bg-gradient-to-b from-orange-500 via-red-500 to-yellow-500 p-6">
    <div className="absolute inset-0 bg-black/10" />
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <AnimatedFlameIcon />
        <div>
          <h1 className="text-2xl font-bold text-white">Campfire</h1>
          <p className="text-sm text-white/80">Customer Support Platform</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        onClick={onClose}
        aria-label="Close menu"
      >
        <X className="h-5 w-5 text-white" />
      </motion.button>
    </motion.div>
  </div>
); 