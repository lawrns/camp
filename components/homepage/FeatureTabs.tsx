"use client";

import { Icon } from "@/lib/ui/Icon";
import { MessageCircle, Bot, Zap, ChartLine, Users, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";

// Feature data
const features = [
  {
    id: "unified-inbox",
    title: "Unified Inbox",
    description: "Manage all customer conversations from one powerful interface. Email, chat, social media, and more—all in one place.",
    benefits: [
      "Centralized conversation management",
      "Multi-channel support",
      "Smart conversation routing",
      "Real-time collaboration"
    ],
    icon: MessageCircle,
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    description: "Intelligent AI agents that understand context, learn from interactions, and seamlessly hand off to humans when needed.",
    benefits: [
      "Context-aware responses",
      "Automatic learning",
      "Smart handoff detection",
      "24/7 availability"
    ],
    icon: Bot,
  },
  {
    id: "real-time",
    title: "Real-time Collaboration",
    description: "Work together seamlessly with real-time updates, shared notes, and instant notifications across your entire team.",
    benefits: [
      "Live collaboration tools",
      "Shared conversation notes",
      "Instant notifications",
      "Team performance insights"
    ],
    icon: Zap,
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Deep insights into customer satisfaction, agent performance, and conversation patterns to continuously improve your support.",
    benefits: [
      "Customer satisfaction tracking",
      "Agent performance metrics",
      "Conversation analytics",
      "Predictive insights"
    ],
    icon: ChartLine,
  },
];

// Visual components for each feature
const UnifiedInboxVisual = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm text-gray-500 ml-auto">Unified Inbox</span>
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Icon icon={MessageCircle} className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">Chat Support</div>
          <div className="text-xs text-gray-500">New message from John Doe</div>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
          <Icon icon={Users} className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">Email Support</div>
          <div className="text-xs text-gray-500">Ticket #1234 - Login Issue</div>
        </div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Icon icon={Globe} className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">Social Media</div>
          <div className="text-xs text-gray-500">Twitter DM from @customer</div>
        </div>
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  </div>
);

const AIAgentsVisual = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm text-gray-500 ml-auto">AI Agent</span>
    </div>
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Icon icon={Bot} className="w-4 h-4 text-white" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
          <p className="text-sm text-gray-800">Hi! I'm here to help you with any questions about our product.</p>
        </div>
      </div>
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
          <p className="text-sm text-gray-800">Thanks! I'm having trouble with the login process.</p>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600 text-sm font-bold">U</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Icon icon={Bot} className="w-4 h-4 text-white" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
          <p className="text-sm text-gray-800">I can help with that! Let me connect you with a human agent who specializes in authentication issues.</p>
        </div>
      </div>
    </div>
  </div>
);

const RealTimeVisual = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm text-gray-500 ml-auto">Team Collaboration</span>
    </div>
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">Sarah (Agent)</span>
          </div>
          <span className="text-xs text-gray-500">2 min ago</span>
        </div>
        <p className="text-sm text-gray-700">Customer is asking about the new feature rollout. I've added notes to the conversation.</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">Mike (Manager)</span>
          </div>
          <span className="text-xs text-gray-500">Just now</span>
        </div>
        <p className="text-sm text-gray-700">Thanks Sarah! I can see the notes. Let me take over this conversation.</p>
      </div>
    </div>
  </div>
);

const AnalyticsVisual = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-sm text-gray-500 ml-auto">Analytics Dashboard</span>
    </div>
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Customer Satisfaction</span>
          <span className="text-sm font-bold text-green-600">4.8/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Response Time</span>
          <span className="text-sm font-bold text-blue-600">2.3s</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Resolution Rate</span>
          <span className="text-sm font-bold text-purple-600">94%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
        </div>
      </div>
    </div>
  </div>
);

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = features[activeTab] || features[0];

  return (
    <div className="bg-background overflow-hidden rounded-2xl border border-border shadow-xl">
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-border bg-muted">
        {features.map((feature, index) => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(index)}
            className={`relative flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
              activeTab === index ? "bg-background text-primary-600" : "text-gray-600 hover:bg-background/50 hover:text-gray-900"
            }`}
          >
            <feature.icon className="h-5 w-5" />
            <span>{feature.title}</span>

            {/* Active indicator */}
            {activeTab === index && <div className="bg-primary-600 absolute bottom-0 left-0 right-0 h-0.5"></div>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left side - Content */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-3xl font-bold text-gray-900">{activeFeature?.title}</h3>
              <p className="leading-relaxed text-foreground text-xl">{activeFeature?.description}</p>
            </div>

            <ul className="space-y-3">
              {activeFeature?.benefits?.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <div className="bg-primary-600 h-2 w-2 rounded-full"></div>
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <button className="hover:text-primary-700 inline-flex min-h-[44px] items-center gap-3 px-4 py-3 font-medium text-primary-600 transition-colors">
              Learn more about {activeFeature?.title?.toLowerCase()}
              <span className="text-xl">→</span>
            </button>
          </div>

          {/* Right side - Visual Demo */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              {/* Feature-specific visual representation */}
              {activeTab === 0 && <UnifiedInboxVisual />}
              {activeTab === 1 && <AIAgentsVisual />}
              {activeTab === 2 && <RealTimeVisual />}
              {activeTab === 3 && <AnalyticsVisual />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
