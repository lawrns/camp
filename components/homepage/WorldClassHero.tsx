"use client";

import { motion } from 'framer-motion';
import { ArrowRight, Users, Zap, CheckCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export const WorldClassHero = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-24 lg:gap-16 items-start">
          
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left lg:col-span-6 lg:col-start-1 max-w-prose lg:max-w-[620px]"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">Trusted by 10,000+ companies</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight max-w-full break-words overflow-wrap-anywhere">
              Customer support that{' '}
<span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-blue-600 font-bold">feels human</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-prose lg:max-w-[620px] mx-auto lg:mx-0 break-words whitespace-pre-wrap text-balance"
            >
              AI that understands context and seamlessly hands over to humans when needed. Deliver instant, intelligent responses your customers love.
            </motion.p>

            {/* Features */}
<motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 sm:mb-8 max-w-full mx-auto lg:mx-0">
              <style jsx>{` .break-words { word-break: break-word; } `}</style>
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 p-3 h-12">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Instant responses</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 p-3 h-12">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">24/7 availability</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 p-3 h-12">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Human handoff</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 p-3 h-12">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Multi-language</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/demo"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-normal min-w-0"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="break-words">Start Free Trial</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
              </Link>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base whitespace-normal min-w-0"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="break-words">Watch Demo</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column - Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center relative mt-8 lg:mt-0 lg:col-span-5 lg:col-start-8 order-2 lg:order-none"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-lg mx-auto relative">
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
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-4 min-h-[280px] sm:min-h-[320px]">
                {/* Customer message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-br-md w-fit max-w-[80%] sm:max-w-xs md:max-w-sm break-words whitespace-pre-wrap hyphens-auto text-sm">
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
<div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md max-w-[80%] sm:max-w-xs md:max-w-sm break-words whitespace-pre-wrap hyphens-auto text-sm">
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
                  <div className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-xs text-blue-700">
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
                  <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md max-w-[80%] sm:max-w-xs md:max-w-sm text-sm break-words whitespace-pre-wrap hyphens-auto">
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
              className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-2.5 shadow-lg border z-10"
            >
              <div className="text-center">
                <div className="text-xs sm:text-sm md:text-base font-bold text-green-600">2.3s</div>
                <div className="text-[10px] sm:text-xs text-gray-500">avg response</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.2, duration: 0.5 }}
              className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 md:bottom-6 md:left-6 bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-2.5 shadow-lg border z-10"
            >
              <div className="text-center">
                <div className="text-xs sm:text-sm md:text-base font-bold text-blue-600">98%</div>
                <div className="text-[10px] sm:text-xs text-gray-500">satisfaction</div>
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