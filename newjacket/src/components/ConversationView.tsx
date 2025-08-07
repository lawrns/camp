import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Clock, 
  MoreHorizontal, 
  Send, 
  Paperclip, 
  Smile,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  timestamp: string;
  avatar: string;
}

interface ConversationViewProps {
  conversationId: string;
  isCollapsed: boolean;
}

export default function ConversationView({ conversationId, isCollapsed }: ConversationViewProps) {
  const [replyText, setReplyText] = useState('');

  const messages: Message[] = [
    {
      id: '1',
      sender: 'customer',
      content: "I'd placed an order for the previous model zPhone and received it yesterday. I'd like to know if I can return the phone and get a refund now.",
      timestamp: '3m',
      avatar: 'AP'
    },
    {
      id: '2',
      sender: 'agent',
      content: "Yes, you can. Would you mind me asking why you'd like to return it?",
      timestamp: '3m',
      avatar: 'You'
    },
    {
      id: '3',
      sender: 'customer',
      content: "Not at all! I'd like to return this and get the latest zPhone instead. Can you tell me what the refund procedure is?",
      timestamp: '2m',
      avatar: 'AP'
    },
    {
      id: '4',
      sender: 'agent',
      content: "Of course! Just give me your order details along with your invoice number to initiate the return. Once the refund's been processed, the money will be credited to your account within 48 business hours.",
      timestamp: 'Now',
      avatar: 'You'
    },
    {
      id: '5',
      sender: 'customer',
      content: "That's great. I'll send you a copy of the invoice right away! Thank you for your help.",
      timestamp: 'Now',
      avatar: 'AP'
    }
  ];

  const handleSendReply = () => {
    if (replyText.trim()) {
      // Handle sending reply
      setReplyText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <motion.div 
        className="px-6 py-4 border-b border-border bg-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                AP
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ashlin Paul</h2>
              <p className="text-sm text-muted-foreground">Active 5h ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xl ${message.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-xs">
                    {message.avatar === 'You' ? 'Y' : message.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`mx-3 ${message.sender === 'agent' ? 'text-right' : 'text-left'}`}>
                  <motion.div 
                    className={cn(
                      "inline-block px-4 py-3 rounded-2xl",
                      message.sender === 'agent'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reply Section */}
      <motion.div 
        className="border-t border-border bg-muted/30 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex space-x-2 mb-3">
          <Button size="sm">Reply</Button>
          <Button variant="outline" size="sm">Note</Button>
          <Button variant="outline" size="sm">Forward</Button>
        </div>

        <div className="bg-card border border-input rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full p-3 border-0 resize-none focus:outline-none rounded-t-lg bg-transparent"
            rows={3}
          />
          
          <div className="flex items-center justify-between p-3 border-t border-border">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              size="sm"
            >
              <span>Send</span>
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}