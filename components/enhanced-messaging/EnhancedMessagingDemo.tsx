"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  EnhancedComposer,
  EnhancedMessageList,
  EnhancedTypingIndicator,
  PresenceIndicator,
  NotificationSystem,
  useNotifications,
  useRealTimeMessaging,
  ResponsiveLayout,
  useBreakpoint,
  MessageData,
  TypingUser,
  PresenceUser,
} from './index';

// Demo data
const DEMO_MESSAGES: MessageData[] = [
  {
    id: '1',
    content: 'Hello! Welcome to the enhanced messaging system. 👋',
    senderType: 'agent',
    senderName: 'Sarah (Agent)',
    senderAvatar: '/avatars/agent.jpg',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'read',
    reactions: [
      { emoji: '👍', count: 2, users: ['John', 'Alice'], hasReacted: false }
    ],
  },
  {
    id: '2',
    content: 'This looks amazing! The new features are really impressive.',
    senderType: 'user',
    senderName: 'John Doe',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    status: 'read',
  },
  {
    id: '3',
    content: 'I love the **rich text formatting** and `code blocks`! \n\n> This is a quote\n\nAnd here\'s a list:\n- Feature 1\n- Feature 2\n- Feature 3',
    senderType: 'user',
    senderName: 'Alice Smith',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    status: 'read',
    reactions: [
      { emoji: '❤️', count: 1, users: ['Sarah'], hasReacted: true }
    ],
  },
  {
    id: '4',
    content: 'The AI integration is working perfectly! Let me know if you need any assistance.',
    senderType: 'ai',
    senderName: 'AI Assistant',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    status: 'delivered',
  },
];

const DEMO_TYPING_USERS: TypingUser[] = [
  {
    id: 'user-1',
    name: 'Mike Johnson',
    role: 'user',
  },
];

const DEMO_PRESENCE_USERS: PresenceUser[] = [
  {
    id: 'agent-1',
    name: 'Sarah Wilson',
    avatar: '/avatars/agent.jpg',
    status: 'online',
  },
  {
    id: 'user-1',
    name: 'John Doe',
    status: 'away',
    lastSeen: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'user-2',
    name: 'Alice Smith',
    status: 'online',
  },
];

