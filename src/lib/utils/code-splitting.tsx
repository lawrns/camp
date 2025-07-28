/**
 * Code Splitting Utilities
 * 
 * Utilities for implementing efficient code splitting
 */

import React, { Suspense, lazy } from 'react';

// Lazy loading wrapper with error boundary
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || React.createElement('div', null, 'Loading...')}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Route-based code splitting
export function createLazyRoute(importFn: () => Promise<any>) {
  return createLazyComponent(importFn, React.createElement('div', { className: "animate-pulse" }, 'Loading page...'));
}

// Feature-based code splitting
export function createLazyFeature(importFn: () => Promise<any>) {
  return createLazyComponent(importFn, React.createElement('div', { className: "animate-pulse" }, 'Loading feature...'));
}

// Dynamic import with retry logic
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {

      await new Promise(resolve => setTimeout(resolve, 1000));
      return dynamicImport(importFn, retries - 1);
    }
    throw error;
  }
}

export default {
  createLazyComponent,
  createLazyRoute,
  createLazyFeature,
  dynamicImport
};