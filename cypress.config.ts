import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Test files
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/e2e.ts',
    fixturesFolder: 'tests/e2e/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    
    // Environment variables
    env: {
      // Test database URL (should be different from production)
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      
      // Test user credentials
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'testpassword123',
      TEST_ADMIN_EMAIL: 'admin@example.com',
      TEST_ADMIN_PASSWORD: 'adminpassword123'
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Task for database seeding/cleanup
      on('task', {
        async seedDatabase() {
          // Add database seeding logic here
          console.log('Seeding test database...');
          return null;
        },
        
        async cleanDatabase() {
          // Add database cleanup logic here
          console.log('Cleaning test database...');
          return null;
        },
        
        async createTestUser(userData: any) {
          // Create test user logic
          console.log('Creating test user:', userData.email);
          return { id: 'test-user-id', email: userData.email };
        },
        
        async deleteTestUser(userId: string) {
          // Delete test user logic
          console.log('Deleting test user:', userId);
          return null;
        },
        
        log(message: string) {
          console.log(message);
          return null;
        }
      });
      
      // Code coverage (if needed)
      // require('@cypress/code-coverage/task')(on, config);
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    specPattern: 'components/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/component.ts'
  },
  
  // Global configuration
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  
  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0
  },
  
  // Browser configuration
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
      version: '',
      path: '',
      majorVersion: 0
    }
  ],
  
  // Experimental features
  experimentalStudio: true,
  experimentalWebKitSupport: false
});