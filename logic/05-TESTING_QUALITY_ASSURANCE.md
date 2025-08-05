# TESTING & QUALITY ASSURANCE COMPREHENSIVE GUIDE

## 🧪 TESTING STRATEGY OVERVIEW

### Testing Pyramid Architecture
```
Testing Strategy:
├── E2E Tests (Playwright/Cypress)     # 150+ tests
├── Integration Tests (Jest)           # 300+ tests  
├── Unit Tests (Jest/React Testing)    # 800+ tests
├── Visual Regression Tests            # 200+ tests
└── Performance Tests (Lighthouse)     # 50+ tests
```

### Test Coverage Metrics
- **Unit Test Coverage**: 85%+ across all modules
- **Integration Test Coverage**: 75%+ for critical paths
- **E2E Test Coverage**: 90%+ for user journeys
- **Visual Regression Coverage**: 100% for key components
- **Performance Budget**: <3s TTI, <100ms API response

## 🎯 TESTING ARCHITECTURE

### Test File Organization
```
__tests__/                      # Unit & Integration tests
├── components/                 # Component testing
│   ├── conversations/
│   │   ├── ConversationCard.test.tsx
│   │   ├── MessageBubble.test.tsx
│   │   └── AgentHandoffProvider.test.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.test.tsx
│   │   └── AnalyticsWidget.test.tsx
│   └── widget/
│       ├── WidgetContainer.test.tsx
│       └── WidgetLauncher.test.tsx
├── hooks/                      # Custom hooks testing
│   ├── useRealtime.test.ts
│   ├── useAuth.test.ts
│   └── useConversation.test.ts
├── services/                   # Service layer testing
│   ├── ai-service.test.ts
│   ├── realtime-manager.test.ts
│   └── api-client.test.ts
├── utils/                      # Utility function testing
│   ├── formatters.test.ts
│   ├── validators.test.ts
│   └── transformers.test.ts
└── integration/               # Integration test suites
    ├── conversation-flow.test.ts
    ├── authentication.test.ts
    └── real-time-messaging.test.ts

e2e/                          # End-to-end tests
├── tests/                    # E2E test files
│   ├── auth.spec.ts
│   ├── conversations.spec.ts
│   ├── dashboard.spec.ts
│   ├── widget.spec.ts
│   └── handoff.spec.ts
├── fixtures/                 # Test data fixtures
│   ├── users.json
│   ├── conversations.json
│   └── messages.json
├── pages/                    # Page object models
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── WidgetPage.ts
└── utils/                    # E2E utilities
    ├── test-helpers.ts
    └── mock-server.ts

visual-tests/                 # Visual regression tests
├── components/
├── pages/
└── snapshots/
```

## 🧪 UNIT TESTING FRAMEWORK

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
};
```

### Component Testing Examples
```typescript
// ConversationCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationCard } from '@/components/conversations/ConversationCard';
import { mockConversation } from '@/__tests__/fixtures/conversations';

