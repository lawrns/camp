"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically designed to catch "Objects are not valid as a React child" errors
 * and provide helpful debugging information
 */
export class ObjectRenderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is the specific "Objects are not valid as a React child" error
    const isObjectRenderError = error.message.includes('Objects are not valid as a React child');
    
    if (isObjectRenderError) {
      console.error('🚨 Object Render Error Detected:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        tip: 'Check for components rendering objects with {value, change, trend} structure directly'
      });
    }

    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ObjectRenderErrorBoundary caught an error:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ObjectRenderErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      // Check if this is the specific object render error
      const isObjectRenderError = this.state.error?.message.includes('Objects are not valid as a React child');
      
      if (isObjectRenderError) {
        return this.props.fallback || (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-medium">Rendering Error Detected</h3>
            </div>
            <p className="text-sm text-red-600 mb-2">
              An object was accidentally rendered as a React child. This usually happens when:
            </p>
            <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
              <li>A component renders <code>{`{metrics}`}</code> instead of <code>{`{metrics.value}`}</code></li>
              <li>API response objects with <code>{`{value, change, trend}`}</code> are rendered directly</li>
              <li>Missing property extraction from metric objects</li>
            </ul>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        );
      }

      // For other errors, re-throw to let other error boundaries handle them
      throw this.state.error;
    }

    return this.props.children;
  }
}

/**
 * Hook version of the error boundary for functional components
 */
export function useObjectRenderErrorHandler() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Objects are not valid as a React child')) {
        console.error('🚨 Object Render Error in useEffect:', {
          message: event.error.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString()
        });
        
        // Prevent the error from propagating
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
}

/**
 * Utility component to safely render potentially problematic values
 */
export function SafeRender({ value, fallback = '' }: { value: unknown; fallback?: string }) {
  try {
    // If it's a safe primitive value, render it directly
    if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <>{value}</>;
    }
    
    // If it's an object with a value property, extract it
    if (typeof value === 'object' && value.value !== undefined) {
      return <SafeRender value={value.value} fallback={fallback} />;
    }
    
    // For other objects, render the fallback
    return <>{fallback}</>;
  } catch (error) {
    console.warn('SafeRender caught error:', error);
    return <>{fallback}</>;
  }
}
