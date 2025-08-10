/**
 * Optimized InboxDashboard Component - Performance-focused version
 * Addresses the "shocks" and remounting issues identified in testing
 */

"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useConversationFilters } from '@/hooks/useConversationFilters';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { broadcastToChannel } from '@/lib/realtime/standardized-realtime';
import { RealtimeLogger } from '@/lib/realtime/enhanced-monitoring';

// Import optimized components
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { EnhancedConversationList } from './components/EnhancedConversationList';
import { EnhancedConversationView } from './components/EnhancedConversationView';
import { EnhancedCustomerDetails } from './components/EnhancedCustomerDetails';
import { StatusDropdown } from './components/StatusDropdown';

interface OptimizedInboxDashboardProps {
  className?: string;
}

export const OptimizedInboxDashboard: React.FC<OptimizedInboxDashboardProps> = React.memo(({ 
  className = "" 
}) => {
  // Authentication
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Conversations data
  const { conversations, isLoading: conversationsLoading, error } = useConversations();
  
  // UI State
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [agentStatus, setAgentStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  // Conversation filters
  const conversationFilters = useConversationFilters(conversations || []);
  
  // Filtered conversations based on search and filters
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    let filtered = conversations;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(conv => (conv.unreadCount || 0) > 0);
        break;
      case 'unassigned':
        filtered = filtered.filter(conv => !conv.assigneeId);
        break;
      case 'ai-managed':
        filtered = filtered.filter(conv => conv.isAIManaged);
        break;
      case 'human-managed':
        filtered = filtered.filter(conv => !conv.isAIManaged);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    return filtered.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, searchQuery, activeFilter]);

  // Mock messages for selected conversation
  const messages = useMemo(() => {
    if (!selectedConversation) return [];
    
    return [
      {
        id: '1',
        content: selectedConversation.lastMessage || 'Hello, how can I help you?',
        senderId: selectedConversation.customerId,
        senderName: selectedConversation.customerName,
        timestamp: new Date(selectedConversation.updatedAt),
        type: 'user' as const,
      }
    ];
  }, [selectedConversation]);

  // Realtime subscriptions
  const realtimeConfig = useMemo(() => ({
    channels: [
      {
        name: UNIFIED_CHANNELS.CONVERSATIONS,
        events: [UNIFIED_EVENTS.CONVERSATION_UPDATED, UNIFIED_EVENTS.MESSAGE_RECEIVED],
        callback: (payload: any) => {
          RealtimeLogger.log('Conversation update received', payload);
          // Handle real-time updates
        }
      }
    ]
  }), []);
  
  useRealtimeSubscriptions(realtimeConfig);

  // Event handlers
  const handleSelectConversation = useCallback((conversation: any) => {
    setSelectedConversation(conversation);
    setCustomerDetailsOpen(false); // Close details when switching conversations
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation) return;
    
    try {
      // Broadcast message
      await broadcastToChannel(UNIFIED_CHANNELS.CONVERSATIONS, {
        event: UNIFIED_EVENTS.MESSAGE_SENT,
        payload: {
          conversationId: selectedConversation.id,
          content,
          senderId: user?.id,
          timestamp: new Date().toISOString()
        }
      });
      
      RealtimeLogger.log('Message sent successfully');
    } catch (error) {
      RealtimeLogger.error('Failed to send message', error);
      throw error;
    }
  }, [selectedConversation, user]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleStatusChange = useCallback((status: typeof agentStatus) => {
    setAgentStatus(status);
    // Broadcast status change
    broadcastToChannel(UNIFIED_CHANNELS.PRESENCE, {
      event: UNIFIED_EVENTS.PRESENCE_UPDATE,
      payload: { userId: user?.id, status }
    });
  }, [user]);

  // Loading states
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-red-600">Authentication required</p>
          <p className="text-foreground">Please log in to access the inbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-background ${className}`} data-testid="inbox-dashboard">
      {/* Header with Status Dropdown */}
      <div className="absolute top-4 right-4 z-50">
        <StatusDropdown 
          currentStatus={agentStatus}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Sidebar */}
      <EnhancedSidebar
        filteredConversations={filteredConversations}
        conversations={conversations || []}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        isCollapsed={sidebarCollapsed}
      />

      {/* Sidebar Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute left-4 top-4 z-40"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Conversation List */}
      <div className={`${sidebarCollapsed ? 'w-80' : 'w-96'} transition-all duration-300`}>
        <EnhancedConversationList
          filteredConversations={filteredConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeFilter={activeFilter}
        />
      </div>

      {/* Conversation View */}
      <div className="flex-1">
        <EnhancedConversationView
          selectedConversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={conversationsLoading}
        />
      </div>

      {/* Customer Details Panel */}
      {customerDetailsOpen && (
        <EnhancedCustomerDetails
          selectedConversation={selectedConversation}
          isOpen={customerDetailsOpen}
          onClose={() => setCustomerDetailsOpen(false)}
        />
      )}

      {/* Customer Details Toggle */}
      {selectedConversation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCustomerDetailsOpen(!customerDetailsOpen)}
          className="absolute right-4 top-16 z-40"
        >
          {customerDetailsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
});

OptimizedInboxDashboard.displayName = 'OptimizedInboxDashboard';
