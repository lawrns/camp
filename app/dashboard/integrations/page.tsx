import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Integrations - Campfire',
  description: 'Manage your third-party integrations',
};

export default function IntegrationsPage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">
              Connect with your favorite tools and services
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Available Integrations</h2>
              <p className="text-muted-foreground mt-2">
                Connect with Slack, Gmail, CRM systems, and more
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 