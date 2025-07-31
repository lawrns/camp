/**
 * Widget State Management
 * Follows GUIDE.md specifications for widget state patterns
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WidgetSettings, BusinessHours } from '@/types/widget-settings';
import type { Message } from '@/types/entities/message';

// ============================================================================
// TYPES
// ============================================================================

export interface TypingUser {
  id: string;
  name: string;
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
}

export interface AIHandover {
  status: 'ai' | 'handover_requested' | 'agent_assigned';
  confidence: number;
  assignedAgent?: Agent;
}

export interface WidgetState {
  // Core state
  isOpen: boolean;
  conversationId: string | null;
  messages: Message[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  typingUsers: TypingUser[];
  aiHandover: AIHandover;
  
  // Configuration
  organizationId: string | null;
  widgetSettings: WidgetSettings;
  
  // Actions
  openWidget: () => void;
  closeWidget: () => void;
  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string | number, updates: Partial<Message>) => void;
  removeMessage: (id: string | number) => void;
  setConnectionStatus: (status: WidgetState['connectionStatus']) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string) => void;
  updateAIHandover: (handover: Partial<AIHandover>) => void;
  setOrganizationId: (id: string | null) => void;
  updateWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  reset: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultWidgetSettings: WidgetSettings = {
  // Branding & Appearance
  primaryColor: '#6366F1',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui, sans-serif',

  // Widget Behavior
  welcomeMessage: 'Hello! How can we help you today?',
  placeholderText: 'Type your message...',
  autoOpenDelay: 0,
  showTypingIndicator: true,
  enableSoundNotifications: true,

  // Positioning & Size
  position: 'bottom-right',
  offsetX: 20,
  offsetY: 20,
  width: 400,
  height: 600,

  // Business Hours & Availability
  businessHours: {
    enabled: false,
    timezone: 'America/New_York',
    schedule: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '10:00', end: '14:00' },
      sunday: { enabled: false, start: '10:00', end: '14:00' },
    },
  },
  offlineMessage: 'We\'re currently offline. Leave us a message and we\'ll get back to you soon!',

  // Pre-chat Form
  requireEmail: false,
  requireName: false,
  customFields: [],

  // AI Settings
  enableAI: true,
  aiWelcomeMessage: 'I\'m an AI assistant. I can help you with common questions, or connect you with a human agent.',
  aiHandoffTriggers: {
    lowConfidenceThreshold: 0.3,
    userRequestsHuman: true,
    maxAIResponses: 5,
    keywords: ['speak to human', 'human agent', 'representative'],
  },

  // GDPR & Privacy
  showGDPRNotice: false,
  gdprNoticeText: 'We use cookies and collect data to improve your experience. By continuing, you agree to our privacy policy.',

  // Advanced Configuration
  allowFileUploads: true,
  maxFileSize: 10,
  allowedFileTypes: ['image/*', '.pdf', '.doc', '.docx', '.txt'],

  // Metadata
  isActive: true,
};

const defaultAIHandover: AIHandover = {
  status: 'ai',
  confidence: 1.0,
};

// ============================================================================
// STORE
// ============================================================================

export const useWidgetStore = create<WidgetState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isOpen: false,
    conversationId: null,
    messages: [],
    connectionStatus: 'disconnected',
    typingUsers: [],
    aiHandover: defaultAIHandover,
    organizationId: null,
    widgetSettings: defaultWidgetSettings,

    // Actions
    openWidget: () => set({ isOpen: true }),
    
    closeWidget: () => set({ isOpen: false }),
    
    setConversationId: (id) => set({ conversationId: id }),
    
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message],
    })),
    
    updateMessage: (id, updates) => set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
    
    removeMessage: (id) => set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),
    
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    
    addTypingUser: (user) => set((state) => ({
      typingUsers: [...state.typingUsers.filter((u) => u.id !== user.id), user],
    })),
    
    removeTypingUser: (userId) => set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u.id !== userId),
    })),
    
    updateAIHandover: (handover) => set((state) => ({
      aiHandover: { ...state.aiHandover, ...handover },
    })),
    
    setOrganizationId: (id) => set({ organizationId: id }),
    
    updateWidgetSettings: (settings) => set((state) => ({
      widgetSettings: { ...state.widgetSettings, ...settings },
    })),
    
    reset: () => set({
      isOpen: false,
      conversationId: null,
      messages: [],
      connectionStatus: 'disconnected',
      typingUsers: [],
      aiHandover: defaultAIHandover,
      organizationId: null,
      widgetSettings: defaultWidgetSettings,
    }),
  }))
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectIsOpen = (state: WidgetState) => state.isOpen;
export const selectConversationId = (state: WidgetState) => state.conversationId;
export const selectMessages = (state: WidgetState) => state.messages;
export const selectConnectionStatus = (state: WidgetState) => state.connectionStatus;
export const selectTypingUsers = (state: WidgetState) => state.typingUsers;
export const selectAIHandover = (state: WidgetState) => state.aiHandover;
export const selectOrganizationId = (state: WidgetState) => state.organizationId;
export const selectWidgetSettings = (state: WidgetState) => state.widgetSettings;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get the latest message
 */
export const selectLatestMessage = (state: WidgetState) => {
  const messages = state.messages;
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

/**
 * Get messages count
 */
export const selectMessagesCount = (state: WidgetState) => state.messages.length;

/**
 * Check if AI handover is requested
 */
export const selectIsHandoverRequested = (state: WidgetState) => 
  state.aiHandover.status === 'handover_requested';

/**
 * Check if agent is assigned
 */
export const selectIsAgentAssigned = (state: WidgetState) => 
  state.aiHandover.status === 'agent_assigned' && state.aiHandover.assignedAgent;

/**
 * Get typing indicator text
 */
export const selectTypingIndicatorText = (state: WidgetState) => {
  const typingUsers = state.typingUsers;
  if (typingUsers.length === 0) return '';
  if (typingUsers.length === 1) return `${typingUsers[0]?.name || 'Someone'} is typing...`;
  if (typingUsers.length === 2) return `${typingUsers[0]?.name || 'Someone'} and ${typingUsers[1]?.name || 'someone'} are typing...`;
  return 'Multiple people are typing...';
};

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Save widget state to localStorage
 */
export const saveWidgetState = () => {
  const state = useWidgetStore.getState();
  const persistData = {
    conversationId: state.conversationId,
    organizationId: state.organizationId,
    widgetSettings: state.widgetSettings,
    timestamp: Date.now(),
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('campfire-widget-state', JSON.stringify(persistData));
  }
};

/**
 * Load widget state from localStorage
 */
export const loadWidgetState = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem('campfire-widget-state');
    if (stored) {
      const data = JSON.parse(stored);
      const state = useWidgetStore.getState();
      
      // Only restore if data is less than 24 hours old
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        state.setConversationId(data.conversationId);
        state.setOrganizationId(data.organizationId);
        state.updateWidgetSettings(data.widgetSettings);
      }
    }
  } catch (error) {
    console.error('[Widget State] Failed to load state:', error);
  }
};

// Auto-save on state changes
useWidgetStore.subscribe((state) => {
  saveWidgetState();
});