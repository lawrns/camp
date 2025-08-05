# Design System Testing Documentation

## Overview

This document describes the comprehensive testing suite for the Campfire V2 design system. The testing framework ensures 100% compliance with the unified design system across all dashboard components.

## Test Architecture

### Test Categories

1. **Unit Tests** - Component-level testing with Jest and React Testing Library
2. **Integration Tests** - Component interaction and API consistency testing
3. **E2E Tests** - Full user journey testing with Playwright
4. **Visual Regression Tests** - Screenshot comparison and visual consistency
5. **Accessibility Tests** - WCAG AA compliance validation
6. **Performance Tests** - Rendering performance and optimization validation
7. **Cross-Browser Tests** - Compatibility across Chrome, Firefox, and Safari

### Test Files Structure

```
__tests__/
├── design-token-compliance.test.ts          # Design token validation
├── design-system-compliance.test.ts         # Comprehensive component testing
└── dashboard/
    ├── metric-card-migration.test.tsx       # Migration compatibility
    ├── enhanced-metric-card-migration.test.tsx
    ├── intercom-metric-card-migration.test.tsx
    └── ...

e2e/
└── dashboard-design-system.spec.ts          # E2E testing suite

scripts/
└── run-design-system-tests.sh               # Test runner script
```

## Running Tests

### Quick Start

```bash
# Run all design system tests
./scripts/run-design-system-tests.sh

# Or using npm
npm run test:design-system
```

### Individual Test Suites

```bash
# Unit tests only
npm test -- __tests__/design-system-compliance.test.ts

# E2E tests only
npx playwright test e2e/dashboard-design-system.spec.ts

# Specific test category
npm test -- __tests__/design-system-compliance.test.ts --testNamePattern="Design Token Validation"
```

### Test Configuration

The test suite uses the following configuration:

- **Unit Test Timeout**: 30 seconds
- **E2E Test Timeout**: 60 seconds
- **Parallel Workers**: 4
- **Coverage Threshold**: 80%

## Test Categories Explained

### 1. Design Token Validation

**Purpose**: Ensures all design tokens are properly defined and used consistently.

**Tests Include**:
- Token structure validation
- Color token compliance
- Spacing grid validation (4px base)
- Typography scale validation
- Motion token performance
- CSS custom properties generation

**Example Test**:
```typescript
it('should validate spacing token values follow 4px grid', () => {
  const spacingValues = Object.values(tokens.spacing);
  
  spacingValues.forEach(value => {
    const remValue = parseFloat(value.replace('rem', ''));
    const pxValue = remValue * 16; // Convert rem to px
    expect(pxValue % 4).toBe(0); // Should be divisible by 4
  });
});
```

### 2. Component System Testing

**Purpose**: Validates that all unified UI components work correctly and consistently.

**Components Tested**:
- Button (variants, sizes, interactions)
- Card (structure, styling)
- Badge (variants, content)
- Avatar (image, fallback)
- Progress (values, accessibility)
- Form components (Input, Textarea, Checkbox, Switch)
- Interactive components (Dialog, Tabs, Tooltip)

**Example Test**:
```typescript
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
```

### 3. Dashboard Component Testing

**Purpose**: Ensures dashboard-specific components work correctly and use the unified design system.

**Components Tested**:
- MetricCard (variants, change indicators, targets)
- DashboardGrid (responsive layout)
- ActivityFeed (items, interactions)
- DashboardSection (structure, actions)

**Example Test**:
```typescript
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
```

### 4. Migration Compatibility Testing

**Purpose**: Ensures backward compatibility during component migration to the unified system.

**Tests Include**:
- Legacy prop support
- API consistency
- Variant mapping
- Styling compatibility

**Example Test**:
```typescript
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
```

### 5. Accessibility Testing

**Purpose**: Ensures WCAG AA compliance across all components.

**Tests Include**:
- ARIA attributes validation
- Keyboard navigation
- Focus management
- Color contrast (design token usage)
- Screen reader support

**Example Test**:
```typescript
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
```

### 6. Performance Testing

**Purpose**: Validates that components render efficiently and meet performance thresholds.

**Tests Include**:
- Rendering performance
- Large dataset handling
- Animation optimization
- Re-render optimization

**Example Test**:
```typescript
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
```

### 7. E2E Testing

**Purpose**: Tests complete user journeys and visual consistency across different scenarios.

