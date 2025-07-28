'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isExtensionError, detectBrowserExtensions, ExtensionDetection } from '@/lib/auth/extension-isolation';

interface AuthExtensionBoundaryState {
  hasError: boolean;
  error: Error | null;
  isExtensionError: boolean;
  detectedExtensions: Record<string, ExtensionDetection>;
  retryCount: number;
}

interface AuthExtensionBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

/**
 * Error boundary specifically designed to handle browser extension conflicts
 * in authentication flows. Provides user-friendly messaging and retry mechanisms.
 */
export class AuthExtensionBoundary extends Component<
  AuthExtensionBoundaryProps,
  AuthExtensionBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: AuthExtensionBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isExtensionError: false,
      detectedExtensions: {},
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthExtensionBoundaryState> {
    const isExt = isExtensionError(error);
    const detections = typeof window !== 'undefined' ? detectBrowserExtensions() : {};
    
    return {
      hasError: true,
      error,
      isExtensionError: isExt,
      detectedExtensions: detections,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AuthExtensionBoundary] Caught error:', error, errorInfo);
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // If it's an extension error and we haven't exceeded retry limit, auto-retry
    if (this.state.isExtensionError && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      isExtensionError: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleManualRetry = () => {
    // Clear any pending auto-retry
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({
      hasError: false,
      error: null,
      isExtensionError: false,
      retryCount: 0,
    });
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isExtensionError, detectedExtensions } = this.state;
      const detectedExtensionsList = Object.values(detectedExtensions).filter(d => d.detected);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                {isExtensionError ? 'Browser Extension Conflict' : 'Authentication Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isExtensionError ? (
                <>
                  <Alert>
                    <AlertDescription>
                      A browser extension is interfering with the authentication process. 
                      This is commonly caused by password managers like 1Password, LastPass, 
                      or Bitwarden.
                    </AlertDescription>
                  </Alert>

                  {detectedExtensionsList.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <strong>Detected extensions:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {detectedExtensionsList.map((ext, index) => (
                            <li key={index} className="text-sm">
                              {ext.name} (interference level: {ext.interference})
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-blue-50 p-3 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Quick fixes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Try the retry button below</li>
                      <li>• Temporarily disable your password manager</li>
                      <li>• Use an incognito/private browsing window</li>
                      <li>• Try a different browser</li>
                    </ul>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    An unexpected error occurred during authentication. Please try again.
                    {error && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Error details</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {error.toString()}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleManualRetry} 
                  className="flex-1"
                  variant="default"
                >
                  Retry Authentication
                </Button>
                <Button 
                  onClick={this.handleRefreshPage} 
                  variant="outline"
                  className="flex-1"
                >
                  Refresh Page
                </Button>
              </div>

              {isExtensionError && (
                <div className="text-center">
                  <Button 
                    onClick={() => window.open('/login', '_blank')} 
                    variant="ghost"
                    size="sm"
                  >
                    Open in New Tab
                  </Button>
                </div>
              )}

              {this.state.retryCount > 0 && (
                <div className="text-center text-sm text-gray-600">
                  Retry attempt: {this.state.retryCount} / {this.props.maxRetries || 3}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
