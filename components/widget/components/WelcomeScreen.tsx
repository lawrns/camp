"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import React, { useEffect, useState } from "react";

interface WelcomeScreenProps {
  organizationId: string;
  onStartChat: () => void;
  onViewFAQ: () => void;
}

interface WelcomeConfig {
  companyName?: string;
  greeting?: string;
  logo?: string;
  primaryColor?: string;
  recentMessage?: {
    from: string;
    preview: string;
    time: string;
  };
}

// Intercom-level spring physics
const springConfig = {
  type: "spring" as const,
  damping: 20,
  stiffness: 200,
  mass: 1,
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ organizationId, onStartChat, onViewFAQ }) => {
  const [config, setConfig] = useState<WelcomeConfig>({
    companyName: "Campfire Support",
    greeting: "Hi there! 👋",
    primaryColor: "#6B46C1",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch organization-specific welcome configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/widget/config/${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setConfig({
            companyName: data.branding?.companyName || "Support",
            greeting: data.branding?.greeting || "Hi there! 👋",
            logo: data.branding?.logo,
            primaryColor: data.branding?.primaryColor || "#6B46C1",
            recentMessage: data.recentMessage,
          });
        }
      } catch (error) {

      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
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
      className="flex h-full flex-col p-spacing-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig, duration: 0.4 }}
    >
      {/* Header with logo and greeting */}
      <OptimizedMotion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...springConfig }}
      >
        {config.logo ? (
          <OptimizedMotion.div
            className="mx-auto mb-4 h-12 w-12 overflow-hidden rounded-ds-full"
            whileHover={{ scale: 1.05 }}
            transition={springConfig}
          >
            <img src={config.logo} alt={config.companyName} className="h-full w-full object-cover" />
          </OptimizedMotion.div>
        ) : (
          <OptimizedMotion.div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-full bg-gradient-to-br from-purple-500 to-blue-500"
            whileHover={{ scale: 1.05 }}
            transition={springConfig}
          >
            <span className="text-lg font-bold text-white">{config.companyName?.charAt(0) || "C"}</span>
          </OptimizedMotion.div>
        )}

        <h2 className="mb-2 text-lg font-bold text-gray-800">{config.greeting}</h2>
        <p className="text-foreground text-sm">How can we help you today?</p>
      </OptimizedMotion.div>

      {/* Recent conversation tease */}
      {config.recentMessage && (
        <OptimizedMotion.div
          className="mb-6 rounded-ds-xl border border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] spacing-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...springConfig }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-tiny font-medium uppercase tracking-wide text-[var(--fl-color-text-muted)]">
              Recent message
            </span>
            <span className="text-tiny text-gray-400">{config.recentMessage.time}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-500 to-blue-600">
              <span className="text-tiny font-semibold text-white">{config.recentMessage.from.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">{config.recentMessage.from}</p>
              <p className="truncate text-tiny text-[var(--fl-color-text-muted)]">{config.recentMessage.preview}</p>
            </div>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </OptimizedMotion.div>
      )}

      {/* Quick action cards */}
      <div className="flex-1 space-y-3">
        <OptimizedMotion.button
          onClick={onStartChat}
          className="group w-full rounded-ds-xl border border-[var(--fl-color-border)] bg-background spacing-3 text-left transition-all duration-200 hover:border-[var(--fl-color-brand-hover)] hover:bg-purple-50/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...springConfig }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ds-xl bg-gradient-to-br from-purple-500 to-purple-600 transition-transform duration-200 group-hover:scale-110">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 transition-colors group-hover:text-purple-700">Start Chat</h3>
              <p className="text-sm text-[var(--fl-color-text-muted)]">Get instant help from our team</p>
            </div>
            <svg
              className="h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </OptimizedMotion.button>

        <OptimizedMotion.button
          onClick={onViewFAQ}
          className="group w-full rounded-ds-xl border border-[var(--fl-color-border)] bg-background spacing-3 text-left transition-all duration-200 hover:border-[var(--fl-color-border-interactive)] hover:bg-blue-50/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, ...springConfig }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ds-xl bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-200 group-hover:scale-110">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 transition-colors group-hover:text-blue-700">Browse FAQ</h3>
              <p className="text-sm text-[var(--fl-color-text-muted)]">Find answers to common questions</p>
            </div>
            <svg
              className="h-5 w-5 text-gray-400 transition-colors group-hover:text-[var(--fl-color-info)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </OptimizedMotion.button>
      </div>

      {/* Footer with subtle branding */}
      <OptimizedMotion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, ...springConfig }}
      >
        <p className="text-tiny text-gray-400">Powered by {config.companyName}</p>
      </OptimizedMotion.div>
    </OptimizedMotion.div>
  );
};