**Test Categories**:
- Visual design compliance
- Responsive design validation
- User interaction flows
- Performance benchmarking
- Cross-browser compatibility
- Error handling scenarios

**Example Test**:
```typescript
test('should use consistent design tokens across all components', async ({ page }) => {
  await checkDesignTokens(page);
  
  // Check that no hardcoded colors are used
  const hardcodedColors = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const hardcoded = [];
    
    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      // Check for hardcoded hex colors
      if (backgroundColor.match(/^#[0-9a-fA-F]{3,6}$/) || 
          color.match(/^#[0-9a-fA-F]{3,6}$/)) {
        hardcoded.push({
          element: element.tagName,
          backgroundColor,
          color
        });
      }
    }
    
    return hardcoded;
  });
  
  expect(hardcodedColors).toHaveLength(0);
});
```

## Test Reports

### Generated Reports

The test suite generates several types of reports:

1. **HTML Test Report** - Comprehensive test results with metrics
2. **Coverage Report** - Code coverage analysis
3. **Screenshots** - Visual regression test images
4. **Playwright Report** - E2E test results with traces
5. **Test Logs** - Detailed execution logs

### Report Locations

```
reports/
└── design-system-test-report-{timestamp}.html

coverage/
└── lcov-report/
    └── index.html

test-results/
├── dashboard-{test-name}-{timestamp}.png
└── {test-name}-{timestamp}.log

playwright-report/
└── index.html
```

### Reading Reports

#### HTML Test Report

The HTML report provides:
- Test summary with metrics
- Phase-by-phase results
- Key findings and recommendations
- Links to detailed logs and screenshots

#### Coverage Report

Shows code coverage for:
- Components directory
- Styles directory
- Design token files

#### Playwright Report

Interactive E2E test results with:
- Test traces
- Screenshots
- Video recordings
- Performance metrics

## Continuous Integration

### GitHub Actions

The test suite is integrated into CI/CD pipelines:

```yaml
name: Design System Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/run-design-system-tests.sh
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Pre-commit Hooks

Design system tests run automatically on commit:

```bash
# .husky/pre-commit
#!/bin/sh
npm run test:design-system:quick
```

## Troubleshooting

### Common Issues

#### Test Timeouts

**Problem**: Tests timing out
**Solution**: Increase timeout values in test configuration

```bash
# Increase Jest timeout
jest --testTimeout=60000

# Increase Playwright timeout
npx playwright test --timeout=120000
```

#### Missing Dependencies

**Problem**: Tests failing due to missing components
**Solution**: Ensure all components are properly exported

```typescript
// Check component exports
import { MetricCard } from '../components/dashboard/StandardizedDashboard';
```

#### Visual Regression Failures

**Problem**: Screenshots don't match baseline
**Solution**: Update baseline images or investigate visual changes

```bash
# Update baseline screenshots
npx playwright test --update-snapshots
```

### Debug Mode

Run tests in debug mode for detailed logging:

```bash
# Debug unit tests
npm test -- __tests__/design-system-compliance.test.ts --verbose --detectOpenHandles

# Debug E2E tests
npx playwright test --debug e2e/dashboard-design-system.spec.ts
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Test one thing at a time** - each test should have a single responsibility
3. **Use data-testid attributes** for reliable element selection
4. **Test both success and failure scenarios**
5. **Validate accessibility** in every component test

### Test Organization

1. **Group related tests** using describe blocks
2. **Use consistent naming conventions**
3. **Keep tests independent** - no shared state between tests
4. **Mock external dependencies** appropriately

### Performance Considerations

1. **Use React Testing Library** for component testing
2. **Avoid testing implementation details**
3. **Use efficient selectors** (data-testid over complex CSS selectors)
4. **Clean up after tests** to prevent memory leaks

## Contributing

### Adding New Tests

1. **Follow existing patterns** in test files
2. **Add tests for new components** immediately
3. **Update documentation** when adding new test categories
4. **Ensure tests are maintainable** and readable

### Test Maintenance

1. **Review test failures** promptly
2. **Update tests** when components change
3. **Remove obsolete tests** when components are deprecated
4. **Keep test data** up to date

## Resources

### Documentation

- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - E2E testing framework
- **Lighthouse CI** - Performance and accessibility testing

---

This testing suite ensures that the Campfire V2 design system maintains high quality, consistency, and accessibility standards across all components and user interactions. 