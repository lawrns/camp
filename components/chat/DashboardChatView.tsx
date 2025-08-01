"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import {
  PaperPlaneTilt as Send,
  Robot as Bot,
  User,
  Clock,
  CheckCircle,
  Warning as AlertCircle,
  DotsThree as MoreHorizontal
} from '@phosphor-icons/react';
import { SmartRepliesHeaderIcon } from './SmartRepliesHeaderIcon';

interface Message {
  id: string;
  content: string;
  sender_type: 'visitor' | 'operator' | 'ai_assistant';
  sender_name: string;
  sender_email?: string;
  created_at: string;
  conversation_id: string;
  organization_id: string;
  read_status?: string;
  attachments?: any[];
}

interface DashboardChatViewProps {
  conversationId: string;
  className?: string;
}

export function DashboardChatView({ conversationId, className }: DashboardChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for the conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('[DashboardChatView] Loading messages for conversation:', conversationId);

      const response = await fetch(`/api/dashboard/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[DashboardChatView] Messages loaded:', data.messages?.length || 0);

      setMessages(data.messages || []);
    } catch (err) {
      console.error('[DashboardChatView] Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !conversationId) return;

    try {
      setIsSending(true);
      setError(null);

      console.log('[DashboardChatView] Sending message:', newMessage.trim());

      const response = await fetch(`/api/dashboard/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newMessage.trim(),
          sender_type: 'operator',
          sender_name: 'Agent'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[DashboardChatView] Message sent successfully:', data.message?.id);

      // Clear the input
      setNewMessage("");

      // The real-time subscription will handle adding the message to the UI
    } catch (err) {
      console.error('[DashboardChatView] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversationId) return;

    console.log('[DashboardChatView] Setting up real-time subscriptions for conversation:', conversationId);

    // Subscribe to message changes for this specific conversation
    const messageChannel = supabase
      .channel(`dashboard-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('[DashboardChatView] Message change received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Add new message to the list
            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.content,
              sender_type: payload.new.sender_type,
              sender_name: payload.new.sender_name,
              sender_email: payload.new.sender_email,
              created_at: payload.new.created_at,
              conversation_id: payload.new.conversation_id,
              organization_id: payload.new.organization_id,
              read_status: payload.new.read_status,
              attachments: payload.new.attachments
            };

            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing message
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new }
                : msg
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted message
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    console.log('[DashboardChatView] Real-time subscription established');

    // Cleanup subscription
    return () => {
      console.log('[DashboardChatView] Cleaning up real-time subscription');
      messageChannel.unsubscribe();
    };
  }, [conversationId]);

  // Load messages on mount and when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter key for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai_assistant':
        return <Bot className="h-4 w-4" />;
      case 'operator':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderBadgeColor = (senderType: string) => {
    switch (senderType) {
      case 'ai_assistant':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-green-100 text-green-800';
      case 'visitor':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadMessages}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle smart reply selection
  const handleSmartReplySelect = (reply: string) => {
    setNewMessage(reply);
  };

  // Get last customer message for smart replies context
  const lastCustomerMessage = messages
    .filter(msg => msg.sender_type === 'visitor')
    .slice(-1)[0]?.content || '';

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header with Smart Replies */}
      <div className="border-b p-4 flex items-center justify-center bg-gray-50 text-center">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium">Conversation</h4>
          <Badge variant="outline">{conversationId.slice(0, 8)}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <SmartRepliesHeaderIcon
            conversationId={conversationId}
            organizationId="default" // TODO: Get from context
            lastMessage={lastCustomerMessage}
            onReplySelect={handleSmartReplySelect}
          />
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {getSenderIcon(message.sender_type)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {message.sender_name || 'Unknown'}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getSenderBadgeColor(message.sender_type)}`}
                  >
                    {message.sender_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
            className="self-end"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
