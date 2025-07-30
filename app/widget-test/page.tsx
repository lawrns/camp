"use client";

import React, { useState } from 'react';

/**
 * Minimal Widget Test Page
 * Simple test page without complex dependencies
 */
export default function WidgetTestPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: string}>>([]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        content: message,
        sender: 'visitor'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Minimal Widget Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Information</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Purpose:</strong> Test basic widget functionality without complex dependencies</p>
            <p><strong>Organization ID:</strong> b5e80170-004c-4e82-a88c-3e2166b169dd</p>
            <p><strong>Conversation ID:</strong> 48eedfba-2568-4231-bb38-2ce20420900d</p>
          </div>
        </div>

        {/* Widget Button */}
        <div className="fixed bottom-6 right-6">
          <button
            data-testid="widget-button"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
          >
            {isOpen ? '✕' : '💬'}
          </button>
        </div>

        {/* Widget Panel */}
        {isOpen && (
          <div 
            data-testid="widget-panel"
            className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div 
              data-testid="widget-header"
              className="bg-blue-600 text-white p-4 rounded-t-lg"
            >
              <h3 className="font-semibold">Customer Support</h3>
              <p className="text-sm opacity-90">We're here to help!</p>
            </div>

            {/* Messages */}
            <div 
              data-testid="widget-messages"
              className="flex-1 p-4 overflow-y-auto space-y-3"
            >
              {messages.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Welcome! How can we help you today?
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    data-testid="widget-message"
                    className="bg-gray-100 rounded-lg p-3 text-sm"
                  >
                    <div className="font-medium text-gray-900">{msg.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {msg.sender} • {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  data-testid="widget-message-input"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  data-testid="widget-send-button"
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Status */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Widget button rendered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Widget panel {isOpen ? 'open' : 'closed'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${messages.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">{messages.length} message(s) sent</span>
            </div>
          </div>
        </div>

        {/* API Test Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <button
            data-testid="api-test-button"
            onClick={async () => {
              try {
                const response = await fetch('/api/widget/messages?conversationId=48eedfba-2568-4231-bb38-2ce20420900d', {
                  headers: {
                    'X-Organization-ID': 'b5e80170-004c-4e82-a88c-3e2166b169dd'
                  }
                });
                const data = await response.json();
                console.log('API Test Result:', data);
                alert(`API Test: ${response.status} - Check console for details`);
              } catch (error) {
                console.error('API Test Error:', error);
                alert('API Test Failed - Check console for details');
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Test API Connection
          </button>
        </div>
      </div>
    </div>
  );
}
