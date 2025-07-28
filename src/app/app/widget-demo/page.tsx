"use client";

import { WidgetProvider } from "@/components/widget";
import React from "react";

export default function WidgetDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Demo page content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">🔥 Campfire Widget Demo</h1>
            <p className="mb-8 text-xl text-gray-600">
              Experience our Intercom-level chat widget with premium animations and design
            </p>
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800">
              <span className="h-2 w-2 animate-pulse rounded-ds-full bg-purple-500"></span>
              Widget Active
            </div>
          </div>

          {/* Feature showcase */}
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Spring Physics</h3>
              <p className="text-sm text-gray-600">
                Buttery smooth animations with professional spring physics (damping: 20, stiffness: 200)
              </p>
            </div>

            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Welcome Experience</h3>
              <p className="text-sm text-gray-600">
                Branded welcome screen with organization customization and quick actions
              </p>
            </div>

            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-green-500 to-green-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Message Bubbles</h3>
              <p className="text-sm text-gray-600">
                Professional message bubbles with avatars, tails, and hover effects
              </p>
            </div>

            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Typing Indicator</h3>
              <p className="text-sm text-gray-600">Bouncing dots with staggered animations and professional styling</p>
            </div>

            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-pink-500 to-pink-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5l2 2"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Enhanced Input</h3>
              <p className="text-sm text-gray-600">
                Modern input with emoji button, gradient send button, and focus states
              </p>
            </div>

            <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-800">Tabbed Interface</h3>
              <p className="text-sm text-gray-600">
                Chat, FAQ, and Help tabs with smooth transitions and active indicators
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="radius-2xl border border-[var(--fl-color-border)] bg-white spacing-8 text-center shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Try the Widget!</h2>
            <p className="mb-6 text-gray-600">
              Click the chat button in the bottom-right corner to experience our Intercom-level widget with:
            </p>
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 text-left md:grid-cols-2">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-ds-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Professional welcome screen</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-ds-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Interactive FAQ section</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-ds-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Smooth spring animations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-ds-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Real-time messaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Integration */}
      <WidgetProvider organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd" debug={true} />
    </div>
  );
}
