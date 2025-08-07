import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  unread: boolean;
}

interface ConversationListProps {
  selectedConversation: string;
  setSelectedConversation: (id: string) => void;
  isCollapsed: boolean;
}

export default function ConversationList({ selectedConversation, setSelectedConversation, isCollapsed }: ConversationListProps) {
  const conversations: Conversation[] = [
    {
      id: '1',
      customer: 'Ashlin Paul',
      avatar: 'AP',
      lastMessage: "That's great. I'll send you a copy of...",
      timestamp: 'Now',
      status: 'open',
      priority: 'medium',
      unread: true
    },
    {
      id: '2',
      customer: 'Rajiv Vincent',
      avatar: 'RV',
      lastMessage: "We're currently working on it, ...",
      timestamp: '43m',
      status: 'pending',
      priority: 'high',
      unread: false
    },
    {
      id: '3',
      customer: 'Amber Cello',
      avatar: 'AC',
      lastMessage: 'Yes, we can do that. Just giv...',
      timestamp: '1h',
      status: 'open',
      priority: 'low',
      unread: false
    },
    {
      id: '4',
      customer: 'Cody Parker',
      avatar: 'CP',
      lastMessage: 'It usually takes less than 5 busi...',
      timestamp: '1h',
      status: 'open',
      priority: 'medium',
      unread: false
    },
    {
      id: '5',
      customer: 'Vanessa Williams',
      avatar: 'VW',
      lastMessage: 'Yes, you can also refer to the a...',
      timestamp: '1h',
      status: 'closed',
      priority: 'low',
      unread: false
    },
    {
      id: '6',
      customer: 'Aaron Ries',
      avatar: 'AR',
      lastMessage: 'Sure, let me get back to you on...',
      timestamp: '1h',
      status: 'open',
      priority: 'medium',
      unread: false
    },
    {
      id: '7',
      customer: 'Mark Davis',
      avatar: 'MD',
      lastMessage: 'Glad to be of help!',
      timestamp: '1h',
      status: 'open',
      priority: 'high',
      unread: false
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-border';
    }
  };

  const listVariants = {
    expanded: { width: 384 },
    collapsed: { width: 0, opacity: 0 }
  };

  if (isCollapsed) {
    return (
      <motion.div 
        className="overflow-hidden"
        variants={listVariants}
        animate="collapsed"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    );
  }

  return (
    <motion.div 
      className="bg-card border-r border-border flex flex-col"
      variants={listVariants}
      animate="expanded"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" className="p-0 h-auto font-semibold text-foreground">
            All
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Badge variant="secondary">46</Badge>
          </div>
        </div>
        
        <div className="relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" className="p-0 h-auto text-sm font-medium">
            Newest
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedConversation(conversation.id)}
            className={cn(
              "p-4 border-l-4 cursor-pointer transition-all duration-200 hover:bg-accent/50",
              selectedConversation === conversation.id
                ? 'bg-accent border-l-primary'
                : `${getPriorityColor(conversation.priority)}`,
              conversation.unread && 'bg-accent/30'
            )}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-sm">
                  {conversation.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn(
                    "font-semibold truncate",
                    conversation.unread ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {conversation.customer}
                  </h3>
                  <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                    {conversation.timestamp}
                  </span>
                </div>
                
                <p className={cn(
                  "text-sm truncate mb-2",
                  conversation.unread ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {conversation.lastMessage}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusVariant(conversation.status)}>
                    {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                  </Badge>
                  {conversation.unread && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}