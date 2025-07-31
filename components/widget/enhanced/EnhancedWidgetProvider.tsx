"use client";

import React from 'react';
import { EnhancedWidget, WidgetConfig } from './EnhancedWidget';
import { trpc } from '@/lib/trpc/client';
import { logWidgetEvent, logWidgetError } from '@/lib/monitoring/widget-logger';

interface EnhancedWidgetProviderProps {
  organizationId: string;
  debug?: boolean;
  config?: Partial<WidgetConfig>;
}

export function EnhancedWidgetProvider({ 
  organizationId, 
  debug = false,
  config = {} 
}: EnhancedWidgetProviderProps) {
  // Default widget configuration
  const defaultConfig: WidgetConfig = {
    organizationName: "Campfire Support",
    primaryColor: "#3B82F6",
    position: "bottom-right",
    welcomeMessage: "Hi! 👋 How can we help you today?",
    showWelcomeMessage: true,
    enableFAQ: true,
    enableHelp: true,
    contactInfo: {
      email: "support@campfire.com",
      phone: "+1 (555) 123-4567",
      website: "https://campfire.com",
      businessHours: {
        timezone: "EST",
        schedule: [
          { day: "Monday", open: "9:00 AM", close: "6:00 PM" },
          { day: "Tuesday", open: "9:00 AM", close: "6:00 PM" },
          { day: "Wednesday", open: "9:00 AM", close: "6:00 PM" },
          { day: "Thursday", open: "9:00 AM", close: "6:00 PM" },
          { day: "Friday", open: "9:00 AM", close: "6:00 PM" },
          { day: "Saturday", closed: true },
          { day: "Sunday", closed: true },
        ]
      }
    },
    ...config,
  };

  // TRPC mutation for sending messages
  const sendMessageMutation = trpc.widget.sendMessage?.useMutation({
    onSuccess: (data) => {
      logWidgetEvent('message_sent_success', { messageId: data?.id });
    },
    onError: (error) => {
      logWidgetError('Failed to send message', { error: error.message });
    },
  });

  // Handle message sending
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      logWidgetEvent('message_send_attempt', { 
        contentLength: content.length,
        hasAttachments: (attachments?.length || 0) > 0 
      });

      if (sendMessageMutation) {
        await sendMessageMutation.mutateAsync({
          organizationId,
          content,
          attachments: attachments?.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })) || [],
        });
      } else {
        // Fallback: simulate message sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        logWidgetEvent('message_sent_fallback', { content });
      }
    } catch (error) {
      logWidgetError('Message send failed', { error });
      throw error;
    }
  };

  // Handle typing indicators
  const handleStartTyping = () => {
    logWidgetEvent('user_typing_start');
    // In real implementation, this would send typing indicator to server
  };

  const handleStopTyping = () => {
    logWidgetEvent('user_typing_stop');
    // In real implementation, this would stop typing indicator on server
  };

  if (debug) {
    console.log('[EnhancedWidget] Initialized with config:', defaultConfig);
  }

  return (
    <EnhancedWidget
      config={defaultConfig}
      organizationId={organizationId}
      onSendMessage={handleSendMessage}
      onStartTyping={handleStartTyping}
      onStopTyping={handleStopTyping}
    />
  );
}
