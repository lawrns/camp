module.exports = {
  displayName: 'E2E Tests',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
  verbose: true,
  collectCoverage: false,
  testEnvironment: 'node'
};
