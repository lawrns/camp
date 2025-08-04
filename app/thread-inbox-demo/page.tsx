"use client";

import React from 'react';
import { ThreadInboxView } from '@/components/widget/thread-inbox/ThreadInboxView';

export default function ThreadInboxDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thread Inbox Demo</h1>
        <p className="text-gray-600 mb-8">
          This demonstrates the mobile-first thread inbox interface with persistent state.
        </p>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <ThreadInboxView
            organizationId="demo-org-123"
            onClose={() => console.log('Thread inbox closed')}
            onSendMessage={async (content) => {
              console.log('Sending message:', content);
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log('Message sent successfully');
            }}
          />
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Features Demonstrated:</h2>
          <ul className="text-blue-800 space-y-1">
            <li>• Mobile-first responsive design</li>
            <li>• Persistent thread state across page reloads</li>
            <li>• Thread list with last message previews</li>
            <li>• Empty state with call-to-action</li>
            <li>• Bottom navigation with active states</li>
            <li>• Thread conversation view</li>
            <li>• Real-time message sending</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 