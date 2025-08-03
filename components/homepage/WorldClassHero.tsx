"use client";

import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Users, Zap, CheckCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export const WorldClassHero = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6"
            >
              <Users className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">Trusted by 10,000+ companies</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Customer support that{' '}
              <span className="text-blue-600">feels human</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              AI that understands context and seamlessly hands over to humans when needed. 
              Deliver instant, intelligent responses your customers love.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto lg:mx-0"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Instant responses</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">24/7 availability</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Human handoff</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Multi-language</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/demo"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column - Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center relative"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-md w-full">
              {/* Header */}
              <div className="bg-blue-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-white font-medium">Campfire Support</span>
                </div>
              </div>

              {/* Chat */}
              <div className="p-6 space-y-4 h-80">
                {/* Customer message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                    Hi! I need help with my billing
                  </div>
                </div>

                {/* AI response */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs">
                    I'd be happy to help with your billing! Let me look up your account...
                  </div>
                </motion.div>

                {/* Handoff indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs text-blue-700">
                    🤝 Connecting you with Sarah...
                  </div>
                </motion.div>

                {/* Human agent message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs">
                    Hi! I'm Sarah from billing. I can see your account and I'm ready to help!
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">2.3s</div>
                <div className="text-xs text-gray-500">avg response</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.2, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">98%</div>
                <div className="text-xs text-gray-500">satisfaction</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsVideoOpen(false)}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-4xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            <div className="aspect-video bg-gray-900 rounded overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}; 