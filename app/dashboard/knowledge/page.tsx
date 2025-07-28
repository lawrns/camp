import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Knowledge Base - Campfire',
  description: 'Manage your knowledge base and help articles',
};

export default function KnowledgePage() {
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Manage your help articles and knowledge base
            </p>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Knowledge Base</h2>
              <p className="text-muted-foreground mt-2">
                Manage your organization's knowledge documents and content
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 