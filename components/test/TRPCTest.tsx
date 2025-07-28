"use client";

import { api as trpc } from "@/trpc/react";

/**
 * Test component to verify tRPC context is working
 */
export function TRPCTest() {
  // Test tRPC query
  const { data, isLoading, error } = trpc.isSignedIn.useQuery();

  if (isLoading) {
    return (
      <div className="border-status-info-light rounded border bg-[var(--fl-color-info-subtle)] spacing-3">
        <p className="text-status-info-dark">Testing tRPC connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-status-error-light rounded border bg-[var(--fl-color-danger-subtle)] spacing-3">
        <p className="text-red-600-dark">❌ tRPC Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="border-status-success-light rounded border bg-[var(--fl-color-success-subtle)] spacing-3">
      <p className="text-green-600-dark">✅ tRPC Context Working!</p>
      <p className="text-semantic-success-dark text-sm">Signed in: {data ? "Yes" : "No"}</p>
    </div>
  );
}
