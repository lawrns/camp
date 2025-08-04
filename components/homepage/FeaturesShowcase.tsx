"use client";

import { motion, useInView } from 'framer-motion';
import { Brain, MessageCircle, Shield, Zap, Users, Clock, Star, CheckCircle } from 'lucide-react';
import { useRef } from 'react';

// Optimized animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// Unified features and social proof data
const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Human-like responses with context understanding",
    metric: "98% accuracy"
  },
  {
    icon: MessageCircle,
    title: "Seamless Handoffs",
    description: "AI to human transitions with full context",
    metric: "Zero friction"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant, GDPR ready",
    metric: "100% secure"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-2 second response times",
    metric: "99.9% uptime"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time support team tools",
    metric: "10x efficiency"
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Always-on customer support",
    metric: "Round the clock"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Support, TechFlow",
    content: "Response time dropped from 4 hours to 2 minutes",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Customer Success, DataSync",
    content: "AI is indistinguishable from human agents",
    rating: 5
  }
];

const stats = [
  { value: "2 min", label: "Response Time" },
  { value: "98%", label: "Satisfaction" },
  { value: "70%", label: "Cost Reduction" },
  { value: "95%", label: "Resolution Rate" }
];

export const FeaturesShowcase = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Unified Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
          >
            Built for Modern Support Teams
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Everything you need, nothing you don't. Optimized for performance and user experience.
          </motion.p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Compact Features Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon size={24} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {feature.description}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    {feature.metric}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={fadeInUp}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-3">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center space-x-6 bg-white rounded-full px-6 py-3 border border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-gray-700">SOC 2 Compliant</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-gray-700">GDPR Ready</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-gray-700">99.9% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};