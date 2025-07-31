"use client";

import { ArrowRight, Sparkles, Terminal, Zap, Bot, Users, Star } from 'lucide-react';
import Link from 'next/link';

export const OptimizedHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-blue-200/50 shadow-sm">
            <Sparkles size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              AI-Powered Customer Service
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Customer Service
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Deliver instant, intelligent responses that delight customers and reduce support costs by up to 70%.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/demo"
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Terminal size={20} />
              <span>Start Free Trial</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#demo"
              className="bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 px-8 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold hover:bg-white hover:border-gray-400 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Bot size={20} />
              <span>Watch Demo</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-600" />
              <span>10,000+ Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-blue-600" />
              <span>70% Cost Reduction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};