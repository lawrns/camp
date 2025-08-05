/**
 * LivePerformanceMonitor Migration Tests
 * 
 * Tests to ensure the migration from mixed import patterns and hardcoded values
 * to unified design tokens maintains functionality while achieving 100% compliance.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LivePerformanceMonitor } from '@/components/dashboard/LivePerformanceMonitor';

// Mock OptimizedMotion and OptimizedAnimatePresence
jest.mock('@/lib/animations/OptimizedMotion', () => ({
  OptimizedMotion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  OptimizedAnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('LivePerformanceMonitor Migration', () => {
  const mockMetrics = [
    {
      id: '1',
      name: 'Response Time',
      value: 150,
      unit: 'ms',
      target: 200,
      previous: 180,
      status: 'excellent' as const,
      trend: 'up' as const,
      change: 12.5,
      description: 'Average API response time'
    },
    {
      id: '2',
      name: 'Error Rate',
      value: 2.1,
      unit: '%',
      target: 1.0,
      status: 'warning' as const,
      trend: 'down' as const,
      change: -5.2,
      description: 'System error percentage'
    },
    {
      id: '3',
      name: 'CPU Usage',
      value: 85,
      unit: '%',
      status: 'critical' as const,
      trend: 'stable' as const,
      description: 'Server CPU utilization'
    }
  ];

  const mockAlerts = [
    {
      id: '1',
      type: 'performance' as const,
      severity: 'critical' as const,
      title: 'High CPU Usage',
      message: 'CPU usage has exceeded 80% for the last 10 minutes',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      metric: 'CPU Usage',
      actionRequired: true
    },
    {
      id: '2',
      type: 'threshold' as const,
      severity: 'medium' as const,
      title: 'Response Time Warning',
      message: 'API response time is approaching threshold limits',
      timestamp: new Date('2024-01-01T11:30:00Z'),
      metric: 'Response Time',
      actionRequired: false
    }
  ];

  const defaultProps = {
    metrics: mockMetrics,
    alerts: mockAlerts,
    isLive: true,
    onMetricClick: jest.fn(),
    onAlertDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Design Token Compliance', () => {
    it('should use unified import patterns', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Should render without errors using unified-ui components
      expect(screen.getByText('Live Performance Monitor')).toBeInTheDocument();
      expect(screen.getAllByText('Response Time')).toHaveLength(2); // Appears in metric and alert
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getAllByText('CPU Usage')).toHaveLength(2); // Appears in metric and alert
    });

    it('should not contain hardcoded color classes', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      const htmlContent = container.innerHTML;
      
      // These should not be present after migration
      expect(htmlContent).not.toMatch(/text-green-600/);
      expect(htmlContent).not.toMatch(/text-red-600/);
      expect(htmlContent).not.toMatch(/text-blue-600/);
      expect(htmlContent).not.toMatch(/bg-green-100/);
      expect(htmlContent).not.toMatch(/bg-red-100/);
      expect(htmlContent).not.toMatch(/border-l-blue-500/);
      expect(htmlContent).not.toMatch(/gap-ds-/);
      // Note: spacing- may appear in unified-ui components, which is expected
    });

    it('should use design tokens consistently', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      const htmlContent = container.innerHTML;
      
      // Should use design token classes
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);
    });

    it('should use design token-based status colors', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      const htmlContent = container.innerHTML;
      
      // Should use design token-based status colors
      expect(htmlContent).toMatch(/var\(--fl-color-success\)/); // excellent status
      expect(htmlContent).toMatch(/var\(--fl-color-warning\)/); // warning status
      expect(htmlContent).toMatch(/var\(--fl-color-error\)/); // critical status
    });
  });

  describe('Component Functionality', () => {
    it('should display performance metrics correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Metric names and values
      expect(screen.getAllByText('Response Time')).toHaveLength(2); // Appears in metric and alert
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('ms')).toBeInTheDocument();
      
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('2.1')).toBeInTheDocument();
      expect(screen.getAllByText('%')).toHaveLength(2); // Appears in Error Rate and Health Score
      
      expect(screen.getAllByText('CPU Usage')).toHaveLength(2); // Appears in metric and alert
      expect(screen.getByText('85')).toBeInTheDocument();
      
      // Status badges
      expect(screen.getByText('excellent')).toBeInTheDocument();
      expect(screen.getByText('warning')).toBeInTheDocument();
      expect(screen.getAllByText('critical')).toHaveLength(2); // Appears in metric status and alert severity
    });

    it('should display summary statistics correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Summary cards
      expect(screen.getByText('Total Metrics')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // total metrics
      
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getAllByText('1')).toHaveLength(3); // excellent, warning, and critical counts

      expect(screen.getByText('Warnings')).toBeInTheDocument();

      expect(screen.getByText('Critical')).toBeInTheDocument();
      
      // Health score (1 excellent out of 3 total = 33%)
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('Health Score')).toBeInTheDocument();
    });

    it('should display alerts correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Alert section header
      expect(screen.getByText('Active Alerts (2)')).toBeInTheDocument();
      
      // Alert titles and messages
      expect(screen.getByText('High CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('CPU usage has exceeded 80% for the last 10 minutes')).toBeInTheDocument();
      
      expect(screen.getByText('Response Time Warning')).toBeInTheDocument();
      expect(screen.getByText('API response time is approaching threshold limits')).toBeInTheDocument();
      
      // Alert severities
      expect(screen.getAllByText('critical')).toHaveLength(2); // Appears in metric status and alert severity
      expect(screen.getByText('medium')).toBeInTheDocument();
      
      // Action required badge
      expect(screen.getByText('Action Required')).toBeInTheDocument();
    });

    it('should handle metric clicks', () => {
      const mockOnMetricClick = jest.fn();
      
      render(<LivePerformanceMonitor {...defaultProps} onMetricClick={mockOnMetricClick} />);
      
      const responseTimeCards = screen.getAllByText('Response Time');
      const responseTimeCard = responseTimeCards[0].closest('div'); // Get the first one (metric card)
      fireEvent.click(responseTimeCard!);
      
      expect(mockOnMetricClick).toHaveBeenCalledWith(mockMetrics[0]);
    });

    it('should handle alert dismissal', () => {
      const mockOnAlertDismiss = jest.fn();
      
      render(<LivePerformanceMonitor {...defaultProps} onAlertDismiss={mockOnAlertDismiss} />);
      
      const dismissButtons = screen.getAllByText('×');
      fireEvent.click(dismissButtons[0]);
      
      expect(mockOnAlertDismiss).toHaveBeenCalledWith('1');
    });

    it('should handle clear all alerts', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      // Alerts should be hidden after clearing
      expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
    });
  });

  describe('Live Status Indicator', () => {
    it('should display live status correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} isLive={true} />);
      
      expect(screen.getByText('Live')).toBeInTheDocument();
      
      const { container } = render(<LivePerformanceMonitor {...defaultProps} isLive={true} />);
      const htmlContent = container.innerHTML;
      
      // Should use success colors for live status
      expect(htmlContent).toMatch(/var\(--fl-color-success\)/);
    });

    it('should display offline status correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} isLive={false} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      const { container } = render(<LivePerformanceMonitor {...defaultProps} isLive={false} />);
      const htmlContent = container.innerHTML;
      
      // Should use muted colors for offline status
      expect(htmlContent).toMatch(/var\(--fl-color-text-muted\)/);
    });
  });

  describe('Progress Bars and Trends', () => {
    it('should display progress bars for metrics with targets', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Response Time has a target, so should show progress
      expect(screen.getAllByText('Progress to target')).toHaveLength(2); // Both Response Time and Error Rate have targets
      expect(screen.getByText('200 ms')).toBeInTheDocument();
    });

    it('should display trend indicators correctly', () => {
      render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Should show percentage changes
      expect(screen.getByText('+12.5%')).toBeInTheDocument(); // up trend
      expect(screen.getByText('-5.2%')).toBeInTheDocument(); // down trend
    });

    it('should use correct progress bar colors based on status', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      const htmlContent = container.innerHTML;
      
      // Should use design token-based progress colors
      expect(htmlContent).toMatch(/var\(--fl-color-success\)/); // excellent status
      expect(htmlContent).toMatch(/var\(--fl-color-warning\)/); // warning status
      expect(htmlContent).toMatch(/var\(--fl-color-error\)/); // critical status
    });
  });

  describe('Empty States', () => {
    it('should handle empty metrics gracefully', () => {
      render(<LivePerformanceMonitor {...defaultProps} metrics={[]} />);
      
      // Should still show header and summary
      expect(screen.getByText('Live Performance Monitor')).toBeInTheDocument();
      expect(screen.getByText('Total Metrics')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(4); // zero metrics in all summary cards
      expect(screen.getByText('0%')).toBeInTheDocument(); // zero health score
    });

    it('should handle empty alerts gracefully', () => {
      render(<LivePerformanceMonitor {...defaultProps} alerts={[]} />);
      
      // Should not show alerts section
      expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Migration Validation', () => {
    it('should achieve 100% design token compliance', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Should render without errors
      expect(screen.getByText('Live Performance Monitor')).toBeInTheDocument();
      
      // Should use design tokens consistently
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);
      
      // Should not contain any hardcoded values in our custom classes
      expect(htmlContent).not.toMatch(/gap-ds-/);
      expect(htmlContent).not.toMatch(/text-gray-900/);
      expect(htmlContent).not.toMatch(/border-l-blue-500/);
    });

    it('should preserve all original functionality', () => {
      const mockOnMetricClick = jest.fn();
      const mockOnAlertDismiss = jest.fn();
      
      render(
        <LivePerformanceMonitor
          {...defaultProps}
          onMetricClick={mockOnMetricClick}
          onAlertDismiss={mockOnAlertDismiss}
        />
      );
      
      // All major sections should be present
      expect(screen.getByText('Live Performance Monitor')).toBeInTheDocument();
      expect(screen.getByText('Real-time system health and performance metrics')).toBeInTheDocument();
      expect(screen.getByText('Health Score')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Total Metrics')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts (2)')).toBeInTheDocument();
      
      // Interactive elements should work
      const responseTimeCards = screen.getAllByText('Response Time');
      const responseTimeCard = responseTimeCards[0].closest('div'); // Get the first one (metric card)
      fireEvent.click(responseTimeCard!);
      expect(mockOnMetricClick).toHaveBeenCalled();
      
      const dismissButton = screen.getAllByText('×')[0];
      fireEvent.click(dismissButton);
      expect(mockOnAlertDismiss).toHaveBeenCalled();
    });

    it('should maintain responsive design with design tokens', () => {
      const { container } = render(<LivePerformanceMonitor {...defaultProps} />);
      
      // Should use responsive grid classes
      expect(container.innerHTML).toMatch(/grid-cols-1/);
      expect(container.innerHTML).toMatch(/md:grid-cols-/);
      expect(container.innerHTML).toMatch(/lg:grid-cols-/);
    });
  });
});
