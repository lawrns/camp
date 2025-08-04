/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication Commands
Cypress.Commands.add('loginAsUser', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for successful login
    cy.wait('@signIn');
    cy.url().should('include', '/dashboard');
    
    // Verify user is logged in
    cy.window().its('localStorage').invoke('getItem', 'supabase.auth.token')
      .should('exist');
  }, {
    validate() {
      // Validate session is still active
      cy.request({
        url: '/api/auth/session',
        failOnStatusCode: false
      }).then((resp) => {
        expect(resp.status).to.eq(200);
      });
    }
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  const adminEmail = Cypress.env('TEST_ADMIN_EMAIL');
  const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD');
  cy.loginAsUser(adminEmail, adminPassword);
});

// Conversation Commands
Cypress.Commands.add('createTestConversation', (data = {}) => {
  const defaultData = {
    title: 'Test Conversation',
    status: 'active',
    priority: 'medium',
    channel: 'web',
    ...data
  };
  
  cy.request({
    method: 'POST',
    url: '/api/conversations',
    body: defaultData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    cy.wrap(response.body).as('testConversation');
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('sendTestMessage', (content: string) => {
  cy.get('@testConversation').then((conversation: unknown) => {
    cy.request({
      method: 'POST',
      url: '/api/messages',
      body: {
        conversationId: conversation.id,
        content,
        type: 'text',
        sender: 'user'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      return cy.wrap(response.body);
    });
  });
});

Cypress.Commands.add('triggerTestHandoff', (reason = 'Need human assistance') => {
  cy.get('@testConversation').then((conversation: unknown) => {
    cy.request({
      method: 'POST',
      url: '/api/handoff/trigger',
      body: {
        conversationId: conversation.id,
        reason,
        priority: 'medium'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      return cy.wrap(response.body);
    });
  });
});

// UI Helper Commands
Cypress.Commands.add('waitForElement', (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

Cypress.Commands.add('typeSlowly', { prevSubject: 'element' }, (subject, text: string, delay = 100) => {
  for (let i = 0; i < text.length; i++) {
    cy.wrap(subject).type(text[i]);
    cy.wait(delay);
  }
});

Cypress.Commands.add('dragAndDrop', (sourceSelector: string, targetSelector: string) => {
  cy.get(sourceSelector).trigger('mousedown', { button: 0 });
  cy.get(targetSelector).trigger('mousemove').trigger('mouseup');
});

// Form Helpers
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"], [name="${field}"], #${field}`)
      .clear()
      .type(value);
  });
});

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit();
});

// API Helpers
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: unknown) => {
  return cy.request({
    method,
    url,
    body,
    headers: {
      'Content-Type': 'application/json'
    },
    failOnStatusCode: false
  });
});

// File Upload
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType = 'text/plain') => {
  cy.fixture(fileName).then((content) => {
    const blob = new Blob([content], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });
    
    cy.get(selector).then((input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input[0].files = dataTransfer.files;
      
      cy.wrap(input).trigger('change', { force: true });
    });
  });
});

// Screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  // Wait for any loading spinners to disappear
  cy.get('[data-testid="loading"], .loading, .spinner').should('not.exist');
  
  // Wait for skeleton loaders to disappear
  cy.get('[data-testid="skeleton"], .skeleton').should('not.exist');
});

// Check for console errors
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = [];
    const originalError = win.console.error;
    
    win.console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(win.console, args);
    };
    
    cy.wrap(errors).as('consoleErrors');
  });
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (actionName: string) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    
    return cy.wrap(null).then(() => {
      const endTime = win.performance.now();
      const duration = endTime - startTime;
      
      cy.log(`${actionName} took ${duration.toFixed(2)}ms`);
      
      // Assert performance threshold (2 seconds)
      expect(duration).to.be.lessThan(2000);
      
      return duration;
    });
  });
});

// Local Storage Helpers
Cypress.Commands.add('setLocalStorage', (key: string, value: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getLocalStorage', (key: string) => {
  return cy.window().then((win) => {
    return win.localStorage.getItem(key);
  });
});

// Cookie Helpers
Cypress.Commands.add('setCookieWithOptions', (name: string, value: string, options = {}) => {
  cy.setCookie(name, value, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    ...options
  });
});

// Network Simulation
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      // Add 2 second delay to simulate slow network
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 2000);
      });
    });
  });
});

Cypress.Commands.add('simulateNetworkError', (statusCode = 500) => {
  cy.intercept('**', {
    statusCode,
    body: { error: 'Network error simulation' }
  });
});

// Extend Cypress namespace for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      waitForElement(selector: string, timeout?: number): Chainable<void>;
      typeSlowly(text: string, delay?: number): Chainable<void>;
      dragAndDrop(sourceSelector: string, targetSelector: string): Chainable<void>;
      fillForm(formData: Record<string, string>): Chainable<void>;
      submitForm(formSelector?: string): Chainable<void>;
      apiRequest(method: string, url: string, body?: unknown): Chainable<any>;
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>;
      screenshotWithTimestamp(name: string): Chainable<void>;
      waitForLoading(): Chainable<void>;
      checkConsoleErrors(): Chainable<void>;
      measurePerformance(actionName: string): Chainable<number>;
      setLocalStorage(key: string, value: string): Chainable<void>;
      getLocalStorage(key: string): Chainable<string | null>;
      setCookieWithOptions(name: string, value: string, options?: unknown): Chainable<void>;
      simulateSlowNetwork(): Chainable<void>;
      simulateNetworkError(statusCode?: number): Chainable<void>;
    }
  }
}