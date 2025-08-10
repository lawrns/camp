import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Testing Configuration for Campfire
 * 
 * Comprehensive E2E testing setup with:
 * - Real Supabase connections
 * - Bidirectional communication testing
 * - Multi-browser support
 * - Performance monitoring
 * - Video recording for debugging
 */

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['list'],
      ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Record video for debugging */
    video: 'retain-on-failure',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Accept downloads */
    acceptDownloads: true,

    /* Locale */
    locale: 'en-US',

    /* Timezone */
    timezoneId: 'America/New_York',

    /* Permissions */
    permissions: ['notifications'],

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state if available
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },

    // Tablet devices
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        storageState: process.env.CI ? undefined : 'e2e/auth-state.json',
      },
      dependencies: process.env.CI ? [] : ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3003',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
  
  /* Global setup and teardown */
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  /* Test timeout */
  timeout: 30000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 10000, // 10 seconds
    toHaveScreenshot: {
      threshold: 0.2, // Visual comparison threshold
      animations: 'disabled',
    },
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Enable web server for testing */
  webServer: {
    command: 'E2E_MOCK=true NEXT_PUBLIC_E2E_MOCK=true NEXT_PUBLIC_SUPABASE_URL=http://localhost:1234 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:1234',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key',
    },
  },
});

/* Test configuration constants */
export const testConfig = {
  // Test data
  testUser: {
    email: 'jam@jam.com',
    password: 'password123',
  },

  testOrganization: {
    id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    name: 'Test Organization',
  },

  // Performance thresholds
  performance: {
    maxLoadTime: 3000, // 3 seconds
    maxInteractionTime: 1000, // 1 second
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  },

  // Visual regression thresholds
  visual: {
    threshold: 0.2,
    animations: 'disabled',
    clip: { x: 0, y: 0, width: 1280, height: 720 },
  },

  // API endpoints
  api: {
    messages: '/api/messages',
    conversations: '/api/conversations',
    auth: '/api/auth',
    widget: '/api/widget',
  },
};
