"use client";

/**
 * @deprecated MIGRATION NOTICE - This hook is being migrated to use UNIFIED_EVENTS.
 *
 * This implementation has been updated to use UNIFIED_EVENTS and UNIFIED_CHANNELS
 * but should eventually be replaced with the standardized useRealtime hook.
 *
 * For new implementations, use hooks/useRealtime.ts instead.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageData } from './EnhancedMessageBubble';
import { TypingUser, PresenceUser } from './PresenceIndicator';
import { Notification } from './NotificationSystem';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';

export interface RealTimeMessagingConfig {
  conversationId: string;
  organizationId: string;
  userId: string;
  enableTypingIndicators?: boolean;
  enablePresence?: boolean;
  enableNotifications?: boolean;
  typingTimeout?: number; // milliseconds
  presenceHeartbeat?: number; // milliseconds
}

export interface RealTimeMessagingState {
  messages: MessageData[];
  typingUsers: TypingUser[];
  presenceUsers: PresenceUser[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isLoading: boolean;
  error: string | null;
}

export interface RealTimeMessagingActions {
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  markAsRead: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  loadMoreMessages: () => Promise<void>;
}

export function useRealTimeMessaging(config: RealTimeMessagingConfig) {
  const supabase = createClientComponentClient();
  
  // State
  const [state, setState] = useState<RealTimeMessagingState>({
    messages: [],
    typingUsers: [],
    presenceUsers: [],
    connectionStatus: 'connecting',
    isLoading: false,
    error: null,
  });

  // Refs for cleanup and debouncing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Initialize real-time connection
  useEffect(() => {
    initializeRealTime();
    return () => cleanup();
  }, [config.conversationId, config.organizationId]);

  // Initialize real-time subscriptions
  const initializeRealTime = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

      // Create channel for this conversation - UNIFIED CHANNELS
      const channel = supabase.channel(UNIFIED_CHANNELS.conversation(config.organizationId, config.conversationId), {
        config: {
          broadcast: { self: true },
          presence: { key: config.userId },
        },
      });

      channelRef.current = channel;

      // Subscribe to message changes
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${config.conversationId}`,
        }, handleMessageChange)
        
        // Subscribe to typing indicators - UNIFIED EVENTS
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, handleTypingBroadcast)
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, handleTypingBroadcast)
        
        // Subscribe to presence changes
        .on('presence', { event: 'sync' }, handlePresenceSync)
        .on('presence', { event: 'join' }, handlePresenceJoin)
        .on('presence', { event: 'leave' }, handlePresenceLeave);

      // Subscribe to channel
      const status = await channel.subscribe();
      
      if (status === 'SUBSCRIBED') {
        setState(prev => ({ ...prev, connectionStatus: 'connected' }));
        
        // Initialize presence if enabled
        if (config.enablePresence) {
          await channel.track({
            user_id: config.userId,
            status: 'online',
            last_seen: new Date().toISOString(),
          });
          
          // Start presence heartbeat
          startPresenceHeartbeat();
        }
        
        // Load initial messages
        await loadMessages();
      } else {
        throw new Error('Failed to subscribe to channel');
      }
    } catch (error) {
      console.error('Failed to initialize real-time:', error);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error', 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }));
    }
  }, [config]);

  // Load messages from database
  const loadMessages = useCallback(async (before?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url),
          reactions:message_reactions(emoji, user_id, profiles(full_name)),
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', config.conversationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedMessages: MessageData[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.sender_type || 'user',
        senderName: msg.sender?.full_name || 'Unknown',
        senderAvatar: msg.sender?.avatar_url,
        timestamp: msg.created_at,
        status: msg.status || 'sent',
        attachments: msg.attachments || [],
        reactions: msg.reactions?.reduce((acc: any[], reaction: any) => {
          const existing = acc.find(r => r.emoji === reaction.emoji);
          if (existing) {
            existing.count++;
            existing.users.push(reaction.profiles.full_name);
            if (reaction.user_id === config.userId) {
              existing.hasReacted = true;
            }
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.profiles.full_name],
              hasReacted: reaction.user_id === config.userId,
            });
          }
          return acc;
        }, []) || [],
        isEdited: msg.edited_at !== null,
        metadata: { userId: msg.user_id },
      }));

      setState(prev => ({
        ...prev,
        messages: before 
          ? [...prev.messages, ...formattedMessages.reverse()]
          : formattedMessages.reverse(),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages' 
      }));
    }
  }, [config.conversationId, config.userId]);

  // Handle message database changes
  const handleMessageChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setState(prev => {
      let newMessages = [...prev.messages];

      switch (eventType) {
        case 'INSERT':
          // Add new message if not already present
          if (!newMessages.find(m => m.id === newRecord.id)) {
            const newMessage: MessageData = {
              id: newRecord.id,
              content: newRecord.content,
              senderType: newRecord.sender_type || 'user',
              senderName: newRecord.sender_name || 'Unknown',
              senderAvatar: newRecord.sender_avatar,
              timestamp: newRecord.created_at,
              status: newRecord.status || 'sent',
              attachments: [],
              reactions: [],
              metadata: { userId: newRecord.user_id },
            };
            newMessages.push(newMessage);
          }
          break;

        case 'UPDATE':
          // Update existing message
          const messageIndex = newMessages.findIndex(m => m.id === newRecord.id);
          if (messageIndex !== -1) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              content: newRecord.content,
              status: newRecord.status,
              isEdited: newRecord.edited_at !== null,
            };
          }
          break;

        case 'DELETE':
          // Remove deleted message
          newMessages = newMessages.filter(m => m.id !== oldRecord.id);
          break;
      }

      return { ...prev, messages: newMessages };
    });
  }, []);

  // Handle typing broadcasts
  const handleTypingBroadcast = useCallback((payload: any) => {
    if (!config.enableTypingIndicators) return;

    const { user_id, user_name, is_typing } = payload.payload;
    
    // Don't show own typing indicator
    if (user_id === config.userId) return;

    setState(prev => {
      let newTypingUsers = [...prev.typingUsers];

      if (is_typing) {
        // Add or update typing user
        const existingIndex = newTypingUsers.findIndex(u => u.id === user_id);
        const typingUser: TypingUser = {
          id: user_id,
          name: user_name,
          role: 'user', // Could be enhanced with actual role
        };

        if (existingIndex !== -1) {
          newTypingUsers[existingIndex] = typingUser;
        } else {
          newTypingUsers.push(typingUser);
        }
      } else {
        // Remove typing user
        newTypingUsers = newTypingUsers.filter(u => u.id !== user_id);
      }

      return { ...prev, typingUsers: newTypingUsers };
    });
  }, [config.enableTypingIndicators, config.userId]);

  // Handle presence sync
  const handlePresenceSync = useCallback(() => {
    if (!config.enablePresence || !channelRef.current) return;

    const presenceState = channelRef.current.presenceState();
    const users: PresenceUser[] = Object.values(presenceState).flat().map((presence: any) => ({
      id: presence.user_id,
      name: presence.user_name || 'Unknown',
      avatar: presence.avatar_url,
      status: presence.status || 'online',
      lastSeen: presence.last_seen,
    }));

    setState(prev => ({ ...prev, presenceUsers: users }));
  }, [config.enablePresence]);

  // Handle presence join/leave
  const handlePresenceJoin = useCallback((payload: any) => {
    console.log('User joined:', payload);
  }, []);

  const handlePresenceLeave = useCallback((payload: any) => {
    console.log('User left:', payload);
  }, []);

  // Start presence heartbeat
  const startPresenceHeartbeat = useCallback(() => {
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
    }

    presenceIntervalRef.current = setInterval(() => {
      if (channelRef.current) {
        channelRef.current.track({
          user_id: config.userId,
          status: 'online',
          last_seen: new Date().toISOString(),
        });
      }
    }, config.presenceHeartbeat || 30000); // 30 seconds default
  }, [config.userId, config.presenceHeartbeat]);

  // Actions
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: config.conversationId,
          user_id: config.userId,
          content,
          sender_type: 'user',
          status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      // Handle attachments if any
      if (attachments && attachments.length > 0) {
        // Upload attachments logic would go here
        console.log('Uploading attachments:', attachments);
      }

      // Stop typing after sending
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [config.conversationId, config.userId]);

  const startTyping = useCallback(() => {
    if (!config.enableTypingIndicators || !channelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing start - UNIFIED EVENTS
    channelRef.current.send({
      type: 'broadcast',
      event: UNIFIED_EVENTS.TYPING_START,
      payload: {
        user_id: config.userId,
        user_name: 'Current User', // Should be actual user name
        is_typing: true,
        conversationId: config.conversationId,
        organizationId: config.organizationId,
      },
    });

    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, config.typingTimeout || 3000);
  }, [config.enableTypingIndicators, config.userId, config.typingTimeout]);

  const stopTyping = useCallback(() => {
    if (!config.enableTypingIndicators || !channelRef.current) return;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Broadcast typing stop - UNIFIED EVENTS
    channelRef.current.send({
      type: 'broadcast',
      event: UNIFIED_EVENTS.TYPING_STOP,
      payload: {
        user_id: config.userId,
        user_name: 'Current User',
        is_typing: false,
        conversationId: config.conversationId,
        organizationId: config.organizationId,
      },
    });
  }, [config.enableTypingIndicators, config.userId]);

  const updatePresence = useCallback(async (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!config.enablePresence || !channelRef.current) return;

    await channelRef.current.track({
      user_id: config.userId,
      status,
      last_seen: new Date().toISOString(),
    });
  }, [config.enablePresence, config.userId]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: config.userId,
          read_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [config.userId]);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', config.userId)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: config.userId,
            emoji,
          });
      }
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  }, [config.userId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await supabase
        .from('messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', config.userId); // Only allow editing own messages
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, [config.userId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', config.userId); // Only allow deleting own messages
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [config.userId]);

  const loadMoreMessages = useCallback(async () => {
    if (state.messages.length === 0) return;
    const oldestMessage = state.messages[0];
    await loadMessages(oldestMessage.timestamp);
  }, [state.messages, loadMessages]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
    }
  }, []);

  const actions: RealTimeMessagingActions = {
    sendMessage,
    startTyping,
    stopTyping,
    updatePresence,
    markAsRead,
    reactToMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
  };

  return { state, actions };
}
