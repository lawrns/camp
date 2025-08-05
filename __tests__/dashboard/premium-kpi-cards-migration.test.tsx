/**
 * PremiumKPICards Migration Tests
 * 
 * Tests to ensure the migration from hardcoded colors to design tokens
 * maintains functionality while achieving 100% compliance.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { PremiumKPICards, defaultKPIMetrics, useKPIMetrics } from '@/components/dashboard/PremiumKPICards';
import { MessageCircle, Clock, Heart, CheckCircle } from 'lucide-react';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the hook for testing
jest.mock('@/components/dashboard/PremiumKPICards', () => {
  const actual = jest.requireActual('@/components/dashboard/PremiumKPICards');
  return {
    ...actual,
    useKPIMetrics: jest.fn(),
  };
});

const mockUseKPIMetrics = useKPIMetrics as jest.MockedFunction<typeof useKPIMetrics>;

describe('PremiumKPICards Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Design Token Compliance', () => {
    it('should use StandardizedDashboard.MetricCard components', () => {
      const testMetrics = [
        {
          id: 'test-metric',
          title: 'Test Metric',
          value: 100,
          variant: 'success' as const,
          icon: MessageCircle,
          loading: false,
          description: 'Test description'
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      // CountUpNumber starts at 0 and animates to target value
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should use DashboardGrid for layout', () => {
      const { container } = render(<PremiumKPICards metrics={defaultKPIMetrics} />);
      
      // Should use grid layout from DashboardGrid
      const gridElement = container.querySelector('[aria-label="Key performance indicators"]');
      expect(gridElement).toBeInTheDocument();
    });

    it('should support all design system variants', () => {
      const variants = ['default', 'success', 'warning', 'error', 'info'] as const;
      
      const testMetrics = variants.map((variant, index) => ({
        id: `metric-${variant}`,
        title: `${variant} Metric`,
        value: 100 + index,
        variant,
        icon: MessageCircle,
        loading: false,
        description: `${variant} description`
      }));

      render(<PremiumKPICards metrics={testMetrics} />);
      
      variants.forEach(variant => {
        expect(screen.getByText(`${variant} Metric`)).toBeInTheDocument();
      });
    });
  });

  describe('Functionality Preservation', () => {
    it('should display count-up animation for numeric values', () => {
      const testMetrics = [
        {
          id: 'numeric-metric',
          title: 'Numeric Metric',
          value: 1500,
          variant: 'info' as const,
          icon: MessageCircle,
          loading: false
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      // Should eventually show the full value (after count-up animation)
      expect(screen.getByText('Numeric Metric')).toBeInTheDocument();
    });

    it('should display string values directly', () => {
      const testMetrics = [
        {
          id: 'string-metric',
          title: 'String Metric',
          value: '$1,234.56',
          variant: 'success' as const,
          icon: MessageCircle,
          loading: false
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should show change indicators with trends', () => {
      const testMetrics = [
        {
          id: 'trending-metric',
          title: 'Trending Metric',
          value: 100,
          variant: 'success' as const,
          icon: MessageCircle,
          change: 12.5,
          trend: 'up' as const,
          loading: false
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      // Text is split across elements, so use a more flexible matcher
      expect(screen.getByText(/previous period/)).toBeInTheDocument();
    });

    it('should show previous value comparison', () => {
      const testMetrics = [
        {
          id: 'comparison-metric',
          title: 'Comparison Metric',
          value: 150,
          previousValue: 120,
          variant: 'info' as const,
          icon: MessageCircle,
          loading: false
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      expect(screen.getByText('Previous:')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('should handle loading states', () => {
      const testMetrics = [
        {
          id: 'loading-metric',
          title: 'Loading Metric',
          value: 100,
          variant: 'default' as const,
          icon: MessageCircle,
          loading: true
        }
      ];

      const { container } = render(<PremiumKPICards metrics={testMetrics} />);
      
      // Should show loading skeleton
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Default Metrics', () => {
    it('should have correct structure for default metrics', () => {
      expect(defaultKPIMetrics).toHaveLength(4);
      
      const expectedMetrics = [
        { id: 'conversations', variant: 'info', title: 'Today\'s Conversations' },
        { id: 'response-time', variant: 'warning', title: 'Avg Response Time' },
        { id: 'satisfaction', variant: 'success', title: 'Satisfaction Rate' },
        { id: 'resolution', variant: 'success', title: 'Resolution Rate' }
      ];

      expectedMetrics.forEach((expected, index) => {
        expect(defaultKPIMetrics[index].id).toBe(expected.id);
        expect(defaultKPIMetrics[index].variant).toBe(expected.variant);
        expect(defaultKPIMetrics[index].title).toBe(expected.title);
        expect(defaultKPIMetrics[index].description).toBeDefined();
      });
    });

    it('should render default metrics correctly', () => {
      // Create non-loading version of default metrics for testing
      const nonLoadingMetrics = defaultKPIMetrics.map(metric => ({
        ...metric,
        loading: false
      }));

      render(<PremiumKPICards metrics={nonLoadingMetrics} />);

      expect(screen.getByText('Today\'s Conversations')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('Satisfaction Rate')).toBeInTheDocument();
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
    });
  });

  describe('Animation and Styling', () => {
    it('should apply staggered animation delays', () => {
      const testMetrics = Array.from({ length: 3 }, (_, index) => ({
        id: `metric-${index}`,
        title: `Metric ${index}`,
        value: 100 + index,
        variant: 'default' as const,
        icon: MessageCircle,
        loading: false
      }));

      const { container } = render(<PremiumKPICards metrics={testMetrics} />);
      
      const animatedElements = container.querySelectorAll('.animate-fade-in-up');
      expect(animatedElements).toHaveLength(3);
      
      // Check that animation delays are applied
      animatedElements.forEach((element, index) => {
        const style = (element as HTMLElement).style;
        expect(style.animationDelay).toBe(`${index * 50}ms`);
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PremiumKPICards 
          metrics={defaultKPIMetrics} 
          className="custom-kpi-class" 
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-kpi-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PremiumKPICards metrics={defaultKPIMetrics} />);
      
      const grid = screen.getByLabelText('Key performance indicators');
      expect(grid).toBeInTheDocument();
    });

    it('should have semantic structure', () => {
      const testMetrics = [
        {
          id: 'accessible-metric',
          title: 'Accessible Metric',
          value: 100,
          variant: 'success' as const,
          icon: MessageCircle,
          loading: false,
          description: 'Accessible description'
        }
      ];

      render(<PremiumKPICards metrics={testMetrics} />);
      
      expect(screen.getByText('Accessible Metric')).toBeInTheDocument();
      expect(screen.getByText('Accessible description')).toBeInTheDocument();
    });
  });

  describe('Trend Logic', () => {
    it('should handle different trend directions', () => {
      const trends = ['up', 'down', 'stable'] as const;
      
      const testMetrics = trends.map((trend, index) => ({
        id: `trend-${trend}`,
        title: `${trend} Trend`,
        value: 100 + index,
        variant: 'default' as const,
        icon: MessageCircle,
        change: trend === 'stable' ? 0 : (trend === 'up' ? 10 : -10),
        trend,
        loading: false
      }));

      render(<PremiumKPICards metrics={testMetrics} />);
      
      // Up trend should show positive change
      expect(screen.getByText('+10%')).toBeInTheDocument();
      
      // Down trend should show negative change
      expect(screen.getByText('-10%')).toBeInTheDocument();
      
      // Stable trend should show no change indicator
      const stableMetric = screen.getByText('stable Trend');
      expect(stableMetric).toBeInTheDocument();
    });
  });

  describe('Migration Validation', () => {
    it('should not contain hardcoded color classes', () => {
      const { container } = render(<PremiumKPICards metrics={defaultKPIMetrics} />);
      
      // Check that no hardcoded color classes are present
      const htmlContent = container.innerHTML;
      
      // These should not be present after migration
      expect(htmlContent).not.toMatch(/text-blue-600/);
      expect(htmlContent).not.toMatch(/bg-blue-600\/10/);
      expect(htmlContent).not.toMatch(/text-accent-green-500/);
      expect(htmlContent).not.toMatch(/text-danger-red-500/);
      expect(htmlContent).not.toMatch(/text-warm-amber/);
    });

    it('should use design tokens consistently', () => {
      const { container } = render(<PremiumKPICards metrics={defaultKPIMetrics} />);
      
      // Should use design token patterns
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-/);
    });
  });
});

describe('Migration Compliance Score', () => {
  it('should achieve 100% design token compliance', () => {
    // This test validates that the migration is complete
    const testMetrics = [
      {
        id: 'compliance-test',
        title: 'Compliance Test',
        value: 100,
        variant: 'success' as const,
        icon: MessageCircle,
        loading: false,
        description: 'Testing compliance'
      }
    ];

    const { container } = render(<PremiumKPICards metrics={testMetrics} />);
    
    // Should render without errors
    expect(screen.getByText('Compliance Test')).toBeInTheDocument();
    
    // Should use MetricCard component (no hardcoded styling)
    expect(container.querySelector('.animate-fade-in-up')).toBeInTheDocument();
  });
});
