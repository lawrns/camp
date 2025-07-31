"use client";

import { motion, useInView } from 'framer-motion';
import { Star, Quote, CheckCircle } from 'lucide-react';
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

// Pre-defined testimonials for performance
const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Head of Support, TechFlow",
    content: "Campfire reduced our response time from 4 hours to 2 minutes. Our customer satisfaction jumped 40% in the first month.",
    rating: 5,
    avatar: "SC"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Customer Success Manager, DataSync",
    content: "The AI is indistinguishable from our human agents. Customers actually prefer it for quick technical questions.",
    rating: 5,
    avatar: "MR"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "VP Operations, CloudScale",
    content: "We handle 10x more support requests with the same team size. The ROI was immediate and substantial.",
    rating: 5,
    avatar: "EW"
  }
];

const stats = [
  { label: "Response Time", value: "2 min", suffix: "avg" },
  { label: "Customer Satisfaction", value: "98%", suffix: "rating" },
  { label: "Cost Reduction", value: "70%", suffix: "savings" },
  { label: "Resolution Rate", value: "95%", suffix: "success" }
];

export const SocialProof = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gray-50">
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
            Trusted by Industry Leaders
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Join thousands of companies that have transformed their customer service with Campfire
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">
                {stat.suffix}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={fadeInUp}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <div className="mb-6">
                <Quote size={24} className="text-blue-600 mb-2" />
                <p className="text-gray-700 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
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
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-6 bg-white rounded-full px-8 py-4 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">SOC 2 Compliant</span>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">GDPR Ready</span>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">99.9% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}; 