/**
 * Comprehensive Unit Tests for ConversationList Component
 * Tests virtualization, filtering, sorting, and proper test ID implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationList } from '@/src/components/InboxDashboard/sub-components/ConversationList';

// Mock react-window for virtualization testing
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: itemCount }, (_, index) => 
        children({ index, style: { height: itemSize } })
      )}
    </div>
  ),
}));

const mockConversations = [
  {
    id: 'conv-1',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    subject: 'Urgent Support Request',
    lastMessage: 'I need immediate assistance',
    updatedAt: new Date('2024-01-10T15:30:00Z'),
    unreadCount: 3,
    status: 'open',
    priority: 'high',
    assignedTo: 'agent-1',
    isOnline: true,
  },
  {
    id: 'conv-2',
    customerName: 'Bob Wilson',
    customerEmail: 'bob@example.com',
    subject: 'General Inquiry',
    lastMessage: 'Thanks for the information',
    updatedAt: new Date('2024-01-10T14:20:00Z'),
    unreadCount: 0,
    status: 'closed',
    priority: 'low',
    assignedTo: 'agent-2',
    isOnline: false,
  },
  {
    id: 'conv-3',
    customerName: 'Carol Davis',
    customerEmail: 'carol@example.com',
    subject: 'Feature Request',
    lastMessage: 'Could you add this feature?',
    updatedAt: new Date('2024-01-10T13:10:00Z'),
    unreadCount: 1,
    status: 'open',
    priority: 'medium',
    assignedTo: null,
    isOnline: true,
  },
];

const defaultProps = {
  conversations: mockConversations,
  selectedConversationId: undefined,
  onSelectConversation: jest.fn(),
  searchQuery: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  isLoading: false,
};

describe('ConversationList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render conversation list container with correct test ID', () => {
      render(<ConversationList {...defaultProps} />);
      
      const container = screen.getByTestId('conversation-list-container');
      expect(container).toBeInTheDocument();
    });

    it('should render virtualized list with correct test ID', () => {
      render(<ConversationList {...defaultProps} />);
      
      const virtualizedList = screen.getByTestId('virtualized-list');
      expect(virtualizedList).toBeInTheDocument();
    });

    it('should render all conversations with proper test IDs', () => {
      render(<ConversationList {...defaultProps} />);
      
      const conversations = screen.getAllByTestId('conversation');
      expect(conversations).toHaveLength(3);
    });

    it('should display conversation details correctly', () => {
      render(<ConversationList {...defaultProps} />);
      
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
      expect(screen.getByText('I need immediate assistance')).toBeInTheDocument();
    });
  });

  describe('Conversation Selection', () => {
    it('should call onSelectConversation when conversation is clicked', () => {
      const onSelectConversation = jest.fn();
      render(<ConversationList {...defaultProps} onSelectConversation={onSelectConversation} />);
      
      const firstConversation = screen.getAllByTestId('conversation')[0];
      fireEvent.click(firstConversation);
      
      expect(onSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
    });

    it('should highlight selected conversation', () => {
      render(<ConversationList {...defaultProps} selectedConversationId="conv-1" />);
      
      const selectedConversation = screen.getAllByTestId('conversation')[0];
      expect(selectedConversation).toHaveClass('bg-accent');
    });

    it('should support keyboard navigation', () => {
      const onSelectConversation = jest.fn();
      render(<ConversationList {...defaultProps} onSelectConversation={onSelectConversation} />);
      
      const firstConversation = screen.getAllByTestId('conversation')[0];
      
      // Test Enter key
      fireEvent.keyDown(firstConversation, { key: 'Enter' });
      expect(onSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
      
      // Test Space key
      fireEvent.keyDown(firstConversation, { key: ' ' });
      expect(onSelectConversation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter conversations by status', () => {
      render(<ConversationList {...defaultProps} statusFilter="unread" />);
      
      // Should only show conversations with unread messages
      const conversations = screen.getAllByTestId('conversation');
      expect(conversations).toHaveLength(2); // Alice and Carol have unread messages
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should filter conversations by search query', () => {
      render(<ConversationList {...defaultProps} searchQuery="Alice" />);
      
      const conversations = screen.getAllByTestId('conversation');
      expect(conversations).toHaveLength(1);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should filter conversations by priority', () => {
      render(<ConversationList {...defaultProps} priorityFilter="high" />);
      
      const conversations = screen.getAllByTestId('conversation');
      expect(conversations).toHaveLength(1);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should sort conversations by updated date (newest first)', () => {
      render(<ConversationList {...defaultProps} />);
      
      const conversations = screen.getAllByTestId('conversation');
      const customerNames = conversations.map(conv => 
        conv.querySelector('[data-testid="conversation-customer-name"]')?.textContent
      );
      
      // Should be sorted by updatedAt descending
      expect(customerNames).toEqual(['Alice Johnson', 'Bob Wilson', 'Carol Davis']);
    });
  });

  describe('Status Indicators', () => {
    it('should display unread count badges', () => {
      render(<ConversationList {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Alice's unread count
      expect(screen.getByText('1')).toBeInTheDocument(); // Carol's unread count
    });

    it('should show online status indicators', () => {
      render(<ConversationList {...defaultProps} />);
      
      // Alice and Carol are online, should have online indicators
      const onlineIndicators = screen.getAllByRole('status');
      expect(onlineIndicators).toHaveLength(2);
    });

    it('should display priority indicators', () => {
      render(<ConversationList {...defaultProps} />);
      
      // Should show priority colors/indicators
      const highPriorityConv = screen.getAllByTestId('conversation')[0];
      expect(highPriorityConv).toHaveClass('border-l-red-500'); // High priority color
    });
  });

  describe('Loading States', () => {
    it('should show loading skeletons when loading', () => {
      render(<ConversationList {...defaultProps} isLoading={true} conversations={[]} />);
      
      // Should show loading skeletons
      const loadingElements = screen.getAllByTestId(/loading-skeleton/i);
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show empty state when no conversations', () => {
      render(<ConversationList {...defaultProps} conversations={[]} />);
      
      expect(screen.getByText(/no conversations/i)).toBeInTheDocument();
    });

    it('should show empty state when filtered results are empty', () => {
      render(<ConversationList {...defaultProps} searchQuery="nonexistent" />);
      
      expect(screen.getByText(/no conversations found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ConversationList {...defaultProps} />);
      
      const conversations = screen.getAllByTestId('conversation');
      conversations.forEach(conv => {
        expect(conv).toHaveAttribute('role', 'button');
        expect(conv).toHaveAttribute('tabIndex', '0');
        expect(conv).toHaveAttribute('aria-label');
      });
    });

    it('should include unread count in aria-label', () => {
      render(<ConversationList {...defaultProps} />);
      
      const firstConversation = screen.getAllByTestId('conversation')[0];
      const ariaLabel = firstConversation.getAttribute('aria-label');
      expect(ariaLabel).toContain('3 unread');
    });

    it('should have proper focus management', () => {
      render(<ConversationList {...defaultProps} />);
      
      const firstConversation = screen.getAllByTestId('conversation')[0];
      firstConversation.focus();
      expect(document.activeElement).toBe(firstConversation);
    });
  });

  describe('Performance', () => {
    it('should handle large conversation lists efficiently', () => {
      const largeConversationList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockConversations[0],
        id: `conv-${index}`,
        customerName: `Customer ${index}`,
      }));

      render(<ConversationList {...defaultProps} conversations={largeConversationList} />);
      
      // Should use virtualization for performance
      const virtualizedList = screen.getByTestId('virtualized-list');
      expect(virtualizedList).toBeInTheDocument();
    });
  });

  describe('Filter Bar', () => {
    it('should render filter buttons', () => {
      render(<ConversationList {...defaultProps} />);
      
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.getByText('AI Managed')).toBeInTheDocument();
      expect(screen.getByText('Human Managed')).toBeInTheDocument();
    });

    it('should highlight active filter', () => {
      render(<ConversationList {...defaultProps} statusFilter="unread" />);
      
      const unreadFilter = screen.getByText('Unread');
      expect(unreadFilter).toHaveClass('bg-primary');
    });
  });
});
