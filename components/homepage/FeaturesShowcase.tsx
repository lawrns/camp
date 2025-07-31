"use client";

import { motion, useInView } from 'framer-motion';
import { Brain, MessageCircle, Shield, Zap, Users, Clock } from 'lucide-react';
import { useRef } from 'react';

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

// Pre-defined features for performance
const features = [
  {
    id: 1,
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced natural language processing that understands context and provides human-like responses.",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    icon: MessageCircle,
    title: "Seamless Handoffs",
    description: "Smooth transitions between AI and human agents with full context preservation.",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 3,
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption and GDPR compliance built-in.",
    color: "from-green-500 to-green-600"
  },
  {
    id: 4,
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-2 second response times with 99.9% uptime guarantee.",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    id: 5,
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration tools for your support team with live typing indicators.",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    id: 6,
    icon: Clock,
    title: "24/7 Availability",
    description: "Always-on support that never sleeps, handling requests around the clock.",
    color: "from-red-500 to-red-600"
  }
];

export const FeaturesShowcase = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
          >
            Everything You Need for Modern Customer Service
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Built for scale, designed for humans. Every feature is optimized for performance and user experience.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeInUp}
              whileHover={scaleOnHover}
              className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={32} className="text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white"
        >
          <h3 className="text-3xl font-bold mb-4">
            Built for Performance
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Every component is optimized for speed and efficiency, ensuring your customers get instant responses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">2s</div>
              <div className="text-blue-100">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10x</div>
              <div className="text-blue-100">Faster Resolution</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}; 