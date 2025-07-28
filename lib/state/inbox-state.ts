/**
 * Inbox State Management
 * Follows GUIDE.md specifications for inbox state patterns
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface Conversation {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage?: Message;
  unreadCount: number;
  assignedAgent?: Agent;
  customer: Customer;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  content: string;
  senderType: 'customer' | 'agent' | 'ai';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  skills: string[];
  maxConversations: number;
  currentConversations: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface ConversationFilters {
  status?: 'open' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  tags?: string[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface InboxState {
  // Core state
  conversations: Conversation[];
  activeConversation: Conversation | null;
  filters: ConversationFilters;
  sortBy: 'newest' | 'oldest' | 'priority' | 'unread';
  assignmentQueue: string[]; // Conversation IDs awaiting assignment
  
  // UI state
  isLoading: boolean;
  error: string | null;
  selectedConversations: string[];
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  updateFilters: (filters: Partial<ConversationFilters>) => void;
  setSortBy: (sortBy: InboxState['sortBy']) => void;
  addToAssignmentQueue: (conversationId: string) => void;
  removeFromAssignmentQueue: (conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectConversation: (id: string) => void;
  deselectConversation: (id: string) => void;
  selectAllConversations: () => void;
  deselectAllConversations: () => void;
  reset: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultFilters: ConversationFilters = {
  status: 'open',
  tags: [],
  search: '',
};

// ============================================================================
// STORE
// ============================================================================

export const useInboxStore = create<InboxState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    activeConversation: null,
    filters: defaultFilters,
    sortBy: 'newest',
    assignmentQueue: [],
    isLoading: false,
    error: null,
    selectedConversations: [],

    // Actions
    setConversations: (conversations) => set({ conversations }),
    
    addConversation: (conversation) => set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
    
    updateConversation: (id, updates) => set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      activeConversation: state.activeConversation?.id === id
        ? { ...state.activeConversation, ...updates }
        : state.activeConversation,
    })),
    
    removeConversation: (id) => set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      activeConversation: state.activeConversation?.id === id
        ? null
        : state.activeConversation,
      selectedConversations: state.selectedConversations.filter((convId) => convId !== id),
    })),
    
    setActiveConversation: (conversation) => set({ activeConversation: conversation }),
    
    updateFilters: (filters) => set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
    
    setSortBy: (sortBy) => set({ sortBy }),
    
    addToAssignmentQueue: (conversationId) => set((state) => ({
      assignmentQueue: [...state.assignmentQueue, conversationId],
    })),
    
    removeFromAssignmentQueue: (conversationId) => set((state) => ({
      assignmentQueue: state.assignmentQueue.filter((id) => id !== conversationId),
    })),
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),
    
    selectConversation: (id) => set((state) => ({
      selectedConversations: [...state.selectedConversations, id],
    })),
    
    deselectConversation: (id) => set((state) => ({
      selectedConversations: state.selectedConversations.filter((convId) => convId !== id),
    })),
    
    selectAllConversations: () => set((state) => ({
      selectedConversations: state.conversations.map((conv) => conv.id),
    })),
    
    deselectAllConversations: () => set({ selectedConversations: [] }),
    
    reset: () => set({
      conversations: [],
      activeConversation: null,
      filters: defaultFilters,
      sortBy: 'newest',
      assignmentQueue: [],
      isLoading: false,
      error: null,
      selectedConversations: [],
    }),
  }))
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectConversations = (state: InboxState) => state.conversations;
export const selectActiveConversation = (state: InboxState) => state.activeConversation;
export const selectFilters = (state: InboxState) => state.filters;
export const selectSortBy = (state: InboxState) => state.sortBy;
export const selectAssignmentQueue = (state: InboxState) => state.assignmentQueue;
export const selectIsLoading = (state: InboxState) => state.isLoading;
export const selectError = (state: InboxState) => state.error;
export const selectSelectedConversations = (state: InboxState) => state.selectedConversations;

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

/**
 * Get filtered and sorted conversations
 */
