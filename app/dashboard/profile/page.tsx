import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Profile - Campfire',
  description: 'Manage your profile and account settings',
};

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile and account settings
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <p className="text-muted-foreground mt-2">
                Update your name, email, and profile picture
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-muted-foreground mt-2">
                Change your password and manage security settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 