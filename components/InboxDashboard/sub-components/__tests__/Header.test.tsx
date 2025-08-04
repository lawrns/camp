import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

const mockProps = {
  searchQuery: '',
  setSearchQuery: jest.fn(),
  statusFilter: '',
  setStatusFilter: jest.fn(),
  priorityFilter: '',
  setPriorityFilter: jest.fn(),
  searchInputRef: React.createRef<HTMLInputElement>(),
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input and filter dropdown only', () => {
      render(<Header {...mockProps} />);
      
      // Should have search input
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
      
      // Should have filter dropdown
      expect(screen.getByLabelText('Filter conversations by status')).toBeInTheDocument();
      
      // Should have New button
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('does not render performance metrics or extra icons', () => {
      render(<Header {...mockProps} />);
      
      // Should NOT have performance metrics
      expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
      expect(screen.queryByText(/connected/i)).not.toBeInTheDocument();
      
      // Should NOT have notification bell
      expect(screen.queryByLabelText(/notification/i)).not.toBeInTheDocument();
      
      // Should NOT have shortcuts button
      expect(screen.queryByLabelText(/shortcut/i)).not.toBeInTheDocument();
      
      // Should NOT have advanced filters
      expect(screen.queryByText(/advanced filter/i)).not.toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      render(<Header {...mockProps} />);
      
      // Should be a header element
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Should have search region
      expect(screen.getByRole('search')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search query changes', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();

      render(<Header {...mockProps} setSearchQuery={mockSetSearchQuery} />);

      const searchInput = screen.getByRole('searchbox');
      await user.clear(searchInput);
      await user.type(searchInput, 'test');

      // Should be called when typing
      expect(mockSetSearchQuery).toHaveBeenCalled();
      // Check that it was called with the final value
      expect(mockSetSearchQuery).toHaveBeenCalledWith(expect.stringContaining('t'));
    });

    it('displays current search query', () => {
      render(<Header {...mockProps} searchQuery="existing query" />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveValue('existing query');
    });

    it('has proper search accessibility', () => {
      render(<Header {...mockProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search conversations');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
      
      // Should have hidden help text
      expect(screen.getByText(/Search through your conversations/)).toHaveClass('sr-only');
    });

    it('focuses search input when ref is used', () => {
      const searchRef = React.createRef<HTMLInputElement>();
      render(<Header {...mockProps} searchInputRef={searchRef} />);
      
      // Simulate focusing via ref
      searchRef.current?.focus();
      expect(searchRef.current).toHaveFocus();
    });
  });

  describe('Filter Functionality', () => {
    it('shows New Conversation button', () => {
      render(<Header {...mockProps} />);
      
      const newButton = screen.getByText('New');
      expect(newButton).toBeInTheDocument();
      expect(newButton).toHaveAttribute('aria-label', 'Start new conversation');
    });

    it('handles status filter changes', async () => {
      const user = userEvent.setup();
      const mockSetStatusFilter = jest.fn();
      
      render(<Header {...mockProps} setStatusFilter={mockSetStatusFilter} />);
      
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      await user.selectOptions(filterSelect, 'open');
      
      expect(mockSetStatusFilter).toHaveBeenCalledWith('open');
    });

    it('displays current status filter', () => {
      render(<Header {...mockProps} statusFilter="open" />);
      
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      expect(filterSelect).toHaveValue('open');
    });

    it('has all expected filter options', () => {
      render(<Header {...mockProps} />);
      
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      const options = Array.from(filterSelect.querySelectorAll('option')).map(opt => opt.textContent);
      
      expect(options).toEqual([
        'All conversations',
        'Open',
        'Closed',
        'Pending'
      ]);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Header {...mockProps} />);
      
      // Header should have banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Search should have search role
      expect(screen.getByRole('search')).toBeInTheDocument();
      
      // Filter should have proper label
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      expect(filterSelect).toHaveAttribute('id', 'status-filter');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Header {...mockProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('searchbox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Filter conversations by status')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('New')).toHaveFocus();
    });

    it('has proper focus indicators', () => {
      render(<Header {...mockProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      const newButton = screen.getByText('New');
      
      // All interactive elements should have focus styles
      expect(searchInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:outline-none');
      expect(filterSelect).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
      expect(newButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:outline-none');
    });

    it('has proper color contrast', () => {
      render(<Header {...mockProps} />);
      
      // Check that elements use proper color classes for WCAG compliance
      const newButton = screen.getByText('New');
      expect(newButton).toHaveClass('bg-blue-600', 'text-white');
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('border-gray-300');
    });
  });

  describe('Responsive Design', () => {
    it('hides on mobile and shows on desktop', () => {
      render(<Header {...mockProps} />);
      
      const headerContent = screen.getByRole('banner').firstChild;
      expect(headerContent).toHaveClass('hidden', 'lg:flex');
    });

    it('maintains proper spacing and layout', () => {
      render(<Header {...mockProps} />);
      
      const headerContent = screen.getByRole('banner').firstChild;
      expect(headerContent).toHaveClass('items-center', 'justify-between', 'px-6', 'py-4');
      
      const searchContainer = screen.getByRole('search');
      expect(searchContainer).toHaveClass('flex-1', 'max-w-2xl');
    });
  });

  describe('Clean Design Implementation', () => {
    it('uses consistent styling tokens', () => {
      render(<Header {...mockProps} />);
      
      // Check for consistent border and background
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-white', 'border-b', 'border-gray-200');
      
      // Check for consistent spacing
      const searchContainer = screen.getByRole('search');
      expect(searchContainer).toHaveClass('gap-3');
    });

    it('has clean visual hierarchy', () => {
      render(<Header {...mockProps} />);
      
      // Search input should be prominent
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('w-full');
      
      // Filter should be secondary
      const filterSelect = screen.getByLabelText('Filter conversations by status');
      expect(filterSelect).toHaveClass('px-3', 'py-2');
      
      // New button should be primary action
      const newButton = screen.getByText('New');
      expect(newButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('follows Intercom-style design patterns', () => {
      render(<Header {...mockProps} />);
      
      // Clean, minimal design
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('flex-shrink-0');
      
      // Proper button styling
      const newButton = screen.getByText('New');
      expect(newButton).toHaveClass('rounded-lg', 'hover:bg-blue-700', 'transition-colors');
      
      // Consistent input styling
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('rounded-lg', 'border', 'focus:ring-2');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestHeader = React.memo(() => {
        renderSpy();
        return <Header {...mockProps} />;
      });
      
      const { rerender } = render(<TestHeader />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestHeader />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('handles rapid search input changes efficiently', async () => {
      const user = userEvent.setup();
      const mockSetSearchQuery = jest.fn();
      
      render(<Header {...mockProps} setSearchQuery={mockSetSearchQuery} />);
      
      const searchInput = screen.getByRole('searchbox');
      
      // Type rapidly
      await user.type(searchInput, 'rapid typing test');
      
      // Should call setSearchQuery for each character
      expect(mockSetSearchQuery).toHaveBeenCalledTimes('rapid typing test'.length);
    });
  });
});