export const selectFilteredConversations = (state: InboxState) => {
  let conversations = [...state.conversations];
  const { filters, sortBy } = state;

  // Apply filters
  if (filters.status) {
    conversations = conversations.filter((conv) => conv.status === filters.status);
  }

  if (filters.priority) {
    conversations = conversations.filter((conv) => conv.priority === filters.priority);
  }

  if (filters.assignedAgent) {
    conversations = conversations.filter((conv) => conv.assignedAgent?.id === filters.assignedAgent);
  }

  if (filters.tags && filters.tags.length > 0) {
    conversations = conversations.filter((conv) =>
      filters.tags!.some((tag) => conv.tags.includes(tag))
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    conversations = conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchLower) ||
      conv.customer.name.toLowerCase().includes(searchLower) ||
      conv.customer.email?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content.toLowerCase().includes(searchLower)
    );
  }

  if (filters.dateRange) {
    conversations = conversations.filter((conv) => {
      const convDate = new Date(conv.updatedAt);
      return convDate >= filters.dateRange!.start && convDate <= filters.dateRange!.end;
    });
  }

  // Apply sorting
  switch (sortBy) {
    case 'newest':
      conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case 'oldest':
      conversations.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      break;
    case 'priority':
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      conversations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      break;
    case 'unread':
      conversations.sort((a, b) => b.unreadCount - a.unreadCount);
      break;
  }

  return conversations;
};

/**
 * Get conversations by status
 */
export const selectConversationsByStatus = (state: InboxState) => {
  const conversations = selectFilteredConversations(state);
  return {
    open: conversations.filter((conv) => conv.status === 'open'),
    closed: conversations.filter((conv) => conv.status === 'closed'),
    pending: conversations.filter((conv) => conv.status === 'pending'),
  };
};

/**
 * Get conversations by priority
 */
export const selectConversationsByPriority = (state: InboxState) => {
  const conversations = selectFilteredConversations(state);
  return {
    urgent: conversations.filter((conv) => conv.priority === 'urgent'),
    high: conversations.filter((conv) => conv.priority === 'high'),
    medium: conversations.filter((conv) => conv.priority === 'medium'),
    low: conversations.filter((conv) => conv.priority === 'low'),
  };
};

/**
 * Get unassigned conversations
 */
export const selectUnassignedConversations = (state: InboxState) => {
  return selectFilteredConversations(state).filter((conv) => !conv.assignedAgent);
};

/**
 * Get conversations assigned to specific agent
 */
export const selectConversationsByAgent = (state: InboxState, agentId: string) => {
  return selectFilteredConversations(state).filter((conv) => conv.assignedAgent?.id === agentId);
};

/**
 * Get total unread count
 */
export const selectTotalUnreadCount = (state: InboxState) => {
  return state.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
};

/**
 * Get conversations in assignment queue
 */
export const selectQueuedConversations = (state: InboxState) => {
  return state.conversations.filter((conv) => state.assignmentQueue.includes(conv.id));
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if conversation is selected
 */
export const isConversationSelected = (state: InboxState, conversationId: string) => {
  return state.selectedConversations.includes(conversationId);
};

/**
 * Check if all conversations are selected
 */
export const areAllConversationsSelected = (state: InboxState) => {
  const filteredConversations = selectFilteredConversations(state);
  return filteredConversations.length > 0 && 
         filteredConversations.every((conv) => state.selectedConversations.includes(conv.id));
};

/**
 * Get conversation by ID
 */
export const getConversationById = (state: InboxState, conversationId: string) => {
  return state.conversations.find((conv) => conv.id === conversationId);
};

/**
 * Get next conversation in queue
 */
export const getNextQueuedConversation = (state: InboxState) => {
  const queuedConversations = selectQueuedConversations(state);
  return queuedConversations.length > 0 ? queuedConversations[0] : null;
};

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Save inbox state to localStorage
 */
export const saveInboxState = () => {
  const state = useInboxStore.getState();
  const persistData = {
    filters: state.filters,
    sortBy: state.sortBy,
    selectedConversations: state.selectedConversations,
    timestamp: Date.now(),
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('campfire-inbox-state', JSON.stringify(persistData));
  }
};

/**
 * Load inbox state from localStorage
 */
export const loadInboxState = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem('campfire-inbox-state');
    if (stored) {
      const data = JSON.parse(stored);
      const state = useInboxStore.getState();
      
      // Only restore if data is less than 24 hours old
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        state.updateFilters(data.filters);
        state.setSortBy(data.sortBy);
        data.selectedConversations.forEach((id: string) => {
          state.selectConversation(id);
        });
      }
    }
  } catch (error) {
    console.error('[Inbox State] Failed to load state:', error);
  }
};

// Auto-save on state changes
useInboxStore.subscribe((state) => {
  saveInboxState();
}); 