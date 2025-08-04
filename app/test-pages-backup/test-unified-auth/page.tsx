/**
 * Test Page for Unified Authentication Widget
 * 
 * This page demonstrates the new unified authentication approach
 * and allows testing of bidirectional message flow between widget and dashboard.
 */

'use client';

import React, { useState } from 'react';
import { UnifiedAuthWidget } from '@/components/widget/UnifiedAuthWidget';
import { AuthConnectionTest } from '@/components/widget/debug/AuthConnectionTest';

export default function TestUnifiedAuthPage() {
  const [organizationId, setOrganizationId] = useState('b5e80170-004c-4e82-a88c-3e2166b169dd');
  const [conversationId, setConversationId] = useState('');
  const [showWidget, setShowWidget] = useState(false);

  const handleStartTest = () => {
    if (!organizationId.trim()) {
      alert('Please enter an organization ID');
      return;
    }
    setShowWidget(true);
  };

  const handleReset = () => {
    setShowWidget(false);
    setConversationId('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Unified Authentication Widget Test
          </h1>
          <p className="text-gray-600 mb-6">
            This page tests the new unified authentication approach for widget-dashboard message broadcasting.
            The widget uses Supabase sessions with a dedicated storage key to prevent conflicts with dashboard authentication.
          </p>

          {/* Configuration */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="orgId" className="block text-sm font-medium text-gray-700 mb-2">
                Organization ID
              </label>
              <input
                id="orgId"
                type="text"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="Enter organization ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={showWidget}
              />
            </div>

            <div>
              <label htmlFor="convId" className="block text-sm font-medium text-gray-700 mb-2">
                Conversation ID (optional)
              </label>
              <input
                id="convId"
                type="text"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="Leave empty to auto-generate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={showWidget}
              />
            </div>

            <div className="flex space-x-4">
              {!showWidget ? (
                <button
                  onClick={handleStartTest}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Start Test
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reset Test
                </button>
              )}
            </div>
          </div>

          {/* Test Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Test Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Enter an organization ID (or use the default)</li>
              <li>Optionally specify a conversation ID</li>
              <li>Click "Start Test" to initialize the widget</li>
              <li>The widget will automatically authenticate as an anonymous visitor</li>
              <li>Send messages from the widget</li>
              <li>Open the dashboard in another tab to see real-time message delivery</li>
              <li>Send messages from the dashboard to test bidirectional communication</li>
              <li>Check browser console for detailed authentication and realtime logs</li>
            </ol>
          </div>

          {/* Expected Behavior */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Expected Behavior</h3>
            <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
              <li>✅ Widget authenticates automatically using Supabase anonymous auth</li>
              <li>✅ Widget establishes realtime connection with proper channel naming</li>
              <li>✅ Messages sent from widget appear in dashboard immediately</li>
              <li>✅ Messages sent from dashboard appear in widget immediately</li>
              <li>✅ Read receipts are tracked and updated</li>
              <li>✅ No authentication conflicts between widget and dashboard</li>
              <li>✅ Proper error handling for network issues</li>
            </ul>
          </div>

          {/* Debugging Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Debugging</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>Check browser console for authentication logs prefixed with "[Widget Auth]"</li>
              <li>Check browser console for realtime logs prefixed with "[Widget]"</li>
              <li>Verify network requests include proper Authorization headers</li>
              <li>Check Application tab in DevTools for separate widget session storage</li>
              <li>Monitor WebSocket connections in Network tab</li>
            </ul>
          </div>
        </div>

        {/* Widget Container */}
        {showWidget && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Widget Test Instance
            </h2>
            <div className="flex justify-center">
              <UnifiedAuthWidget
                organizationId={organizationId}
                conversationId={conversationId || undefined}
                className="w-full max-w-md"
                debug={true}
              />
            </div>
          </div>
        )}

        {/* Comprehensive Test Component */}
        {showWidget && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <AuthConnectionTest
              organizationId={organizationId}
              onTestComplete={(results) => {
                console.log('Test results:', results);
                const allPassed = results.authTest && results.jwtEnrichmentTest &&
                                 results.realtimeConnectionTest && results.messageFlowTest;
                if (allPassed) {
                  console.log('🎉 All tests passed!');
                } else {
                  console.log('⚠️ Some tests failed:', results.errors);
                }
              }}
            />
          </div>
        )}

        {/* Dashboard Link */}
        {showWidget && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Bidirectional Communication
            </h3>
            <p className="text-gray-600 mb-4">
              To test bidirectional message flow, open the dashboard in a new tab and navigate to the inbox.
              You should see the conversation created by this widget and be able to send messages back and forth.
            </p>
            <a
              href="/dashboard/inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Open Dashboard Inbox
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M14 6h6m0 0v6m0-6L10 16" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
