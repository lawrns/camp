'use client';

import React from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CriticalBoundary } from '@/components/error/CriticalErrorBoundary';

interface AuthProvidersProps {
  children: React.ReactNode;
}

export function AuthProviders({ children }: AuthProvidersProps) {
  return (
    <CriticalBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </CriticalBoundary>
  );
} 