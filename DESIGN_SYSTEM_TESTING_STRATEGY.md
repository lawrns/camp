# Design System Testing Strategy & Validation Framework

## Testing Overview

Comprehensive testing approach to ensure 100% design system compliance, visual consistency, accessibility, and performance standards across all migrated dashboard components.

## Testing Framework Architecture

### 1. Multi-Layer Testing Strategy
```
┌─────────────────────────────────────┐
│           E2E Testing               │ ← User workflows
├─────────────────────────────────────┤
│        Integration Testing          │ ← Component interactions  
├─────────────────────────────────────┤
│         Unit Testing               │ ← Individual components
├─────────────────────────────────────┤
│       Visual Regression            │ ← Design consistency
├─────────────────────────────────────┤
│      Accessibility Testing         │ ← WCAG compliance
├─────────────────────────────────────┤
│      Performance Testing           │ ← Render performance
└─────────────────────────────────────┘
```

### 2. Testing Tools Stack
- **Visual Regression**: Playwright + Percy
- **Accessibility**: axe-core + jest-axe
- **Performance**: Lighthouse CI + Web Vitals
- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright
- **Design Token Validation**: Custom ESLint rules

## Phase 1: Design Token Compliance Testing

### 1.1 Automated Token Validation
```typescript
// tests/design-system/token-compliance.test.ts
import { validateDesignTokens } from '../utils/token-validator';

describe('Design Token Compliance', () => {
  const dashboardComponents = [
    'MetricCard',
    'EnhancedMetricCard', 
    'IntercomMetricCard',
    'PremiumKPICards',
    'QuickActionButton'
  ];

  dashboardComponents.forEach(component => {
    it(`${component} should use only design tokens`, async () => {
      const violations = await validateDesignTokens(component);
      
      expect(violations.hardcodedColors).toHaveLength(0);
      expect(violations.legacyImports).toHaveLength(0);
      expect(violations.customSpacing).toHaveLength(0);
      expect(violations.complianceScore).toBeGreaterThanOrEqual(95);
    });
  });
});
```

### 1.2 ESLint Rules for Token Enforcement
```javascript
// .eslintrc.js - Custom rules
module.exports = {
  rules: {
    'design-system/no-hardcoded-colors': 'error',
    'design-system/use-design-tokens': 'error',
    'design-system/consistent-imports': 'error',
  }
};

// lib/eslint-rules/design-system.js
const FORBIDDEN_PATTERNS = [
  /text-(blue|red|green|yellow)-\d+/,
  /bg-(blue|red|green|yellow)-\d+/,
  /border-(blue|red|green|yellow)-\d+/,
];

const REQUIRED_TOKEN_PATTERN = /var\(--fl-[a-z-]+\)/;

function validateTokenUsage(node) {
  const className = node.value.value;
  
  // Check for forbidden hardcoded colors
  const hasForbiddenPattern = FORBIDDEN_PATTERNS.some(pattern => 
    pattern.test(className)
  );
  
  if (hasForbiddenPattern) {
    return {
      message: `Use design tokens instead of hardcoded colors: ${className}`,
      severity: 'error'
    };
  }
  
  return null;
}
```

### 1.3 Token Usage Validation Script
```typescript
// scripts/validate-token-usage.ts
interface TokenValidationResult {
  component: string;
  complianceScore: number;
  violations: {
    hardcodedColors: string[];
    legacyImports: string[];
    customSpacing: string[];
    missingTokens: string[];
  };
}

async function validateComponentTokens(componentPath: string): Promise<TokenValidationResult> {
  const content = await fs.readFile(componentPath, 'utf-8');
  
  const violations = {
    hardcodedColors: findHardcodedColors(content),
    legacyImports: findLegacyImports(content),
    customSpacing: findCustomSpacing(content),
    missingTokens: findMissingTokens(content)
  };
  
  const totalViolations = Object.values(violations).flat().length;
  const complianceScore = Math.max(0, 100 - (totalViolations * 5));
  
  return {
    component: path.basename(componentPath),
    complianceScore,
    violations
  };
}
```

## Phase 2: Visual Regression Testing

### 2.1 Playwright Visual Testing Setup
```typescript
// tests/visual/dashboard-components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/test-components');
  });

  test('MetricCard variants should match design system', async ({ page }) => {
    // Test all variants
    const variants = ['default', 'success', 'warning', 'error', 'info'];
    
    for (const variant of variants) {
      await page.locator(`[data-testid="metric-card-${variant}"]`).waitFor();
      await expect(page.locator(`[data-testid="metric-card-${variant}"]`))
        .toHaveScreenshot(`metric-card-${variant}.png`);
    }
  });

  test('Dashboard grid layout should be consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="dashboard-grid"]'))
      .toHaveScreenshot('dashboard-grid-desktop.png');
      
    await page.setViewportSize({ width: 768, height: 600 });
    await expect(page.locator('[data-testid="dashboard-grid"]'))
      .toHaveScreenshot('dashboard-grid-tablet.png');
      
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="dashboard-grid"]'))
      .toHaveScreenshot('dashboard-grid-mobile.png');
  });
});
```

