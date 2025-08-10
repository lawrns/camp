/**
 * Enhanced Conversation List Component - Extracted from InboxDashboard for performance
 * Prevents remounting on every state change and optimizes animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EnhancedConversationListProps {
  filteredConversations: any[];
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
}

const EnhancedConversationList = React.memo(({ 
  filteredConversations, 
  selectedConversation, 
  onSelectConversation,
  searchQuery,
  onSearchChange,
  activeFilter
}: EnhancedConversationListProps) => {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card" data-testid="conversation-list-container">
      {/* Search Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
            data-testid="search-input"
          />
        </div>
        
        {/* Filter Summary */}
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && ` • ${activeFilter}`}
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-muted-foreground mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations'}
            </div>
            <div className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'New conversations will appear here'}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                layout
                className={`
                  p-4 rounded-lg cursor-pointer transition-colors mb-2 border-l-4
                  ${selectedConversation?.id === conversation.id 
                    ? 'bg-accent border-l-primary' 
                    : 'hover:bg-accent/50 border-l-transparent'
                  }
                  ${getPriorityColor(conversation.priority)}
                `}
                onClick={() => onSelectConversation(conversation)}
                data-testid="conversation"
                role="button"
                tabIndex={0}
                aria-label={`Conversation with ${conversation.customerName}, ${conversation.unreadCount || 0} unread messages`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation(conversation);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {conversation.customerName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground" data-testid="conversation-customer-name">
                        {conversation.customerName || 'Unknown Customer'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {conversation.customerEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {conversation.isOnline && (
                      <div 
                        className="w-2 h-2 bg-green-500 rounded-full"
                        role="status"
                        aria-label="Online"
                      />
                    )}
                    {(conversation.unreadCount || 0) > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {conversation.lastMessage || 'No messages yet'}
                </p>
                
                {conversation.subject && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Re: {conversation.subject}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

EnhancedConversationList.displayName = 'EnhancedConversationList';

export { EnhancedConversationList };
