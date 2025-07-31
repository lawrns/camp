"use client";

import { motion } from 'framer-motion';
import { ArrowRight, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Optimized animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
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

// Pre-defined benefits for performance
const benefits = [
  "No credit card required",
  "14-day free trial",
  "Cancel anytime",
  "Full feature access"
];

export const FinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-cyan-600/90" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Ready to Transform Your Customer Service?
          </motion.h2>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto"
          >
            Join thousands of companies that have already revolutionized their support with Campfire. Start your free trial today.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
          >
            <motion.div whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="bg-white text-blue-600 px-10 py-5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-xl flex items-center space-x-3"
              >
                <Zap size={24} />
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
                href="/demo"
                className="border-2 border-white text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-700 transition-colors"
              >
                Book a Live Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center items-center space-x-6 text-blue-100"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 pt-8 border-t border-white/20"
          >
            <p className="text-blue-100 text-sm">
              Trusted by 10,000+ companies worldwide • 99.9% uptime guarantee • SOC 2 compliant
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}; 