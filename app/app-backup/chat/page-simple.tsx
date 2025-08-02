"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button-unified";
import { ChatCircle, PaperPlaneTilt, User, Robot } from "@phosphor-icons/react";
import { getBrowserClient } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_name?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function SimpleChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! Welcome to Campfire support. How can I help you today?',
      sender_type: 'agent',
      sender_name: 'Support Agent',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      status: 'read',
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_type: 'customer',
      sender_name: user?.email || 'You',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 500);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAgentResponse(newMessage),
        sender_type: 'agent',
        sender_name: 'Support Agent',
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 3000);
  };

  const getAgentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you with any questions you have. What can I assist you with today?";
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('login')) {
      return "I'd be happy to help you with your account! Can you tell me more about the specific issue you're experiencing?";
    }
    
    if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return "I can help you with billing questions! What specific billing question do you have?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! Is there anything else I can help you with today?";
    }
    
    return "I understand you need help. Could you provide a bit more detail about what you're looking for?";
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChatCircle size={24} weight="fill" className="text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Chat</h1>
              <p className="text-sm text-gray-600">
                {user ? `Chatting as ${user.email}` : "Demo Chat"}
              </p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            🟢 Connected
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-xs lg:max-w-md`}>
                {message.sender_type !== 'customer' && (
                  <div className="flex-shrink-0">
                    {message.sender_type === 'agent' ? (
                      <User className="h-8 w-8 p-1 bg-blue-100 text-blue-600 rounded-full" />
                    ) : message.sender_type === 'ai' ? (
                      <Robot className="h-8 w-8 p-1 bg-purple-100 text-purple-600 rounded-full" />
                    ) : (
                      <ChatCircle className="h-8 w-8 p-1 bg-gray-100 text-gray-600 rounded-full" />
                    )}
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-lg shadow-sm ${
                    message.sender_type === 'customer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      message.sender_type === 'customer' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.sender_type === 'customer' && (
                      <span className="text-xs text-blue-100">
                        {message.status === 'sending' ? '⏳' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
                
                {message.sender_type === 'customer' && (
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
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 p-1 bg-blue-100 text-blue-600 rounded-full" />
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-sm">
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
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperPlaneTilt className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
