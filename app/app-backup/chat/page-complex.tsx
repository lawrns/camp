"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrowserClient } from "@/lib/supabase";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { aiService } from "../services/aiService";

interface Message {
  id: string;
  content: string;
  senderType: 'customer' | 'agent' | 'ai' | 'system';
  sender_name?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setConnectionStatus('connected');

        if (session?.user) {
          // Get or create a conversation for this demo
          await loadOrCreateConversation(supabase, session.user.id);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setConnectionStatus('disconnected');
      }
    };

    const loadOrCreateConversation = async (supabase: unknown, userId: string) => {
      try {
        // First, get the user's organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .single();

        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);

          // Get the most recent conversation for this organization
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (conversations && conversations.length > 0) {
            const convId = conversations[0].id;
            setConversationId(convId);
            await loadMessages(supabase, convId);
          } else {
            // Create a demo conversation if none exists
            await createDemoConversation(supabase, profile.organization_id);
          }
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        // Fall back to demo messages
        setMessages([
          {
            id: '1',
            content: 'Welcome to Campfire! This is a demo conversation.',
            senderType: 'system',
            senderName: 'System',
            timestamp: new Date(),
            status: 'read',
          },
        ]);
      }
    };

    const loadMessages = async (supabase: unknown, conversationId: string) => {
      const { data: messageData, error } = await supabase
        .from('messages')
        .select('id, content, senderType, senderName, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = messageData?.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        senderName: msg.senderName,
        timestamp: new Date(msg.created_at),
        status: 'read' as const,
      })) || [];

      setMessages(formattedMessages);
    };

    const createDemoConversation = async (supabase: unknown, orgId: string) => {
      // This would create a demo conversation - for now just show demo messages
      setMessages([
        {
          id: 'demo-1',
          content: 'Hello! This is a demo conversation. Start typing to test the real-time features!',
          senderType: 'agent',
          senderName: 'Demo Agent',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          status: 'read',
        },
      ]);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !organizationId) return;

    const tempId = Date.now().toString();
    const message: Message = {
      id: tempId,
      content: newMessage,
      senderType: 'customer',
      senderName: user?.email || 'Demo User',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      const supabase = getBrowserClient();

      // Save message to database
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          organization_id: organizationId,
          content: messageContent,
          senderType: 'customer',
          senderName: user?.email || 'Demo User',
          senderId: user?.id || 'demo-user',
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        // Update message status to show error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, status: 'sent' } : msg
          )
        );
      } else {
        // Update with real message ID
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, id: savedMessage.id, status: 'sent' } : msg
          )
        );

        // Simulate agent typing and response
        setTimeout(() => {
          setIsTyping(true);
        }, 1000);

        setTimeout(async () => {
          setIsTyping(false);

          // Generate AI response
          const conversationContext = {
            messages: messages.map(m => ({
              content: m.content,
              senderType: m.senderType,
              timestamp: m.timestamp,
            })),
            customerInfo: {
              name: user?.email || 'Demo User',
              email: user?.email,
            },
          };

          const aiResponse = await aiService.generateResponse(messageContent, conversationContext);

          // Save agent response to database
          const { data: agentMessage } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              organization_id: organizationId,
              content: aiResponse.content,
              senderType: aiResponse.escalate ? 'agent' : 'ai',
              senderName: aiResponse.escalate ? 'Human Agent' : 'AI Assistant',
              senderId: aiResponse.escalate ? 'human-agent' : 'ai-agent',
            })
            .select()
            .single();

          if (agentMessage) {
            const newAgentMessage: Message = {
              id: agentMessage.id,
              content: aiResponse.content,
              senderType: aiResponse.escalate ? 'agent' : 'ai',
              senderName: aiResponse.escalate ? 'Human Agent' : 'AI Assistant',
              timestamp: new Date(agentMessage.created_at),
              status: 'sent',
            };
            setMessages(prev => [...prev, newAgentMessage]);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  const getAgentResponse = (userMessage: string): string => {
    const responses = [
      "Thanks for your message! I'm looking into that for you.",
      "I understand your concern. Let me help you with that.",
      "That's a great question! Here's what I can tell you...",
      "I see what you mean. Let me check our system for you.",
      "Thanks for the details. I'll get that sorted out right away.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MessageCircle size={24} weight="fill" className="text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Chat</h1>
              <p className="text-sm text-gray-600">
                {user ? `Chatting as ${user.email}` : "Guest Chat"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={`${connectionStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}
            >
              {connectionStatus === 'connected' ? '🟢 Connected' :
                connectionStatus === 'connecting' ? '🟡 Connecting' : '🔴 Disconnected'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto p-6 min-h-0">
        <Card className="flex-1 flex flex-col min-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px] bg-gray-50 rounded-lg p-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start a conversation by typing a message below</p>
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-xs lg:max-w-md`}>
                    {message.senderType !== 'customer' && (
                      <div className="flex-shrink-0">
                        {message.senderType === 'agent' ? (
                          <User className="h-8 w-8 p-1 bg-blue-100 text-blue-600 rounded-full" />
                        ) : message.senderType === 'ai' ? (
                          <Bot className="h-8 w-8 p-1 bg-purple-100 text-purple-600 rounded-full" />
                        ) : (
                          <MessageCircle className="h-8 w-8 p-1 bg-gray-100 text-gray-600 rounded-full" />
                        )}
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-lg ${message.senderType === 'customer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                        }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${message.senderType === 'customer' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                          {formatTime(message.timestamp)}
                        </span>
                        {message.senderType === 'customer' && (
                          <span className={`text-xs ${message.status === 'sending' ? 'text-blue-200' :
                            message.status === 'sent' ? 'text-blue-100' :
                              message.status === 'delivered' ? 'text-blue-100' :
                                'text-blue-100'
                            }`}>
                            {message.status === 'sending' ? '⏳' :
                              message.status === 'sent' ? '✓' :
                                message.status === 'delivered' ? '✓✓' :
                                  '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {message.senderType === 'customer' && (
                      <div className="flex-shrink-0">
                        <User className="h-8 w-8 p-1 bg-gray-100 text-gray-600 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2">
                    <User className="h-8 w-8 p-1 bg-blue-100 text-blue-600 rounded-full" />
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
