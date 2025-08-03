"use client";

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Play, Star, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export const WorldClassHero = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoPlaying) {
        setIsVideoPlaying(false);
      }
    };
    
    if (isVideoPlaying) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isVideoPlaying]);


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 motion-safe:animate-pulse"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 motion-safe:animate-pulse"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 0.7 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start max-w-6xl mx-auto w-full overflow-hidden">
          
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left max-w-lg lg:max-w-xl xl:max-w-2xl md:col-span-1"
          >
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full mb-8 shadow-sm"
            >
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">C</div>
              </div>
              <span className="text-sm font-medium text-gray-700">Join 10,000+ companies</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Customer support that 
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                feels human
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg"
            >
              Deliver instant, intelligent responses that your customers love. 
              AI that understands context, and seamlessly 
              hands over to humans when needed.
            </motion.p>

            {/* Key Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">Instant responses</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">24/7 availability</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">Seamless handover</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">Multi-language</span>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Link
                  href="/demo"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center justify-center space-x-2 text-base sm:text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1"
              >
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center justify-center space-x-2 text-base sm:text-lg font-medium hover:border-blue-600 hover:bg-gray-50 transition-all duration-200 shadow-sm transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Watch Demo</span>
                </button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-500"
            >
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>10M+ conversations</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative w-full md:col-span-1 flex justify-center md:justify-end max-w-sm sm:max-w-md lg:max-w-lg"
          >
            {/* Main Demo Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Demo Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 text-white font-medium">Campfire Demo</div>
                </div>
              </div>

              {/* Interactive Chat Demo */}
              <div className="p-6 space-y-4">
                {/* Customer Message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                    Hi! I need help with my billing issue
                  </div>
                </div>

                {/* AI Response with Typing Animation */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      Hi there! I'd be happy to help with your billing issue. 
                      Let me look up your account details...
                    </motion.div>
                  </div>
                </div>

                {/* Handover Indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-2xl rounded-bl-md max-w-xs text-sm">
                    🤝 Handing over to human agent...
                  </div>
                </motion.div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3, duration: 0.5 }}
                className="absolute -top-6 -right-6 bg-white rounded-xl p-2 sm:p-4 shadow-xl border border-gray-200/50 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><div><div className="text-xl font-bold text-green-600">2.3s</div><div className="text-xs text-gray-500 font-medium">Avg response</div></div></div>
                
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.5, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl p-2 sm:p-4 shadow-xl border border-gray-200/50 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><div><div className="text-xl font-bold text-blue-600">98%</div><div className="text-xs text-gray-500 font-medium">Satisfaction</div></div></div>
                
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsVideoPlaying(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-title"
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
              aria-label="Close video"
            >
              ×
            </button>
            <h2 id="video-title" className="sr-only">Campfire Demo Video</h2>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                title="Campfire Demo Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}; 