describe('ConversationCard', () => {
  const mockConversation = {
    id: 'conv-123',
    title: 'Test Conversation',
    lastMessage: 'Hello, how can I help you?',
    status: 'open',
    priority: 'medium',
    customer: {
      id: 'user-123',
      fullName: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg'
    },
    assignedAgent: null,
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    messageCount: 5,
    unreadCount: 2
  };

  it('renders conversation details correctly', () => {
    render(<ConversationCard conversation={mockConversation} />);
    
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays priority indicator correctly', () => {
    const { rerender } = render(<ConversationCard conversation={mockConversation} />);
    
    expect(screen.getByTestId('priority-medium')).toBeInTheDocument();
    
    rerender(<ConversationCard conversation={{...mockConversation, priority: 'high'}} />);
    expect(screen.getByTestId('priority-high')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <ConversationCard 
        conversation={mockConversation} 
        onClick={handleClick} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockConversation);
  });

  it('shows unread message count', () => {
    render(<ConversationCard conversation={mockConversation} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles empty assigned agent gracefully', () => {
    render(<ConversationCard conversation={mockConversation} />);
    expect(screen.queryByText('Unassigned')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// useRealtime.test.ts
import { renderHook, act } from '@testing-library/react';
import { useRealtime } from '@/hooks/useRealtime';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';

describe('useRealtime', () => {
  const mockSupabase = createMockSupabaseClient();
  
  it('subscribes to conversation updates', () => {
    const { result } = renderHook(() => 
      useRealtime('conversation-123', mockSupabase)
    );
    
    expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:conversation-123');
    expect(result.current.isConnected).toBe(true);
  });

  it('handles new messages in real-time', () => {
    const { result } = renderHook(() => 
      useRealtime('conversation-123', mockSupabase)
    );
    
    const newMessage = {
      id: 'msg-456',
      content: 'New test message',
      created_at: new Date().toISOString()
    };
    
    act(() => {
      mockSupabase.emit('postgres_changes', {
        eventType: 'INSERT',
        new: newMessage
      });
    });
    
    expect(result.current.messages).toContainEqual(newMessage);
  });

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => 
      useRealtime('conversation-123', mockSupabase)
    );
    
    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});
```

## 🔗 INTEGRATION TESTING

### API Integration Tests
```typescript
// conversation-api.test.ts
import { createTRPCClient } from '@trpc/client';
import { createTRPCContext } from '@/trpc/context';
import { appRouter } from '@/trpc/router';
import { mockSession } from '@/__tests__/fixtures/auth';

describe('Conversation API Integration', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createTRPCContext({
      session: mockSession,
      supabase: createMockSupabaseClient()
    });
    caller = appRouter.createCaller(ctx);
  });

  it('creates a new conversation', async () => {
    const input = {
      organizationId: 'org-123',
      title: 'Test Integration Conversation',
      priority: 'high' as const,
      customerId: 'user-456'
    };

    const conversation = await caller.conversations.create(input);
    
    expect(conversation).toMatchObject({
      title: input.title,
      priority: input.priority,
      organization_id: input.organizationId,
      customer_id: input.customerId,
      status: 'open'
    });
  });

  it('lists conversations with pagination', async () => {
    const result = await caller.conversations.list({
      organizationId: 'org-123',
      limit: 10
    });

    expect(result.conversations).toHaveLength(10);
    expect(result).toHaveProperty('nextCursor');
  });

  it('filters conversations by status', async () => {
    const result = await caller.conversations.list({
      organizationId: 'org-123',
      status: 'open',
      limit: 20
    });

    expect(result.conversations.every(c => c.status === 'open')).toBe(true);
  });
});
```

### Database Integration Tests
```typescript
// database-integration.test.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

describe('Database Integration', () => {
  let supabase: SupabaseClient<Database>;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  });

  afterAll(async () => {
    await supabase.removeAllChannels();
  });

  it('creates and retrieves conversation with relations', async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org', slug: 'test-org' })
      .select()
      .single();

    // Create test user
    const { data: user } = await supabase
      .from('users')
      .insert({ 
        email: 'test@example.com', 
        organization_id: org!.id 
      })
      .select()
      .single();

    // Create conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        organization_id: org!.id,
        customer_id: user!.id,
        title: 'Integration Test Conversation'
      })
      .select(`
        *,
        customer:customer_id(*),
        organization:organization_id(*)
      `)
      .single();

    expect(conversation).toMatchObject({
      title: 'Integration Test Conversation',
      customer: { email: 'test@example.com' },
      organization: { name: 'Test Org' }
    });
  });

  it('handles real-time subscriptions', async () => {
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          expect(payload.new).toHaveProperty('content');
        }
      )
      .subscribe();

    // Wait for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Insert test message
    await supabase.from('messages').insert({
      conversation_id: 'test-conv-123',
      content: 'Test message',
      sender_type: 'user'
    });

    await channel.unsubscribe();
  });
});
```

## 🎭 END-TO-END TESTING

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples
```typescript
// e2e/conversations.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Conversation Management', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await dashboardPage.waitForLoad();
  });

  test('creates new conversation', async ({ page }) => {
    await dashboardPage.clickNewConversation();
    await dashboardPage.fillConversationDetails({
      title: 'E2E Test Conversation',
      priority: 'high',
      customerEmail: 'customer@test.com'
    });
    await dashboardPage.submitConversation();
    
    await expect(page.getByText('E2E Test Conversation')).toBeVisible();
    await expect(page.getByText('Priority: High')).toBeVisible();
  });

  test('handles real-time message updates', async ({ page }) => {
    await dashboardPage.openConversation('conv-123');
    
    // Send message through API
    await page.evaluate(() => {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123',
          content: 'Real-time test message'
        })
      });
    });
    
    await expect(page.getByText('Real-time test message')).toBeVisible();
  });

  test('AI handoff flow', async ({ page }) => {
    await dashboardPage.openConversation('conv-ai-test');
    
    // Verify AI is active
    await expect(page.getByText('AI Active')).toBeVisible();
    
    // Trigger handoff
    await page.getByRole('button', { name: 'AI Active' }).click();
    await page.getByRole('button', { name: 'Request Human Agent' }).click();
    
    // Verify handoff initiated
    await expect(page.getByText('Human Agent')).toBeVisible();
    await expect(page.getByText('Handoff requested')).toBeVisible();
  });

  test('file upload functionality', async ({ page }) => {
    await dashboardPage.openConversation('conv-file-test');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/test-document.pdf');
    
    await expect(page.getByText('test-document.pdf')).toBeVisible();
    await expect(page.getByText('Upload successful')).toBeVisible();
  });
});
```

### Page Object Models
```typescript
// e2e/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  private page: Page;
  private conversationsList: Locator;
  private newConversationButton: Locator;
  private searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.conversationsList = page.locator('[data-testid="conversations-list"]');
    this.newConversationButton = page.getByRole('button', { name: 'New Conversation' });
    this.searchInput = page.getByPlaceholder('Search conversations...');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.conversationsList.waitFor({ state: 'visible' });
  }

  async clickNewConversation() {
    await this.newConversationButton.click();
  }

  async fillConversationDetails(details: {
    title: string;
    priority: string;
    customerEmail?: string;
  }) {
    await this.page.getByLabel('Title').fill(details.title);
    await this.page.getByLabel('Priority').selectOption(details.priority);
    
    if (details.customerEmail) {
      await this.page.getByLabel('Customer Email').fill(details.customerEmail);
    }
  }

  async submitConversation() {
    await this.page.getByRole('button', { name: 'Create Conversation' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openConversation(conversationId: string) {
    await this.page.getByTestId(`conversation-${conversationId}`).click();
  }

  async searchConversations(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  async getConversationCount(): Promise<number> {
    return await this.conversationsList.locator('[data-testid="conversation-item"]').count();
  }
}
```

## 📊 VISUAL REGRESSION TESTING

### Visual Test Configuration
```typescript
// visual-tests/components/ConversationCard.visual.test.ts
import { test, expect } from '@playwright/test';

test.describe('ConversationCard Visual Regression', () => {
  test('renders correctly - default state', async ({ page }) => {
    await page.goto('/visual-test/conversation-card');
    await page.setViewportSize({ width: 400, height: 200 });
    
    const card = page.locator('[data-testid="conversation-card"]');
    await expect(card).toHaveScreenshot('conversation-card-default.png');
  });

  test('renders correctly - high priority', async ({ page }) => {
    await page.goto('/visual-test/conversation-card?priority=high');
    await page.setViewportSize({ width: 400, height: 200 });
    
    const card = page.locator('[data-testid="conversation-card"]');
    await expect(card).toHaveScreenshot('conversation-card-high-priority.png');
  });

  test('renders correctly - with unread messages', async ({ page }) => {
    await page.goto('/visual-test/conversation-card?unreadCount=5');
    await page.setViewportSize({ width: 400, height: 200 });
    
    const card = page.locator('[data-testid="conversation-card"]');
    await expect(card).toHaveScreenshot('conversation-card-unread.png');
  });

  test('responsive design - mobile', async ({ page }) => {
    await page.goto('/visual-test/conversation-card');
    await page.setViewportSize({ width: 375, height: 200 });
    
    const card = page.locator('[data-testid="conversation-card"]');
    await expect(card).toHaveScreenshot('conversation-card-mobile.png');
  });
});
```

## ⚡ PERFORMANCE TESTING

### Lighthouse Performance Tests
```typescript
// performance/lighthouse.test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

describe('Performance Tests', () => {
  const testUrls = [
    'http://localhost:3000/dashboard',
    'http://localhost:3000/conversations',
    'http://localhost:3000/widget-demo'
  ];

  test.each(testUrls)('should meet performance budget for %s', async (url) => {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    };

    const runnerResult = await lighthouse(url, options);
    const report = runnerResult.report;
    const { audits } = JSON.parse(report);

    expect(audits['first-contentful-paint'].numericValue).toBeLessThan(2000);
    expect(audits['largest-contentful-paint'].numericValue).toBeLessThan(3000);
    expect(audits['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);
    expect(audits['total-blocking-time'].numericValue).toBeLessThan(200);

    await chrome.kill();
  });
});
```

### Bundle Size Monitoring
```typescript
// performance/bundle-analyzer.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');

const config = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    })
  ]
};

