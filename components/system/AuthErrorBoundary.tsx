'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { forceSessionRecovery } from '@/lib/auth/auth-persistence-fix';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

/**
 * Error boundary specifically designed for authentication-related errors
 * Includes automatic session recovery and extension conflict handling
 */
export class AuthErrorBoundary extends Component<Props, State> {
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is an auth-related error
    const isAuthError = 
      error.message.includes('auth') ||
      error.message.includes('session') ||
      error.message.includes('token') ||
      error.message.includes('unauthorized') ||
      error.message.includes('AuthProvider') ||
      error.message.includes('useAuth');

    if (isAuthError) {
      return {
        hasError: true,
        error,
      };
    }

    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AuthErrorBoundary] Authentication error caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Attempt automatic recovery for certain types of errors
    this.attemptRecovery(error);
  }

  private async attemptRecovery(error: Error) {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.warn('[AuthErrorBoundary] Max recovery attempts reached');
      return;
    }

    this.recoveryAttempts++;
    this.setState({ isRecovering: true });

    try {
      console.log(`[AuthErrorBoundary] Attempting recovery (${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

      // Clear any corrupted auth state
      if (typeof window !== 'undefined') {
        // Clear localStorage auth data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear sessionStorage auth data
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }

      // Force session recovery
      await forceSessionRecovery();

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset error state to trigger re-render
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });

      console.log('[AuthErrorBoundary] Recovery attempt completed');
    } catch (recoveryError) {
      console.error('[AuthErrorBoundary] Recovery failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  }

  private handleManualRetry = () => {
    this.recoveryAttempts = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-lg font-semibold text-gray-900">Recovering Session...</h2>
              <p className="text-gray-600">Please wait while we restore your authentication.</p>
            </div>
          </div>
        );
      }

      // Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-6 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                There was a problem with your authentication session.
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
              <p className="text-xs text-gray-700 font-mono break-all">
                {this.state.error?.message || 'Unknown authentication error'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Recovery attempts: {this.recoveryAttempts}/{this.maxRecoveryAttempts}
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Debug Information (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually trigger auth error boundary
 */
export function useAuthErrorBoundary() {
  return {
    triggerError: (error: Error) => {
      throw error;
    },
    triggerAuthError: (message: string) => {
      throw new Error(`Authentication Error: ${message}`);
    },
  };
}
