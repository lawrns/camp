/**
 * Centralized Test Configuration
 * 
 * This file contains standardized test data, selectors, and configuration
 * that should be used across all E2E tests to ensure consistency.
 */

export const TEST_CONFIG = {
  // Base URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:3001',
  WIDGET_URL: process.env.BASE_URL || 'http://localhost:3001', // Widget is on homepage now
  
  // Test Credentials
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  CUSTOMER_EMAIL: 'customer@test.com',
  CUSTOMER_PASSWORD: 'password123',
  
  // Test Organization (will be refreshed during setup)
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b', // FIXED: Aligned with dashboard

  // Legacy conversation ID (DO NOT USE)
  LEGACY_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d', // DEPRECATED
  
  // Timeouts
  DEFAULT_TIMEOUT: 15000,
  NAVIGATION_TIMEOUT: 10000,
  API_TIMEOUT: 5000,
  
  // Selectors - Standardized across all tests
  SELECTORS: {
    // Authentication
    LOGIN_EMAIL: '#email, input[type="email"], input[name="email"]',
    LOGIN_PASSWORD: '#password, input[type="password"], input[name="password"]',
    LOGIN_SUBMIT: 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")',
    
    // Dashboard
    DASHBOARD_CONTAINER: '[data-testid="inbox-dashboard"], .dashboard, [class*="dashboard"]',
    DASHBOARD_HEADER: '[data-testid="dashboard-header"], .dashboard-header',
    
    // Navigation
    SIDEBAR: '[data-testid="sidebar"], .sidebar',
    NAVIGATION_MENU: '[data-testid="navigation-menu"], .nav-menu',
    
    // Conversations
    CONVERSATION_LIST: '[data-testid="conversation-list"], .conversation-list',
    CONVERSATION_ROW: '[data-testid="conversation-row"], [data-testid="conversation-card"]',
    CONVERSATION_ITEM: '[data-testid="conversation-row"], [data-testid="conversation-card"]',
    CONVERSATION_EMPTY: '[data-testid="conversation-empty-title"], .conversation-empty',
    
    // Messages
    MESSAGE_INPUT: 'textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="message-input"]',
    MESSAGE_SEND_BUTTON: '[data-testid="composer-send-button"], button[aria-label*="Send"]',
    MESSAGE_LIST: '[data-testid="message-list"], .message-list',
    MESSAGE_ITEM: '[data-testid="message"], .message, .chat-message',
    
    // Widget
    WIDGET_BUTTON: '[data-testid="widget-button"]',
    WIDGET_PANEL: '[data-testid="widget-panel"]',
    WIDGET_MESSAGE_INPUT: '[data-testid="widget-message-input"]',
    WIDGET_SEND_BUTTON: '[data-testid="widget-send-button"]',
    WIDGET_MESSAGE: '[data-testid="widget-message"]',
    WIDGET_CLOSE: '[data-testid="widget-close-button"]',
    WIDGET_MINIMIZE: '[data-testid="widget-minimize-button"]',
    
    // Composer
    COMPOSER_CONTAINER: '[data-testid="composer"], .composer',
    COMPOSER_SEND_BUTTON: '[data-testid="composer-send-button"]',
    COMPOSER_ATTACHMENT: '[data-testid="composer-attachment-button"]',
    COMPOSER_EMOJI: '[data-testid="composer-emoji-button"]',
    
    // Loading States
    LOADING_SPINNER: '[data-testid="loading-spinner"], .loading, .spinner',
    LOADING_SKELETON: '[data-testid="loading-skeleton"], .skeleton',
    
    // Notifications
    NOTIFICATION: '[data-testid="notification"], .notification, .toast',
    ERROR_MESSAGE: '[data-testid="error-message"], .error, .alert-error',
    SUCCESS_MESSAGE: '[data-testid="success-message"], .success, .alert-success',
  },
  
  // Test Data
  TEST_MESSAGES: {
    WIDGET_TO_DASHBOARD: 'Widget to dashboard test message',
    DASHBOARD_TO_WIDGET: 'Dashboard to widget test message',
    LONG_MESSAGE: 'This is a longer test message to verify that the system can handle messages with more content and ensure proper formatting and display across both the widget and dashboard interfaces.',
    EMOJI_MESSAGE: 'Hello! 👋 How can I help you today? 😊',
    SPECIAL_CHARS: 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    INBOX: '/dashboard/inbox',
    TICKETS: '/dashboard/tickets',
    ANALYTICS: '/dashboard/analytics',
    SETTINGS: '/dashboard/settings',
    TEAM: '/dashboard/team',
    KNOWLEDGE: '/dashboard/knowledge',
    INTEGRATIONS: '/dashboard/integrations',
    NOTIFICATIONS: '/dashboard/notifications',
    HELP: '/dashboard/help',
    PROFILE: '/dashboard/profile',
  },
};

// Helper functions for common test operations
export const TestHelpers = {
  // Wait for element with multiple fallback selectors
  async waitForElement(page: any, selectors: string[], timeout = TEST_CONFIG.DEFAULT_TIMEOUT) {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return selector;
      } catch (error) {
        continue;
      }
    }
    throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
  },
  
  // Click element with fallback selectors
  async clickElement(page: any, selectors: string[], options = {}) {
    const selector = await this.waitForElement(page, selectors);
    await page.click(selector, options);
  },
  
  // Fill input with fallback selectors
  async fillInput(page: any, selectors: string[], value: string) {
    const selector = await this.waitForElement(page, selectors);
    await page.fill(selector, value);
  },
  
  // Wait for navigation
  async waitForNavigation(page: any, urlPattern: string) {
    await page.waitForURL(urlPattern, { timeout: TEST_CONFIG.NAVIGATION_TIMEOUT });
  },
  
  // Generate unique test message
  generateTestMessage(prefix: string = 'Test') {
    return `${prefix} message ${Date.now()}`;
  },
  
  // Wait for API response
  async waitForAPIResponse(page: any, urlPattern: string, timeout = TEST_CONFIG.API_TIMEOUT) {
    return page.waitForResponse(
      (response: any) => response.url().includes(urlPattern),
      { timeout }
    );
  },
};

export default TEST_CONFIG; 