/**
 * Comprehensive Unit Tests for InboxDashboard Component
 * Tests rendering, state management, conversation handling, and real-time updates
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InboxDashboard } from '@/components/InboxDashboard/index';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useConversations');
jest.mock('@/lib/realtime/enhanced-monitoring', () => ({
  RealtimeLogger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

// Mock conversation data
const mockConversations = [
  {
    id: 'conv-1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    subject: 'Test Subject 1',
    lastMessage: 'Hello, I need help',
    updatedAt: new Date('2024-01-10T10:00:00Z'),
    unreadCount: 2,
    status: 'open',
    priority: 'high',
    assignedTo: 'agent-1',
    organizationId: 'org-1',
  },
  {
    id: 'conv-2',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    subject: 'Test Subject 2',
    lastMessage: 'Thanks for your help',
    updatedAt: new Date('2024-01-10T09:00:00Z'),
    unreadCount: 0,
    status: 'closed',
    priority: 'low',
    assignedTo: 'agent-2',
    organizationId: 'org-1',
  },
];

const mockUser = {
  id: 'user-1',
  email: 'agent@example.com',
  organizationId: 'org-1',
  role: 'agent',
};

describe('InboxDashboard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderInboxDashboard = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InboxDashboard {...props} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render the inbox dashboard with correct test ID', () => {
      renderInboxDashboard();
      
      const dashboard = screen.getByTestId('inbox-dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('should render conversation list with proper test IDs', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const conversations = screen.getAllByTestId('conversation');
        expect(conversations).toHaveLength(2);
      });
    });

    it('should display conversation details correctly', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Hello, I need help')).toBeInTheDocument();
      });
    });

    it('should show unread count badges', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const unreadBadge = screen.getByText('2');
        expect(unreadBadge).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Interaction', () => {
    it('should select conversation when clicked', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const firstConversation = screen.getAllByTestId('conversation')[0];
        fireEvent.click(firstConversation);
        
        // Check if conversation is selected (has active styling)
        expect(firstConversation).toHaveClass('bg-accent');
      });
    });

    it('should display conversation messages when selected', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const firstConversation = screen.getAllByTestId('conversation')[0];
        fireEvent.click(firstConversation);
      });

      // Should show message view area
      await waitFor(() => {
        const messageView = screen.getByTestId('conversation-view');
        expect(messageView).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    it('should filter conversations by status', async () => {
      renderInboxDashboard();
      
      // Click on "Unread" filter
      const unreadFilter = screen.getByText('Unread');
      fireEvent.click(unreadFilter);
      
      await waitFor(() => {
        // Should only show conversations with unread messages
        const conversations = screen.getAllByTestId('conversation');
        expect(conversations).toHaveLength(1);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should search conversations by customer name', async () => {
      renderInboxDashboard();
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      await waitFor(() => {
        const conversations = screen.getAllByTestId('conversation');
        expect(conversations).toHaveLength(1);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when conversations are loading', () => {
      mockUseConversations.mockReturnValue({
        conversations: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      renderInboxDashboard();
      
      // Should show loading skeletons
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show empty state when no conversations', () => {
      mockUseConversations.mockReturnValue({
        conversations: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderInboxDashboard();
      
      // Should show empty state
      expect(screen.getByText(/no conversation selected/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when conversations fail to load', () => {
      mockUseConversations.mockReturnValue({
        conversations: [],
        isLoading: false,
        error: new Error('Failed to load conversations'),
        refetch: jest.fn(),
      });

      renderInboxDashboard();
      
      // Should show error state
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update conversation list when new message arrives', async () => {
      const { rerender } = renderInboxDashboard();
      
      // Simulate new message arriving
      const updatedConversations = [
        {
          ...mockConversations[0],
          lastMessage: 'New message arrived',
          unreadCount: 3,
          updatedAt: new Date(),
        },
        mockConversations[1],
      ];

      mockUseConversations.mockReturnValue({
        conversations: updatedConversations,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <InboxDashboard />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('New message arrived')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for conversations', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const conversations = screen.getAllByTestId('conversation');
        conversations.forEach(conv => {
          expect(conv).toHaveAttribute('role', 'button');
          expect(conv).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('should support keyboard navigation', async () => {
      renderInboxDashboard();
      
      await waitFor(() => {
        const firstConversation = screen.getAllByTestId('conversation')[0];
        firstConversation.focus();
        
        // Simulate Enter key press
        fireEvent.keyDown(firstConversation, { key: 'Enter' });
        
        expect(firstConversation).toHaveClass('bg-accent');
      });
    });
  });
});
