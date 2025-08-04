'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MagnifyingGlass as Search,
  Funnel as Filter,
  ChatCircle as MessageSquare,
  Clock,
  User,
  Robot as Bot,
  Warning as AlertCircle,
  CheckCircle,
  XCircle as X,
  Archive,
  Star,
  Flag,
  DotsThree as MoreHorizontal
} from '@phosphor-icons/react';
import { DashboardChatView } from '@/components/chat/DashboardChatView';
import { ConversationCard } from '@/components/inbox/ConversationCard';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { subscribeToChannel } from '@/lib/realtime/standardized-realtime';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { AssignmentPanel } from '@/components/conversations/AssignmentPanel';
import { PriorityManagement } from '@/components/conversations/PriorityManagement';
import { ConversationStatusDropdown } from '@/components/inbox/ConversationStatusDropdown';
import { ConversationMetadata } from '@/components/conversations/ConversationMetadata';
import { ConvertToTicketDialog } from '@/components/conversations/ConvertToTicketDialog';
import { HistoryTab } from '@/components/conversations/customer-details/tabs/HistoryTab';

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  subject: string;
  status: 'active' | 'handoff' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'chat' | 'email' | 'slack' | 'api';
  assignedAgent?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  estimatedWaitTime?: number;
}

interface InboxDashboardProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'agent' | 'admin' | 'customer';
  className?: string;
}

