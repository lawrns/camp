"use client";

import React, { useEffect, useState } from 'react';

/**
 * Console Error Test Page
 * This page helps identify any console errors in the browser
 */
export default function ConsoleErrorTestPage() {
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [consoleWarnings, setConsoleWarnings] = useState<string[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    // Capture console errors, warnings, and logs
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setConsoleErrors(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setConsoleWarnings(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      // Only capture widget-related logs to avoid spam
      if (message.includes('Widget') || message.includes('🔥') || message.includes('Campfire')) {
        setConsoleLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
      }
      originalLog.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  const clearLogs = () => {
    setConsoleErrors([]);
    setConsoleWarnings([]);
    setConsoleLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Console Error Monitor</h1>
            <button
              onClick={clearLogs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Logs
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            This page monitors console errors, warnings, and widget-related logs in real-time.
            Open your browser's developer console to see all messages.
          </p>

          {/* Test Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Test Instructions:</h2>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Look for the widget button in the bottom-right corner</li>
              <li>Click the widget button to open the chat panel</li>
              <li>Try switching between tabs (Home/Messages/Help)</li>
              <li>Try sending a test message</li>
              <li>Check for any errors or warnings below</li>
            </ol>
          </div>
        </div>

        {/* Console Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Errors */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Console Errors ({consoleErrors.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {consoleErrors.length === 0 ? (
                <div className="text-green-600 text-sm">✅ No errors detected</div>
              ) : (
                consoleErrors.map((error, index) => (
                  <div key={index} className="bg-red-50 p-2 rounded text-sm text-red-800 font-mono">
                    {error}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warnings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center">
              <span className="mr-2">⚠️</span>
              Console Warnings ({consoleWarnings.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {consoleWarnings.length === 0 ? (
                <div className="text-green-600 text-sm">✅ No warnings detected</div>
              ) : (
                consoleWarnings.map((warning, index) => (
                  <div key={index} className="bg-yellow-50 p-2 rounded text-sm text-yellow-800 font-mono">
                    {warning}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget Logs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Widget Logs ({consoleLogs.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500 text-sm">No widget logs yet</div>
              ) : (
                consoleLogs.map((log, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded text-sm text-blue-800 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Content</h2>
          <p className="text-gray-600 mb-4">
            This is sample content to test the widget functionality. The widget should appear
            in the bottom-right corner and work seamlessly with this page content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Widget Features to Test:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Widget button visibility</li>
                <li>• Widget panel opening/closing</li>
                <li>• Tab navigation (Home/Messages/Help)</li>
                <li>• Message sending functionality</li>
                <li>• Auto-scroll behavior</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Expected Behavior:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• No console errors</li>
                <li>• Smooth animations</li>
                <li>• Proper tab switching</li>
                <li>• Widget stays within boundaries</li>
                <li>• Bottom tabs positioned correctly</li>
                <li>• Auto-scroll on new messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
