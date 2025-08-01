"use client";

import React, { useState } from "react";
import { useTypingPreview } from "@/lib/realtime/useTypingPreview";
import { MessageComposer } from "@/components/unified-ui/components/Composer";

/**
 * Test page for the enhanced typing preview system
 *
 * This page allows testing the unified typing preview functionality:
 * - Real-time typing indicators
 * - Live content preview
 * - 200ms throttling
 * - Database integration
 * - Supabase realtime channels
 */
export default function TestTypingPreviewPage() {
  const [testConversationId] = useState("test-conversation-123");
  const { typingUsers, broadcastTyping, stopTyping, isTyping, updateTypingContent } =
    useTypingPreview(testConversationId);

  const handleSendMessage = (content: string) => {

    stopTyping(testConversationId);
  };

  const handleTyping = () => {

    broadcastTyping(testConversationId);
  };

  const handleStopTyping = () => {

    stopTyping(testConversationId);
  };

  const handleContentChange = (content: string) => {

    updateTypingContent(testConversationId, content);
  };

  return (
    <div className="min-h-screen bg-gray-50 spacing-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔥 Typing Preview System Test</h1>
          <p className="mt-2 text-gray-600">
            Test the unified typing preview system with live content, 200ms throttling, and realtime channels.
          </p>
        </div>

        {/* Status Panel */}
        <div className="mb-6 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Conversation ID:</span>
              <p className="text-sm text-gray-900">{testConversationId}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Currently Typing:</span>
              <p className="text-sm text-gray-900">{isTyping ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Active Typing Users:</span>
              <p className="text-sm text-gray-900">{typingUsers.length}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Feature Flags:</span>
              <p className="text-sm text-gray-900">AI Simulation: Enabled</p>
            </div>
          </div>
        </div>

        {/* Typing Indicators Display */}
        <div className="mb-6 rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Live Typing Indicators</h2>
          {typingUsers.length > 0 ? (
            <div className="space-y-3">
              {typingUsers.map((user) => (
                <div key={user.userId} className="rounded-ds-lg border border-[var(--fl-color-border-interactive)] bg-blue-50 spacing-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-ds-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-blue-900">{user.userName} is typing...</span>
                    <span className="text-xs text-blue-600">({user.senderType})</span>
                  </div>
                  {user.content && (
                    <div className="text-sm italic text-blue-800">
                      Preview: "{user.content}"<span className="animate-pulse">|</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-blue-600">
                    Last update: {new Date(user.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No active typing indicators</p>
              <p className="text-sm">Start typing in the composer below to see live previews</p>
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="rounded-ds-lg bg-white spacing-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Message Composer</h2>
          <MessageComposer
            onSend={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            onContentChange={handleContentChange}
            placeholder="Type a message to test the typing preview system..."
            enableAISuggestions={true}
            enableQuickReplies={true}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-ds-lg bg-yellow-50 spacing-6">
          <h3 className="mb-2 text-lg font-semibold text-yellow-900">Testing Instructions</h3>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>• Type in the composer to trigger typing indicators</li>
            <li>• Content is throttled to 200ms updates</li>
            <li>• Live preview shows what you're typing in real-time</li>
            <li>• Typing stops automatically after 3 seconds of inactivity</li>
            <li>• Open multiple browser tabs to test multi-user typing</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
