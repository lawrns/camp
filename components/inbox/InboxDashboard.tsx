'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, MessageCircle, Clock, User, Bot, AlertTriangle, CheckCircle, X, Archive, Star, Flag, MoreHorizontal, RefreshCw, ChevronRight } from "lucide-react";
import { DashboardChatView } from '@/components/chat/DashboardChatView';
import { ConversationCard } from '@/components/inbox/ConversationCard';
import { InboxHeader } from '@/components/inbox/InboxHeader';
import { AIAssistantPanel } from '@/components/inbox/AIAssistantPanel';
import { AIActionBar } from '@/components/inbox/AIActionBar';
import { ConversationList } from '@/components/InboxDashboard/sub-components/ConversationList';
import type { Conversation as InboxConversation } from '@/src/components/InboxDashboard/types';
import { useBulkSelection, getSelectAllState } from '@/components/inbox/hooks/useBulkSelection';
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
  zIndex: {
    modal: 'var(--z-modal)',
    popover: 'var(--z-popover)',
    dropdown: 'var(--z-dropdown)',
  }
};

interface Conversation {
  id: string;
  customer_id: string;
  customerName: string;
  customerEmail: string;
  avatar?: string;
  subject: string;
  status: 'open' | 'assigned' | 'escalated' | 'waiting' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  channel: 'email' | 'chat' | 'phone' | 'social';
  assigned_agent?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unread_count: number;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  estimated_wait_time?: number;
  assigned_to_ai?: boolean;
}

interface InboxDashboardProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  className?: string;
}

// Error fallback component
const ErrorFallback = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-lg font-medium mb-2">Error loading conversations</h2>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <Button onClick={retry} aria-label="Retry loading conversations">
        Try Again
      </Button>
    </div>
  </div>
);