export function InboxDashboard({
  currentUserId,
  currentUserName,
  currentUserRole,
  className
}: InboxDashboardProps) {
  console.log('🚨🚨🚨 [COMPONENTS/INBOX/INBOXDASHBOARD] This component is being used!');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [currentUserId, statusFilter, priorityFilter]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    console.log('[InboxDashboard] Setting up standardized real-time subscriptions...');

    const unsubscribers: (() => void)[] = [];

    // Subscribe to organization-wide conversation updates
    const conversationUnsubscriber = subscribeToChannel(
      UNIFIED_CHANNELS.organization(currentUserId),
      UNIFIED_EVENTS.CONVERSATION_UPDATED,
      (payload) => {
        console.log('[InboxDashboard] Conversation update via standardized channel:', payload);
        loadConversations();
      }
    );
    unsubscribers.push(conversationUnsubscriber);

    // Subscribe to organization-wide message updates
    const messageUnsubscriber = subscribeToChannel(
      UNIFIED_CHANNELS.organization(currentUserId),
      UNIFIED_EVENTS.MESSAGE_CREATED,
      (payload) => {
        console.log('[InboxDashboard] Message update via standardized channel:', payload);
        loadConversations(); // Refresh to update last message previews

        // If we have a selected conversation and the message is for it, refresh the chat view
        if (selectedConversation && payload.message && payload.message.conversationId === selectedConversation.id) {
          console.log('[InboxDashboard] Message for selected conversation, refreshing chat view');
        }
      }
    );
    unsubscribers.push(messageUnsubscriber);

    // Subscribe to conversation creation events
    const conversationCreatedUnsubscriber = subscribeToChannel(
      UNIFIED_CHANNELS.organization(currentUserId),
      UNIFIED_EVENTS.CONVERSATION_CREATED,
      (payload) => {
        console.log('[InboxDashboard] New conversation created:', payload);
        loadConversations();
      }
    );
    unsubscribers.push(conversationCreatedUnsubscriber);

    console.log('[InboxDashboard] Standardized real-time subscriptions established');

    return () => {
      console.log('[InboxDashboard] Cleaning up standardized real-time subscriptions...');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedConversation, currentUserId]); // Re-subscribe when selected conversation changes

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use dashboard API instead of direct Supabase queries
      const response = await fetch('/api/dashboard/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[InboxDashboard] Loaded conversations:', data.conversations?.length || 0);

      // Transform API response to match component interface
      const conversations = data.conversations || [];

      // Transform data
      const transformedConversations: Conversation[] = conversations.map((conv: any) => {
        return {
          id: conv.id,
          customerId: conv.customer_id,
          customerName: conv.customerName || 'Unknown Customer',
          customerEmail: conv.customer_email || '',
          customerAvatar: undefined,
          subject: conv.subject || 'No Subject',
          status: conv.status,
          priority: conv.priority || 'medium',
          channel: conv.channel || 'chat',
          assignedAgent: conv.assigned_agent,
          lastMessage: conv.lastMessage || 'No messages yet',
          lastMessageAt: new Date(conv.lastMessageAt || conv.updated_at),
          unreadCount: conv.unread_count || 0,
          tags: conv.tags || [],
          sentiment: conv.sentiment || 'neutral',
          estimatedWaitTime: conv.estimated_wait_time
        };
      });

      setConversations(transformedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.customerName.toLowerCase().includes(query) ||
      conv.customerEmail.toLowerCase().includes(query) ||
      conv.subject.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageSquare className="h-4 w-4" />;
      case 'handoff':
        return <Clock className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'handoff':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-gray-600';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'chat':
        return <MessageSquareIcon className="h-4 w-4" />;
      case 'email':
        return <MessageSquareIcon className="h-4 w-4" />;
      case 'slack':
        return <MessageSquareIcon className="h-4 w-4" />;
      case 'api':
        return <BotIcon className="h-4 w-4" />;
      default:
        return <MessageSquareIcon className="h-4 w-4" />;
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark as read
    if (conversation.unreadCount > 0) {
      supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversation.id)
        .then(() => {
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversation.id
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        });
    }
  };

  // Bulk selection handlers
  const handleBulkSelect = (conversationId: string, selected: boolean) => {
    setSelectedConversationIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(conversationId);
      } else {
        newSet.delete(conversationId);
      }
      return newSet;
    });
  };

  const handleBulkAction = async (action: string, data?: any) => {
    const selectedIds = Array.from(selectedConversationIds);
    if (selectedIds.length === 0) return;

    try {
      // Implement bulk actions: assign, archive, close, etc.
      console.log(`Bulk action: ${action}`, { selectedIds, data });

      // Reset selection after action
      setSelectedConversationIds(new Set());
      setIsBulkSelectMode(false);

      // Reload conversations to reflect changes
      await loadConversations();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Helper functions for ConversationCard data transformation
  const mapStatusToCardStatus = (status: string): "open" | "assigned" | "escalated" | "waiting" | "closed" => {
    switch (status) {
      case 'active': return 'open';
      case 'handoff': return 'assigned';
      case 'pending': return 'waiting';
      case 'closed': return 'closed';
      default: return 'open';
    }
  };

  const mapPriorityToUrgency = (priority: string): "critical" | "high" | "normal" | "low" => {
    switch (priority) {
      case 'urgent': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'normal';
      case 'low': return 'low';
      default: return 'normal';
    }
  };

  const calculateEscalationRisk = (conversation: Conversation): "high" | "medium" | "low" => {
    // Simple escalation risk calculation based on priority and wait time
    if (conversation.priority === 'urgent' && conversation.unreadCount > 0) return 'high';
    if (conversation.priority === 'high' && conversation.estimatedWaitTime && conversation.estimatedWaitTime > 60) return 'medium';
    return 'low';
  };



  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Error loading conversations</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadConversations}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full gap-0 md:gap-1 ${className}`}>
      {/* Sidebar - Conversation List */}
      <aside className="conversation-list flex-1 min-w-0 border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-background space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-sans font-semibold">Inbox</h2>
            <Button size="sm" className="font-sans text-xs" onClick={loadConversations}>
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-sans text-sm"
            />
          </div>

          {/* Filters */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4 font-sans">
              <TabsTrigger value="all" className="text-xs font-medium">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs font-medium">Active</TabsTrigger>
              <TabsTrigger value="handoff" className="text-xs font-medium">Handoff</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs font-medium">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversation List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto h-full scroll-pl-4 pr-4 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <ul className="space-y-1 p-2" data-testid="conversation-list-container">
              {filteredConversations.map((conversation) => {
                // Transform conversation data to match ConversationCard format
                const transformedConversation = {
                  id: conversation.id,
                  email_from: conversation.customerEmail,
                  subject: conversation.subject,
                  preview: conversation.lastMessage,
                  status: mapStatusToCardStatus(conversation.status),
                  lastMessageAt: conversation.lastMessageAt.toISOString(),
                  unread: conversation.unreadCount > 0,
                  priority: conversation.priority,
                  tags: conversation.tags,
                  avatar: conversation.customerAvatar,
                  isOnline: false, // Could be enhanced with real-time presence
                  isVerified: false, // Could be enhanced with customer verification
                  assignedTo: conversation.assignedAgent,
                  aiEnabled: false, // Could be enhanced with AI status
                  customer: {
                    location: undefined,
                    localTime: undefined,
                  },
                  urgency: mapPriorityToUrgency(conversation.priority),
                  sentiment: conversation.sentiment,
                  responseTime: conversation.estimatedWaitTime,
                  escalationRisk: calculateEscalationRisk(conversation)
                };

                return (
                  <li key={conversation.id} className="cl-item">
                    <ConversationCard
                      conversation={transformedConversation}
                      isSelected={selectedConversation?.id === conversation.id}
                      onSelect={() => handleConversationSelect(conversation)}
                      onBulkSelect={handleBulkSelect}
                      isBulkSelectMode={isBulkSelectMode}
                    />
                  </li>
                );
              })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content - Chat View with Management */}
      <div className="flex-1 flex flex-col gap-6 md:gap-8">
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Conversation Management Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 md:space-x-6">
                  <h3 className="text-base font-sans font-semibold">{selectedConversation.customerName}</h3>
                  <Badge variant={getPriorityColor(selectedConversation.priority)} className="font-sans text-xs">
                    {selectedConversation.priority}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedConversation.status)}`} />
                </div>
                <div className="flex items-center space-x-2">
                  {/* Import existing conversation management components */}
                  <AssignmentPanel 
                    conversationId={selectedConversation.id}
                    currentAgentId={selectedConversation.assignedAgent}
                    organizationId={currentUserId} // Use currentUserId as organizationId for now
                    onAssignmentChange={(agentId) => {
                      // Update assignment
                      setConversations(prev => 
                        prev.map(conv => 
                          conv.id === selectedConversation.id 
                            ? { ...conv, assignedAgent: agentId }
                            : conv
                        )
                      );
                    }}
                  />
                  <PriorityManagement
                    conversationId={selectedConversation.id}
                    currentPriority={selectedConversation.priority}
                    onPriorityChange={(priority) => {
                      // Update priority
                      setConversations(prev => 
                        prev.map(conv => 
                          conv.id === selectedConversation.id 
                            ? { ...conv, priority }
                            : conv
                        )
                      );
                    }}
                  />
                  <ConversationStatusDropdown
                    currentStatus={selectedConversation.status}
                    onStatusChange={(status) => {
                      // Update status
                      setConversations(prev => 
                        prev.map(conv => 
                          conv.id === selectedConversation.id 
                            ? { ...conv, status }
                            : conv
                        )
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Chat and Management Tabs */}
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1">
                <DashboardChatView
                  conversationId={selectedConversation.id}
                  className="h-full"
                />
              </TabsContent>
              
              <TabsContent value="management" className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Tags and Notes */}
                  <ConversationMetadata
                    conversationId={selectedConversation.id}
                    metadata={{
                      tags: selectedConversation.tags,
                      notes: '',
                      customerInfo: {
                        name: selectedConversation.customerName,
                        email: selectedConversation.customerEmail
                      }
                    }}
                    onMetadataUpdate={(metadata) => {
                      // Update metadata
                      setConversations(prev => 
                        prev.map(conv => 
                          conv.id === selectedConversation.id 
                            ? { ...conv, tags: metadata.tags || [] }
                            : conv
                        )
                      );
                    }}
                  />
                  
                  {/* Convert to Ticket */}
                  <ConvertToTicketDialog
                    open={false}
                    onOpenChange={() => {}}
                    conversation={{
                      id: selectedConversation.id,
                      subject: selectedConversation.subject,
                      customer: {
                        name: selectedConversation.customerName,
                        email: selectedConversation.customerEmail
                      },
                      messages: [],
                      priority: selectedConversation.priority,
                      category: ''
                    }}
                    onConvert={async (ticketData) => {
                      console.log('Conversation converted to ticket:', ticketData);
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 p-4">
                <HistoryTab
                  customer={{
                    id: selectedConversation.customerId,
                    name: selectedConversation.customerName,
                    email: selectedConversation.customerEmail,
                    conversationCount: 0
                  }}
                  conversationHistory={[]}
                  isLoadingHistory={false}
                  error={null}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}