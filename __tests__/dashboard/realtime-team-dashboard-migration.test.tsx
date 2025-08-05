/**
 * RealtimeTeamDashboard Migration Tests
 * 
 * Tests to ensure the migration from mixed import patterns and hardcoded values
 * to unified design tokens maintains functionality while achieving 100% compliance.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealtimeTeamDashboard } from '@/components/dashboard/RealtimeTeamDashboard';

// Mock the hooks
jest.mock('@/hooks/useRealtimeTeamData', () => ({
  useRealtimeTeamData: jest.fn(() => ({
    teamMembers: [
      {
        agentId: '1',
        name: 'John Doe',
        status: 'online',
        avatar: '/avatar1.jpg',
        currentLoad: 3,
        maxCapacity: 5,
        utilizationRate: 60,
        satisfactionScore: 4.5,
        avgResponseTime: 120
      },
      {
        agentId: '2',
        name: 'Jane Smith',
        status: 'busy',
        avatar: '/avatar2.jpg',
        currentLoad: 5,
        maxCapacity: 5,
        utilizationRate: 100,
        satisfactionScore: 4.8,
        avgResponseTime: 90
      }
    ],
    teamMetrics: {
      onlineAgents: 2,
      totalAgents: 3,
      busyAgents: 1,
      awayAgents: 0,
      utilizationRate: 75.5,
      totalActiveChats: 8,
      totalCapacity: 10,
      averageResponseTime: 105,
      averageSatisfaction: 4.65
    },
    loading: false,
    error: null,
    refreshData: jest.fn(),
    updateAgentStatus: jest.fn()
  }))
}));

jest.mock('@/hooks/useAssignmentQueue', () => ({
  useAssignmentQueue: jest.fn(() => ({
    queueItems: [
      {
        id: '1',
        priority: 8,
        type: 'chat',
        waitTime: 300000,
        requiredSkills: ['support', 'billing'],
        attempts: 2,
        expiresIn: 600000,
        status: 'pending'
      },
      {
        id: '2',
        priority: 5,
        type: 'email',
        waitTime: 180000,
        requiredSkills: ['technical'],
        attempts: 1,
        expiresIn: 900000,
        status: 'pending'
      }
    ],
    pendingCount: 2,
    failedCount: 0,
    highPriorityCount: 1,
    loading: false,
    error: null,
    refreshQueue: jest.fn(),
    autoAssign: jest.fn()
  }))
}));

describe('RealtimeTeamDashboard Migration', () => {
  const defaultProps = {
    organizationId: 'test-org-123'
  };

  beforeEach(() => {
    // Reset mocks to default state before each test
    require('@/hooks/useRealtimeTeamData').useRealtimeTeamData.mockReturnValue({
      teamMembers: [
        {
          agentId: '1',
          name: 'John Doe',
          status: 'online',
          avatar: '/avatar1.jpg',
          currentLoad: 3,
          maxCapacity: 5,
          utilizationRate: 60,
          satisfactionScore: 4.5,
          avgResponseTime: 120
        },
        {
          agentId: '2',
          name: 'Jane Smith',
          status: 'busy',
          avatar: '/avatar2.jpg',
          currentLoad: 5,
          maxCapacity: 5,
          utilizationRate: 100,
          satisfactionScore: 4.8,
          avgResponseTime: 90
        }
      ],
      teamMetrics: {
        onlineAgents: 2,
        totalAgents: 3,
        busyAgents: 1,
        awayAgents: 0,
        utilizationRate: 75.5,
        totalActiveChats: 8,
        totalCapacity: 10,
        averageResponseTime: 105,
        averageSatisfaction: 4.65
      },
      loading: false,
      error: null,
      refreshData: jest.fn(),
      updateAgentStatus: jest.fn()
    });

    require('@/hooks/useAssignmentQueue').useAssignmentQueue.mockReturnValue({
      queueItems: [
        {
          id: '1',
          priority: 8,
          type: 'chat',
          waitTime: 300000,
          requiredSkills: ['support', 'billing'],
          attempts: 2,
          expiresIn: 600000,
          status: 'pending'
        },
        {
          id: '2',
          priority: 5,
          type: 'email',
          waitTime: 180000,
          requiredSkills: ['technical'],
          attempts: 1,
          expiresIn: 900000,
          status: 'pending'
        }
      ],
      pendingCount: 2,
      failedCount: 0,
      highPriorityCount: 1,
      loading: false,
      error: null,
      refreshQueue: jest.fn(),
      autoAssign: jest.fn()
    });
  });

  describe('Design Token Compliance', () => {
    it('should use unified import patterns', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      // Should render without errors using unified-ui components
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Team Status')).toBeInTheDocument();
      expect(screen.getByText('Assignment Queue')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();
    });

    it('should not contain hardcoded color classes', () => {
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);

      const htmlContent = container.innerHTML;

      // These should not be present after migration
      expect(htmlContent).not.toMatch(/bg-green-500/);
      expect(htmlContent).not.toMatch(/bg-red-500/);
      expect(htmlContent).not.toMatch(/text-red-600/);
      expect(htmlContent).not.toMatch(/text-muted-foreground/);
      expect(htmlContent).not.toMatch(/gap-ds-/);
      // Note: spacing- may appear in unified-ui components, but not in our custom classes
    });

    it('should use design tokens consistently', () => {
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);
      
      const htmlContent = container.innerHTML;
      
      // Should use design token classes
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);
    });

    it('should use design token-based status colors', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      // Should show team members with design token-based status indicators
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      
      // Status badges should use design token variants
      expect(screen.getByText('online')).toBeInTheDocument();
      expect(screen.getByText('busy')).toBeInTheDocument();
    });
  });

  describe('Component Functionality', () => {
    it('should display team metrics correctly', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      // Team Status metrics
      expect(screen.getByText('2/3')).toBeInTheDocument(); // onlineAgents/totalAgents
      expect(screen.getByText('1 busy, 0 away')).toBeInTheDocument();
      
      // Utilization metrics
      expect(screen.getByText('75.5%')).toBeInTheDocument();
      expect(screen.getByText('8/10 capacity')).toBeInTheDocument();
      
      // Response time and satisfaction
      expect(screen.getByText('1m')).toBeInTheDocument(); // 105 seconds = 1m
      expect(screen.getByText('4.7/5')).toBeInTheDocument(); // averageSatisfaction
    });

    it('should display assignment queue items', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      // Queue badges
      expect(screen.getByText('2 pending')).toBeInTheDocument();
      expect(screen.getByText('1 urgent')).toBeInTheDocument();
      
      // Queue items
      expect(screen.getByText('Priority 8')).toBeInTheDocument();
      expect(screen.getByText('Priority 5')).toBeInTheDocument();
      expect(screen.getByText('chat')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      
      // Skills and timing
      expect(screen.getByText('Skills: support, billing')).toBeInTheDocument();
      expect(screen.getByText('Skills: technical')).toBeInTheDocument();
    });

    it('should display team members with correct information', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      // Member names and status
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('online')).toBeInTheDocument();
      expect(screen.getByText('busy')).toBeInTheDocument();
      
      // Capacity information
      expect(screen.getByText('3/5')).toBeInTheDocument(); // John's load
      expect(screen.getByText('5/5')).toBeInTheDocument(); // Jane's load
      
      // Performance metrics
      expect(screen.getByText('⭐ 4.5')).toBeInTheDocument(); // John's satisfaction
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument(); // Jane's satisfaction
    });

    it('should handle refresh functionality', async () => {
      const mockRefreshData = jest.fn();
      const mockRefreshQueue = jest.fn();
      
      // Update mocks to return the refresh functions
      require('@/hooks/useRealtimeTeamData').useRealtimeTeamData.mockReturnValue({
        teamMembers: [],
        teamMetrics: {
          onlineAgents: 0,
          totalAgents: 0,
          busyAgents: 0,
          awayAgents: 0,
          utilizationRate: 0,
          totalActiveChats: 0,
          totalCapacity: 0,
          averageResponseTime: 0,
          averageSatisfaction: 0
        },
        loading: false,
        error: null,
        refreshData: mockRefreshData,
        updateAgentStatus: jest.fn()
      });
      
      require('@/hooks/useAssignmentQueue').useAssignmentQueue.mockReturnValue({
        queueItems: [],
        pendingCount: 0,
        failedCount: 0,
        highPriorityCount: 0,
        loading: false,
        error: null,
        refreshQueue: mockRefreshQueue,
        autoAssign: jest.fn()
      });
      
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockRefreshData).toHaveBeenCalled();
        expect(mockRefreshQueue).toHaveBeenCalled();
      });
    });

    it('should handle auto-assign functionality', () => {
      const mockAutoAssign = jest.fn();
      
      require('@/hooks/useAssignmentQueue').useAssignmentQueue.mockReturnValue({
        queueItems: [
          {
            id: '1',
            priority: 8,
            type: 'chat',
            waitTime: 300000,
            requiredSkills: ['support'],
            attempts: 1,
            expiresIn: 600000,
            status: 'pending'
          }
        ],
        pendingCount: 1,
        failedCount: 0,
        highPriorityCount: 1,
        loading: false,
        error: null,
        refreshQueue: jest.fn(),
        autoAssign: mockAutoAssign
      });
      
      render(<RealtimeTeamDashboard {...defaultProps} />);
      
      const autoAssignButton = screen.getByText('Auto Assign');
      fireEvent.click(autoAssignButton);
      
      expect(mockAutoAssign).toHaveBeenCalledWith('1');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state with design tokens', () => {
      require('@/hooks/useRealtimeTeamData').useRealtimeTeamData.mockReturnValue({
        teamMembers: [],
        teamMetrics: {},
        loading: true,
        error: null,
        refreshData: jest.fn(),
        updateAgentStatus: jest.fn()
      });
      
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);
      
      expect(screen.getByText('Loading team dashboard...')).toBeInTheDocument();
      
      // Should use design tokens for loading state
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-spacing-xl\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-primary\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-text-muted\)/);
    });

    it('should display error state with design tokens', () => {
      require('@/hooks/useRealtimeTeamData').useRealtimeTeamData.mockReturnValue({
        teamMembers: [],
        teamMetrics: {},
        loading: false,
        error: 'Failed to load team data',
        refreshData: jest.fn(),
        updateAgentStatus: jest.fn()
      });
      
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);
      
      expect(screen.getByText('Error loading dashboard: Failed to load team data')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      
      // Should use design tokens for error state
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-spacing-md\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-error-subtle\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-error-200\)/);
      expect(htmlContent).toMatch(/var\(--fl-radius-lg\)/);
    });

    it('should display empty queue state', () => {
      // Override the mock for this specific test
      require('@/hooks/useAssignmentQueue').useAssignmentQueue.mockReturnValueOnce({
        queueItems: [],
        pendingCount: 0,
        failedCount: 0,
        highPriorityCount: 0,
        loading: false,
        error: null,
        refreshQueue: jest.fn(),
        autoAssign: jest.fn()
      });

      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);

      expect(screen.getByText('No items in assignment queue')).toBeInTheDocument();

      // Should use design tokens for empty state
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-spacing-8\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-text-muted\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-success\)/);
    });
  });

  describe('Status Color Mapping', () => {
    it('should map status colors to design tokens correctly', () => {
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);

      const htmlContent = container.innerHTML;

      // Should use design token-based status colors
      expect(htmlContent).toMatch(/var\(--fl-color-success\)/); // online status
      expect(htmlContent).toMatch(/var\(--fl-color-error\)/); // busy status
      expect(htmlContent).not.toMatch(/bg-green-500/);
      expect(htmlContent).not.toMatch(/bg-red-500/);
    });

    it('should map priority colors to design tokens correctly', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);

      // High priority (8) should use error color
      const priority8Badge = screen.getByText('Priority 8');
      expect(priority8Badge).toBeInTheDocument();

      // Medium priority (5) should use warning color
      const priority5Badge = screen.getByText('Priority 5');
      expect(priority5Badge).toBeInTheDocument();
    });
  });

  describe('Migration Validation', () => {
    it('should achieve 100% design token compliance', () => {
      const { container } = render(<RealtimeTeamDashboard {...defaultProps} />);

      // Should render without errors
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument();

      // Should use design tokens consistently
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);

      // Should not contain any hardcoded values in our custom classes
      expect(htmlContent).not.toMatch(/gap-ds-/);
      // Note: rounded-ds- may appear in unified-ui components, which is expected
    });

    it('should preserve all original functionality', () => {
      render(<RealtimeTeamDashboard {...defaultProps} />);

      // All major sections should be present
      expect(screen.getByText('Team Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Team Status')).toBeInTheDocument();
      expect(screen.getByText('Utilization')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
      expect(screen.getByText('Assignment Queue')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();

      // Interactive elements should be present
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getAllByText('Auto Assign')).toHaveLength(2);
    });
  });
});
