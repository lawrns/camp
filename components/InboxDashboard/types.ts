// Type definitions for Inbox Dashboard

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadStatus?: "uploading" | "success" | "error";
  preview?: string;
}

export interface Conversation {
  id: string;
  customer_name: string;
  customer_email: string;
  status: "open" | "pending" | "resolved" | "escalated";
  last_message_at: string;
  unread_count: number;
  last_message_preview: string;
  metadata?: Record<string, any>;
  assigned_to_ai?: boolean;
  ai_handover_session_id?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: "agent" | "customer" | "visitor" | "ai";
  sender_name: string;
  created_at: string;
  message_type?: string;
  attachments?: FileAttachment[];
  read_status?: "sent" | "delivered" | "read";
  read_at?: string;
  delivered_at?: string;
}

export interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  type: "response" | "action" | "escalation";
  reasoning?: string;
}

export interface PerformanceMetrics {
  messageLoadTime: number;
  channelConnectionTime: number;
  renderTime: number;
  memoryUsage: number;
}

export interface MessageTemplate {
  id: string;
  label: string;
  content: string;
  category: string;
}

// Hook return types
export interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  reload: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export interface UseConversationChannelReturn {
  typingUsers: string[];
  onlineUsers: string[];
  broadcastTyping: (isTyping: boolean) => void;
  handleTyping: () => void;
  stopTyping: () => void;
}

// Component prop types
export interface ConversationRowProps {
  conversation: Conversation;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  style?: React.CSSProperties;
}

export interface MessageRowProps {
  message: Message;
  selectedConversation?: Conversation;
  hoveredMessage?: string | null;
  setHoveredMessage: (id: string | null) => void;
  style?: React.CSSProperties;
}

export interface HeaderProps {
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  setShowShortcuts: (show: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  performanceMetrics?: {
    averageLatency: number;
    messageCount: number;
    reconnectionCount: number;
  };
  connectionStatus?: "connecting" | "connected" | "disconnected" | "error";
}

export interface ComposerProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  attachments: FileAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  isSending: boolean;
  sendMessage: () => void;
  isAIActive: boolean;
  toggleAIHandover: () => void;
  selectedConversation?: Conversation;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  showAISuggestions: boolean;
  setShowAISuggestions: (show: boolean) => void;
  aiSuggestions: AISuggestion[];
  generateAISuggestions: () => void;
  useSuggestion: (suggestion: AISuggestion) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  typingUsers: string[];
  onlineUsers: string[];
  handleTyping: () => void;
  stopTyping: () => void;
}
