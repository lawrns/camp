/**
 * QuickActionButton Migration Tests
 * 
 * Tests to ensure the migration from hardcoded colors to design tokens
 * maintains functionality while achieving 100% compliance.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { MessageCircle } from 'lucide-react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock gtag for analytics testing
declare global {
  interface Window {
    gtag: jest.Mock;
  }
}

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

describe('QuickActionButton Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock gtag
    Object.defineProperty(window, 'gtag', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for all variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
      
      variants.forEach(variant => {
        const { container } = render(
          <QuickActionButton
            title={`${variant} Action`}
            description="Test description"
            icon={MessageCircle}
            href="/test"
            variant={variant}
          />
        );
        
        expect(screen.getByText(`${variant} Action`)).toBeInTheDocument();
        
        // Should use design token classes
        const htmlContent = container.innerHTML;
        expect(htmlContent).toMatch(/var\(--fl-color-/);
      });
    });

    it('should not contain hardcoded color classes', () => {
      const { container } = render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          variant="primary"
        />
      );
      
      const htmlContent = container.innerHTML;
      
      // These should not be present after migration
      expect(htmlContent).not.toMatch(/bg-blue-50/);
      expect(htmlContent).not.toMatch(/text-blue-600/);
      expect(htmlContent).not.toMatch(/border-blue-200/);
      expect(htmlContent).not.toMatch(/from-blue-50/);
      expect(htmlContent).not.toMatch(/to-indigo-100/);
    });

    it('should support all size variants', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        render(
          <QuickActionButton
            title={`${size} Action`}
            description="Test description"
            icon={MessageCircle}
            href="/test"
            size={size}
          />
        );
        
        expect(screen.getByText(`${size} Action`)).toBeInTheDocument();
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should support legacy color prop', () => {
      const legacyColors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'] as const;
      
      legacyColors.forEach(color => {
        render(
          <QuickActionButton
            title={`${color} Action`}
            description="Test description"
            icon={MessageCircle}
            href="/test"
            color={color}
          />
        );
        
        expect(screen.getByText(`${color} Action`)).toBeInTheDocument();
      });
    });

    it('should map legacy colors to correct variants', () => {
      const colorMappings = [
        { color: 'blue' as const, expectedVariant: 'primary' },
        { color: 'green' as const, expectedVariant: 'success' },
        { color: 'purple' as const, expectedVariant: 'info' },
        { color: 'orange' as const, expectedVariant: 'warning' },
        { color: 'red' as const, expectedVariant: 'error' },
        { color: 'yellow' as const, expectedVariant: 'warning' },
      ];
      
      colorMappings.forEach(({ color, expectedVariant }) => {
        const { container } = render(
          <QuickActionButton
            title={`${color} Action`}
            description="Test description"
            icon={MessageCircle}
            href="/test"
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
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          variant="error"
          color="blue" // Should override variant
        />
      );
      
      // Should use primary styling (from color="blue") not error styling
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/--fl-color-primary/);
      expect(htmlContent).not.toMatch(/--fl-color-error/);
    });
  });

  describe('Functionality Preservation', () => {
    it('should handle click navigation', () => {
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/dashboard"
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle custom onClick', () => {
      const mockOnClick = jest.fn();
      
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/dashboard"
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled(); // Should not navigate when onClick is provided
    });

    it('should handle keyboard navigation', () => {
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/dashboard"
        />
      );
      
      const button = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      
      mockPush.mockClear();
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should display badge when provided', () => {
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          badge="New"
        />
      );
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should track analytics on click', () => {
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/dashboard"
          variant="primary"
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'quick_action_click', {
        action_title: 'Test Action',
        action_href: '/dashboard',
        action_variant: 'primary',
        legacy_color: undefined,
      });
    });

    it('should track legacy color usage in analytics', () => {
      render(
        <QuickActionButton
          title="Test Action"
          description="Test description"
          icon={MessageCircle}
          href="/dashboard"
          color="blue"
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'quick_action_click', {
        action_title: 'Test Action',
        action_href: '/dashboard',
        action_variant: 'primary',
        legacy_color: 'blue',
      });
    });
  });

  describe('Disabled State', () => {
    it('should handle disabled state correctly', () => {
      render(
        <QuickActionButton
          title="Disabled Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabIndex', '-1');
      
      // Should not navigate when disabled
      fireEvent.click(button);
      expect(mockPush).not.toHaveBeenCalled();
      
      // Should not respond to keyboard events when disabled
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should apply disabled styling', () => {
      const { container } = render(
        <QuickActionButton
          title="Disabled Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          disabled={true}
        />
      );
      
      expect(container.firstChild).toHaveClass('opacity-50');
      expect(container.firstChild).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <QuickActionButton
          title="Accessible Action"
          description="This is an accessible button"
          icon={MessageCircle}
          href="/test"
        />
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Accessible Action: This is an accessible button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper focus management', () => {
      const { container } = render(
        <QuickActionButton
          title="Focusable Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
        />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      // Should have focus ring styles
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('focus-within:ring-2');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <QuickActionButton
          title="Custom Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should support hover animations when not disabled', () => {
      const { container } = render(
        <QuickActionButton
          title="Animated Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
        />
      );
      
      expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
      expect(container.firstChild).toHaveClass('hover:scale-[1.02]');
    });

    it('should not have hover animations when disabled', () => {
      const { container } = render(
        <QuickActionButton
          title="Disabled Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          disabled={true}
        />
      );
      
      expect(container.firstChild).not.toHaveClass('hover:-translate-y-0.5');
      expect(container.firstChild).not.toHaveClass('hover:scale-[1.02]');
    });
  });

  describe('Migration Validation', () => {
    it('should achieve 100% design token compliance', () => {
      const { container } = render(
        <QuickActionButton
          title="Compliant Action"
          description="Test description"
          icon={MessageCircle}
          href="/test"
          variant="success"
        />
      );
      
      // Should render without errors
      expect(screen.getByText('Compliant Action')).toBeInTheDocument();
      
      // Should use design tokens consistently
      const htmlContent = container.innerHTML;
      expect(htmlContent).toMatch(/var\(--fl-color-/);
      expect(htmlContent).toMatch(/var\(--fl-spacing-/);
      expect(htmlContent).toMatch(/var\(--fl-radius-/);
      expect(htmlContent).toMatch(/var\(--fl-shadow-/);
    });
  });
});