const InboxDashboardComponent = function InboxDashboard({
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);

  // CRITICAL: Bulk selection functionality with ARIA compliance
  const [bulkSelection, bulkActions] = useBulkSelection();

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock data generation for development
  const generateMockConversations = useCallback((): Conversation[] => {
    const mockData: Conversation[] = [];
    
    for (let i = 1; i <= 30; i++) {
      const conversation: Conversation = {
        id: `conv-${i}`,
        customer_id: `cust-${i}`,
        customerName: `Customer ${i}`,
        customerEmail: `customer${i}@example.com`,
        avatar: undefined,
        subject: `Conversation ${i} - Sample subject`,
        status: ['open', 'assigned', 'escalated', 'waiting', 'closed'][Math.floor(Math.random() * 5)] as Conversation['status'],
        priority: ['urgent', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as Conversation['priority'],
        channel: ['email', 'chat', 'phone', 'social'][Math.floor(Math.random() * 4)] as Conversation['channel'],
        assigned_agent: i % 3 === 0 ? `Agent ${Math.ceil(i / 3)}` : undefined,
        lastMessage: `Last message for conversation ${i}`,
        lastMessageAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        unread_count: Math.floor(Math.random() * 5),
        tags: [`tag-${i % 3}`, `category-${i % 2}`],
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as Conversation['sentiment'],
        estimated_wait_time: Math.floor(Math.random() * 60),
        assigned_to_ai: false, // TODO: Get from API
      };
      
      mockData.push(conversation);
    }
    
    return mockData;
  }, []);

  // Load conversations with error handling
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, use mock data
      // TODO: Replace with actual API call
      const mockConversations = generateMockConversations();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setConversations(mockConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [generateMockConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations based on search and filters
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const matchesSearch = !searchQuery || 
        conversation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || conversation.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || conversation.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [conversations, searchQuery, filterStatus, filterPriority]);

  // Event handlers
  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobileView) {
      setShowConversationList(false);
    }
  }, [isMobileView]);

  const handleBackToList = useCallback(() => {
    setShowConversationList(true);
    setSelectedConversation(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  }, [loadConversations]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedConversation && isMobileView) {
        handleBackToList();
      }
    }
  }, [selectedConversation, isMobileView, handleBackToList]);

  // Handle real-time updates (placeholder)
  useEffect(() => {
    // TODO: Set up real-time subscription for new messages
    // subscribeToChannel(...)
    
    return () => {
      // TODO: Cleanup subscription
    };
  }, []);

  if (error) {
    return <ErrorFallback error={error} retry={loadConversations} />;
  }

  return (
    <div 
      className={cn(
        // WORLD-CLASS LAYOUT: Proper viewport management with 3-panel responsive design
        "inbox-container h-screen flex flex-col bg-neutral-50",
        className
      )}
      onKeyDown={handleKeyDown}
      role="main"
      aria-label="Inbox Dashboard"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* WORLD-CLASS LAYOUT: Proper z-index layering and spacing */}
      <div className="grid h-full grid-rows-1 grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[340px_1fr_380px] gap-0 overflow-hidden relative">
        
        {/* Sidebar - Conversation List */}
        <aside 
          className={cn(
            "conversation-sidebar flex flex-col bg-white border-r border-neutral-200 overflow-hidden relative z-10",
            isMobileView && !showConversationList && "hidden md:flex",
            "col-span-1"
          )}
          role="complementary"
          aria-label="Conversation list"
          style={{
            height: '100vh',
            maxHeight: '100vh'
          }}
        >
          {/* PINNED HEADER: Properly elevated with clean design */}
          <div className="flex-shrink-0 bg-white border-b border-neutral-200 shadow-sm relative z-20" 
               style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
            <InboxHeader
            title="Inbox"
            totalCount={filteredConversations.length}
            unreadCount={filteredConversations.filter(c => c.unread_count > 0).length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            activeFilter={filterStatus}
            onFilterChange={setFilterStatus}
            user={{
              name: currentUserName || 'User',
              email: 'user@example.com',
              avatar: undefined
            }}
            />
          </div>

          {/* SCROLLABLE CONVERSATION LIST: Proper overflow handling with modern spacing */}
          <div className="flex-1 overflow-hidden" style={{ marginTop: '0.5rem' }}>
            <ScrollArea className="h-full">
            <div className="px-4 py-2 space-y-2">
              {isLoading ? (
                // Modern loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border border-neutral-200 rounded-lg animate-pulse bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-12 h-3 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-neutral-900 mb-1">No conversations</h3>
                  <p className="text-sm text-neutral-500">
                    {searchQuery ? 'Try adjusting your search terms' : 'New conversations will appear here'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={handleConversationSelect}
                    className="hover:bg-neutral-50 transition-colors duration-150 cursor-pointer border border-transparent hover:border-neutral-200 rounded-lg"
                  />
                ))
              )}
            </div>
            </ScrollArea>
          </div>

          {/* CLEAN FOOTER: Minimal conversation count */}
          <div className="flex-shrink-0 border-t border-neutral-200 px-4 py-3 bg-white">
            <p className="text-xs text-neutral-500 font-medium">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </aside>

        {/* Main Content - Message View */}
        <main 
          className={cn(
            "chat-main bg-white flex flex-col overflow-hidden",
            "col-span-1 relative z-5",
            isMobileView && showConversationList && "hidden"
          )}
          style={{
            height: '100vh',
            maxHeight: '100vh'
          }}
        >
          {selectedConversation ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* ELEVATED CHAT HEADER: Clean design with proper spacing */}
              <div className="flex-shrink-0 border-b border-neutral-200 px-6 py-4 bg-white shadow-sm relative z-15">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToList}
                      className="p-1"
                      aria-label="Back to conversation list"
                    >
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                  )}
                  
                                      <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-11 w-11 ring-2 ring-neutral-100">
                        <AvatarImage src={selectedConversation.avatar} />
                        <AvatarFallback className="bg-neutral-100 text-neutral-700 font-medium">
                          {selectedConversation.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate text-base">
                          {selectedConversation.customerName}
                        </h3>
                        <p className="text-sm text-neutral-500 truncate mt-0.5">
                          {selectedConversation.subject}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={selectedConversation.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {selectedConversation.priority}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className="text-xs font-medium border-neutral-300 text-neutral-600"
                        >
                          {selectedConversation.status}
                        </Badge>
                      </div>
                    </div>
                </div>
              </div>

              {/* SCROLLABLE CHAT AREA: Proper message overflow handling */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <DashboardChatView
                    conversationId={selectedConversation.id}
                    className="h-full"
                  />
                </div>
                
                {/* PREMIUM COMPOSER: Always visible with proper elevation */}
                <div className="flex-shrink-0 border-t border-neutral-200 bg-white shadow-lg px-6 py-4">
                  <AIActionBar 
                    conversationId={selectedConversation.id}
                    onSendMessage={(message) => {
                      // TODO: Implement send message functionality
                      console.log('Sending message:', message);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="ds-typography-h4 font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Customer Details Panel with AI Integration (Desktop/Tablet) */}
        <aside 
          className={cn(
            "details-sidebar bg-neutral-50 flex-col overflow-hidden border-l border-neutral-200",
            "hidden lg:flex",
            "col-span-1 relative z-5"
          )}
          role="complementary"
          aria-label="Customer details and AI insights"
          style={{
            height: '100vh',
            maxHeight: '100vh'
          }}
        >
          {selectedConversation ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* ELEGANT CUSTOMER HEADER: Clean and modern */}
              <div className="flex-shrink-0 border-b border-neutral-200 p-6 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 ring-2 ring-neutral-100">
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback className="bg-neutral-100 text-neutral-700 font-medium">
                        {selectedConversation.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">{selectedConversation.customerName}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Customer Profile & AI Insights</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <AIAssistantPanel 
                      conversationId={selectedConversation.id}
                      customerSentiment={selectedConversation.sentiment}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* SCROLLABLE CUSTOMER DETAILS: Modern spacing and layout */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedConversation.avatar} />
                          <AvatarFallback>
                            {selectedConversation.customerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedConversation.customerName}</p>
                          <p className="text-sm text-muted-foreground">{selectedConversation.customerEmail}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Channel:</span>
                          <Badge variant="outline" className="capitalize">
                            {selectedConversation.channel}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last seen:</span>
                          <span>{formatDistanceToNow(new Date(selectedConversation.lastMessageAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Conversation Metadata */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Conversation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ConversationStatusDropdown
                        status={selectedConversation.status}
                        onStatusChange={(status) => {
                          // TODO: Update conversation status
                          console.log('Status changed to:', status);
                        }}
                      />
                      
                      <PriorityManagement
                        priority={selectedConversation.priority}
                        onPriorityChange={(priority) => {
                          // TODO: Update conversation priority
                          console.log('Priority changed to:', priority);
                        }}
                      />

                      <AssignmentPanel
                        currentAssignee={selectedConversation.assigned_agent}
                        onAssignmentChange={(assignee) => {
                          // TODO: Update conversation assignment
                          console.log('Assigned to:', assignee);
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  {selectedConversation.tags && selectedConversation.tags.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {selectedConversation.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-sm text-neutral-600 font-medium mb-1">Customer Details</p>
                <p className="text-xs text-neutral-500">
                  Select a conversation to view customer information and AI insights
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
export const InboxDashboard = memo(InboxDashboardComponent);