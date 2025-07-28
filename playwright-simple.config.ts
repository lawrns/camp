import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright Configuration for Bidirectional Testing Demo
 * No global setup/teardown, just basic testing
 */

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Retry on CI only */
  retries: 0,
  
  /* Use 1 worker for demo */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['line'],
    ['html', { outputFolder: 'test-results/html-report' }],
  ],
  
  /* Shared settings */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3001',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Record video for debugging */
    video: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Test timeout */
  timeout: 30000,
  
  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
});
