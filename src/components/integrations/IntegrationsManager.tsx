/**
 * Integrations Manager Component
 * Provides UI for managing third-party integrations
 */

"use client";

import React, { useState } from "react";

export interface Integration {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: "connected" | "disconnected" | "error" | "pending";
  lastSync?: Date;
  config?: Record<string, unknown>;
  icon?: string;
}

export interface IntegrationsManagerProps {
  organizationId?: string;
  onIntegrationUpdate?: (integration: Integration) => void;
  className?: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Connect your Slack workspace for notifications and collaboration",
    provider: "slack",
    status: "disconnected",
    icon: "💬",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Integrate with Discord for community management",
    provider: "discord",
    status: "disconnected",
    icon: "🎮",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Connect Microsoft Teams for enterprise communication",
    provider: "teams",
    status: "disconnected",
    icon: "🏢",
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    description: "Send data to custom endpoints via webhooks",
    provider: "webhook",
    status: "disconnected",
    icon: "🔗",
  },
];

export default function IntegrationsManager({
  organizationId,
  onIntegrationUpdate,
  className = "",
}: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (integrationId: string) => {
    setIsLoading(true);
    try {
      // Stub implementation - simulate connection
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIntegrations((prev) =>
        prev.map((integration: any) =>
          integration.id === integrationId ? { ...integration, status: "connected", lastSync: new Date() } : integration
        )
      );

      const updatedIntegration = integrations.find((i) => i.id === integrationId);
      if (updatedIntegration && onIntegrationUpdate) {
        onIntegrationUpdate({ ...updatedIntegration, status: "connected" });
      }
    } catch (error) {
      setIntegrations((prev) =>
        prev.map((integration: any) =>
          integration.id === integrationId ? { ...integration, status: "error" } : integration
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setIsLoading(true);
    try {
      // Stub implementation - simulate disconnection
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIntegrations((prev) =>
        prev.map((integration: any) => {
          if (integration.id === integrationId) {
            const { lastSync, ...rest } = integration;
            return { ...rest, status: "disconnected" as const };
          }
          return integration;
        })
      );

      const updatedIntegration = integrations.find((i) => i.id === integrationId);
      if (updatedIntegration && onIntegrationUpdate) {
        onIntegrationUpdate({ ...updatedIntegration, status: "disconnected" });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "error":
        return "Error";
      case "pending":
        return "Connecting...";
      default:
        return "Not connected";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-[var(--fl-color-border)] pb-4">
        <h2 className="text-3xl font-bold text-gray-900">Integrations</h2>
        <p className="text-foreground mt-1">Connect your favorite tools and services to enhance your workflow.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration: any) => (
          <div
            key={integration.id}
            className="rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-md transition-shadow hover:shadow-card-hover"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <span
                    className={`inline-flex items-center rounded-ds-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(integration.status)}`}
                  >
                    {getStatusText(integration.status)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-foreground mb-4 text-sm">{integration.description}</p>

            {integration.lastSync && (
              <p className="mb-4 text-tiny text-[var(--fl-color-text-muted)]">
                Last synced: {integration.lastSync.toLocaleString()}
              </p>
            )}

            <div className="flex space-x-spacing-sm">
              {integration.status === "connected" ? (
                <>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    disabled={isLoading}
                    className="bg-status-error-light border-status-error-light flex-1 rounded-ds-md border px-3 py-2 text-sm font-medium text-red-600 hover:bg-[var(--fl-color-danger-subtle)] disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                  <button
                    disabled={isLoading}
                    className="text-foreground hover:bg-background flex-1 rounded-ds-md border border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Configure
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={isLoading}
                  className="bg-primary flex-1 rounded-ds-md border border-transparent px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {integration.status === "pending" ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {organizationId && (
        <div className="mt-8 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
          <h3 className="mb-2 font-medium text-gray-900">Organization ID</h3>
          <code className="text-foreground text-sm">{organizationId}</code>
        </div>
      )}
    </div>
  );
}
