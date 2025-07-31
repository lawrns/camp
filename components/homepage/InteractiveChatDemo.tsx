"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User, Bot } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';

// Optimized animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
};

const typingVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export const InteractiveChatDemo = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);

  // Pre-defined conversation for performance
  const conversation = useMemo(() => [
    { text: "Hi! I need help with my billing issue.", sender: 'user' as const },
    { text: "Of course! I can help you with that. What seems to be the problem?", sender: 'ai' as const },
    { text: "I was charged twice for the same service.", sender: 'user' as const },
    { text: "I understand that's frustrating. Let me check your account right away...", sender: 'ai' as const },
    { text: "I found the duplicate charge. I'm processing a refund now - you'll see it in 2-3 business days.", sender: 'ai' as const },
    { text: "Thank you so much! That's exactly what I needed.", sender: 'user' as const },
    { text: "You're welcome! I've also added account protection to prevent this in the future. Is there anything else I can help with?", sender: 'ai' as const }
  ], []);

  // Optimized typing animation
  const typeMessage = useCallback(async (text: string, sender: 'user' | 'ai') => {
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    
    if (sender === 'ai') {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsTyping(false);
    }

    setMessages(prev => [...prev, {
      id: messageId,
      text,
      sender,
      timestamp: Date.now()
    }]);
  }, []);

  // Auto-play conversation
  useEffect(() => {
    const playConversation = async () => {
      for (let i = 0; i < conversation.length; i++) {
        const { text, sender } = conversation[i];
        await typeMessage(text, sender);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Reset after completion
      setTimeout(() => {
        setMessages([]);
        setCurrentTypingIndex(0);
      }, 5000);
    };

    const interval = setInterval(playConversation, 15000);
    return () => clearInterval(interval);
  }, [conversation, typeMessage]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white font-medium">Campfire Support</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-xs ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`}>
                  {message.sender === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-gray-600" />
                  )}
                </div>
                <div className={`px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              variants={typingVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-gray-600" />
                </div>
                <div className="px-4 py-2 rounded-2xl bg-gray-100">
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MessageCircle size={16} />
          <span>AI-powered responses in real-time</span>
        </div>
      </div>
    </div>
  );
}; 