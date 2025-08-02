"use client";

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle, Play, Star, Users, Zap, MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export const EnhancedHero = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Chat animation sequence
  const chatMessages = [
    { type: 'customer', text: "Hi! I need help with my billing issue", delay: 1000 },
    { type: 'ai', text: "Hi there! I'd be happy to help with your billing issue. Let me look up your account details...", delay: 2500 },
    { type: 'handover', text: "🤝 Connecting you with a specialist...", delay: 4000 }
  ];

  useEffect(() => {
    if (shouldReduceMotion) return;

    const timer = setTimeout(() => {
      if (currentMessageIndex < chatMessages.length - 1) {
        setCurrentMessageIndex(prev => prev + 1);
      }
    }, chatMessages[currentMessageIndex]?.delay || 1000);

    return () => clearTimeout(timer);
  }, [currentMessageIndex, shouldReduceMotion, chatMessages]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Optimized Background - Using CSS gradients instead of heavy blurs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* Subtle geometric patterns instead of animated blurs */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full transform rotate-45"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500 rounded-full transform -rotate-12"></div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          
          {/* Left Column - Content */}
          <div className="text-left space-y-8">
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-3 bg-white/90 border border-gray-200/60 px-4 py-2 rounded-full shadow-sm"
            >
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">Join 10,000+ companies</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Customer support that{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                feels human
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-600 leading-relaxed max-w-2xl"
            >
              Deliver instant, intelligent responses that your customers love. AI that understands context and knows when to hand over to humans.
            </motion.p>

            {/* Feature Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-2 gap-4 max-w-lg"
            >
              {[
                "Instant responses",
                "24/7 availability", 
                "Seamless handover",
                "Multi-language"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
                onClick={() => setIsVideoPlaying(true)}
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex items-center space-x-6 pt-4"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">4.9/5 rating</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">10M+</span> conversations
              </div>
            </motion.div>
          </div>

          {/* Right Column - Interactive Chat Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Chat Interface */}
            <div className="relative max-w-md mx-auto">
              {/* Chat Window */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-white font-medium">Campfire Support</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white/90 text-sm">Online</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-6 space-y-4 min-h-[300px]">
                  {chatMessages.slice(0, currentMessageIndex + 1).map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex ${message.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                        message.type === 'customer' 
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : message.type === 'handover'
                          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-bl-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {currentMessageIndex < chatMessages.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Floating Metrics */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200/50"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">2.3s</div>
                    <div className="text-xs text-gray-500">Avg response</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200/50"
              >
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">98%</div>
                    <div className="text-xs text-gray-500">Satisfaction</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Demo video would play here</p>
                <button
                  onClick={() => setIsVideoPlaying(false)}
                  className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};
