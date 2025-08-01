"use client";

import React from "react";
import { useCampfireStore } from "@/store/unified-campfire-store";
import { useDashboardStore, useInboxStore, useStore } from "@/store/legacy-adapters";

/**
 * Test page for the consolidated store system
 *
 * This page verifies that:
 * - Unified store works correctly
 * - Legacy adapters redirect properly
 * - All store slices are accessible
 * - State updates work across adapters
 */
export default function TestStoreConsolidationPage() {
  // Test unified store direct access
  const unifiedState = useCampfireStore((state) => ({
    conversations: state.conversations.size,
    dashboardMetrics: state.dashboard.metrics,
    inboxMessageText: state.inbox.messageText,
    notifications: state.ui.notifications.length,
  }));

  const unifiedActions = useCampfireStore((state) => ({
    setMessageText: state.setMessageText,
    setDashboardMetrics: state.setDashboardMetrics,
    addNotification: state.addNotification,
    toggleConversationSelection: state.toggleConversationSelection,
  }));

  // Test legacy adapters
  const dashboardStore = useDashboardStore();
  const inboxStore = useInboxStore();
  const phoenixStore = useStore();

  const handleTestUnifiedStore = () => {

    // Test message text
    unifiedActions.setMessageText("Test message from unified store");

    // Test dashboard metrics
    unifiedActions.setDashboardMetrics({
      totalConversations: 42,
      activeConversations: 12,
      lastUpdated: new Date().toISOString(),
    });

    // Test notifications
    unifiedActions.addNotification({
      type: "success",
      message: "Unified store test successful!",
    });

  };

  const handleTestLegacyAdapters = () => {

    // Test dashboard adapter
    if (dashboardStore.setMetrics) {
      dashboardStore.setMetrics({
        totalConversations: 24,
        activeConversations: 8,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Test inbox adapter
    if (inboxStore.setMessageText) {
      inboxStore.setMessageText("Test message from legacy adapter");
    }

  };

  const handleTestStateSync = () => {

    // Update via unified store
    unifiedActions.setMessageText("Sync test message");

    // Check if legacy adapter sees the change
    setTimeout(() => {
      const legacyMessageText = inboxStore.messageText;
      const unifiedMessageText = unifiedState.inboxMessageText;

      if (legacyMessageText === unifiedMessageText) {

        unifiedActions.addNotification({
          type: "success",
          message: "State sync test passed!",
        });
      } else {

        unifiedActions.addNotification({
          type: "error",
          message: "State sync test failed!",
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 spacing-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏪 Store Consolidation Test</h1>
          <p className="mt-2 text-gray-600">Test the unified store system and legacy adapter compatibility.</p>
        </div>

        {/* Store State Display */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Unified Store State</h2>
            <div className="space-y-2 text-sm">
              <div>Conversations: {unifiedState.conversations}</div>
              <div>Dashboard Metrics: {unifiedState.dashboardMetrics ? "Loaded" : "None"}</div>
              <div>Message Text: "{unifiedState.inboxMessageText}"</div>
              <div>Notifications: {unifiedState.notifications}</div>
            </div>
          </div>

          <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Legacy Adapter State</h2>
            <div className="space-y-2 text-sm">
              <div>Dashboard Loading: {dashboardStore.isLoading ? "Yes" : "No"}</div>
              <div>Dashboard Error: {dashboardStore.error || "None"}</div>
              <div>Inbox Message: "{inboxStore.messageText}"</div>
              <div>Inbox Sending: {inboxStore.isSending ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestUnifiedStore}
              className="rounded-ds-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Test Unified Store
            </button>
            <button
              onClick={handleTestLegacyAdapters}
              className="rounded-ds-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Test Legacy Adapters
            </button>
            <button
              onClick={handleTestStateSync}
              className="rounded-ds-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Test State Sync
            </button>
          </div>
        </div>

        {/* Migration Status */}
        <div className="rounded-ds-lg bg-yellow-50 spacing-6">
          <h3 className="mb-2 text-lg font-semibold text-yellow-900">Migration Status</h3>
          <div className="space-y-2 text-sm text-yellow-800">
            <div>✅ Unified store created with consolidated state</div>
            <div>✅ Legacy adapters provide backward compatibility</div>
            <div>✅ Dashboard store functionality migrated</div>
            <div>✅ Inbox store functionality migrated</div>
            <div>✅ Phoenix store functionality migrated</div>
            <div>⚠️ Components should gradually migrate to useCampfireStore</div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-yellow-900">Files to Remove After Migration:</h4>
            <ul className="mt-1 list-inside list-disc text-xs text-yellow-700">
              <li>store/dashboard-store.ts</li>
              <li>store/domains/inbox/inbox-store.ts</li>
              <li>store/domains/ui/ui-store.ts</li>
              <li>store/phoenix-store.ts</li>
              <li>store/domains/conversation-store.example.ts</li>
            </ul>
          </div>
        </div>

        {/* Console Output */}
        <div className="mt-6 rounded-ds-lg bg-gray-900 spacing-4 text-green-400">
          <div className="font-mono text-sm">
            <div>💡 Open browser console to see detailed test output</div>
            <div>🔍 Check Network tab for API calls</div>
            <div>📊 Monitor state changes in React DevTools</div>
          </div>
        </div>
      </div>
    </div>
  );
}
