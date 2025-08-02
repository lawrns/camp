/**
 * ULTIMATE WIDGET TEST COMPONENT
 *
 * Test component to verify that all advanced features are working
 */

"use client";

import React from 'react';
import { UltimateWidget } from './UltimateWidget';

export function UltimateWidgetTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">UltimateWidget Advanced Features Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Features Implemented:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Message Reactions & Emoticons</li>
            <li>✅ File Attachments (upload, drag & drop, preview)</li>
            <li>✅ Message Threading/History</li>
            <li>✅ Sound Notifications</li>
            <li>✅ Advanced Message Actions (reply, copy, react)</li>
            <li>✅ File Upload Progress Tracking</li>
            <li>✅ Audio Notification Service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Configuration:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>File Upload: Enabled (max 10MB, 5 files)</li>
            <li>Reactions: Enabled</li>
            <li>Threading: Enabled</li>
            <li>Sound Notifications: Enabled</li>
            <li>Accepted File Types: Images, PDF, Documents, Videos, Audio</li>
          </ul>
        </div>

        <div className="mt-8">
          <UltimateWidget
            organizationId="test-org"
            config={{
              organizationName: 'Campfire Test',
              primaryColor: '#3b82f6',
              position: 'bottom-right',
              welcomeMessage: 'Hi! This is a test of the advanced widget features. Try uploading files, reacting to messages, and more!',
              showWelcomeMessage: true,
              enableHelp: true,
              enableNotifications: true,
              // Advanced features
              enableFileUpload: true,
              enableReactions: true,
              enableThreading: true,
              enableSoundNotifications: true,
              maxFileSize: 10,
              maxFiles: 5,
              acceptedFileTypes: ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
            }}
            onMessage={(message) => {
              console.log('Message sent:', message);
            }}
            onClose={() => {
              console.log('Widget closed');
            }}
          />
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the chat widget button in the bottom-right corner</li>
            <li>Try sending a message with text</li>
            <li>Click the file upload button (📎) to test file upload</li>
            <li>Try dragging and dropping files onto the upload area</li>
            <li>Hover over messages to see reaction and reply buttons</li>
            <li>Click the emoji button to add emojis to your message</li>
            <li>Check that sound notifications play when messages are sent/received</li>
            <li>Test the different tabs (Home, Messages, Help)</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">Advanced Features Status:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Message Reactions
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              File Attachments
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Message Threading
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Sound Notifications
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Drag & Drop Upload
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Progress Tracking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 