# Campfire V2 Testing Strategy - Design Consistency & Layout Stability

> **MANDATORY**: This strategy ensures zero layout breaks and unbreakable design consistency.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Categories](#test-categories)
3. [Design Token Enforcement](#design-token-enforcement)
4. [Layout Stability Testing](#layout-stability-testing)
5. [Bidirectional Communication Testing](#bidirectional-communication-testing)
6. [Testing Workflow](#testing-workflow)
7. [Failure Analysis](#failure-analysis)
8. [Performance Monitoring](#performance-monitoring)

## Testing Philosophy

### Core Principles

1. **Design Tokens as Law**: All styling must use centralized design tokens
2. **Zero Layout Breaks**: No component should cause layout shifts
3. **Bidirectional Reliability**: Real-time communication must be bulletproof
4. **Performance First**: All interactions must be <50ms
5. **Accessibility Mandatory**: WCAG 2.2 AA compliance required

### Testing Hierarchy

```
Unit Tests (Fastest) → Integration Tests → E2E Tests (Most Comprehensive)
     ↓                        ↓                    ↓
Design Tokens → Component Behavior → Full User Flows
```

## Test Categories

### 1. Design Token Compliance Tests

**Purpose**: Enforce design system as the rule of law

```typescript
// __tests__/design-token-compliance.test.ts
describe('Design Token System', () => {
  it('should validate all design tokens are accessible', () => {
    expect(tokens).toBeDefined();
    expect(tokens.colors).toBeDefined();
    expect(tokens.spacing).toBeDefined();
  });

  it('should enforce 8px grid system', () => {
    expect(tokens.spacing[1]).toBe('0.25rem'); // 4px
    expect(tokens.spacing[2]).toBe('0.5rem');  // 8px
    expect(tokens.spacing[4]).toBe('1rem');    // 16px
  });
});
```

### 2. Component Unit Tests

**Purpose**: Test individual components with design token compliance

```typescript
// __tests__/components/Button.test.tsx
describe('Button Component', () => {
  it('should use design tokens for styling', () => {
    render(<Button variant="primary" size="md">Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500', 'text-white', 'h-10', 'px-4');
    
    // Should NOT have hardcoded values
    expect(button.className).not.toMatch(/bg-blue-500/);
    expect(button.className).not.toMatch(/h-40px/);
  });

  it('should maintain consistent dimensions', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    const smallButton = screen.getByRole('button');
    const smallBox = smallButton.getBoundingClientRect();
    
    rerender(<Button size="lg">Large</Button>);
    const largeButton = screen.getByRole('button');
    const largeBox = largeButton.getBoundingClientRect();
    
    // Should have predictable size differences
    expect(largeBox.height).toBeGreaterThan(smallBox.height);
    expect(largeBox.width).toBeGreaterThan(smallBox.width);
  });
});
```

### 3. Layout Stability Tests

**Purpose**: Prevent layout shifts and ensure consistent rendering

```typescript
// __tests__/layout-stability.test.ts
describe('Layout Stability', () => {
  it('should not cause layout shifts during state changes', async () => {
    const { rerender } = render(<MessageList messages={[]} />);
    const container = screen.getByTestId('message-list');
    const initialBox = container.getBoundingClientRect();
    
    // Add messages
    rerender(<MessageList messages={mockMessages} />);
    await waitFor(() => {
      const finalBox = container.getBoundingClientRect();
      // Container should maintain its position
      expect(finalBox.x).toBe(initialBox.x);
      expect(finalBox.y).toBe(initialBox.y);
    });
  });

  it('should handle dynamic content without breaking layout', () => {
    render(<DynamicContent />);
    
    const container = screen.getByTestId('dynamic-container');
    const initialHeight = container.offsetHeight;
    
    // Trigger content change
    fireEvent.click(screen.getByText('Load More'));
    
    // Should expand smoothly without breaking
    expect(container.offsetHeight).toBeGreaterThanOrEqual(initialHeight);
  });
});
```

### 4. Bidirectional Communication Tests

**Purpose**: Ensure real-time communication works flawlessly

```typescript
// e2e/bidirectional-communication.spec.ts
describe('Bidirectional Communication', () => {
  it('should establish authenticated session and open interfaces', async () => {
    // Setup agent and customer contexts
    await setupAgentDashboard();
    await setupCustomerWidget();
    
    // Verify both interfaces are accessible
    expect(await agentPage.isVisible('[data-testid="message-input"]')).toBe(true);
    expect(await customerPage.isVisible('[data-testid="widget-message-input"]')).toBe(true);
  });

  it('should verify widget to dashboard message delivery', async () => {
    const testMessage = `Test message ${Date.now()}`;
    
    // Send from widget
    await customerPage.fill('[data-testid="widget-message-input"]', testMessage);
    await customerPage.click('[data-testid="widget-send-button"]');
    
    // Verify in dashboard
    await expect(agentPage.locator(`text=${testMessage}`)).toBeVisible();
  });
});
```

## Design Token Enforcement

### ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@campfire/design-tokens'],
  rules: {
    '@campfire/design-tokens/no-hardcoded-colors': 'error',
    '@campfire/design-tokens/no-arbitrary-spacing': 'error',
    '@campfire/design-tokens/no-arbitrary-typography': 'error',
    '@campfire/design-tokens/require-motion-tokens': 'error',
  },
};
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Running design token compliance checks..."
npm run lint:design-tokens

echo "🧪 Running unit tests..."
npm run test:unit

echo "🎨 Running visual regression tests..."
npm run test:visual:quick

echo "✅ All checks passed!"
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Design Consistency & Layout Stability

on: [push, pull_request]

jobs:
  design-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check Design Token Compliance
        run: npm run lint:design-tokens
        
      - name: Run Unit Tests
        run: npm run test:unit
        
      - name: Run Layout Stability Tests
        run: npm run test:layout
        
      - name: Run Visual Regression Tests
        run: npm run test:visual
        
      - name: Run Bidirectional Communication Tests
        run: npm run test:e2e:bidirectional
```

## Layout Stability Testing

### Component Dimension Tests

```typescript
// __tests__/layout/component-dimensions.test.ts
describe('Component Dimensions', () => {
  it('should maintain consistent button dimensions', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    const smallButton = screen.getByRole('button');
    const smallDimensions = {
      height: smallButton.offsetHeight,
      width: smallButton.offsetWidth,
    };
    
    rerender(<Button size="lg">Large</Button>);
    const largeButton = screen.getByRole('button');
    const largeDimensions = {
      height: largeButton.offsetHeight,
      width: largeButton.offsetWidth,
    };
    
    // Should follow design token specifications
    expect(largeDimensions.height).toBe(48); // 3rem
    expect(smallDimensions.height).toBe(32); // 2rem
  });
});
```

### Layout Shift Detection

```typescript
// __tests__/layout/shift-detection.test.ts
describe('Layout Shift Detection', () => {
  it('should not cause cumulative layout shift', () => {
    const { rerender } = render(<DynamicLayout />);
    const container = screen.getByTestId('layout-container');
    
    let totalShift = 0;
    
    // Simulate multiple state changes
    for (let i = 0; i < 10; i++) {
      const beforeBox = container.getBoundingClientRect();
      rerender(<DynamicLayout state={i} />);
      const afterBox = container.getBoundingClientRect();
      
      const shift = Math.abs(afterBox.x - beforeBox.x) + Math.abs(afterBox.y - beforeBox.y);
      totalShift += shift;
    }
    
    // Total shift should be minimal
    expect(totalShift).toBeLessThan(10); // 10px total shift maximum
  });
});
```

## Bidirectional Communication Testing

### Test Infrastructure

```typescript
// e2e/test-helpers/bidirectional-helper.ts
export class BidirectionalTestHelper {
  constructor(
    private agentPage: Page,
    private customerPage: Page,
    private testConfig: TestConfig
  ) {}

  async setupAuthenticatedSession() {
    // Setup agent authentication
    await this.agentPage.goto('/dashboard/conversations');
    await this.agentPage.waitForLoadState('networkidle');
    
    // Setup customer widget
    await this.customerPage.goto('/');
    await this.customerPage.waitForLoadState('networkidle');
    await this.customerPage.click('[data-testid="widget-button"]');
  }

  async sendMessageFromWidget(message: string) {
    await this.customerPage.fill('[data-testid="widget-message-input"]', message);
    await this.customerPage.click('[data-testid="widget-send-button"]');
  }

  async sendMessageFromDashboard(message: string) {
    await this.agentPage.fill('[data-testid="message-input"]', message);
    await this.agentPage.click('[data-testid="send-button"]');
  }

  async verifyMessageDelivery(message: string, direction: 'widget-to-dashboard' | 'dashboard-to-widget') {
    if (direction === 'widget-to-dashboard') {
      await expect(this.agentPage.locator(`text=${message}`)).toBeVisible();
    } else {
      await expect(this.customerPage.locator(`text=${message}`)).toBeVisible();
    }
  }
}
```

### Performance Monitoring

```typescript
// e2e/performance/message-latency.test.ts
describe('Message Latency', () => {
  it('should deliver messages within performance threshold', async () => {
    const helper = new BidirectionalTestHelper(agentPage, customerPage, testConfig);
    const latencies: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      const message = `Performance test ${i}`;
      
      await helper.sendMessageFromWidget(message);
      await helper.verifyMessageDelivery(message, 'widget-to-dashboard');
      
      const latency = Date.now() - startTime;
      latencies.push(latency);
    }
    
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    expect(avgLatency).toBeLessThan(1000); // 1 second maximum
  });
});
```

## Testing Workflow

### Development Workflow

1. **Before Every Change**:
   ```bash
   npm run test:unit          # Run unit tests
   npm run lint:design-tokens # Check design compliance
   ```

2. **After Every Change**:
   ```bash
   npm run test:layout        # Check layout stability
   npm run test:visual:quick  # Quick visual regression
   ```

3. **Before Commit**:
   ```bash
   npm run test:all           # Full test suite
   npm run test:e2e:basic     # Basic E2E tests
   ```

### Continuous Integration

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on: [push, pull_request]

jobs:
  test-suite:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
        browser: [chromium, firefox, webkit]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run design token compliance
        run: npm run lint:design-tokens
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e:${{ matrix.browser }}
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.browser }}
          path: test-results/
```

## Failure Analysis

### Common Failure Patterns

1. **Design Token Violations**:
   - Hardcoded colors (`bg-blue-500` instead of `bg-primary-500`)
   - Arbitrary spacing (`p-5` instead of `p-4`)
   - Non-standard typography (`text-13px` instead of `text-sm`)

2. **Layout Breaks**:
   - Components changing dimensions unexpectedly
   - Cumulative layout shift > 10px
   - Elements overlapping or disappearing

3. **Bidirectional Communication Failures**:
   - Widget not loading (`[data-testid="widget-message-input"]` not found)
   - Authentication issues (missing auth state)
   - Real-time connection failures

### Debugging Steps

1. **Check Browser Console**:
   ```bash
   # Run tests with console logging
   npm run test:e2e:bidirectional -- --headed --debug
   ```

2. **Analyze Screenshots**:
   ```bash
   # View test failure screenshots
   open test-results/*/test-failed-*.png
   ```

3. **Check Network Requests**:
   ```bash
   # Monitor network activity during tests
   npm run test:e2e:bidirectional -- --headed --trace on
   ```

## Performance Monitoring

### Metrics to Track

1. **Design Token Compliance**: 100% target
2. **Layout Stability**: <10px cumulative shift
3. **Message Latency**: <1000ms average
4. **Test Success Rate**: >95%
5. **Component Render Time**: <50ms

### Performance Budgets

```typescript
// performance-budgets.json
{
  "design-tokens": {
    "compliance-rate": 100,
    "hardcoded-values": 0
  },
  "layout-stability": {
    "cumulative-shift": 10,
    "component-shifts": 0
  },
  "bidirectional-communication": {
    "message-latency": 1000,
    "success-rate": 95,
    "connection-timeout": 5000
  },
  "component-performance": {
    "render-time": 50,
    "interaction-time": 100
  }
}
```

---

## Summary

This testing strategy ensures:

1. **Zero Layout Breaks**: Comprehensive layout stability testing
2. **Design Consistency**: Enforced design token compliance
3. **Bidirectional Reliability**: Robust real-time communication testing
4. **Performance Excellence**: Sub-50ms component interactions
5. **Accessibility Compliance**: WCAG 2.2 AA standards

**Remember**: Every change must pass all tests before deployment. Design tokens are the law, and layout stability is non-negotiable. 