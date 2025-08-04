export interface ThreadParticipant {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'customer' | 'agent' | 'system';
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  content: string;
  sender: ThreadParticipant;
  timestamp: string;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ThreadData {
  id: string;
  title: string;
  participants: ThreadParticipant[];
  lastMessage: {
    id: string;
    content: string;
    sender: ThreadParticipant;
    timestamp: string;
    isUnread: boolean;
  };
  unreadCount: number;
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isDocument: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
  timestamp: string;
}

export interface ThreadInboxState {
  threads: ThreadData[];
  selectedThreadId: string | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeTab: 'home' | 'messages' | 'help';
}

export interface ThreadNavigationState {
  activeThreadId: string | null;
  scrollPosition: number;
  lastVisitedThreads: string[];
} 