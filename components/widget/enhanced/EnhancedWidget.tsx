"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatCircle, 
  Question, 
  Phone, 
  X, 
  Minus,
  ArrowsOut,
  ArrowsIn,
  PaperPlaneTilt
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WidgetConfig } from './EnhancedWidgetProvider';

interface EnhancedWidgetProps {
  organizationId: string;
  config: WidgetConfig;
  debug?: boolean;
}

interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  activeTab: 'chat' | 'faq' | 'help';
  conversationId?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

export const EnhancedWidget: React.FC<EnhancedWidgetProps> = ({
  organizationId,
  config,
  debug = false
}) => {
  const [state, setState] = useState<WidgetState>({
    isOpen: false,
    isMinimized: false,
    isExpanded: false,
    activeTab: 'chat'
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize conversation
  useEffect(() => {
    if (state.isOpen && !state.conversationId) {
      initializeConversation();
    }
  }, [state.isOpen]);

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/widget/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          organizationId,
          visitorId: `visitor-${Date.now()}`,
          customerName: 'Website Visitor',
          customerEmail: 'visitor@widget.com',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const conversationId = data.conversation?.id || data.conversationId || data.id;
        setState(prev => ({ ...prev, conversationId }));
        
        // Add welcome message
        if (config.showWelcomeMessage && config.welcomeMessage) {
          setMessages([{
            id: 'welcome',
            content: config.welcomeMessage,
            sender: 'system',
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !state.conversationId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          conversationId: state.conversationId,
          content: inputValue,
          senderType: 'visitor'
        }),
      });

      if (response.ok) {
        // Simulate agent response
        setTimeout(() => {
          const agentMessage: Message = {
            id: `agent-${Date.now()}`,
            content: "Thanks for your message! An agent will respond shortly.",
            sender: 'agent',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
          setIsTyping(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const toggleWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const minimizeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const expandWidget = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const closeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const switchTab = useCallback((tab: 'chat' | 'faq' | 'help') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // Get widget size classes
  const getWidgetSizeClasses = () => {
    if (state.isExpanded) {
      return 'w-[90vw] h-[90vh] max-w-4xl max-h-[800px]';
    }
    return 'w-80 h-96 sm:w-96 sm:h-[500px]';
  };

  // Get position classes
  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (config.position) {
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      default:
        return `${base} bottom-4 right-4`;
    }
  };

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                message.sender === 'user'
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="widget-message-input"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            data-testid="widget-send-button"
          >
            <PaperPlaneTilt size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFAQTab = () => (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Frequently Asked Questions</h3>
      <div className="space-y-3">
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2">How can I get help?</h4>
          <p className="text-sm text-gray-600">You can start a chat with us or browse our help articles.</p>
        </div>
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2">What are your business hours?</h4>
          <p className="text-sm text-gray-600">
            {config.contactInfo?.businessHours?.monday || "9:00 AM - 6:00 PM"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Contact Information</h3>
      <div className="space-y-3">
        {config.contactInfo?.email && (
          <div>
            <h4 className="font-medium">Email</h4>
            <p className="text-sm text-gray-600">{config.contactInfo.email}</p>
          </div>
        )}
        {config.contactInfo?.phone && (
          <div>
            <h4 className="font-medium">Phone</h4>
            <p className="text-sm text-gray-600">{config.contactInfo.phone}</p>
          </div>
        )}
        <div>
          <h4 className="font-medium">Business Hours</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {config.contactInfo?.businessHours && Object.entries(config.contactInfo.businessHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize">{day}:</span>
                <span>{String(hours)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={getPositionClasses()}>
      {/* Widget Button */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleWidget}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            style={{ backgroundColor: config.primaryColor }}
            data-testid="widget-button"
          >
            <ChatCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "bg-white rounded-lg shadow-2xl border overflow-hidden",
              getWidgetSizeClasses(),
              state.isMinimized && "h-12"
            )}
            data-testid="widget-panel"
          >
            {/* Header */}
            <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <span className="font-medium text-sm">{config.organizationName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={minimizeWidget}>
                  <Minus size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={expandWidget}>
                  {state.isExpanded ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
                </Button>
                <Button variant="ghost" size="sm" onClick={closeWidget}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            {!state.isMinimized && (
              <>
                {/* Tabs */}
                <div className="border-b">
                  <div className="flex">
                    <button
                      onClick={() => switchTab('chat')}
                      className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        state.activeTab === 'chat'
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <ChatCircle size={16} className="inline mr-2" />
                      Chat
                    </button>
                    {config.enableFAQ && (
                      <button
                        onClick={() => switchTab('faq')}
                        className={cn(
                          "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          state.activeTab === 'faq'
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <Question size={16} className="inline mr-2" />
                        FAQ
                      </button>
                    )}
                    {config.enableHelp && (
                      <button
                        onClick={() => switchTab('help')}
                        className={cn(
                          "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          state.activeTab === 'help'
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <Phone size={16} className="inline mr-2" />
                        Help
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  {state.activeTab === 'chat' && renderChatTab()}
                  {state.activeTab === 'faq' && renderFAQTab()}
                  {state.activeTab === 'help' && renderHelpTab()}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};