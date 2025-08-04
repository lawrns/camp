'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  DotsThree as MoreHorizontal,
  ArrowsClockwise as RefreshCw,
  ChatCircle as MessageSquareIcon,
  Robot as BotIcon,
  CaretRight as ChevronRight
} from '@phosphor-icons/react';
import { DashboardChatView } from '@/components/chat/DashboardChatView';
import { ConversationCard } from '@/components/inbox/ConversationCard';
import { ConversationList } from '@/components/InboxDashboard/sub-components/ConversationList';
import type { Conversation as InboxConversation } from '@/src/components/InboxDashboard/types';
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
import { cn } from '@/lib/utils';

// Design system tokens for consistent spacing and colors
const DESIGN_TOKENS = {
  spacing: {
    xs: 'var(--ds-spacing-2)', // 8px
    sm: 'var(--ds-spacing-3)', // 12px
    md: 'var(--ds-spacing-4)', // 16px
    lg: 'var(--ds-spacing-6)', // 24px
    xl: 'var(--ds-spacing-8)', // 32px
  },
  colors: {
    primary: 'var(--ds-color-primary)',
    secondary: 'var(--ds-color-secondary)',
    success: 'var(--ds-color-success)',
    warning: 'var(--ds-color-warning)',
    error: 'var(--ds-color-error)',
    background: 'var(--ds-color-background)',
    surface: 'var(--ds-color-surface)',
    border: 'var(--ds-color-border)',
    text: {
      primary: 'var(--ds-color-text-primary)',
      secondary: 'var(--ds-color-text-secondary)',
      muted: 'var(--ds-color-text-muted)',
    }
  },
  typography: {
    h1: 'var(--ds-typography-h1)',
    h2: 'var(--ds-typography-h2)',
    h3: 'var(--ds-typography-h3)',
    body: 'var(--ds-typography-body)',
    caption: 'var(--ds-typography-caption)',
  },
  transitions: {
    fast: 'var(--ds-transition-fast)',
    medium: 'var(--ds-transition-medium)',
    slow: 'var(--ds-transition-slow)',
  }
};

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

// Loading skeleton component for better UX
const ConversationListSkeleton = () => (
  <div className="space-y-3 p-4" role="status" aria-label="Loading conversations">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Error boundary component
const ErrorFallback = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="flex items-center justify-center h-64" role="alert" aria-live="polite">
    <div className="text-center">
      <X className="h-12 w-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
      <h2 className="text-lg font-medium mb-2">Error loading conversations</h2>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <Button onClick={retry} aria-label="Retry loading conversations">
        Try Again
      </Button>
    </div>
  </div>
);

