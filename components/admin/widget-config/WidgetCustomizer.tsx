"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface WidgetConfig {
  branding: {
    primaryColor: string;
    logo?: string;
    companyName: string;
    greeting: string;
  };
  settings: {
    position: string;
    enableTypingIndicator: boolean;
    enableAI: boolean;
    aiWelcomeMessage: string;
    allowFileUpload: boolean;
  };
}

interface WidgetCustomizerProps {
  organizationId: string;
}

// Intercom-level spring physics
const springConfig = {
  type: "spring" as const,
  damping: 20,
  stiffness: 200,
  mass: 1,
};

export const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ organizationId }) => {
  const [config, setConfig] = useState<WidgetConfig>({
    branding: {
      primaryColor: "#6B46C1",
      companyName: "Your Company",
      greeting: "Hi! How can we help you today?",
    },
    settings: {
      position: "bottom-right",
      enableTypingIndicator: true,
      enableAI: true,
      aiWelcomeMessage: "I'm an AI assistant. How can I help you today?",
      allowFileUpload: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load current configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/widget/config/${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setConfig({
            branding: {
              primaryColor: data.branding?.primaryColor || "#6B46C1",
              logo: data.branding?.logo,
              companyName: data.branding?.companyName || "Your Company",
              greeting: data.branding?.greeting || "Hi! How can we help you today?",
            },
            settings: {
              position: data.settings?.position || "bottom-right",
              enableTypingIndicator: data.settings?.enableTypingIndicator ?? true,
              enableAI: data.settings?.enableAI ?? true,
              aiWelcomeMessage: data.settings?.aiWelcomeMessage || "I'm an AI assistant. How can I help you today?",
              allowFileUpload: data.settings?.allowFileUpload ?? true,
            },
          });
        }
      } catch (error) {

        toast.error("Failed to load widget configuration");
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [organizationId]);

  // Save configuration
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/widget/config/${organizationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Widget configuration saved successfully!");
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {

      toast.error("Failed to save widget configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <OptimizedMotion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-ds-full border-2 border-purple-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <OptimizedMotion.div
      className="mx-auto max-w-4xl p-spacing-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Widget Customization</h1>
        <p className="text-foreground">Customize your chat widget to match your brand and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Branding Section */}
          <OptimizedMotion.div
            className="bg-background radius-2xl border border-[var(--fl-color-border)] p-spacing-md shadow-card-base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, ...springConfig }}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-800">🎨 Branding</h2>

            <div className="space-y-3">
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config.branding.primaryColor}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, primaryColor: e.target.value },
                      }))
                    }
                    className="border-ds-border-strong h-12 w-12 cursor-pointer rounded-ds-lg border"
                  />
                  <input
                    type="text"
                    value={config.branding.primaryColor}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, primaryColor: e.target.value },
                      }))
                    }
                    className="border-ds-border-strong flex-1 rounded-ds-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Company Name</label>
                <input
                  type="text"
                  value={config.branding.companyName}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, companyName: e.target.value },
                    }))
                  }
                  className="border-ds-border-strong w-full rounded-ds-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Welcome Greeting</label>
                <textarea
                  value={config.branding.greeting}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, greeting: e.target.value },
                    }))
                  }
                  className="border-ds-border-strong w-full rounded-ds-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Hi! How can we help you today?"
                />
              </div>
            </div>
          </OptimizedMotion.div>

          {/* Settings Section */}
          <OptimizedMotion.div
            className="bg-background radius-2xl border border-[var(--fl-color-border)] p-spacing-md shadow-card-base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, ...springConfig }}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-800">⚙️ Settings</h2>

            <div className="space-y-3">
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Widget Position</label>
                <select
                  value={config.settings.position}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, position: e.target.value },
                    }))
                  }
                  className="border-ds-border-strong w-full rounded-ds-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.settings.enableTypingIndicator}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, enableTypingIndicator: e.target.checked },
                      }))
                    }
                    className="border-ds-border-strong h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-foreground text-sm">Show typing indicator</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.settings.enableAI}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, enableAI: e.target.checked },
                      }))
                    }
                    className="border-ds-border-strong h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-foreground text-sm">Enable AI assistant</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.settings.allowFileUpload}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, allowFileUpload: e.target.checked },
                      }))
                    }
                    className="border-ds-border-strong h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-foreground text-sm">Allow file uploads</span>
                </label>
              </div>

              {config.settings.enableAI && (
                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">AI Welcome Message</label>
                  <textarea
                    value={config.settings.aiWelcomeMessage}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, aiWelcomeMessage: e.target.value },
                      }))
                    }
                    className="border-ds-border-strong w-full rounded-ds-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="I'm an AI assistant. How can I help you today?"
                  />
                </div>
              )}
            </div>
          </OptimizedMotion.div>

          {/* Save Button */}
          <OptimizedMotion.button
            onClick={saveConfig}
            disabled={isSaving}
            className="w-full rounded-ds-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-purple-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </OptimizedMotion.button>
        </div>

        {/* Preview Panel */}
        <OptimizedMotion.div
          className="radius-2xl bg-[var(--fl-color-background-subtle)] p-spacing-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...springConfig }}
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-800">👀 Preview</h2>

          <div className="bg-background relative h-96 rounded-ds-xl border border-[var(--fl-color-border)] spacing-3 shadow-card-base">
            <div className="mb-4 text-center text-sm text-[var(--fl-color-text-muted)]">Widget Preview</div>

            {/* Mock widget preview */}
            <div
              className="absolute bottom-4 right-4 flex h-16 w-16 cursor-pointer items-center justify-center rounded-ds-full font-bold text-white shadow-card-deep"
              style={{ backgroundColor: config.branding.primaryColor }}
            >
              💬
            </div>

            <div className="bg-background absolute bottom-20 right-4 h-64 w-80 radius-2xl border border-[var(--fl-color-border)] spacing-3 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-spacing-sm">
                  <div className="h-3 w-3 rounded-ds-full bg-green-400"></div>
                  <span className="text-sm font-semibold">{config.branding.companyName}</span>
                </div>
                <button className="hover:text-foreground text-gray-400">✕</button>
              </div>

              <div className="py-4 text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-ds-full font-bold text-white"
                  style={{ backgroundColor: config.branding.primaryColor }}
                >
                  {config.branding.companyName.charAt(0)}
                </div>
                <h3 className="mb-1 font-semibold text-gray-800">👋 Welcome!</h3>
                <p className="text-foreground text-sm">{config.branding.greeting}</p>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center space-x-spacing-sm rounded-ds-lg bg-[var(--fl-color-background-subtle)] p-spacing-sm">
                  <span className="text-sm">😊</span>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    disabled
                  />
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-ds-lg text-white"
                    style={{ backgroundColor: config.branding.primaryColor }}
                  >
                    ➤
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OptimizedMotion.div>
      </div>
    </OptimizedMotion.div>
  );
};
