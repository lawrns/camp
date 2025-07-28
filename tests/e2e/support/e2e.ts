// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions. This is useful for third-party code
  // that might throw errors we can't control.
  
  // Don't fail on these specific errors
  if (
    err.message.includes('ResizeObserver loop limit exceeded') ||
    err.message.includes('Non-Error promise rejection captured') ||
    err.message.includes('ChunkLoadError')
  ) {
    return false;
  }
  
  // Let other errors fail the test
  return true;
});

// Global hooks
beforeEach(() => {
  // Clear local storage and session storage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up common aliases
  cy.intercept('GET', '/api/auth/session').as('getSession');
  cy.intercept('POST', '/api/auth/signin').as('signIn');
  cy.intercept('POST', '/api/auth/signout').as('signOut');
  cy.intercept('GET', '/api/conversations*').as('getConversations');
  cy.intercept('POST', '/api/conversations').as('createConversation');
  cy.intercept('GET', '/api/messages*').as('getMessages');
  cy.intercept('POST', '/api/messages').as('sendMessage');
  cy.intercept('POST', '/api/ai/generate').as('generateAI');
  cy.intercept('POST', '/api/handoff/trigger').as('triggerHandoff');
});

// Custom viewport sizes
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Performance monitoring
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const perfData = win.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    cy.log(`Page load time: ${pageLoadTime}ms`);
    
    // Assert page loads within 3 seconds
    expect(pageLoadTime).to.be.lessThan(3000);
  });
});

// Accessibility testing
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  cy.get('button, a').each(($el) => {
    cy.wrap($el).should('be.visible');
  });
});

// Wait for network idle
Cypress.Commands.add('waitForNetworkIdle', (timeout = 5000) => {
  let requestCount = 0;
  
  cy.intercept('**', (req) => {
    requestCount++;
    req.continue((res) => {
      requestCount--;
    });
  });
  
  cy.waitUntil(() => requestCount === 0, {
    timeout,
    interval: 100,
    errorMsg: 'Network did not become idle'
  });
});

// Database helpers
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('cleanTestData', () => {
  cy.task('cleanDatabase');
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      measurePageLoad(): Chainable<void>;
      checkA11y(): Chainable<void>;
      waitForNetworkIdle(timeout?: number): Chainable<void>;
      seedTestData(): Chainable<void>;
      cleanTestData(): Chainable<void>;
      loginAsUser(email: string, password: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      createTestConversation(data?: any): Chainable<void>;
      sendTestMessage(content: string): Chainable<void>;
      triggerTestHandoff(reason?: string): Chainable<void>;
    }
  }
}