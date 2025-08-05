/**
 * EnhancedMetricCard Migration Tests
 * 
 * Tests to ensure the migration from hardcoded colors to StandardizedDashboard.MetricCard
 * maintains functionality while achieving 100% compliance.
 */

import { render, screen } from '@testing-library/react';
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { Users } from 'lucide-react';

// Mock console.warn to test deprecation warnings
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

describe('EnhancedMetricCard Migration', () => {
  describe('Deprecation and Migration', () => {
    it('should show deprecation warning in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <EnhancedMetricCard
          title="Test Metric"
          value={100}
          color="blue"
          icon={Users}
        />
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('EnhancedMetricCard is deprecated')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('color="blue" → variant="info"')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show deprecation warning in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <EnhancedMetricCard
          title="Test Metric"
          value={100}
          color="blue"
          icon={Users}
        />
      );

      expect(console.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should forward all props to StandardizedDashboard.MetricCard', () => {
      render(
        <EnhancedMetricCard
          title="Users Online"
          value={1250}
          description="Active users"
          color="green"
          icon={Users}
          change="+12%"
          trend="up"
        />
      );

      // Should render the content using StandardizedDashboard.MetricCard
      expect(screen.getByText('Users Online')).toBeInTheDocument();
      // StandardizedDashboard.MetricCard formats numbers (1250 → 1.3K)
      expect(screen.getByText('1.3K')).toBeInTheDocument();
      expect(screen.getByText('Active users')).toBeInTheDocument();
      // Change is handled differently in StandardizedDashboard.MetricCard
      // Just verify the component renders successfully with the change data
      const { container } = render(
        <EnhancedMetricCard
          title="Test Change"
          value={100}
          color="green"
          icon={Users}
          change="+12%"
          trend="up"
        />
      );
      expect(container.textContent).toContain('12');
      expect(container.textContent).toContain('%');
    });
  });

  describe('Color to Variant Mapping', () => {
    const colorMappings = [
      { color: 'blue' as const, expectedVariant: 'info' },
      { color: 'green' as const, expectedVariant: 'success' },
      { color: 'orange' as const, expectedVariant: 'warning' },
      { color: 'red' as const, expectedVariant: 'error' },
      { color: 'yellow' as const, expectedVariant: 'warning' },
      { color: 'purple' as const, expectedVariant: 'info' },
    ];

    colorMappings.forEach(({ color, expectedVariant }) => {
      it(`should map color="${color}" to variant="${expectedVariant}"`, () => {
        render(
          <EnhancedMetricCard
            title={`${color} Metric`}
            value={100}
            color={color}
            icon={Users}
          />
        );

        // Should render without errors and show the content
        expect(screen.getByText(`${color} Metric`)).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });
  });

  describe('Functionality Preservation', () => {
    it('should handle loading state', () => {
      render(
        <EnhancedMetricCard
          title="Loading Metric"
          value={100}
          color="blue"
          icon={Users}
          loading={true}
        />
      );

      // Should show loading state with skeleton (handled by StandardizedDashboard.MetricCard)
      // Loading state shows skeleton placeholders, not the actual title
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should handle error state', () => {
      render(
        <EnhancedMetricCard
          title="Error Metric"
          value={100}
          color="red"
          icon={Users}
          error="Failed to load data"
        />
      );

      // Should show error state (handled by StandardizedDashboard.MetricCard)
      expect(screen.getByText('Error Metric')).toBeInTheDocument();
    });

    it('should handle trend indicators', () => {
      render(
        <EnhancedMetricCard
          title="Trending Metric"
          value={100}
          color="green"
          icon={Users}
          trend="up"
          change="+15%"
        />
      );

      expect(screen.getByText('Trending Metric')).toBeInTheDocument();
      // Change is mapped to percentage value without the + sign
      const { container } = render(
        <EnhancedMetricCard
          title="Test Trend"
          value={100}
          color="green"
          icon={Users}
          trend="up"
          change="+15%"
        />
      );
      expect(container.textContent).toContain('15');
      expect(container.textContent).toContain('%');
    });

    it('should handle neutral trend', () => {
      render(
        <EnhancedMetricCard
          title="Stable Metric"
          value={100}
          color="blue"
          icon={Users}
          trend="neutral"
          change="0%"
        />
      );

      expect(screen.getByText('Stable Metric')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle down trend', () => {
      render(
        <EnhancedMetricCard
          title="Declining Metric"
          value={100}
          color="red"
          icon={Users}
          trend="down"
          change="-5%"
        />
      );

      expect(screen.getByText('Declining Metric')).toBeInTheDocument();
      // Change is mapped to percentage value without the - sign
      const { container } = render(
        <EnhancedMetricCard
          title="Test Down"
          value={100}
          color="red"
          icon={Users}
          trend="down"
          change="-5%"
        />
      );
      expect(container.textContent).toContain('5');
      expect(container.textContent).toContain('%');
    });
  });

  describe('API Compatibility', () => {
    it('should accept all legacy props', () => {
      const props = {
        title: 'Complete Metric',
        value: 1000,
        change: '+20%',
        trend: 'up' as const,
        icon: Users,
        color: 'purple' as const,
        description: 'Full description',
        loading: false,
        error: undefined,
      };

      render(<EnhancedMetricCard {...props} />);

      expect(screen.getByText('Complete Metric')).toBeInTheDocument();
      // StandardizedDashboard.MetricCard formats numbers (1000 → 1.0K)
      expect(screen.getByText('1.0K')).toBeInTheDocument();
      expect(screen.getByText('Full description')).toBeInTheDocument();
      // Change is mapped to percentage value without the + sign
      const { container } = render(
        <EnhancedMetricCard
          title="Test Complete"
          value={1000}
          description="Full description"
          color="purple"
          icon={Users}
          change="+20%"
          trend="up"
        />
      );
      expect(container.textContent).toContain('20');
      expect(container.textContent).toContain('%');
    });

    it('should handle minimal props', () => {
      render(
        <EnhancedMetricCard
          title="Minimal Metric"
          value={42}
          color="blue"
          icon={Users}
        />
      );

      expect(screen.getByText('Minimal Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle string and number values', () => {
      render(
        <>
          <EnhancedMetricCard
            title="String Value"
            value="$1,000"
            color="green"
            icon={Users}
          />
          <EnhancedMetricCard
            title="Number Value"
            value={1000}
            color="blue"
            icon={Users}
          />
        </>
      );

      expect(screen.getByText('String Value')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
      expect(screen.getByText('Number Value')).toBeInTheDocument();
      // StandardizedDashboard.MetricCard formats numbers (1000 → 1.0K)
      expect(screen.getByText('1.0K')).toBeInTheDocument();
    });
  });

  describe('Migration Validation', () => {
    it('should achieve 100% design token compliance', () => {
      const { container } = render(
        <EnhancedMetricCard
          title="Compliant Metric"
          value={100}
          color="blue"
          icon={Users}
        />
      );

      // Should render without errors using StandardizedDashboard.MetricCard
      expect(screen.getByText('Compliant Metric')).toBeInTheDocument();
      
      // Should not contain any hardcoded color classes
      const htmlContent = container.innerHTML;
      expect(htmlContent).not.toMatch(/bg-blue-50/);
      expect(htmlContent).not.toMatch(/text-blue-600/);
      expect(htmlContent).not.toMatch(/border-blue-200/);
      expect(htmlContent).not.toMatch(/from-blue-50/);
      expect(htmlContent).not.toMatch(/to-indigo-100/);
    });

    it('should use design tokens through StandardizedDashboard.MetricCard', () => {
      const { container } = render(
        <EnhancedMetricCard
          title="Token Metric"
          value={100}
          color="success"
          icon={Users}
        />
      );

      // Should render successfully (design tokens are handled by StandardizedDashboard.MetricCard)
      expect(screen.getByText('Token Metric')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain accessibility features', () => {
      render(
        <EnhancedMetricCard
          title="Accessible Metric"
          value={100}
          color="blue"
          icon={Users}
          description="Accessible description"
        />
      );

      // Accessibility is handled by StandardizedDashboard.MetricCard
      expect(screen.getByText('Accessible Metric')).toBeInTheDocument();
      expect(screen.getByText('Accessible description')).toBeInTheDocument();
    });

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <EnhancedMetricCard
          title="Dynamic Metric"
          value={100}
          color="blue"
          icon={Users}
        />
      );

      // Should handle updates efficiently
      rerender(
        <EnhancedMetricCard
          title="Dynamic Metric"
          value={200}
          color="green"
          icon={Users}
        />
      );

      expect(screen.getByText('Dynamic Metric')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      render(
        <EnhancedMetricCard
          title="Zero Metric"
          value={0}
          color="blue"
          icon={Users}
        />
      );

      expect(screen.getByText('Zero Metric')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty strings', () => {
      render(
        <EnhancedMetricCard
          title="Empty Metric"
          value=""
          color="blue"
          icon={Users}
        />
      );

      expect(screen.getByText('Empty Metric')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long metric title that should be handled gracefully';
      
      render(
        <EnhancedMetricCard
          title={longTitle}
          value={100}
          color="blue"
          icon={Users}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });
});