export function EnhancedMessagingDemo() {
  const [messages, setMessages] = useState<MessageData[]>(DEMO_MESSAGES);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showTypingDemo, setShowTypingDemo] = useState(false);
  const breakpoint = useBreakpoint();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  // Simulate sending a message
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    const newMessage: MessageData = {
      id: `msg-${Date.now()}`,
      content,
      senderType: 'user',
      senderName: 'You',
      timestamp: new Date().toISOString(),
      status: 'sending',
      attachments: attachments?.map((file, index) => ({
        id: `att-${index}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      })) || [],
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
      ));
    }, 2000);

    // Add notification
    addNotification({
      type: 'message',
      title: 'Message Sent',
      message: 'Your message has been delivered successfully.',
      autoHide: true,
      duration: 3000,
    });

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: MessageData = {
        id: `ai-${Date.now()}`,
        content: `Thanks for your message! I received: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        senderType: 'ai',
        senderName: 'AI Assistant',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      setMessages(prev => [...prev, aiResponse]);

      addNotification({
        type: 'message',
        title: 'New Message',
        message: 'AI Assistant replied to your message.',
        avatar: '/avatars/ai.jpg',
        actionLabel: 'View',
        autoHide: true,
        duration: 5000,
      });
    }, 3000);
  }, [addNotification]);

  // Handle message reactions
  const handleReact = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = [...(msg.reactions || [])];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        if (existingReaction.hasReacted) {
          // Remove reaction
          existingReaction.count--;
          existingReaction.hasReacted = false;
          existingReaction.users = existingReaction.users.filter(u => u !== 'You');
          
          if (existingReaction.count === 0) {
            return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
          }
        } else {
          // Add reaction
          existingReaction.count++;
          existingReaction.hasReacted = true;
          existingReaction.users.push('You');
        }
      } else {
        // New reaction
        reactions.push({
          emoji,
          count: 1,
          users: ['You'],
          hasReacted: true,
        });
      }

      return { ...msg, reactions };
    }));
  }, []);

  // Simulate typing indicator
  const handleStartTyping = useCallback(() => {
    if (!showTypingDemo) {
      setTypingUsers(DEMO_TYPING_USERS);
      setShowTypingDemo(true);
      
      setTimeout(() => {
        setTypingUsers([]);
        setShowTypingDemo(false);
      }, 3000);
    }
  }, [showTypingDemo]);

  // Demo sidebar content
  const sidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Online Users</h3>
        <div className="space-y-2">
          {DEMO_PRESENCE_USERS.map(user => (
            <PresenceIndicator
              key={user.id}
              user={user}
              variant="full"
              showName={true}
              showLastSeen={true}
              size="sm"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Demo Actions</h3>
        <div className="space-y-2">
          <button
            onClick={handleStartTyping}
            disabled={showTypingDemo}
            className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            {showTypingDemo ? 'Typing demo active...' : 'Show typing indicator'}
          </button>
          
          <button
            onClick={() => addNotification({
              type: 'mention',
              title: 'You were mentioned',
              message: 'Sarah mentioned you in the conversation.',
              avatar: '/avatars/agent.jpg',
              actionLabel: 'View',
            })}
            className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            Test mention notification
          </button>
          
          <button
            onClick={() => addNotification({
              type: 'error',
              title: 'Connection Error',
              message: 'Failed to connect to the server. Please try again.',
              autoHide: false,
            })}
            className="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
          >
            Test error notification
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>✅ Rich text formatting</div>
          <div>✅ Emoji reactions</div>
          <div>✅ File attachments</div>
          <div>✅ Typing indicators</div>
          <div>✅ Read receipts</div>
          <div>✅ Presence status</div>
          <div>✅ Real-time notifications</div>
          <div>✅ Mobile responsive</div>
          <div>✅ Accessibility support</div>
          <div>✅ Performance optimized</div>
        </div>
      </div>
    </div>
  );

  // Main chat content
  const mainContent = (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Enhanced Messaging Demo</h2>
            <p className="text-sm text-gray-600">
              {DEMO_PRESENCE_USERS.filter(u => u.status === 'online').length} online
            </p>
          </div>
          <div className="flex items-center gap-2">
            {DEMO_PRESENCE_USERS.slice(0, 3).map(user => (
              <PresenceIndicator
                key={user.id}
                user={user}
                variant="dot"
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <EnhancedMessageList
          messages={messages}
          typingUsers={typingUsers}
          enableVirtualization={messages.length > 50}
          enableAutoScroll={true}
          enableGrouping={true}
          onReact={handleReact}
          onCopy={(content) => {
            navigator.clipboard.writeText(content);
            addNotification({
              type: 'success',
              title: 'Copied',
              message: 'Message copied to clipboard.',
              autoHide: true,
              duration: 2000,
            });
          }}
        />
      </div>

      {/* Composer */}
      <div className="border-t bg-white p-4">
        <EnhancedComposer
          onSend={handleSendMessage}
          placeholder="Type your message..."
          enableEmoji={true}
          enableAttachments={true}
          enableDrafts={true}
          maxLength={2000}
          variant={breakpoint === 'mobile' ? 'compact' : 'default'}
          onTyping={handleStartTyping}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50">
      <ResponsiveLayout
        sidebar={sidebarContent}
        main={mainContent}
        sidebarWidth="w-80"
      />

      {/* Notifications */}
      <NotificationSystem
        notifications={notifications}
        position="top-right"
        enableSound={false} // Disabled for demo
        onNotificationDismiss={dismissNotification}
        onNotificationClick={(notification) => {
          console.log('Notification clicked:', notification);
          dismissNotification(notification.id);
        }}
      />
    </div>
  );
}
