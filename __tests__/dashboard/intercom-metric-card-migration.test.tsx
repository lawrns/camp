/**
 * IntercomMetricCard Migration Tests
 * 
 * Tests to ensure the migration from hardcoded colors to design tokens
 * maintains functionality while achieving 100% compliance and preserving
 * Intercom-specific features like CountUpNumber animation and glass effects.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntercomMetricCard } from '@/components/dashboard/IntercomMetricCard';
import { MessageCircle } from 'lucide-react';

describe('IntercomMetricCard Migration', () => {
  describe('Design Token Compliance', () => {
    it('should use design tokens for all variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
      
      variants.forEach(variant => {
        const { container } = render(
          <IntercomMetricCard
            label={`${variant} Metric`}
            value={100}
            icon={MessageCircle}
            variant={variant}
          />
        );
        
        expect(screen.getByText(`${variant} Metric`)).toBeInTheDocument();
        
        // Should use design token classes
        const htmlContent = container.innerHTML;
        expect(htmlContent).toMatch(/var\(--fl-color-/);
        expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      });
    });

    it('should not contain hardcoded color classes', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Test Metric"
          value={100}
          icon={MessageCircle}
          variant="primary"
        />
      );
      
      const htmlContent = container.innerHTML;
      
      // These should not be present after migration
      expect(htmlContent).not.toMatch(/text-amber-600/);
      expect(htmlContent).not.toMatch(/bg-gradient-to-br from-amber-50/);
      expect(htmlContent).not.toMatch(/border-amber-200/);
      expect(htmlContent).not.toMatch(/glass-card metric-/);
    });

    it('should use design token-based glass effects', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Glass Effect Test"
          value={100}
          icon={MessageCircle}
          variant="success"
        />
      );
      
      const htmlContent = container.innerHTML;
      
      // Should use design token-based backdrop blur and surface colors
      expect(htmlContent).toMatch(/backdrop-blur-sm/);
      expect(htmlContent).toMatch(/var\(--fl-color-surface\)/);
      expect(htmlContent).not.toMatch(/glass-card/);
    });
  });

  describe('Backward Compatibility', () => {
    it('should support legacy color prop', () => {
      const legacyColors = ['warm', 'success', 'danger', 'info'] as const;
      
      legacyColors.forEach(color => {
        render(
          <IntercomMetricCard
            label={`${color} Metric`}
            value={100}
            icon={MessageCircle}
            color={color}
          />
        );
        
        expect(screen.getByText(`${color} Metric`)).toBeInTheDocument();
      });
    });

    it('should map legacy colors to correct variants', () => {
      const colorMappings = [
        { color: 'warm' as const, expectedVariant: 'warning' },
        { color: 'success' as const, expectedVariant: 'success' },
        { color: 'danger' as const, expectedVariant: 'error' },
        { color: 'info' as const, expectedVariant: 'info' },
      ];
      
      colorMappings.forEach(({ color, expectedVariant }) => {
        const { container } = render(
          <IntercomMetricCard
            label={`${color} Metric`}
            value={100}
            icon={MessageCircle}
            color={color}
          />
        );
        
        // Should apply the correct variant styling
        const htmlContent = container.innerHTML;
        expect(htmlContent).toMatch(new RegExp(`--fl-color-${expectedVariant}`));
      });
    });

    it('should prioritize color over variant when both are provided', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Priority Test"
          value={100}
          icon={MessageCircle}
          variant="error"
          color="success" // Should override variant
        />
      );
      
      // Should use success styling (from color="success") not error styling
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/--fl-color-success/);
      expect(htmlContent).not.toMatch(/--fl-color-error/);
    });
  });

  describe('Intercom-Specific Features', () => {
    it('should preserve CountUpNumber animation for numeric values', async () => {
      render(
        <IntercomMetricCard
          label="Animated Metric"
          value={1000}
          icon={MessageCircle}
          variant="primary"
        />
      );
      
      // Should start with 0 and animate to 1000
      expect(screen.getByText('Animated Metric')).toBeInTheDocument();
      
      // Wait for animation to complete
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle string values without animation', () => {
      render(
        <IntercomMetricCard
          label="String Metric"
          value="$1,500"
          icon={MessageCircle}
          variant="success"
        />
      );
      
      expect(screen.getByText('String Metric')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });

    it('should support suffix for numeric values', async () => {
      render(
        <IntercomMetricCard
          label="Suffix Metric"
          value={95}
          suffix="%"
          icon={MessageCircle}
          variant="info"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should display trend indicators correctly', () => {
      const trends = [
        { direction: 'up' as const, value: 12.5 },
        { direction: 'down' as const, value: -8.2 },
        { direction: 'stable' as const, value: 0 },
      ];
      
      trends.forEach(trend => {
        const { container } = render(
          <IntercomMetricCard
            label={`${trend.direction} Trend`}
            value={100}
            trend={trend}
            icon={MessageCircle}
            variant="default"
          />
        );
        
        expect(screen.getByText(`${trend.direction} Trend`)).toBeInTheDocument();
        
        if (trend.direction !== 'stable') {
          const expectedText = trend.value > 0 ? `+${trend.value.toFixed(1)}%` : `${trend.value.toFixed(1)}%`;
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Interactive Features', () => {
    it('should handle click events', () => {
      const mockOnClick = jest.fn();
      
      render(
        <IntercomMetricCard
          label="Clickable Metric"
          value={100}
          icon={MessageCircle}
          variant="primary"
          onClick={mockOnClick}
        />
      );
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility attributes when clickable', () => {
      render(
        <IntercomMetricCard
          label="Accessible Metric"
          value={100}
          icon={MessageCircle}
          variant="success"
          onClick={() => {}}
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should not have button role when not clickable', () => {
      render(
        <IntercomMetricCard
          label="Non-clickable Metric"
          value={100}
          icon={MessageCircle}
          variant="default"
        />
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle hover state changes', () => {
      render(
        <IntercomMetricCard
          label="Hoverable Metric"
          value={100}
          icon={MessageCircle}
          variant="warning"
        />
      );
      
      const container = screen.getByText('Hoverable Metric').closest('div');
      
      fireEvent.mouseEnter(container!);
      fireEvent.mouseLeave(container!);
      
      // Should not throw errors
      expect(screen.getByText('Hoverable Metric')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton with design tokens', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Loading Metric"
          value={100}
          icon={MessageCircle}
          variant="primary"
          loading={true}
        />
      );
      
      // Should show skeleton placeholders
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Should use design tokens for skeleton colors
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-background-muted\)/);
      expect(htmlContent).toMatch(/var\(--fl-color-surface\)/);
      expect(htmlContent).not.toMatch(/bg-gray-200/);
    });

    it('should not show content when loading', () => {
      render(
        <IntercomMetricCard
          label="Loading Test"
          value={100}
          icon={MessageCircle}
          variant="success"
          loading={true}
        />
      );
      
      // Should not show the actual label
      expect(screen.queryByText('Loading Test')).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Custom Styled"
          value={100}
          icon={MessageCircle}
          variant="info"
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should support hover animations when clickable', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Animated Metric"
          value={100}
          icon={MessageCircle}
          variant="primary"
          onClick={() => {}}
        />
      );
      
      expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
      expect(container.firstChild).toHaveClass('hover:scale-[1.02]');
    });

    it('should not have hover animations when not clickable', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Static Metric"
          value={100}
          icon={MessageCircle}
          variant="default"
        />
      );
      
      expect(container.firstChild).not.toHaveClass('hover:-translate-y-0.5');
      expect(container.firstChild).not.toHaveClass('hover:scale-[1.02]');
    });
  });

  describe('Migration Validation', () => {
    it('should achieve 100% design token compliance', () => {
      const { container } = render(
        <IntercomMetricCard
          label="Compliant Metric"
          value={100}
          icon={MessageCircle}
          variant="success"
        />
      );
      
      // Should render without errors
      expect(screen.getByText('Compliant Metric')).toBeInTheDocument();
      
      // Should use design tokens consistently
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);
      expect(htmlContent).toMatch(/var\(--fl-shadow-/);
    });

    it('should preserve all original functionality', () => {
      const mockOnClick = jest.fn();
      
      render(
        <IntercomMetricCard
          label="Full Feature Test"
          value={1500}
          suffix="ms"
          trend={{ value: 15.5, direction: 'up' }}
          icon={MessageCircle}
          variant="warning"
          onClick={mockOnClick}
          className="test-class"
        />
      );
      
      // All features should work
      expect(screen.getByText('Full Feature Test')).toBeInTheDocument();
      expect(screen.getByText('+15.5%')).toBeInTheDocument();
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});
