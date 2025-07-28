"use client";

import React from "react";
import { Briefcase, Headphones, Sparkle as Sparkles, Storefront as Store } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  config: any;
}

const templates: WidgetTemplate[] = [
  {
    id: "default",
    name: "Default",
    description: "A clean, professional setup suitable for most businesses",
    icon: <Icon icon={Briefcase} className="h-5 w-5" />,
    category: "General",
    config: {
      appearance: {
        position: "bottom-right",
        colors: {
          primary: "#246BFF",
          background: "#FFFFFF",
        },
        size: "medium",
        borderRadius: 12,
      },
      behavior: {
        welcomeMessage: "Hi! How can we help you today?",
        autoOpen: false,
        showOnMobile: true,
        collectEmail: true,
      },
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Optimized for online stores with product inquiries and order support",
    icon: <Icon icon={Store} className="h-5 w-5" />,
    category: "Industry",
    config: {
      appearance: {
        position: "bottom-right",
        colors: {
          primary: "#10B981",
          background: "#FFFFFF",
        },
        size: "large",
        borderRadius: 16,
      },
      behavior: {
        welcomeMessage: "👋 Need help with your order? We're here to assist!",
        autoOpen: true,
        autoOpenDelay: 10,
        showOnMobile: true,
        collectEmail: true,
      },
      ai: {
        enabled: true,
        systemPrompt:
          "You are a helpful e-commerce assistant. Help customers with product questions, orders, shipping, and returns.",
      },
    },
  },
  {
    id: "support",
    name: "Customer Support",
    description: "Focused on technical support and issue resolution",
    icon: <Icon icon={Headphones} className="h-5 w-5" />,
    category: "Use Case",
    config: {
      appearance: {
        position: "bottom-right",
        colors: {
          primary: "#7C3AED",
          background: "#FFFFFF",
        },
        size: "medium",
        borderRadius: 8,
      },
      behavior: {
        welcomeMessage: "🛠️ Having technical issues? Let's get that fixed!",
        autoOpen: false,
        showOnMobile: true,
        collectEmail: true,
      },
      security: {
        rateLimiting: {
          enabled: true,
          maxMessages: 100,
          windowMinutes: 60,
        },
      },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and distraction-free for a modern look",
    icon: <Icon icon={Sparkles} className="h-5 w-5" />,
    category: "Style",
    config: {
      appearance: {
        position: "bottom-right",
        colors: {
          primary: "#000000",
          background: "#FFFFFF",
        },
        size: "small",
        borderRadius: 24,
      },
      behavior: {
        welcomeMessage: "Hello 👋",
        autoOpen: false,
        showOnMobile: false,
        collectEmail: false,
      },
    },
  },
];

interface WidgetTemplatesProps {
  onApply: (template: WidgetTemplate) => void;
}

export function WidgetTemplates({ onApply }: WidgetTemplatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Templates</CardTitle>
        <CardDescription>Start with a pre-configured template and customize from there</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {templates.map((template: any) => (
            <div
              key={template.id}
              className="cursor-pointer rounded-ds-lg border spacing-3 transition-colors hover:border-primary"
              onClick={() => onApply(template)}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-ds-2">
                  {template.icon}
                  <h4 className="font-medium">{template.name}</h4>
                </div>
                <Badge variant="secondary" className="text-tiny">
                  {template.category}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{template.description}</p>
              <div className="flex items-center gap-ds-2">
                <div
                  className="h-4 w-4 rounded-ds-full border"
                  style={{ backgroundColor: template.config.appearance.colors.primary }}
                />
                <span className="text-tiny text-muted-foreground">
                  {template.config.appearance.position} • {template.config.appearance.size}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
