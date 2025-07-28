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
  SearchIcon,
  FilterIcon,
  MessageSquareIcon,
  ClockIcon,
  UserIcon,
  BotIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { ChatView } from '@/components/chat/ChatView';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [currentUserId, statusFilter, priorityFilter]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:customers(*),
          messages(content, created_at, user_id)
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      // For agents, only show assigned conversations or unassigned ones
      if (currentUserRole === 'agent') {
        query = query.or(`assigned_agent.eq.${currentUserId},assigned_agent.is.null`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transform data
      const transformedConversations: Conversation[] = (data || []).map(conv => {
        const lastMessage = conv.messages?.[0];
        return {
          id: conv.id,
          customerId: conv.customer_id,
          customerName: conv.customer?.name || 'Unknown Customer',
          customerEmail: conv.customer?.email || '',
          customerAvatar: conv.customer?.avatar_url,
          subject: conv.subject || 'No Subject',
          status: conv.status,
          priority: conv.priority || 'medium',
          channel: conv.channel || 'chat',
          assignedAgent: conv.assigned_agent,
          lastMessage: lastMessage?.content || 'No messages yet',
          lastMessageAt: new Date(conv.updated_at),
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
        return <MessageSquareIcon className="h-4 w-4" />;
      case 'handoff':
        return <ClockIcon className="h-4 w-4" />;
      case 'closed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <AlertCircleIcon className="h-4 w-4" />;
      default:
        return <MessageSquareIcon className="h-4 w-4" />;
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

  const handleHandoffTriggered = () => {
    // Refresh conversations to show updated status
    loadConversations();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Error loading conversations</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadConversations}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar - Conversation List */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Inbox</h2>
            <Button size="sm" onClick={loadConversations}>
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="handoff">Handoff</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.customerAvatar} />
                        <AvatarFallback>
                          {conversation.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">
                            {conversation.customerName}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`} />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {getChannelIcon(conversation.channel)}
                            <Badge variant={getPriorityColor(conversation.priority)} className="text-xs">
                              {conversation.priority}
                            </Badge>
                            <span className={`text-xs ${getSentimentColor(conversation.sentiment)}`}>
                              {conversation.sentiment}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Chat View */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatView
            conversationId={selectedConversation.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onHandoffTriggered={handleHandoffTriggered}
            className="h-full"
          />
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