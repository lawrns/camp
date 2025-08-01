"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. I understand your request and I\'m here to help you with any questions you might have.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="ds-flex ds-items-center ds-justify-between ds-p-4 ds-bg-surface ds-border-b ds-border-border">
        <h1 className="ds-text-lg ds-font-semibold ds-text-foreground">
          Customer Support Chat
        </h1>
        <div className="ds-flex ds-items-center ds-gap-2">
          <div className="ds-w-2 ds-h-2 ds-bg-success-500 ds-rounded-full"></div>
          <span className="ds-text-sm ds-text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        <div className="ds-space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.sender} ${
                message.sender === 'user' ? 'ds-ml-auto' : 'ds-mr-auto'
              }`}
            >
              <div className="ds-text-sm ds-mb-1">
                {message.content}
              </div>
              <div className={`ds-text-xs ds-opacity-75 ${
                message.sender === 'user' ? 'ds-text-primary-100' : 'ds-text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <form onSubmit={handleSendMessage} className="ds-flex ds-gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="ds-flex-1 ds-px-4 ds-py-3 ds-border ds-border-border ds-rounded-lg ds-bg-background ds-text-foreground ds-placeholder-muted-foreground focus:ds-border-primary-500 focus:ds-outline-none focus:ds-ring-2 focus:ds-ring-offset-2 focus:ds-ring-offset-background focus:ds-ring-primary-500 ds-transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="ds-px-6 ds-py-3 ds-bg-primary-500 ds-text-primary-50 ds-rounded-lg ds-font-medium ds-transition-all hover:ds-bg-primary-600 disabled:ds-opacity-50 disabled:ds-cursor-not-allowed ds-focus-ring"
          >
            Send
          </button>
        </form>
        
        {/* Typing Indicator */}
        <div className="ds-mt-2 ds-text-xs ds-text-muted-foreground ds-flex ds-items-center ds-gap-1">
          <div className="ds-w-1 ds-h-1 ds-bg-muted-foreground ds-rounded-full ds-animate-pulse"></div>
          <span>AI is typing...</span>
        </div>
      </div>
    </div>
  );
}
