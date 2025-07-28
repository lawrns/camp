"use client";

import { WidgetCustomizer } from "@/components/admin/widget-config/WidgetCustomizer";
import { WidgetProvider } from "@/components/widget";
import React from "react";

export default function WidgetSettingsPage() {
  // In a real app, this would come from auth context
  const organizationId = "b5e80170-004c-4e82-a88c-3e2166b169dd";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Widget Settings</h1>
              <p className="mt-2 text-gray-600">
                Customize your chat widget to match your brand and provide the best customer experience
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-ds-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                ✅ Widget Active
              </div>
              <button className="rounded-ds-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200">
                View Live Widget
              </button>
            </div>
          </div>
        </div>

        {/* Widget Customizer */}
        <WidgetCustomizer organizationId={organizationId} />

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">Real-time Updates</h3>
            <p className="text-sm text-gray-600">
              Changes are applied instantly to your live widget. No need to refresh or redeploy.
            </p>
          </div>

          <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5l2 2"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">Brand Consistency</h3>
            <p className="text-sm text-gray-600">
              Match your widget perfectly to your brand colors, messaging, and style guidelines.
            </p>
          </div>

          <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-green-500 to-green-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">AI Integration</h3>
            <p className="text-sm text-gray-600">
              Configure AI assistant behavior and welcome messages for seamless customer support.
            </p>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="mt-12 radius-2xl border border-[var(--fl-color-border)] bg-white spacing-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Widget Integration</h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">📋 Installation Code</h3>
              <div className="rounded-ds-lg bg-gray-900 spacing-4 text-sm">
                <code className="text-green-400">
                  {`<!-- Add this to your website's <head> -->`}
                  <br />
                  <span className="text-blue-400">{`<script`}</span>
                  <br />
                  <span className="text-yellow-400">{`  src="https://your-domain.com/widget.js"`}</span>
                  <br />
                  <span className="text-yellow-400">{`  data-organization-id="${organizationId}"`}</span>
                  <br />
                  <span className="text-yellow-400">{`  data-position="bottom-right"`}</span>
                  <br />
                  <span className="text-blue-400">{`></script>`}</span>
                </code>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Copy and paste this code into your website's HTML to add the chat widget.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">🔧 Advanced Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                  <span className="text-sm font-medium text-gray-700">Custom CSS</span>
                  <button className="text-sm text-purple-600 hover:text-purple-700">Configure</button>
                </div>
                <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                  <span className="text-sm font-medium text-gray-700">Webhook Integration</span>
                  <button className="text-sm text-purple-600 hover:text-purple-700">Setup</button>
                </div>
                <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                  <span className="text-sm font-medium text-gray-700">Analytics Tracking</span>
                  <button className="text-sm text-purple-600 hover:text-purple-700">Enable</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Widget for Testing */}
      <WidgetProvider organizationId={organizationId} debug={true} />
    </div>
  );
}
