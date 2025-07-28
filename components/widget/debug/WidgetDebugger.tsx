"use client";

import React, { useEffect, useState } from 'react';

interface DebugInfo {
  widgetState: any;
  messagesState: any;
  apiCalls: any[];
  errors: any[];
  performance: any;
}

export function WidgetDebugger({ 
  organizationId, 
  conversationId, 
  messages, 
  isLoading, 
  error 
}: {
  organizationId?: string;
  conversationId?: string;
  messages?: any[];
  isLoading?: boolean;
  error?: string | null;
}) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    widgetState: {},
    messagesState: {},
    apiCalls: [],
    errors: [],
    performance: {}
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update debug info when props change
    setDebugInfo(prev => ({
      ...prev,
      widgetState: {
        organizationId,
        conversationId,
        timestamp: new Date().toISOString()
      },
      messagesState: {
        messageCount: messages?.length || 0,
        isLoading,
        error,
        messages: messages?.slice(0, 3) // Show first 3 messages for debugging
      }
    }));
  }, [organizationId, conversationId, messages, isLoading, error]);

  // Monitor API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        if (url.toString().includes('/api/widget') || url.toString().includes('/api/messages')) {
          setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls.slice(-9), {
              url: url.toString(),
              method: options?.method || 'GET',
              status: response.status,
              duration: Math.round(endTime - startTime),
              timestamp: new Date().toISOString()
            }]
          }));
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-4), {
            url: url.toString(),
            error: (error as Error).message,
            duration: Math.round(endTime - startTime),
            timestamp: new Date().toISOString()
          }]
        }));
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-red-500 text-white px-3 py-1 rounded text-tiny font-mono"
        style={{ zIndex: 9999 }}
      >
        🐛 Debug Widget
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-black text-green-400 p-spacing-md rounded-ds-lg max-w-md max-h-96 overflow-auto font-mono text-tiny"
         style={{ zIndex: 9999 }}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-yellow-400 font-bold">Widget Debugger</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Widget State */}
        <div>
          <h4 className="text-blue-400 font-semibold">Widget State:</h4>
          <div className="pl-2">
            <div>Org ID: {debugInfo.widgetState.organizationId || '❌ Missing'}</div>
            <div>Conv ID: {debugInfo.widgetState.conversationId || '❌ Missing'}</div>
          </div>
        </div>

        {/* Messages State */}
        <div>
          <h4 className="text-blue-400 font-semibold">Messages:</h4>
          <div className="pl-2">
            <div>Count: {debugInfo.messagesState.messageCount}</div>
            <div>Loading: {debugInfo.messagesState.isLoading ? '🔄' : '✅'}</div>
            <div>Error: {debugInfo.messagesState.error || '✅ None'}</div>
          </div>
        </div>

        {/* Recent API Calls */}
        <div>
          <h4 className="text-blue-400 font-semibold">API Calls:</h4>
          <div className="pl-2 space-y-1">
            {debugInfo.apiCalls.slice(-3).map((call, i) => (
              <div key={i} className="text-tiny">
                <span className={call.status === 200 ? 'text-green-400' : 'text-red-400'}>
                  {call.status}
                </span>
                {' '}
                <span className="text-cyan-400">{call.method}</span>
                {' '}
                {call.url.split('/').pop()}
                {' '}
                <span className="text-gray-400">({call.duration}ms)</span>
              </div>
            ))}
            {debugInfo.apiCalls.length === 0 && (
              <div className="text-red-400">❌ No API calls detected</div>
            )}
          </div>
        </div>

        {/* Errors */}
        {debugInfo.errors.length > 0 && (
          <div>
            <h4 className="text-red-400 font-semibold">Errors:</h4>
            <div className="pl-2 space-y-1">
              {debugInfo.errors.slice(-2).map((error, i) => (
                <div key={i} className="text-red-300 text-tiny">
                  {error.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="text-blue-400 font-semibold">Quick Actions:</h4>
          <div className="pl-2 space-y-1">
            <button 
              onClick={() => console.log('Widget Debug Info:', debugInfo)}
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              📋 Log Full State
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="text-orange-400 hover:text-orange-300 underline block"
            >
              🔄 Reload Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
