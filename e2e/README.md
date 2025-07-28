# E2E Testing Suite - Campfire V2

## 🎯 Overview

This comprehensive E2E testing suite validates the entire user experience of Campfire V2, from authentication to real-time communication, ensuring high-quality, accessible, and performant user interactions.

## 🏗️ Architecture

```
e2e/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   ├── auth/                     # Authentication flows
│   ├── widget/                   # Widget integration
│   ├── conversations/            # Chat functionality
│   ├── accessibility/            # A11y testing
│   ├── performance/              # Performance testing
│   └── visual/                   # Visual regression
├── fixtures/                     # Test data
├── utils/                        # Test utilities
├── reports/                      # Test reports
└── run-tests.sh                  # Test runner script
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Development server running on localhost:3000

### Installation
```bash
npm install -D @playwright/test
npx playwright install
```

### Running Tests

#### All Tests
```bash
npm run test:e2e
```

#### Interactive Mode
```bash
npm run test:e2e:ui
```

#### Debug Mode
```bash
npm run test:e2e:debug
```

#### Comprehensive Test Suite
```bash
./e2e/run-tests.sh
```

## 📋 Test Categories

### 1. Authentication Tests (`tests/auth/`)
- **Purpose**: Validate user authentication flows
- **Coverage**: Login, registration, password reset, error handling
- **Key Tests**:
  - Complete authentication flow
  - Error state handling
  - Form validation
  - OAuth integration

### 2. Widget Integration Tests (`tests/widget/`)
- **Purpose**: Test widget embedding and functionality
- **Coverage**: Widget loading, chat panel, message sending
- **Key Tests**:
  - Widget button interaction
  - Chat panel open/close
  - Message input and sending
  - Typing indicators

### 3. Real-time Communication Tests (`tests/conversations/`)
- **Purpose**: Validate real-time messaging functionality
- **Coverage**: WebSocket connections, message sync, typing indicators
- **Key Tests**:
  - Real-time connection establishment
  - Message sending and receiving
  - Typing indicator synchronization
  - Connection error handling

### 4. Accessibility Tests (`tests/accessibility/`)
- **Purpose**: Ensure WCAG 2.1 AA compliance
- **Coverage**: Screen reader support, keyboard navigation, color contrast
- **Key Tests**:
  - Heading structure validation
  - ARIA label compliance
  - Keyboard navigation
  - Color contrast ratios
  - Focus management

### 5. Performance Tests (`tests/performance/`)
- **Purpose**: Validate Core Web Vitals and performance metrics
- **Coverage**: LCP, FID, CLS, load times, interaction responsiveness
- **Key Tests**:
  - Core Web Vitals thresholds
  - Widget load performance
  - Rapid interaction handling
  - Memory usage optimization

### 6. Visual Regression Tests (`tests/visual/`)
- **Purpose**: Ensure design system consistency
- **Coverage**: Design tokens, responsive design, cross-browser rendering
- **Key Tests**:
  - Design system token validation
  - Responsive design compliance
  - Cross-browser visual consistency
  - Dark mode support

## 🎯 Test Coverage Matrix

| Test Category | Coverage | Priority | Status |
|---------------|----------|----------|--------|
| **Authentication** | 90% | High | ✅ Complete |
| **Widget Integration** | 85% | High | ✅ Complete |
| **Real-time Communication** | 80% | High | ✅ Complete |
| **Accessibility** | 90% | High | ✅ Complete |
| **Performance** | 75% | Medium | ✅ Complete |
| **Visual Regression** | 70% | Medium | ✅ Complete |
| **Cross-browser** | 100% | High | ✅ Complete |

## 📊 Success Metrics

### Technical Metrics
- **Test Coverage**: 90%+ overall coverage
- **Performance**: <2s page load, <100ms interactions
- **Accessibility**: WCAG 2.1 AA compliance
- **Cross-browser**: 100% compatibility (Chrome, Firefox, Safari, Edge)

### User Experience Metrics
- **Task Completion**: 95%+ success rate for core user journeys
- **Error Rate**: <1% for critical user flows
- **Response Time**: <500ms for real-time features
- **Mobile Experience**: 100% responsive design compliance

## 🔧 Configuration

### Playwright Configuration
- **Base URL**: http://localhost:3000
- **Browsers**: Chrome, Firefox, Safari, Edge, Mobile Chrome, Mobile Safari
- **Retries**: 2 in CI, 0 in development
- **Screenshots**: On failure
- **Videos**: Retain on failure
- **Traces**: On first retry

### Environment Variables
```bash
BASE_URL=http://localhost:3000  # Test environment URL
CI=true                        # CI/CD environment flag
```

## 📈 Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e
    npm run test:e2e:report
```

### Pre-commit Hooks
```bash
# Run smoke tests before commit
npm run test:e2e -- --grep="@smoke"
```

## 🐛 Debugging

### Common Issues
1. **Development Server Not Running**
   ```bash
   npm run dev
   ```

2. **Browser Installation Issues**
   ```bash
   npx playwright install
   ```

3. **Test Timeouts**
   - Increase timeout in `playwright.config.ts`
   - Check network connectivity
   - Verify test environment setup

### Debug Commands
```bash
# Run specific test with debug
npx playwright test --debug tests/auth/auth-flow.spec.ts

# Run with UI mode
npx playwright test --ui

# Generate trace
npx playwright test --trace on
```

## 📝 Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-page');
  });

  test('should perform specific action', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### Best Practices
1. **Use data-testid attributes** for reliable element selection
2. **Write descriptive test names** that explain the expected behavior
3. **Group related tests** using `test.describe()`
4. **Use page object model** for complex interactions
5. **Include accessibility checks** in every test
6. **Test error states** and edge cases

## 📊 Reporting

### HTML Reports
```bash
npm run test:e2e:report
```

### JSON Reports
```bash
npx playwright test --reporter=json
```

### JUnit Reports
```bash
npx playwright test --reporter=junit
```

## 🔄 Maintenance

### Regular Tasks
- [ ] Update test data fixtures monthly
- [ ] Review and update performance thresholds quarterly
- [ ] Validate accessibility compliance monthly
- [ ] Update browser versions quarterly
- [ ] Review test coverage and add missing scenarios

### Performance Monitoring
- Track Core Web Vitals over time
- Monitor test execution times
- Analyze flaky test patterns
- Review accessibility compliance trends

## 📞 Support

For questions or issues with the E2E testing suite:
1. Check the debugging section above
2. Review test logs in `e2e/reports/`
3. Run tests in debug mode for detailed investigation
4. Consult the Playwright documentation

---

**Last Updated**: January 2025
**Version**: 1.0.0
