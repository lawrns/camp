/**
 * Widget Debug Panel
 * 
 * Visual debugging interface for the unified authentication widget system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { widgetDebugger, WidgetDebugState, DebugLogEntry, formatTimestamp, getDebugLevelColor } from '@/lib/utils/widget-debug';
import { cn } from '@/lib/utils';

interface WidgetDebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function WidgetDebugPanel({ isOpen, onToggle, className }: WidgetDebugPanelProps) {
  const [debugState, setDebugState] = useState<WidgetDebugState>(widgetDebugger.getState());
  const [selectedTab, setSelectedTab] = useState<'status' | 'logs' | 'network'>('status');

  useEffect(() => {
    const unsubscribe = widgetDebugger.subscribe(setDebugState);
    return unsubscribe;
  }, []);

  const getStatusColor = (status: string) => {
    if (status.includes('connected') || status === 'authenticated') return 'text-green-600';
    if (status.includes('connecting') || status === 'loading') return 'text-yellow-600';
    if (status.includes('error') || status === 'failed') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('connected') || status === 'authenticated') return '🟢';
    if (status.includes('connecting') || status === 'loading') return '🟡';
    if (status.includes('error') || status === 'failed') return '🔴';
    return '⚪';
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-mono shadow-lg hover:bg-gray-700 transition-colors",
          className
        )}
        title="Open Widget Debug Panel"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-sm text-gray-900">Widget Debug Panel</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
          title="Close Debug Panel"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'status', label: 'Status' },
          { id: 'logs', label: 'Logs' },
          { id: 'network', label: 'Network' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              selectedTab === tab.id
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'status' && (
          <div className="p-3 space-y-3 text-xs">
            {/* Authentication Status */}
            <div className="space-y-1">
              <div className="font-medium text-gray-700">Authentication</div>
              <div className={cn("flex items-center space-x-2", getStatusColor(debugState.authStatus))}>
                <span>{getStatusIcon(debugState.authStatus)}</span>
                <span className="font-mono">{debugState.authStatus}</span>
              </div>
              {debugState.sessionToken && (
                <div className="text-gray-500 font-mono text-xs">
                  Token: {debugState.sessionToken.substring(0, 20)}...
                </div>
              )}
            </div>

            {/* Supabase Client Status */}
            <div className="space-y-1">
              <div className="font-medium text-gray-700">Supabase Client</div>
              <div className={cn("flex items-center space-x-2", getStatusColor(debugState.supabaseClientStatus))}>
                <span>{getStatusIcon(debugState.supabaseClientStatus)}</span>
                <span className="font-mono">{debugState.supabaseClientStatus}</span>
              </div>
            </div>

            {/* WebSocket Status */}
            <div className="space-y-1">
              <div className="font-medium text-gray-700">WebSocket</div>
              <div className={cn("flex items-center space-x-2", getStatusColor(debugState.websocketStatus))}>
                <span>{getStatusIcon(debugState.websocketStatus)}</span>
                <span className="font-mono">{debugState.websocketStatus}</span>
              </div>
            </div>

            {/* IDs */}
            <div className="space-y-1">
              <div className="font-medium text-gray-700">Identifiers</div>
              <div className="space-y-1 text-gray-600 font-mono">
                <div>Org: {debugState.organizationId || 'not set'}</div>
                <div>Conv: {debugState.conversationId || 'not set'}</div>
              </div>
            </div>

            {/* Message Timestamps */}
            <div className="space-y-1">
              <div className="font-medium text-gray-700">Messages</div>
              <div className="space-y-1 text-gray-600 font-mono">
                <div>Last Sent: {debugState.lastMessageSent ? formatTimestamp(debugState.lastMessageSent) : 'none'}</div>
                <div>Last Received: {debugState.lastMessageReceived ? formatTimestamp(debugState.lastMessageReceived) : 'none'}</div>
              </div>
            </div>

            {/* Last Error */}
            {debugState.lastError && (
              <div className="space-y-1">
                <div className="font-medium text-red-700">Last Error</div>
                <div className="text-red-600 text-xs">
                  <div className="font-mono">{formatTimestamp(debugState.lastError.timestamp)}</div>
                  <div>{debugState.lastError.message}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'logs' && (
          <div className="h-64 overflow-y-auto">
            <div className="p-2 space-y-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">Recent Logs ({debugState.logs.length})</span>
                <button
                  onClick={() => widgetDebugger.clearLogs()}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              {debugState.logs.slice(-20).reverse().map((log, index) => (
                <div key={index} className="text-xs border-l-2 pl-2 py-1" style={{ borderColor: getDebugLevelColor(log.level) }}>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    <span className="font-medium" style={{ color: getDebugLevelColor(log.level) }}>
                      [{log.category}]
                    </span>
                  </div>
                  <div className="text-gray-700 mt-1">{log.message}</div>
                  {log.data && (
                    <div className="text-gray-500 font-mono mt-1 text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
              {debugState.logs.length === 0 && (
                <div className="text-gray-500 text-center py-4">No logs yet</div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'network' && (
          <div className="p-3 space-y-2 text-xs">
            <div className="font-medium text-gray-700">Network Activity</div>
            <div className="space-y-1">
              {debugState.logs
                .filter(log => log.category === 'Network')
                .slice(-10)
                .reverse()
                .map((log, index) => (
                  <div key={index} className="border-l-2 border-blue-400 pl-2 py-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gray-500">{formatTimestamp(log.timestamp)}</span>
                      <span className={cn(
                        "font-medium",
                        log.level === 'error' ? 'text-red-600' : 'text-blue-600'
                      )}>
                        {log.message}
                      </span>
                    </div>
                    {log.data && (
                      <div className="text-gray-500 font-mono mt-1 text-xs">
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              {debugState.logs.filter(log => log.category === 'Network').length === 0 && (
                <div className="text-gray-500 text-center py-4">No network activity yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
