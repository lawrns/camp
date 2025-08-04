// ***********************************************************
// This example support/component.ts is processed and
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
import { mount } from 'cypress/react18';
import React from 'react';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Example use:
// cy.mount(<MyComponent />)

// Global configuration for component tests
beforeEach(() => {
  // Reset any global state before each test
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Mock providers for component testing
Cypress.Commands.add('mountWithProviders', (component: React.ReactElement, options = {}) => {
  const defaultOptions = {
    // Add default providers here
    ...options
  };
  
  cy.mount(component, defaultOptions);
});

// Component testing utilities
Cypress.Commands.add('testComponent', (component: React.ReactElement) => {
  cy.mount(component);
  
  // Basic accessibility checks
  cy.get('*').should('be.visible');
  
  // Check for console errors
  cy.window().then((win) => {
    const errors: string[] = [];
    const originalError = win.console.error;
    
    win.console.error = (...args: unknown[]) => {
      errors.push(args.join(' '));
      originalError.apply(win.console, args);
    };
    
    cy.wrap(errors).should('have.length', 0);
  });
});

// Theme testing
Cypress.Commands.add('testWithTheme', (component: React.ReactElement, theme: 'light' | 'dark' = 'light') => {
  const ThemedComponent = React.createElement('div', { 
    'data-theme': theme, 
    className: theme 
  }, component);
  
  cy.mount(ThemedComponent);
});

// Responsive testing
Cypress.Commands.add('testResponsive', (component: React.ReactElement) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' }
  ];
  
  viewports.forEach(({ width, height, name }) => {
    cy.viewport(width, height);
    cy.mount(component);
    cy.get('*').should('be.visible');
    cy.screenshot(`${name}-view`);
  });
});

// Form testing utilities
Cypress.Commands.add('testFormValidation', (formComponent: React.ReactElement) => {
  cy.mount(formComponent);
  
  // Test empty form submission
  cy.get('form').submit();
  cy.get('[data-testid*="error"], .error, [role="alert"]').should('exist');
  
  // Test invalid data
  cy.get('input[type="email"]').type('invalid-email');
  cy.get('form').submit();
  cy.get('[data-testid*="error"], .error, [role="alert"]').should('exist');
});

// Animation testing
Cypress.Commands.add('testAnimations', (component: React.ReactElement) => {
  cy.mount(component);
  
  // Disable animations for consistent testing
  cy.get('*').invoke('css', 'animation-duration', '0s');
  cy.get('*').invoke('css', 'transition-duration', '0s');
});

// Interaction testing
Cypress.Commands.add('testInteractions', (component: React.ReactElement) => {
  cy.mount(component);
  
  // Test keyboard navigation
  cy.get('button, a, input, select, textarea').each(($el) => {
    cy.wrap($el).focus().should('have.focus');
  });
  
  // Test click interactions
  cy.get('button, a').each(($el) => {
    cy.wrap($el).click();
  });
});

// Performance testing for components
Cypress.Commands.add('testComponentPerformance', (component: React.ReactElement) => {
  const startTime = performance.now();
  
  cy.mount(component).then(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    cy.log(`Component render time: ${renderTime.toFixed(2)}ms`);
    
    // Assert component renders within 100ms
    expect(renderTime).to.be.lessThan(100);
  });
});

// Extend Cypress namespace for component testing
declare global {
  namespace Cypress {
    interface Chainable {
      mountWithProviders(component: React.ReactElement, options?: unknown): Chainable<void>;
      testComponent(component: React.ReactElement): Chainable<void>;
      testWithTheme(component: React.ReactElement, theme?: 'light' | 'dark'): Chainable<void>;
      testResponsive(component: React.ReactElement): Chainable<void>;
      testFormValidation(formComponent: React.ReactElement): Chainable<void>;
      testAnimations(component: React.ReactElement): Chainable<void>;
      testInteractions(component: React.ReactElement): Chainable<void>;
      testComponentPerformance(component: React.ReactElement): Chainable<void>;
    }
  }
}