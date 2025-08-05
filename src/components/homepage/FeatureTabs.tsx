"use client";

import { useState } from "react";
import { ChartBar as BarChart3, Globe, Shield, Sparkles as Sparkles, Users, Zap as Zap,  } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";

interface Feature {
  id: string;
  icon: unknown;
  title: string;
  description: string;
  benefits: string[];
  visual?: string;
}

const features: Feature[] = [
  {
    id: "unified-inbox",
    icon: () => <span className="text-2xl">📥</span>, // Use emoji instead of icon
    title: "Unified Inbox",
    description: "All conversations in one place. AI and human agents work side-by-side seamlessly.",
    benefits: [
      "Smart queue management with intelligent routing",
      "Real-time presence and typing indicators",
      "Context-aware assignment based on expertise",
      "Seamless handover between AI and human agents",
    ],
  },
  {
    id: "ai-agents",
    icon: Sparkles,
    title: "AI Agents",
    description: "RAG-powered AI that feels completely human. No more robotic responses.",
    benefits: [
      "Natural language with personality and empathy",
      "Deep knowledge base integration",
      "Learns from every interaction",
      "Confidence-based escalation",
    ],
  },
  {
    id: "real-time",
    icon: Zap,
    title: "Real-time Engine",
    description: "Lightning-fast infrastructure inspired by the best in the industry.",
    benefits: [
      "Sub-50ms message delivery",
      "WebSocket with automatic reconnection",
      "Edge-deployed for global performance",
      "Offline message queuing",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Understand your support performance with actionable insights.",
    benefits: [
      "Real-time performance dashboards",
      "Customer satisfaction tracking",
      "Agent productivity metrics",
      "Predictive analytics and forecasting",
    ],
  },
];

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = features[activeTab] || features[0];

  return (
    <div className="bg-background overflow-hidden radius-2xl border border-[var(--fl-color-border-subtle)] shadow-xl">
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)]">
        {features.map((feature, index) => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(index)}
            className={`relative flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
              activeTab === index ? "bg-white text-blue-600" : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
            }`}
          >
            {typeof feature.icon === 'function' ? (
              feature.icon()
            ) : (
              <feature.icon className="h-5 w-5" />
            )}
            <span>{feature.title}</span>

            {/* Active indicator */}
            {activeTab === index && <div className="bg-primary absolute bottom-0 left-0 right-0 h-0.5"></div>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-spacing-lg">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left side - Content */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-3xl font-bold text-gray-900">{activeFeature?.title}</h3>
              <p className="leading-relaxed text-foreground text-base">{activeFeature?.description}</p>
            </div>

            <ul className="space-y-3">
              {activeFeature?.benefits?.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
                    <div className="bg-primary h-2 w-2 rounded-ds-full"></div>
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <button className="hover:text-status-info-dark inline-flex min-h-[44px] items-center gap-ds-2 px-4 py-3 font-medium text-blue-600 transition-colors">
              Learn more about {activeFeature?.title?.toLowerCase()}
              <span className="text-base">→</span>
            </button>
          </div>

          {/* Right side - Visual Demo */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-ds-xl bg-gradient-to-br from-gray-50 to-gray-100 p-spacing-lg">
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

// Visual components for each feature
function UnifiedInboxVisual() {
  return (
    <div className="space-y-3">
      <div className="bg-background transform rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base transition-transform hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-500 to-blue-600">
            <Icon icon={Users} className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">John D.</div>
            <div className="text-foreground text-sm">Need help with billing...</div>
          </div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">2m ago</div>
        </div>
      </div>

      <div className="bg-background transform rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 opacity-75 shadow-card-base transition-transform hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-gradient-to-br from-purple-500 to-purple-600">
            <Icon icon={Sparkles} className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Sarah M.</div>
            <div className="text-foreground text-sm">Product question about...</div>
          </div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">5m ago</div>
        </div>
        <div className="mt-2 flex items-center gap-ds-2 text-sm text-blue-600">
          <Icon icon={Sparkles} className="h-3 w-3" />
          AI handling • 94% confidence
        </div>
      </div>

      <div className="bg-background transform rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 opacity-50 shadow-card-base transition-transform hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-gradient-to-br from-green-500 to-green-600">
            <Icon icon={Users} className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Mike T.</div>
            <div className="text-foreground text-sm">Technical issue with API...</div>
          </div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">8m ago</div>
        </div>
      </div>
    </div>
  );
}

function AIAgentsVisual() {
  return (
    <div className="space-y-3">
      <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
        <div className="mb-3 flex items-center gap-ds-2">
          <Icon icon={Sparkles} className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-gray-900">AI Agent Response</span>
        </div>
        <div className="text-foreground space-y-spacing-sm text-sm">
          <p>Hi Sarah! I understand you're having trouble with your subscription renewal.</p>
          <p>Let me look into that for you right away...</p>
          <div className="mt-3 flex items-center gap-ds-2 text-sm text-[var(--fl-color-text-muted)]">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 w-1 rounded-ds-full bg-purple-500" />
              ))}
            </div>
            <span>98% confidence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
          <div className="text-3xl font-bold text-purple-600">2.3s</div>
          <div className="text-foreground text-sm">Avg response time</div>
        </div>
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
          <div className="text-3xl font-bold text-purple-600">94%</div>
          <div className="text-foreground text-sm">Resolution rate</div>
        </div>
      </div>
    </div>
  );
}

function RealTimeVisual() {
  return (
    <div className="space-y-3">
      <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-gray-900">Performance Metrics</span>
          <div className="flex items-center gap-1">
            <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full"></div>
            <span className="text-foreground text-sm">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground">Message Latency</span>
              <span className="text-semantic-success-dark font-medium">47ms</span>
            </div>
            <div className="h-2 w-full rounded-ds-full bg-gray-200">
              <div className="bg-semantic-success h-2 rounded-ds-full" style={{ width: "95%" }}></div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground">Uptime</span>
              <span className="font-medium text-blue-600">99.98%</span>
            </div>
            <div className="h-2 w-full rounded-ds-full bg-gray-200">
              <div className="h-2 rounded-ds-full bg-brand-blue-500" style={{ width: "99.98%" }}></div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-foreground">Active Connections</span>
              <span className="font-medium text-purple-600">24,576</span>
            </div>
            <div className="h-2 w-full rounded-ds-full bg-gray-200">
              <div className="h-2 rounded-ds-full bg-purple-500" style={{ width: "75%" }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-ds-2 text-center">
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm shadow-card-base">
          <Icon icon={Globe} className="mx-auto mb-1 h-4 w-4 text-blue-600" />
          <div className="text-sm font-medium">Global CDN</div>
        </div>
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm shadow-card-base">
          <Icon icon={Shield} className="text-semantic-success-dark mx-auto mb-1 h-4 w-4" />
          <div className="text-sm font-medium">Auto-failover</div>
        </div>
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm shadow-card-base">
          <Icon icon={Zap} className="mx-auto mb-1 h-4 w-4 text-yellow-600" />
          <div className="text-sm font-medium">Edge Deploy</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="space-y-3">
      <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-gray-900">Today's Performance</span>
          <span className="text-foreground text-sm">Real-time</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-3xl font-bold text-gray-900">2,847</div>
            <div className="text-foreground text-sm">Conversations</div>
            <div className="text-semantic-success-dark mt-1 text-sm">↑ 12% from yesterday</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">4.8</div>
            <div className="text-foreground text-sm">Satisfaction</div>
            <div className="text-semantic-success-dark mt-1 text-sm">↑ 0.2 from last week</div>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-ds-lg border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
        <div className="mb-3 font-medium text-gray-900">Response Time Trend</div>
        <div className="flex h-24 items-end justify-between gap-1">
          {[40, 45, 38, 42, 35, 38, 32, 28, 25, 22, 20, 18].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-400"
              style={{ height: `${height * 2}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-[var(--fl-color-text-muted)]">
          <span>12 AM</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
