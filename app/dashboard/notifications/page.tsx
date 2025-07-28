import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Notifications - Campfire',
  description: 'Manage your notification preferences',
};

export default function NotificationsPage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your notification preferences and settings
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Notification Settings</h2>
              <p className="text-muted-foreground mt-2">
                Configure email, push, and in-app notifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 