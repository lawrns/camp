'use client';

import { ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Simple QueryProvider - Helper2 Style
 * Removed @tanstack/react-query dependency
 * Use simple fetch instead of complex query management
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Simple passthrough provider - no complex query management needed
  return <>{children}</>;
}
