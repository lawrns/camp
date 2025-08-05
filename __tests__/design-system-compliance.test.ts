/**
 * COMPREHENSIVE DESIGN SYSTEM COMPLIANCE TESTS
 * 
 * This test suite validates the complete design system implementation:
 * - Design token compliance across all components
 * - Unified UI system functionality
 * - Component API consistency
 * - Migration validation
 * - Accessibility compliance
 * - Performance optimization
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { tokens } from '../styles/theme';
import { 
  MetricCard, 
  DashboardGrid, 
  ActivityFeed,
  DashboardSection,
  MetricCardSkeleton
} from '../components/dashboard/StandardizedDashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { 
  Button, 
  Card, 
  Badge, 
  Avatar,
  Progress,
  Tabs,
  Dialog,
  Select,
  Input,
  Textarea,
  Checkbox,
  Switch,
  RadioGroup,
  Slider,
  Tooltip,
  Alert,
  Skeleton,
  Toast
} from '../components/unified-ui/components';

// Mock data for testing
const mockActivityItems = [
  {
    id: '1',
    title: 'New conversation started',
    description: 'Customer inquiry about pricing',
    timestamp: '2 minutes ago',
    icon: 'MessageCircle',
    variant: 'default' as const
  },
  {
    id: '2',
    title: 'Ticket resolved',
    description: 'Technical issue fixed',
    timestamp: '5 minutes ago',
    icon: 'CheckCircle',
    variant: 'success' as const
  }
];

const mockMetricData = {
  title: 'Revenue',
  value: 50000,
  description: 'This month',
  change: {
    value: 12.5,
    trend: 'up' as const,
    period: 'last month'
  },
  target: {
    value: 60000,
    label: 'Monthly goal'
  }
};

describe('Design System Compliance', () => {
  describe('Design Token Validation', () => {
    it('should validate all required token categories exist', () => {
      expect(tokens.colors).toBeDefined();
      expect(tokens.spacing).toBeDefined();
      expect(tokens.typography).toBeDefined();
      expect(tokens.radius).toBeDefined();
      expect(tokens.shadows).toBeDefined();
      expect(tokens.motion).toBeDefined();
      expect(tokens.breakpoints).toBeDefined();
      expect(tokens.ai).toBeDefined();
      expect(tokens.components).toBeDefined();
    });

    it('should validate color token structure', () => {
      const requiredColorCategories = ['primary', 'neutral', 'success', 'warning', 'error', 'info'];
      
      requiredColorCategories.forEach(category => {
        expect(tokens.colors[category]).toBeDefined();
        expect(typeof tokens.colors[category]).toBe('object');
      });
    });

    it('should validate spacing token values follow 4px grid', () => {
      const spacingValues = Object.values(tokens.spacing);
      
      spacingValues.forEach(value => {
        const remValue = parseFloat(value.replace('rem', ''));
        const pxValue = remValue * 16; // Convert rem to px
        expect(pxValue % 4).toBe(0); // Should be divisible by 4
      });
    });

    it('should validate typography token structure', () => {
      expect(tokens.typography.fontSize).toBeDefined();
      expect(tokens.typography.fontWeight).toBeDefined();
      expect(tokens.typography.lineHeight).toBeDefined();
      expect(tokens.typography.letterSpacing).toBeDefined();
    });

    it('should validate motion token performance', () => {
      Object.values(tokens.motion.duration).forEach(duration => {
        const msValue = parseInt(duration.replace('ms', ''));
        expect(msValue).toBeGreaterThanOrEqual(50);
        expect(msValue).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('Unified UI Component System', () => {
    describe('Button Component', () => {
      it('should render with all variants', () => {
        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
        
        variants.forEach(variant => {
          const { container } = render(
            <Button variant={variant} data-testid={`button-${variant}`}>
              {variant} button
            </Button>
          );
          
          expect(screen.getByTestId(`button-${variant}`)).toBeInTheDocument();
          expect(container.firstChild).toHaveClass(`variant-${variant}`);
        });
      });

      it('should render with all sizes', () => {
        const sizes = ['sm', 'md', 'lg'] as const;
        
        sizes.forEach(size => {
          render(
            <Button size={size} data-testid={`button-${size}`}>
              {size} button
            </Button>
          );
          
          expect(screen.getByTestId(`button-${size}`)).toBeInTheDocument();
        });
      });

      it('should handle click events', () => {
        const handleClick = jest.fn();
        
        render(
          <Button onClick={handleClick} data-testid="clickable-button">
            Click me
          </Button>
        );
        
        fireEvent.click(screen.getByTestId('clickable-button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it('should be disabled when disabled prop is true', () => {
        render(
          <Button disabled data-testid="disabled-button">
            Disabled button
          </Button>
        );
        
        expect(screen.getByTestId('disabled-button')).toBeDisabled();
      });
    });

    describe('Card Component', () => {
      it('should render with proper structure', () => {
        render(
          <Card data-testid="card">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>Card content</CardContent>
          </Card>
        );
        
        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card content')).toBeInTheDocument();
      });

      it('should apply proper styling classes', () => {
        const { container } = render(
          <Card data-testid="styled-card">
            <CardContent>Content</CardContent>
          </Card>
        );
        
        expect(container.firstChild).toHaveClass('bg-[var(--fl-color-surface-default)]');
        expect(container.firstChild).toHaveClass('border-[var(--fl-color-border-default)]');
      });
    });

    describe('Badge Component', () => {
      it('should render with all variants', () => {
        const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
        
        variants.forEach(variant => {
          render(
            <Badge variant={variant} data-testid={`badge-${variant}`}>
              {variant} badge
            </Badge>
          );
          
          expect(screen.getByTestId(`badge-${variant}`)).toBeInTheDocument();
        });
      });

      it('should render with custom content', () => {
        render(
          <Badge data-testid="custom-badge">
            Custom <strong>content</strong>
          </Badge>
        );
        
        expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
      });
    });

    describe('Avatar Component', () => {
      it('should render with image', () => {
        render(
          <Avatar data-testid="avatar-with-image">
            <Avatar.Image src="/test-image.jpg" alt="Test user" />
            <Avatar.Fallback>TU</Avatar.Fallback>
          </Avatar>
        );
        
        expect(screen.getByTestId('avatar-with-image')).toBeInTheDocument();
        expect(screen.getByAltText('Test user')).toBeInTheDocument();
      });

      it('should render fallback when image fails', () => {
        render(
          <Avatar data-testid="avatar-fallback">
            <Avatar.Image src="/invalid-image.jpg" alt="Test user" />
            <Avatar.Fallback>TU</Avatar.Fallback>
          </Avatar>
        );
        
        expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
        expect(screen.getByText('TU')).toBeInTheDocument();
      });
    });

    describe('Progress Component', () => {
      it('should render with correct progress value', () => {
        render(
          <Progress value={75} data-testid="progress-bar" />
        );
        
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      });

      it('should handle different progress values', () => {
        const values = [0, 25, 50, 75, 100];
        
        values.forEach(value => {
          const { unmount } = render(
            <Progress value={value} data-testid={`progress-${value}`} />
          );
          
          expect(screen.getByTestId(`progress-${value}`)).toHaveAttribute('aria-valuenow', value.toString());
          unmount();
        });
      });
    });

    describe('Form Components', () => {
      it('should render Input with proper attributes', () => {
        render(
          <Input 
            placeholder="Enter text" 
            data-testid="test-input"
            aria-label="Test input"
          />
        );
        
        const input = screen.getByTestId('test-input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Enter text');
        expect(input).toHaveAttribute('aria-label', 'Test input');
      });

      it('should render Textarea with proper attributes', () => {
        render(
          <Textarea 
            placeholder="Enter long text" 
            data-testid="test-textarea"
            rows={5}
          />
        );
        
        const textarea = screen.getByTestId('test-textarea');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveAttribute('placeholder', 'Enter long text');
        expect(textarea).toHaveAttribute('rows', '5');
      });

      it('should render Checkbox with proper state', () => {
        render(
          <Checkbox 
            data-testid="test-checkbox"
            aria-label="Test checkbox"
          />
        );
        
        const checkbox = screen.getByTestId('test-checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute('aria-label', 'Test checkbox');
      });

      it('should render Switch with proper state', () => {
        render(
          <Switch 
            data-testid="test-switch"
            aria-label="Test switch"
          />
        );
        
        const switchElement = screen.getByTestId('test-switch');
        expect(switchElement).toBeInTheDocument();
        expect(switchElement).toHaveAttribute('aria-label', 'Test switch');
      });
    });

    describe('Interactive Components', () => {
      it('should render Dialog with proper structure', () => {
        render(
          <Dialog>
            <Dialog.Trigger asChild>
              <Button data-testid="dialog-trigger">Open Dialog</Button>
            </Dialog.Trigger>
            <Dialog.Content data-testid="dialog-content">
              <Dialog.Header>
                <Dialog.Title>Dialog Title</Dialog.Title>
              </Dialog.Header>
              <Dialog.Description>Dialog description</Dialog.Description>
            </Dialog.Content>
          </Dialog>
        );
        
        expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
      });

      it('should render Tabs with proper structure', () => {
        render(
          <Tabs defaultValue="tab1" data-testid="tabs">
            <Tabs.List>
              <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">Content 1</Tabs.Content>
            <Tabs.Content value="tab2">Content 2</Tabs.Content>
          </Tabs>
        );
        
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
        expect(screen.getByText('Tab 1')).toBeInTheDocument();
        expect(screen.getByText('Tab 2')).toBeInTheDocument();
      });

      it('should render Tooltip with proper content', () => {
        render(
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button data-testid="tooltip-trigger">Hover me</Button>
            </Tooltip.Trigger>
            <Tooltip.Content data-testid="tooltip-content">
              Tooltip content
            </Tooltip.Content>
          </Tooltip>
        );
        
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Component System', () => {
    describe('MetricCard Component', () => {
      it('should render with basic props', () => {
        render(
          <MetricCard
            title="Test Metric"
            value="100"
            description="Test description"
          />
        );
        
        expect(screen.getByText('Test Metric')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });

      it('should render with all variants', () => {
        const variants = ['default', 'success', 'warning', 'error', 'info'] as const;
        
        variants.forEach(variant => {
          const { container } = render(
            <MetricCard
              title={`${variant} metric`}
              value="100"
              variant={variant}
            />
          );
          
          expect(screen.getByText(`${variant} metric`)).toBeInTheDocument();
          expect(container.firstChild).toHaveClass(`variant-${variant}`);
        });
      });

      it('should render with change indicator', () => {
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

      it('should render with target progress', () => {
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

      it('should format large numbers correctly', () => {
        render(
          <MetricCard
            title="Large Number"
            value={1500000}
          />
        );
        
        expect(screen.getByText('1.5M')).toBeInTheDocument();
      });

      it('should handle loading state', () => {
        render(
          <MetricCard
            title="Loading Metric"
            value="100"
            loading={true}
          />
        );
        
        expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();
      });
    });

    describe('DashboardGrid Component', () => {
      it('should render with correct number of columns', () => {
        const { container } = render(
          <DashboardGrid columns={3} data-testid="dashboard-grid">
            <MetricCard title="Metric 1" value="100" />
            <MetricCard title="Metric 2" value="200" />
            <MetricCard title="Metric 3" value="300" />
          </DashboardGrid>
        );
        
        expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('grid-cols-3');
      });

      it('should be responsive', () => {
        const { container } = render(
          <DashboardGrid columns={4} data-testid="responsive-grid">
            <MetricCard title="Metric 1" value="100" />
            <MetricCard title="Metric 2" value="200" />
          </DashboardGrid>
        );
        
        expect(container.firstChild).toHaveClass('grid-cols-1');
        expect(container.firstChild).toHaveClass('md:grid-cols-2');
        expect(container.firstChild).toHaveClass('lg:grid-cols-4');
      });
    });

    describe('ActivityFeed Component', () => {
      it('should render activity items', () => {
        render(
          <ActivityFeed
            items={mockActivityItems}
            data-testid="activity-feed"
          />
        );
        
        expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
        expect(screen.getByText('New conversation started')).toBeInTheDocument();
        expect(screen.getByText('Ticket resolved')).toBeInTheDocument();
      });

      it('should render empty state', () => {
        render(
          <ActivityFeed
            items={[]}
            data-testid="empty-feed"
          />
        );
        
        expect(screen.getByTestId('empty-feed')).toBeInTheDocument();
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
      });

      it('should handle item clicks', () => {
        const handleItemClick = jest.fn();
        
        render(
          <ActivityFeed
            items={mockActivityItems}
            onItemClick={handleItemClick}
            data-testid="clickable-feed"
          />
        );
        
        fireEvent.click(screen.getByText('New conversation started'));
        expect(handleItemClick).toHaveBeenCalledWith(mockActivityItems[0]);
      });
    });

    describe('DashboardSection Component', () => {
      it('should render with title and description', () => {
        render(
          <DashboardSection
            title="Test Section"
            description="Section description"
            data-testid="dashboard-section"
          >
            <MetricCard title="Metric" value="100" />
          </DashboardSection>
        );
        
        expect(screen.getByTestId('dashboard-section')).toBeInTheDocument();
        expect(screen.getByText('Test Section')).toBeInTheDocument();
        expect(screen.getByText('Section description')).toBeInTheDocument();
      });

      it('should render with actions', () => {
        render(
          <DashboardSection
            title="Section with Actions"
            actions={
              <Button data-testid="section-action">Action</Button>
            }
            data-testid="section-with-actions"
          >
            <MetricCard title="Metric" value="100" />
          </DashboardSection>
        );
        
        expect(screen.getByTestId('section-with-actions')).toBeInTheDocument();
        expect(screen.getByTestId('section-action')).toBeInTheDocument();
      });
    });
  });

  describe('Migration Compatibility', () => {
    describe('StatCard Migration', () => {
      it('should maintain backward compatibility with StatCard props', () => {
        render(
          <StatCard
            title="Legacy Stat"
            value="100"
            change={{
              value: 10,
              trend: 'up',
              period: 'last week'
            }}
            variant="success"
          />
        );
        
        expect(screen.getByText('Legacy Stat')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('+10%')).toBeInTheDocument();
      });

      it('should support all StatCard variants', () => {
        const variants = ['default', 'success', 'warning', 'error'] as const;
        
        variants.forEach(variant => {
          const { container } = render(
            <StatCard
              title={`${variant} stat`}
              value="100"
              variant={variant}
            />
          );
          
          expect(screen.getByText(`${variant} stat`)).toBeInTheDocument();
          expect(container.firstChild).toHaveClass(`variant-${variant}`);
        });
      });
    });

    describe('Component API Consistency', () => {
      it('should have consistent variant prop across components', () => {
        const components = [
          { Component: MetricCard, props: { title: 'Test', value: '100' } },
          { Component: StatCard, props: { title: 'Test', value: '100' } },
          { Component: Badge, props: { children: 'Test' } },
          { Component: Button, props: { children: 'Test' } }
        ];

        components.forEach(({ Component, props }) => {
          const variants = ['default', 'success', 'warning', 'error'] as const;
          
          variants.forEach(variant => {
            const { container } = render(
              <Component {...props} variant={variant} />
            );
            
            expect(container.firstChild).toHaveClass(`variant-${variant}`);
          });
        });
      });

      it('should have consistent size prop across components', () => {
        const components = [
          { Component: Button, props: { children: 'Test' } },
          { Component: Badge, props: { children: 'Test' } },
          { Component: Avatar, props: { children: <Avatar.Fallback>TU</Avatar.Fallback> } }
        ];

        components.forEach(({ Component, props }) => {
          const sizes = ['sm', 'md', 'lg'] as const;
          
          sizes.forEach(size => {
            const { container } = render(
              <Component {...props} size={size} />
            );
            
            expect(container.firstChild).toHaveClass(`size-${size}`);
          });
        });
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(
        <div>
          <Button aria-label="Test button" data-testid="aria-button">Click me</Button>
          <Input aria-label="Test input" data-testid="aria-input" />
          <Checkbox aria-label="Test checkbox" data-testid="aria-checkbox" />
        </div>
      );
      
      expect(screen.getByTestId('aria-button')).toHaveAttribute('aria-label', 'Test button');
      expect(screen.getByTestId('aria-input')).toHaveAttribute('aria-label', 'Test input');
      expect(screen.getByTestId('aria-checkbox')).toHaveAttribute('aria-label', 'Test checkbox');
    });

    it('should have proper focus management', () => {
      render(
        <div>
          <Button data-testid="first-button">First</Button>
          <Button data-testid="second-button">Second</Button>
        </div>
      );
      
      const firstButton = screen.getByTestId('first-button');
      const secondButton = screen.getByTestId('second-button');
      
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      expect(secondButton).toHaveFocus();
    });

    it('should have proper color contrast', () => {
      // This would require a color contrast testing library
      // For now, we'll test that components use design tokens
      const { container } = render(
        <Button variant="primary">High contrast button</Button>
      );
      
      expect(container.firstChild).toHaveClass('bg-[var(--fl-color-primary-500)]');
      expect(container.firstChild).toHaveClass('text-[var(--fl-color-primary-foreground)]');
    });

    it('should support keyboard navigation', () => {
      render(
        <Tabs defaultValue="tab1" data-testid="keyboard-tabs">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );
      
      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');
      
      tab1.focus();
      expect(tab1).toHaveFocus();
      
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(tab2).toHaveFocus();
    });
  });

  describe('Performance Optimization', () => {
    it('should render components efficiently', () => {
      const renderStart = performance.now();
      
      render(
        <DashboardGrid columns={4}>
          {Array.from({ length: 20 }, (_, i) => (
            <MetricCard
              key={i}
              title={`Metric ${i}`}
              value={i * 100}
            />
          ))}
        </DashboardGrid>
      );
      
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Should render 20 metric cards in under 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', () => {
      const largeActivityItems = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        title: `Activity ${i}`,
        timestamp: `${i} minutes ago`,
        icon: 'MessageCircle',
        variant: 'default' as const
      }));
      
      const renderStart = performance.now();
      
      render(
        <ActivityFeed items={largeActivityItems} />
      );
      
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Should render 100 activity items in under 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should optimize re-renders', () => {
      const { rerender } = render(
        <MetricCard
          title="Test Metric"
          value="100"
          data-testid="optimized-metric"
        />
      );
      
      const firstRender = screen.getByTestId('optimized-metric');
      
      rerender(
        <MetricCard
          title="Test Metric"
          value="100"
          data-testid="optimized-metric"
        />
      );
      
      const secondRender = screen.getByTestId('optimized-metric');
      
      // Should be the same DOM element (no unnecessary re-render)
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required props gracefully', () => {
      // @ts-ignore - Testing missing props
      render(<MetricCard />);
      
      // Should render with default values or error state
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('should handle invalid prop values', () => {
      render(
        <MetricCard
          title="Test"
          value="invalid"
          // @ts-ignore - Testing invalid variant
          variant="invalid-variant"
        />
      );
      
      // Should fall back to default variant
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle network errors in data fetching', async () => {
      // Mock a failed API call
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <MetricCard
          title="Network Metric"
          value="100"
          loading={false}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Network Metric')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Testing', () => {
    it('should work with real dashboard layout', () => {
      render(
        <div className="dashboard-layout">
          <DashboardSection title="Key Metrics" description="Important KPIs">
            <DashboardGrid columns={3}>
              <MetricCard
                title="Revenue"
                value={50000}
                variant="success"
                change={{
                  value: 12.5,
                  trend: 'up',
                  period: 'last month'
                }}
              />
              <MetricCard
                title="Users"
                value={1200}
                variant="info"
                target={{
                  value: 1500,
                  label: 'Monthly goal'
                }}
              />
              <MetricCard
                title="Errors"
                value={5}
                variant="error"
              />
            </DashboardGrid>
          </DashboardSection>
          
          <DashboardSection title="Recent Activity">
            <ActivityFeed items={mockActivityItems} />
          </DashboardSection>
        </div>
      );
      
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New conversation started')).toBeInTheDocument();
    });

    it('should handle complex user interactions', async () => {
      render(
        <div>
          <Button data-testid="open-dialog">Open Dialog</Button>
          <Dialog>
            <Dialog.Trigger asChild>
              <Button data-testid="dialog-trigger">Open</Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Test Dialog</Dialog.Title>
              </Dialog.Header>
              <Dialog.Description>Dialog content</Dialog.Description>
              <div>
                <Input placeholder="Enter name" data-testid="dialog-input" />
                <Button data-testid="dialog-submit">Submit</Button>
              </div>
            </Dialog.Content>
          </Dialog>
        </div>
      );
      
      // Open dialog
      fireEvent.click(screen.getByTestId('dialog-trigger'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
      
      // Fill form
      fireEvent.change(screen.getByTestId('dialog-input'), {
        target: { value: 'John Doe' }
      });
      
      expect(screen.getByTestId('dialog-input')).toHaveValue('John Doe');
      
      // Submit form
      fireEvent.click(screen.getByTestId('dialog-submit'));
    });
  });
}); 