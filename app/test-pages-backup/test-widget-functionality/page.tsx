"use client";

import React, { useEffect, useState } from 'react';
import { WidgetProvider } from '@/components/widget';

/**
 * Comprehensive Widget Functionality Test
 * Tests all widget features and monitors for console errors
 */
export default function WidgetFunctionalityTestPage() {
  const [testResults, setTestResults] = useState<{[key: string]: 'pending' | 'pass' | 'fail'}>({
    widgetButton: 'pending',
    widgetPanel: 'pending',
    tabNavigation: 'pending',
    messageInput: 'pending',
    autoScroll: 'pending',
    responsiveDesign: 'pending',
  });

  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Monitor console errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setConsoleErrors(prev => [...prev.slice(-4), message]);
      originalError.apply(console, args);
    };

    addLog('Test page loaded, monitoring console errors');

    return () => {
      console.error = originalError;
    };
  }, []);

  const runTest = (testName: string, testFn: () => boolean) => {
    try {
      const result = testFn();
      setTestResults(prev => ({ ...prev, [testName]: result ? 'pass' : 'fail' }));
      addLog(`Test ${testName}: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: 'fail' }));
      addLog(`Test ${testName}: ERROR - ${error}`);
      return false;
    }
  };

  const testWidgetButton = () => {
    const button = document.querySelector('[data-testid="widget-button"]');
    return button !== null;
  };

  const testWidgetPanel = () => {
    const button = document.querySelector('[data-testid="widget-button"]') as HTMLElement;
    if (button) {
      button.click();
      setTimeout(() => {
        const panel = document.querySelector('[data-testid="widget-container"]');
        const isVisible = panel && !panel.classList.contains('hidden');
        setTestResults(prev => ({ ...prev, widgetPanel: isVisible ? 'pass' : 'fail' }));
        addLog(`Widget panel visibility: ${isVisible ? 'PASS' : 'FAIL'}`);
      }, 500);
      return true;
    }
    return false;
  };

  const testTabNavigation = () => {
    // Look for tab buttons
    const tabs = document.querySelectorAll('[role="tab"]');
    return tabs.length >= 3; // Should have Home, Messages, Help tabs
  };

  const testMessageInput = () => {
    const input = document.querySelector('textarea[placeholder*="message"]');
    return input !== null;
  };

  const testAutoScroll = () => {
    // This is harder to test automatically, so we'll just check if the scroll container exists
    const scrollContainer = document.querySelector('[data-testid="messages-container"]');
    return scrollContainer !== null;
  };

  const testResponsiveDesign = () => {
    const widget = document.querySelector('[data-testid="widget-container"]');
    if (widget) {
      const styles = window.getComputedStyle(widget);
      // Check if it has responsive classes or styles
      return styles.maxWidth !== 'none' || styles.width.includes('%') || styles.width.includes('vw');
    }
    return false;
  };

  const runAllTests = () => {
    addLog('Starting comprehensive widget tests...');
    
    setTimeout(() => runTest('widgetButton', testWidgetButton), 100);
    setTimeout(() => runTest('tabNavigation', testTabNavigation), 200);
    setTimeout(() => runTest('messageInput', testMessageInput), 300);
    setTimeout(() => runTest('autoScroll', testAutoScroll), 400);
    setTimeout(() => runTest('responsiveDesign', testResponsiveDesign), 500);
    setTimeout(() => testWidgetPanel(), 600); // This one opens the widget
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Widget Functionality Test Suite</h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Run All Tests
            </button>
            <button
              onClick={() => {
                setTestResults({
                  widgetButton: 'pending',
                  widgetPanel: 'pending',
                  tabNavigation: 'pending',
                  messageInput: 'pending',
                  autoScroll: 'pending',
                  responsiveDesign: 'pending',
                });
                setConsoleErrors([]);
                setTestLog([]);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reset Tests
            </button>
          </div>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(testResults).map(([testName, status]) => (
              <div key={testName} className="bg-gray-50 p-4 rounded-lg">
                <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <span className="font-medium capitalize">{testName.replace(/([A-Z])/g, ' $1')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Console Errors</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
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

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-4">Test Log</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testLog.length === 0 ? (
                <div className="text-gray-500 text-sm">No test activity yet</div>
              ) : (
                testLog.map((log, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded text-sm text-blue-800 font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Manual Test Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Test Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Widget Features to Test:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Click widget button (bottom-right)</li>
                <li>• Switch between Home/Messages/Help tabs</li>
                <li>• Type in message input field</li>
                <li>• Send a test message</li>
                <li>• Check auto-scroll behavior</li>
                <li>• Test on different screen sizes</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Expected Behavior:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Widget button appears in bottom-right</li>
                <li>• Panel opens smoothly when clicked</li>
                <li>• Tabs switch content properly</li>
                <li>• Bottom tabs stay within widget</li>
                <li>• Auto-scroll works on new messages</li>
                <li>• No console errors or warnings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Provider */}
      <WidgetProvider
        organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd"
        debug={true}
      />
    </div>
  );
}