// Bundle size thresholds (in KB)
const bundleLimits = {
  'dashboard.js': 500,
  'widget.js': 200,
  'vendor.js': 800,
  'styles.css': 100
};

function checkBundleSizes() {
  const stats = require('./dist/stats.json');
  
  Object.entries(bundleLimits).forEach(([filename, limit]) => {
    const bundle = stats.assets.find(asset => asset.name.includes(filename));
    if (bundle && bundle.size > limit * 1024) {
      throw new Error(`${filename} exceeds ${limit}KB limit: ${bundle.size / 1024}KB`);
    }
  });
}
```

## 🔄 CONTINUOUS INTEGRATION

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
      
      - name: Run visual regression tests
        run: npm run test:visual
      
      - name: Performance budget check
        run: npm run test:performance
```

## 📈 TEST REPORTING & METRICS

### Test Results Dashboard
```typescript
// test-results-dashboard.js
export class TestResultsDashboard {
  async generateReport() {
    const unitResults = await this.getUnitTestResults();
    const e2eResults = await this.getE2EResults();
    const visualResults = await this.getVisualResults();
    const performanceResults = await this.getPerformanceResults();

    return {
      summary: {
        totalTests: unitResults.total + e2eResults.total + visualResults.total,
        passed: unitResults.passed + e2eResults.passed + visualResults.passed,
        failed: unitResults.failed + e2eResults.failed + visualResults.failed,
        skipped: unitResults.skipped + e2eResults.skipped + visualResults.skipped,
        coverage: unitResults.coverage,
        performance: performanceResults.score
      },
      details: {
        unit: unitResults,
        e2e: e2eResults,
        visual: visualResults,
        performance: performanceResults
      },
      trends: await this.getTrendData(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

## 🔍 DEBUGGING & TROUBLESHOOTING

### Test Debugging Tools
```typescript
// debug-test-setup.ts
import { debug } from 'debug';

// Enable debug logging for tests
process.env.DEBUG = 'test:*';

// Custom test logger
export const testLogger = debug('test:debug');

// Enhanced error handling
export const withTestLogging = async (testFn: () => Promise<void>) => {
  try {
    testLogger('Starting test...');
    await testFn();
    testLogger('Test completed successfully');
  } catch (error) {
    testLogger('Test failed:', error);
    throw error;
  }
};

// Test data inspector
export const inspectTestData = (data: any) => {
  console.log('Test Data:', JSON.stringify(data, null, 2));
};
```
