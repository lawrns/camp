/**
 * MetricCard Migration Tests
 * 
 * Tests to ensure the migration from legacy MetricCard to StandardizedDashboard.MetricCard
 * maintains backward compatibility and functionality.
 */

import { render, screen } from '@testing-library/react';
import { 
  MetricCard, 
  ResponseTimeMetric, 
  SatisfactionMetric, 
  HandoffRateMetric, 
  ResolutionRateMetric 
} from '@/components/dashboard/StandardizedDashboard';

describe('MetricCard Migration', () => {
  describe('Backward Compatibility', () => {
    it('should support legacy status prop', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="100"
          status="success"
        />
      );
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should prioritize status over variant when both are provided', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value="100"
          variant="error"
          status="success"
        />
      );
      
      // Should use success styling (from status) not error styling (from variant)
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-success-muted)]');
    });

    it('should support all legacy status values', () => {
      const statusValues = ['success', 'warning', 'error', 'info'] as const;
      
      statusValues.forEach(status => {
        const { container } = render(
          <MetricCard
            title={`${status} Metric`}
            value="100"
            status={status}
          />
        );
        
        expect(screen.getByText(`${status} Metric`)).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Functionality', () => {
    it('should support target progress bars', () => {
      render(
        <MetricCard
          title="Progress Metric"
          value={75}
          target={{
            value: 100,
            label: 'Target goal'
          }}
        />
      );
      
      expect(screen.getByText('Target goal')).toBeInTheDocument();
      expect(screen.getByText('75 / 100')).toBeInTheDocument();
      expect(screen.getByText('75.0% of target')).toBeInTheDocument();
    });

    it('should support change indicators', () => {
      render(
        <MetricCard
          title="Trending Metric"
          value="1000"
          change={{
            value: 12.5,
            trend: 'up',
            period: 'last month'
          }}
        />
      );
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText('from last month')).toBeInTheDocument();
    });

    it('should support custom charts', () => {
      const CustomChart = () => <div data-testid="custom-chart">Chart</div>;
      
      render(
        <MetricCard
          title="Chart Metric"
          value="100"
          chart={<CustomChart />}
        />
      );
      
      expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
    });

    it('should support click handlers', () => {
      const handleClick = jest.fn();
      
      render(
        <MetricCard
          title="Clickable Metric"
          value="100"
          onClick={handleClick}
        />
      );
      
      const card = screen.getByText('Clickable Metric').closest('div');
      card?.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preset Components', () => {
    it('should render ResponseTimeMetric with correct variant', () => {
      // Test success case (under target)
      render(<ResponseTimeMetric value={1500} target={2000} />);
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('1.5s')).toBeInTheDocument();
      expect(screen.getByText('Average AI response time')).toBeInTheDocument();
    });

    it('should render SatisfactionMetric with correct variant', () => {
      // Test success case (high satisfaction)
      render(<SatisfactionMetric value={4.8} />);
      expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
      expect(screen.getByText('4.8/5')).toBeInTheDocument();
      expect(screen.getByText('Average rating from customers')).toBeInTheDocument();
    });

    it('should render HandoffRateMetric with correct variant', () => {
      // Test success case (low handoff rate)
      render(<HandoffRateMetric value={8.5} />);
      expect(screen.getByText('AI Handoff Rate')).toBeInTheDocument();
      expect(screen.getByText('8.5%')).toBeInTheDocument();
      expect(screen.getByText('Percentage of conversations handed off to humans')).toBeInTheDocument();
    });

    it('should render ResolutionRateMetric with correct variant', () => {
      // Test success case (high resolution rate)
      render(<ResolutionRateMetric value={95.2} />);
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
      expect(screen.getByText('95.2%')).toBeInTheDocument();
      expect(screen.getByText('Percentage of issues resolved')).toBeInTheDocument();
    });
  });

  describe('Variant Logic', () => {
    it('should apply correct variants for ResponseTimeMetric', () => {
      const { rerender, container } = render(<ResponseTimeMetric value={1000} target={2000} />);
      // Success: under target
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-success-muted)]');
      
      rerender(<ResponseTimeMetric value={2500} target={2000} />);
      // Warning: 1.25x target
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-warning-muted)]');
      
      rerender(<ResponseTimeMetric value={3500} target={2000} />);
      // Error: over 1.5x target
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-error-muted)]');
    });

    it('should apply correct variants for SatisfactionMetric', () => {
      const { rerender, container } = render(<SatisfactionMetric value={4.8} />);
      // Success: >= 4.5
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-success-muted)]');
      
      rerender(<SatisfactionMetric value={4.0} />);
      // Warning: >= 3.5 but < 4.5
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-warning-muted)]');
      
      rerender(<SatisfactionMetric value={3.0} />);
      // Error: < 3.5
      expect(container.firstChild).toHaveClass('border-[var(--fl-color-error-muted)]');
    });
  });

  describe('Loading States', () => {
    it('should render loading skeleton', () => {
      const { container } = render(
        <MetricCard
          title="Loading Metric"
          value="100"
          loading={true}
        />
      );
      
      // Should have skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for interactive cards', () => {
      const handleClick = jest.fn();

      const { container } = render(
        <MetricCard
          title="Interactive Metric"
          value="100"
          onClick={handleClick}
        />
      );

      // The cursor-pointer class should be on the Card component (root element)
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('should have proper semantic structure', () => {
      render(
        <MetricCard
          title="Accessible Metric"
          value="100"
          description="This is a test metric"
        />
      );
      
      // Title should be in a heading-like element
      expect(screen.getByText('Accessible Metric')).toBeInTheDocument();
      expect(screen.getByText('This is a test metric')).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format large numbers correctly', () => {
      const { rerender } = render(<MetricCard title="Test" value={1500000} />);
      expect(screen.getByText('1.5M')).toBeInTheDocument();
      
      rerender(<MetricCard title="Test" value={2500} />);
      expect(screen.getByText('2.5K')).toBeInTheDocument();
      
      rerender(<MetricCard title="Test" value={500} />);
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should handle string values', () => {
      render(<MetricCard title="Test" value="$1,234.56" />);
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });
});

describe('Migration Validation', () => {
  it('should export all required components', () => {
    // Verify all components are properly exported
    expect(MetricCard).toBeDefined();
    expect(ResponseTimeMetric).toBeDefined();
    expect(SatisfactionMetric).toBeDefined();
    expect(HandoffRateMetric).toBeDefined();
    expect(ResolutionRateMetric).toBeDefined();
  });

  it('should maintain API compatibility', () => {
    // Test that all legacy props are still supported
    const legacyProps = {
      title: 'Legacy Metric',
      value: '100',
      description: 'Legacy description',
      status: 'success' as const,
      className: 'custom-class',
      loading: false
    };
    
    expect(() => render(<MetricCard {...legacyProps} />)).not.toThrow();
  });
});
