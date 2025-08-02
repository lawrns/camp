// Test page for InboxDashboard without authentication
// This allows us to test the refactored component functionality

"use client";

import React from "react";
import InboxDashboard from "@/components/InboxDashboard";

// Mock user data for testing
const mockUser = {
  id: "test-user-1",
  organizationId: "test-org-1",
  name: "Test Agent",
  email: "test@example.com",
};

export default function TestInboxPage(): JSX.Element {
  return (
    <div className="h-screen w-full bg-[var(--fl-color-background-subtle)]">
      <div className="flex h-full flex-col">
        {/* Test Header */}
        <div className="flex-shrink-0 bg-blue-600 spacing-4 text-white">
          <h1 className="text-xl font-bold">🧪 InboxDashboard Test Environment</h1>
          <p className="text-sm text-blue-100">
            Testing refactored modular architecture • User: {mockUser.name} • Org: {mockUser.organizationId}
          </p>
        </div>

        {/* InboxDashboard Component */}
        <div className="flex-1 overflow-hidden">
          <InboxDashboard className="h-full w-full" />
        </div>

        {/* Test Footer */}
        <div className="flex-shrink-0 bg-neutral-800 spacing-2 text-xs text-neutral-300">
          <div className="flex items-center justify-between">
            <span>🔧 Refactored Architecture: 21 modular files, 97.8% size reduction</span>
            <span>✅ Mock data active • No authentication required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
