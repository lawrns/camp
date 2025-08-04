'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface AuthDebugInfo {
  user: unknown;
  session: unknown;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  cookies: string;
  suppressedLogs: unknown[];
}

export function AuthDebugPanel() {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDebugInfo = () => {
      // Collect localStorage auth data
      const localStorageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('sb-') || key.includes('campfire'))) {
          try {
            localStorageData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      // Collect sessionStorage auth data
      const sessionStorageData: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('sb-') || key.includes('campfire'))) {
          try {
            sessionStorageData[key] = JSON.parse(sessionStorage.getItem(key) || '');
          } catch {
            sessionStorageData[key] = sessionStorage.getItem(key);
          }
        }
      }

      // Get suppressed logs if available
      const suppressedLogs = (window as unknown).__SUPPRESSED_LOGS__ || [];

      setDebugInfo({
        user: auth.user,
        session: auth.session,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        error: auth.error,
        localStorage: localStorageData,
        sessionStorage: sessionStorageData,
        cookies: document.cookie,
        suppressedLogs: suppressedLogs.slice(-10), // Last 10 suppressed logs
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, [auth]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg hover:bg-blue-700 z-50"
      >
        🔍 Auth Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm">Auth Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 overflow-y-auto max-h-80 text-xs font-mono">
        {debugInfo && (
          <div className="space-y-3">
            {/* Auth State */}
            <div>
              <h4 className="font-semibold text-green-700 mb-1">Auth State</h4>
              <div className="bg-gray-50 p-2 rounded">
                <div>Authenticated: <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>{auth.isAuthenticated ? '✅' : '❌'}</span></div>
                <div>Loading: <span className={auth.isLoading ? 'text-yellow-600' : 'text-gray-600'}>{auth.isLoading ? '⏳' : '✅'}</span></div>
                <div>Error: <span className={auth.error ? 'text-red-600' : 'text-green-600'}>{auth.error ? '❌' : '✅'}</span></div>
                {auth.error && <div className="text-red-600 text-xs mt-1">{auth.error.message}</div>}
              </div>
            </div>

            {/* User Info */}
            {debugInfo.user && (
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">User</h4>
                <div className="bg-gray-50 p-2 rounded">
                  <div>ID: {debugInfo.user.id}</div>
                  <div>Email: {debugInfo.user.email}</div>
                  <div>Org ID: {debugInfo.user.organizationId || 'None'}</div>
                  <div>Role: {debugInfo.user.organizationRole || 'None'}</div>
                </div>
              </div>
            )}

            {/* Session Info */}
            {debugInfo.session && (
              <div>
                <h4 className="font-semibold text-purple-700 mb-1">Session</h4>
                <div className="bg-gray-50 p-2 rounded">
                  <div>Access Token: {debugInfo.session.access_token ? '✅ Present' : '❌ Missing'}</div>
                  <div>Refresh Token: {debugInfo.session.refresh_token ? '✅ Present' : '❌ Missing'}</div>
                </div>
              </div>
            )}

            {/* Storage Info */}
            <div>
              <h4 className="font-semibold text-orange-700 mb-1">Storage</h4>
              <div className="bg-gray-50 p-2 rounded">
                <div>localStorage: {Object.keys(debugInfo.localStorage).length} auth keys</div>
                <div>sessionStorage: {Object.keys(debugInfo.sessionStorage).length} auth keys</div>
                <div>Cookies: {debugInfo.cookies ? '✅ Present' : '❌ None'}</div>
              </div>
            </div>

            {/* Suppressed Logs */}
            {debugInfo.suppressedLogs.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-1">Suppressed Errors ({debugInfo.suppressedLogs.length})</h4>
                <div className="bg-red-50 p-2 rounded max-h-20 overflow-y-auto">
                  {debugInfo.suppressedLogs.map((log, index) => (
                    <div key={index} className="text-xs text-red-700 truncate">
                      {log.message || log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                >
                  Clear Storage & Reload
                </button>
                <button
                  onClick={() => {
                    if ((window as unknown).__CONSOLE_DEBUG__) {
                      (window as unknown).__CONSOLE_DEBUG__.showSuppressed();
                    }
                  }}
                  className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Show Suppressed Logs
                </button>
                <button
                  onClick={() => {
                    console.log('Auth Debug Info:', debugInfo);
                  }}
                  className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                >
                  Log to Console
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
