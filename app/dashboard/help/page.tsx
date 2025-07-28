import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Help & Support - Campfire',
  description: 'Get help and support for Campfire',
};

export default function HelpPage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
            <p className="text-muted-foreground">
              Get help, documentation, and support for Campfire
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Documentation</h2>
              <p className="text-muted-foreground mt-2">
                Browse our comprehensive documentation and guides
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Contact Support</h2>
              <p className="text-muted-foreground mt-2">
                Get in touch with our support team for assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 