export function InboxDashboard({
  currentUserId,
  currentUserName,
  currentUserRole,
  className
}: InboxDashboardProps) {
  console.log('🚨🚨🚨 [COMPONENTS/INBOX/INBOXDASHBOARD] This component is being used!');
  
  // State management with proper typing
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bulk selection state
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());

  // Mobile responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Performance optimization: Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        conv.customerName.toLowerCase().includes(query) ||
        conv.customerEmail.toLowerCase().includes(query) ||
        conv.subject.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  // Responsive breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowConversationList(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations with proper error handling
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[InboxDashboard] Loaded conversations:', data.conversations?.length || 0);

      const transformedConversations: Conversation[] = (data.conversations || []).map((conv: unknown) => ({
        id: conv.id,
        customerId: conv.customer_id,
        customerName: conv.customerName || 'Unknown Customer',
        customerEmail: conv.customerEmail || '',
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
      }));

      setConversations(transformedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh conversations
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  }, [loadConversations]);

  // Set up real-time subscriptions with proper cleanup
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
        loadConversations();

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
  }, [selectedConversation, currentUserId, loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Utility functions with proper typing
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageSquare className="h-4 w-4" aria-hidden="true" />;
      case 'handoff':
        return <Clock className="h-4 w-4" aria-hidden="true" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
      default:
        return <MessageSquare className="h-4 w-4" aria-hidden="true" />;
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
        return <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />;
      case 'email':
        return <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />;
      case 'slack':
        return <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />;
      case 'api':
        return <BotIcon className="h-4 w-4" aria-hidden="true" />;
      default:
        return <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />;
    }
  };

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mobile: Hide conversation list when conversation is selected
    if (isMobileView) {
      setShowConversationList(false);
    }

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
  }, [isMobileView]);

  // Bulk selection handlers
  const handleBulkSelect = useCallback((conversationId: string, selected: boolean) => {
    setSelectedConversationIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(conversationId);
      } else {
        newSet.delete(conversationId);
      }
      return newSet;
    });
  }, []);

  const handleBulkAction = useCallback(async (action: string, data?: unknown) => {
    const selectedIds = Array.from(selectedConversationIds);
    if (selectedIds.length === 0) return;

    try {
      console.log(`Bulk action: ${action}`, { selectedIds, data });

      setSelectedConversationIds(new Set());
      setIsBulkSelectMode(false);

      await loadConversations();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedConversationIds, loadConversations]);

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
    if (conversation.priority === 'urgent' && conversation.unreadCount > 0) return 'high';
    if (conversation.priority === 'high' && conversation.estimatedWaitTime && conversation.estimatedWaitTime > 60) return 'medium';
    return 'low';
  };

  // Keyboard navigation support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileView && !showConversationList) {
      setShowConversationList(true);
    }
  }, [isMobileView, showConversationList]);

  // Error state
  if (error) {
    return <ErrorFallback error={error} retry={loadConversations} />;
  }

  return (
    <div 
      className={cn(
        "ds-inbox-container h-full",
        isMobileView ? "flex-col" : "grid grid-cols-1 lg:grid-cols-[320px_1fr]",
        className
      )}
      onKeyDown={handleKeyDown}
      role="main"
      aria-label="Inbox Dashboard"
    >
      {/* Sidebar - Conversation List */}
      <aside 
        className={cn(
          "ds-inbox-sidebar flex flex-col bg-background border-r",
          isMobileView && !showConversationList && "hidden",
          isMobileView ? "w-full" : "w-full"
        )}
        role="complementary"
        aria-label="Conversation list"
      >
        {/* Header */}
        <div className="ds-inbox-header p-4 border-b bg-background space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="ds-typography-h3 font-semibold" id="inbox-title">
              Inbox
            </h2>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh conversations"
              className="ds-button-secondary"
            >
              <RefreshCw 
                className={cn("h-4 w-4", isRefreshing && "animate-spin")} 
                aria-hidden="true" 
              />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
              aria-hidden="true" 
            />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 ds-input"
              aria-label="Search conversations"
              aria-describedby="inbox-title"
            />
          </div>

        </div>

        {/* Enhanced Conversation List with Functional Filters */}
        <ConversationList
          conversations={conversations.map(conv => ({
            id: conv.id,
            customerName: conv.customerName,
            customerEmail: conv.customerEmail,
            status: conv.status === 'active' ? 'open' : conv.status === 'handoff' ? 'escalated' : conv.status === 'closed' ? 'resolved' : 'pending',
            lastMessageAt: conv.lastMessageAt.toISOString(),
            unreadCount: conv.unreadCount,
            lastMessagePreview: conv.lastMessage,
            metadata: {
              subject: conv.subject,
              channel: conv.channel,
              sentiment: conv.sentiment,
              estimatedWaitTime: conv.estimatedWaitTime,
            },
            assigned_to_ai: false, // TODO: Get from API
            ai_handover_session_id: undefined,
            priority: conv.priority,
            tags: conv.tags,
            customerAvatar: conv.customerAvatar,
            isOnline: false,
            isVerified: false,
            lastMessageSender: 'customer' as const,
            assigneeId: conv.assignedAgent,
            assigneeName: undefined,
          } as InboxConversation))}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleConversationSelect}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          isLoading={isLoading}
        />
      </aside>

      {/* Main Content - Chat View with Management */}
      <div className={cn(
        "ds-inbox-main flex flex-col",
        isMobileView && !showConversationList ? "w-full" : "hidden lg:flex"
      )}>
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Conversation Management Header */}
            <div className="ds-inbox-conversation-header border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 md:space-x-6">
                  {/* Mobile back button */}
                  {isMobileView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConversationList(true)}
                      aria-label="Back to conversation list"
                      className="ds-button-ghost"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                    </Button>
                  )}
                  
                  <h3 className="ds-typography-h4 font-semibold">{selectedConversation.customerName}</h3>
                  <Badge 
                    variant={getPriorityColor(selectedConversation.priority)} 
                    className="ds-badge"
                  >
                    {selectedConversation.priority}
                  </Badge>
                  <div 
                    className={cn("w-2 h-2 rounded-full", getStatusColor(selectedConversation.status))}
                    aria-label={`Status: ${selectedConversation.status}`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <AssignmentPanel 
                    conversationId={selectedConversation.id}
                    currentAgentId={selectedConversation.assignedAgent}
                    organizationId={currentUserId}
                    onAssignmentChange={(agentId) => {
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
              <TabsList className="grid w-full grid-cols-3 ds-tabs-list">
                <TabsTrigger value="chat" className="ds-tabs-trigger">Chat</TabsTrigger>
                <TabsTrigger value="management" className="ds-tabs-trigger">Management</TabsTrigger>
                <TabsTrigger value="history" className="ds-tabs-trigger">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1">
                <DashboardChatView
                  conversationId={selectedConversation.id}
                  className="h-full"
                />
              </TabsContent>
              
              <TabsContent value="management" className="flex-1 p-4">
                <div className="space-y-4">
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
                      setConversations(prev => 
                        prev.map(conv => 
                          conv.id === selectedConversation.id 
                            ? { ...conv, tags: metadata.tags || [] }
                            : conv
                        )
                      );
                    }}
                  />
                  
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
              <MessageSquareIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="ds-typography-h4 font-medium mb-2">Select a conversation</h3>
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