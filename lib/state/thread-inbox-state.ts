import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThreadData, ThreadInboxState, ThreadNavigationState } from '@/types/thread-inbox';

interface ThreadInboxActions {
  // Thread management
  setThreads: (threads: ThreadData[]) => void;
  addThread: (thread: ThreadData) => void;
  updateThread: (threadId: string, updates: Partial<ThreadData>) => void;
  removeThread: (threadId: string) => void;
  
  // Selection and navigation
  selectThread: (threadId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'home' | 'messages' | 'help') => void;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Navigation state
  setScrollPosition: (position: number) => void;
  addVisitedThread: (threadId: string) => void;
  clearVisitedThreads: () => void;
  
  // Thread messages
  updateThreadLastMessage: (threadId: string, message: ThreadData['lastMessage']) => void;
  incrementUnreadCount: (threadId: string) => void;
  clearUnreadCount: (threadId: string) => void;
  
  // Utility actions
  reset: () => void;
}

const initialState: ThreadInboxState & ThreadNavigationState = {
  threads: [],
  selectedThreadId: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  activeTab: 'messages',
  scrollPosition: 0,
  lastVisitedThreads: [],
};

export const useThreadInboxStore = create<ThreadInboxState & ThreadNavigationState & ThreadInboxActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Thread management
      setThreads: (threads) => set({ threads }),
      
      addThread: (thread) => set((state) => ({
        threads: [thread, ...state.threads.filter(t => t.id !== thread.id)]
      })),
      
      updateThread: (threadId, updates) => set((state) => ({
        threads: state.threads.map(thread =>
          thread.id === threadId ? { ...thread, ...updates } : thread
        )
      })),
      
      removeThread: (threadId) => set((state) => ({
        threads: state.threads.filter(thread => thread.id !== threadId),
        selectedThreadId: state.selectedThreadId === threadId ? null : state.selectedThreadId
      })),
      
      // Selection and navigation
      selectThread: (threadId) => {
        set({ selectedThreadId: threadId });
        if (threadId) {
          get().addVisitedThread(threadId);
        }
      },
      
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // Loading and error states
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      // Navigation state
      setScrollPosition: (scrollPosition) => set({ scrollPosition }),
      
      addVisitedThread: (threadId) => set((state) => ({
        lastVisitedThreads: [
          threadId,
          ...state.lastVisitedThreads.filter(id => id !== threadId)
        ].slice(0, 10) // Keep only last 10 visited threads
      })),
      
      clearVisitedThreads: () => set({ lastVisitedThreads: [] }),
      
      // Thread messages
      updateThreadLastMessage: (threadId, lastMessage) => set((state) => ({
        threads: state.threads.map(thread =>
          thread.id === threadId
            ? { ...thread, lastMessage, updatedAt: new Date().toISOString() }
            : thread
        )
      })),
      
      incrementUnreadCount: (threadId) => set((state) => ({
        threads: state.threads.map(thread =>
          thread.id === threadId
            ? { ...thread, unreadCount: thread.unreadCount + 1 }
            : thread
        )
      })),
      
      clearUnreadCount: (threadId) => set((state) => ({
        threads: state.threads.map(thread =>
          thread.id === threadId
            ? { ...thread, unreadCount: 0 }
            : thread
        )
      })),
      
      // Utility actions
      reset: () => set(initialState),
    }),
    {
      name: 'campfire-thread-inbox-state',
      partialize: (state) => ({
        threads: state.threads,
        selectedThreadId: state.selectedThreadId,
        searchQuery: state.searchQuery,
        activeTab: state.activeTab,
        scrollPosition: state.scrollPosition,
        lastVisitedThreads: state.lastVisitedThreads,
      }),
    }
  )
);

// Selectors for better performance
export const selectThreads = (state: ThreadInboxState) => state.threads;
export const selectSelectedThread = (state: ThreadInboxState) => 
  state.threads.find(thread => thread.id === state.selectedThreadId);
export const selectFilteredThreads = (state: ThreadInboxState) => {
  if (!state.searchQuery) return state.threads;
  
  const query = state.searchQuery.toLowerCase();
  return state.threads.filter(thread =>
    thread.title.toLowerCase().includes(query) ||
    thread.participants.some(p => p.name.toLowerCase().includes(query)) ||
    thread.lastMessage.content.toLowerCase().includes(query)
  );
};
export const selectUnreadCount = (state: ThreadInboxState) =>
  state.threads.reduce((total, thread) => total + thread.unreadCount, 0); 