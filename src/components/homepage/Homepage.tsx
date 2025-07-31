"use client";

import { BrandLogo } from "@/components/unified-ui/components/BrandLogo";
import { FlameGradient } from "@/components/unified-ui/components/flame-gradient";
import { ArrowRight, CheckCircle as Check, Lightning, ShieldCheck, Users, ChartBar, Star, Globe } from "@phosphor-icons/react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";

// Trust metrics data
const TRUST_METRICS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 3s", label: "Avg Response Time" },
  { value: "95%", label: "Customer Satisfaction" },
  { value: "24/7", label: "Support Available" },
  { value: "50+", label: "Languages Supported" },
  { value: "10M+", label: "Messages Handled" },
];

// Modern Campfire Homepage
function Homepage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by showing loading state until client-side mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Campfire...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <FlameGradient />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={32} className="h-8 w-8" />
              <span className="text-xl font-bold text-blue-600">Campfire</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="hero-center lg:text-left">
              <h1 className="heading-center lg:text-left text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transform Customer Service Into Your{" "}
                <span className="text-blue-600">Competitive Advantage</span>
              </h1>
              <p className="paragraph-center lg:text-left text-xl text-gray-600 mb-8 leading-relaxed mx-auto lg:mx-0">
                AI-powered customer support that combines human expertise with AI intelligence. 
                Deliver exceptional experiences at scale with seamless AI-to-human handover.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/features"
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                >
                  View Features
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-auto">Campfire Support</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-100 text-blue-800 p-3 rounded-lg max-w-xs">
                    Hi! I'm having trouble with my billing...
                  </div>
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-xs ml-auto">
                    I'd be happy to help! Let me transfer you to our billing specialist.
                  </div>
                  <div className="text-center text-sm text-gray-500 py-2">
                    🔄 Transferring to human agent...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything you need section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need for world-class support
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Campfire combines AI intelligence with human expertise to deliver exceptional customer experiences
          </p>
          
          {/* Feature tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
              📥 Unified Inbox
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200">
              🤖 AI Agents
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200">
              ⚡ Real-time Engine
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200">
              📊 Analytics & Insights
            </button>
          </div>

          {/* Unified Inbox Feature */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Unified Inbox</h3>
                <p className="text-gray-600 mb-6">
                  All conversations in one place. AI and human agents work side-by-side seamlessly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span>Smart queue management with intelligent routing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span>Real-time presence and typing indicators</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span>Context-aware assignment based on expertise</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span>Seamless handover between AI and human agents</span>
                  </li>
                </ul>
                <button className="mt-6 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Learn more about unified inbox →
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Product question about...</div>
                      <div className="text-xs text-gray-500">AI handling • 98% confidence</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Billing issue with A...</div>
                      <div className="text-xs text-gray-500">Technical Issue with AI • 8m ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Mike T.</div>
                      <div className="text-xs text-gray-500">Technical Issue with AI • 8m ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Trusted by thousands of companies worldwide
          </h2>
          <p className="text-blue-100 mb-12">Our AI handles millions of conversations daily</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {TRUST_METRICS.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                <div className="text-blue-100 text-sm">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Start free and scale as you grow
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Perfect for small teams</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $0<span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Up to 100 conversations/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Basic AI capabilities</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Email support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>1 team member</span>
                </li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-blue-600 text-white rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  The Campfire Difference
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-blue-100 mb-6">For growing businesses</p>
              <div className="text-4xl font-bold mb-6">
                $99<span className="text-lg text-blue-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-200" />
                  <span>Unlimited conversations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-200" />
                  <span>Advanced AI with learning</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-200" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-200" />
                  <span>Up to 10 team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-200" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For large organizations</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">Custom</div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Dedicated infrastructure</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>SLA guarantees</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>White-label options</span>
                </li>
              </ul>
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to revolutionize your customer support?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies already using Campfire to deliver magical support experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>
          <p className="text-blue-200 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}

// Export memoized component for better performance
export default memo(Homepage);
