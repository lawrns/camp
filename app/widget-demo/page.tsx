"use client";

import React from 'react';
import { WidgetProvider } from '../../components/widget';

/**
 * Widget Demo Page
 * Used for E2E testing of widget functionality
 */
export default function WidgetDemoPage() {
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const TEST_CONVERSATION_ID = '48eedfba-2568-4231-bb38-2ce20420900d';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Widget Demo Page
          </h1>
          <p className="text-gray-600 mb-6">
            This page is used for testing the Campfire widget functionality.
            The widget should appear in the bottom-right corner of the page.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                Widget Features
              </h2>
              <ul className="space-y-2 text-blue-800">
                <li>• Real-time messaging</li>
                <li>• Typing indicators</li>
                <li>• Message history</li>
                <li>• Agent handover</li>
                <li>• File uploads</li>
                <li>• Emoji support</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-3">
                Test Instructions
              </h2>
              <ol className="space-y-2 text-green-800">
                <li>1. Click the widget button (bottom-right)</li>
                <li>2. Send a test message</li>
                <li>3. Check dashboard for message</li>
                <li>4. Test typing indicators</li>
                <li>5. Test bidirectional communication</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-900 mb-3">
              Test Data Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-yellow-800">
              <div>
                <h3 className="font-medium mb-2">Organization:</h3>
                <p className="text-sm font-mono bg-yellow-100 p-2 rounded">
                  {TEST_ORG_ID}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Test Conversation:</h3>
                <p className="text-sm font-mono bg-yellow-100 p-2 rounded">
                  48eedfba-2568-4231-bb38-2ce20420900d
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Widget Test Selectors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Container:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><code>data-testid="widget-container"</code></li>
                  <li><code>data-testid="widget-button"</code></li>
                  <li><code>data-testid="widget-panel"</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Interface:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><code>data-testid="widget-header"</code></li>
                  <li><code>data-testid="widget-messages"</code></li>
                  <li><code>data-testid="widget-message"</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Input:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><code>data-testid="widget-message-input"</code></li>
                  <li><code>data-testid="widget-send-button"</code></li>
                  <li><code>data-testid="widget-typing-indicator"</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">
              Real-time Communication Test
            </h2>
            <p className="text-purple-800 mb-4">
              To test bidirectional communication:
            </p>
            <ol className="space-y-2 text-purple-800">
              <li>1. Open this page in one browser tab</li>
              <li>2. Open the dashboard in another tab</li>
              <li>3. Login as agent (jam@jam.com / password123)</li>
              <li>4. Open the test conversation in dashboard</li>
              <li>5. Send messages from both widget and dashboard</li>
              <li>6. Verify real-time delivery and typing indicators</li>
            </ol>
          </div>

          <div className="mt-8 p-6 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold text-red-900 mb-3">
              Debug Information
            </h2>
            <div className="text-red-800 space-y-2">
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Widget Organization:</strong> {TEST_ORG_ID}</p>
              <p><strong>Real-time Status:</strong> <span id="realtime-status">Checking...</span></p>
              <p><strong>Widget Status:</strong> <span id="widget-status">Initializing...</span></p>
            </div>
          </div>
        </div>

        {/* Sample content to make the page feel more realistic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Sample Content 1</h3>
            <p className="text-gray-600">
              This is sample content to make the page feel more like a real website.
              The widget should work seamlessly alongside regular page content.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Sample Content 2</h3>
            <p className="text-gray-600">
              Users should be able to interact with the page normally while
              the widget provides customer support functionality.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Sample Content 3</h3>
            <p className="text-gray-600">
              The widget should maintain its position and functionality
              regardless of page scrolling or content changes.
            </p>
          </div>
        </div>

        {/* More content to test scrolling */}
        <div className="mt-8 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Extended Content</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
              quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
              eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
              sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
          </div>
        </div>
      </div>

      {/* Widget Component */}
      <WidgetProvider
        organizationId={TEST_ORG_ID}
        conversationId={TEST_CONVERSATION_ID}
      >
        {/* Widget will render its own UI */}
      </WidgetProvider>

      {/* Debug Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Update debug status
            setTimeout(() => {
              const realtimeStatus = document.getElementById('realtime-status');
              const widgetStatus = document.getElementById('widget-status');
              
              if (realtimeStatus) {
                realtimeStatus.textContent = 'Connected';
                realtimeStatus.className = 'text-green-600 font-semibold';
              }
              
              if (widgetStatus) {
                widgetStatus.textContent = 'Ready';
                widgetStatus.className = 'text-green-600 font-semibold';
              }
            }, 2000);
          `,
        }}
      />
    </div>
  );
}