### 2.2 Percy Integration for Visual Diffs
```typescript
// tests/visual/percy-snapshots.spec.ts
import percySnapshot from '@percy/playwright';

test('Dashboard components Percy snapshots', async ({ page }) => {
  await page.goto('/dashboard/component-showcase');
  
  // Capture full dashboard
  await percySnapshot(page, 'Dashboard - Complete View');
  
  // Capture individual components
  const components = [
    'metric-card-showcase',
    'kpi-cards-showcase', 
    'performance-monitor-showcase'
  ];
  
  for (const component of components) {
    await page.locator(`[data-testid="${component}"]`).scrollIntoViewIfNeeded();
    await percySnapshot(page, `Component - ${component}`);
  }
});
```

## Phase 3: Accessibility Testing

### 3.1 Automated A11y Testing
```typescript
// tests/accessibility/dashboard-a11y.test.ts
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Dashboard Accessibility', () => {
  it('MetricCard should be accessible', async () => {
    const { container } = render(
      <MetricCard
        title="Revenue"
        value="$50,000"
        variant="success"
        change={{ value: 12, trend: 'up', period: 'last month' }}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dashboard grid should have proper ARIA labels', async () => {
    const { container } = render(
      <DashboardGrid columns={4} aria-label="Key performance metrics">
        <MetricCard title="Test" value="100" />
      </DashboardGrid>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 3.2 Keyboard Navigation Testing
```typescript
// tests/accessibility/keyboard-navigation.spec.ts
test('Dashboard should be fully keyboard navigable', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Test tab navigation through all interactive elements
  const interactiveElements = [
    '[data-testid="metric-card-clickable"]',
    '[data-testid="quick-action-button"]',
    '[data-testid="dashboard-filter"]'
  ];
  
  for (let i = 0; i < interactiveElements.length; i++) {
    await page.keyboard.press('Tab');
    await expect(page.locator(interactiveElements[i])).toBeFocused();
  }
  
  // Test Enter key activation
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="metric-detail-modal"]')).toBeVisible();
});
```

## Phase 4: Performance Testing

### 4.1 Component Render Performance
```typescript
// tests/performance/render-performance.test.ts
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('Component Render Performance', () => {
  it('MetricCard should render within performance budget', () => {
    const startTime = performance.now();
    
    render(
      <MetricCard
        title="Performance Test"
        value="1000"
        variant="default"
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render in less than 16ms (60fps budget)
    expect(renderTime).toBeLessThan(16);
  });

  it('Dashboard with 20 MetricCards should render efficiently', () => {
    const startTime = performance.now();
    
    render(
      <DashboardGrid columns={4}>
        {Array.from({ length: 20 }, (_, i) => (
          <MetricCard key={i} title={`Metric ${i}`} value={i * 100} />
        ))}
      </DashboardGrid>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 20 cards in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

### 4.2 Lighthouse CI Integration
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/analytics'
      ],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }]
      }
    }
  }
};
```

## Phase 5: Integration Testing

### 5.1 Component Interaction Testing
```typescript
// tests/integration/dashboard-interactions.spec.ts
test('Dashboard component interactions work correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Test metric card click opens detail modal
  await page.click('[data-testid="metric-card-revenue"]');
  await expect(page.locator('[data-testid="metric-detail-modal"]')).toBeVisible();
  
  // Test modal close
  await page.click('[data-testid="modal-close-button"]');
  await expect(page.locator('[data-testid="metric-detail-modal"]')).not.toBeVisible();
  
  // Test dashboard refresh
  await page.click('[data-testid="dashboard-refresh"]');
  await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
});
```

## Testing Automation & CI/CD Integration

### 1. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm run test:design-tokens",
      "npm run test:accessibility"
    ]
  }
}
```

### 2. GitHub Actions Workflow
```yaml
# .github/workflows/design-system-tests.yml
name: Design System Tests
on: [push, pull_request]

jobs:
  design-system-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        
      - name: Install dependencies
        run: npm ci
        
      - name: Run design token validation
        run: npm run test:design-tokens
        
      - name: Run accessibility tests
        run: npm run test:a11y
        
      - name: Run visual regression tests
        run: npm run test:visual
        
      - name: Run performance tests
        run: npm run test:performance
```

## Success Metrics & Validation

### Compliance Targets
- [ ] **100% Design Token Usage** - Zero hardcoded values
- [ ] **95%+ Accessibility Score** - WCAG AA compliance
- [ ] **90%+ Performance Score** - Lighthouse metrics
- [ ] **Zero Visual Regressions** - Percy diff approval
- [ ] **100% Test Coverage** - All components tested

### Monitoring & Reporting
```typescript
// scripts/generate-compliance-report.ts
interface ComplianceReport {
  timestamp: string;
  overallScore: number;
  componentScores: ComponentScore[];
  violations: Violation[];
  recommendations: string[];
}

async function generateComplianceReport(): Promise<ComplianceReport> {
  const components = await scanDashboardComponents();
  const scores = await Promise.all(
    components.map(validateComponentCompliance)
  );
  
  return {
    timestamp: new Date().toISOString(),
    overallScore: calculateOverallScore(scores),
    componentScores: scores,
    violations: extractViolations(scores),
    recommendations: generateRecommendations(scores)
  };
}
```

---

*This testing strategy ensures comprehensive validation of design system compliance, accessibility, performance, and visual consistency across all dashboard components.*
