import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Team Management - Campfire',
  description: 'Manage your team members and roles',
};

export default function TeamPage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members, roles, and permissions
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Team Members</h2>
              <p className="text-muted-foreground mt-2">
                Invite team members and manage their roles and permissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 