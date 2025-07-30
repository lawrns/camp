/**
 * E2E Test Setup
 * Configures Jest for Puppeteer testing
 */

// Increase timeout for E2E tests
jest.setTimeout(60000);

// Global test configuration
global.TEST_CONFIG = {
  baseUrl: 'http://localhost:3005',
  timeout: 30000,
  slowMo: 100
};

console.log('🎭 E2E Test Environment Setup Complete');
