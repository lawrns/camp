"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

// Optimized animation variants - minimal re-renders
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const scaleOnHover = { scale: 1.05, transition: { duration: 0.2 } };

export const OptimizedHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Optimized transforms - only recalculate on scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Optimized Parallax Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        style={{ y: backgroundY }}
      />
      
      {/* Floating Elements - Performance Optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full opacity-60"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-2 h-2 bg-indigo-400 rounded-full opacity-50"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-6xl mx-auto"
          style={{ y: textY }}
        >
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-blue-200/50 shadow-lg"
          >
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              AI-Powered Customer Service Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Transform Customer Service Into Your{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Competitive Advantage
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            AI support so advanced, your customers can't tell it's not human. Deliver instant, intelligent responses that feel completely natural while reducing costs and increasing satisfaction.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
          >
            <motion.div whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
              <Link
                href="/demo"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl flex items-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                <Terminal size={24} />
                <span>Start Free Trial</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              </Link>
            </motion.div>

            <motion.div whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
              <Link
                href="#demo"
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 text-gray-700 px-10 py-5 rounded-xl flex items-center space-x-3 text-lg font-semibold hover:border-blue-500/50 hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                <span>Watch Demo</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200/50 shadow-lg"
          >
            <span className="text-gray-700 font-medium">
              Trusted by 10,000+ companies worldwide
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
