"use client";

import React from "react";
import InboxDashboard from "@/components/InboxDashboard";
import { useAuth } from "@/hooks/useAuth";

export default function InboxPage(): JSX.Element {
  const { user, loading } = useAuth();

  // Debug logging
  React.useEffect(() => {
    if (user) {

    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="font-medium text-gray-600">Loading your inbox...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="rounded-ds-lg bg-white spacing-8 text-center shadow-md">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <InboxDashboard className="h-full w-full" />
    </div>
  );
}
