/**
 * Critical User Flows E2E Tests
 * Tests the most important user journeys end-to-end
 */

describe('Critical User Flows', () => {
  beforeEach(() => {
    // Setup test environment
    cy.task('cleanDatabase');
    cy.task('seedDatabase');
  });

  describe('User Registration & Onboarding', () => {
    it('should complete new user registration flow', () => {
      cy.visit('/');
      
      // Landing page should load
      cy.contains('Transform Every Customer Interaction').should('be.visible');
      
      // Click sign up
      cy.contains('Start Free Trial').click();
      
      // Fill registration form
      cy.get('[data-testid="email-input"]').type('jam@jam.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="company-name-input"]').type('Test Company');
      
      // Submit registration
      cy.get('[data-testid="register-button"]').click();
      
      // Should redirect to email verification
      cy.url().should('include', '/verify-email');
      cy.contains('Check your email').should('be.visible');
      
      // Simulate email verification (in real test, would check email)
      cy.task('createTestUser', { email: 'jam@jam.com', verified: true });
      
      // Navigate to dashboard
      cy.visit('/dashboard');
      
      // Should see dashboard
      cy.contains('Dashboard').should('be.visible');
      cy.get('[data-testid="metric-card"]').should('have.length.at.least', 4);
    });

    it('should complete organization setup', () => {
      // Login as new user
      cy.login('jam@jam.com', 'password123');
      
      // Navigate to organization setup
      cy.visit('/setup/organization');
      
      // Configure organization
      cy.get('[data-testid="org-name-input"]').clear().type('Acme Corp');
      cy.get('[data-testid="org-timezone-select"]').select('America/New_York');
      cy.get('[data-testid="org-industry-select"]').select('Technology');
      
      // Save configuration
      cy.get('[data-testid="save-org-button"]').click();
      
      // Should show success message
      cy.contains('Organization updated successfully').should('be.visible');
      
      // Should redirect to mailbox setup
      cy.url().should('include', '/setup/mailbox');
    });

    it('should configure first mailbox', () => {
      cy.login('jam@jam.com', 'password123');
      cy.visit('/setup/mailbox');
      
      // Configure mailbox
      cy.get('[data-testid="mailbox-name-input"]').type('Support');
      cy.get('[data-testid="mailbox-email-input"]').type('support@acmecorp.com');
      cy.get('[data-testid="mailbox-description-input"]').type('General customer support');
      
      // Enable AI features
      cy.get('[data-testid="enable-ai-checkbox"]').check();
      cy.get('[data-testid="ai-confidence-slider"]').invoke('val', 75).trigger('change');
      
      // Save mailbox
      cy.get('[data-testid="create-mailbox-button"]').click();
      
      // Should show success and redirect to dashboard
      cy.contains('Mailbox created successfully').should('be.visible');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Customer Support Conversation', () => {
    beforeEach(() => {
      // Setup authenticated user with configured organization
      cy.task('createTestUser', {
        email: 'jam@jam.com',
        role: 'agent',
        organizationId: 'test-org-1'
      });
      cy.login('jam@jam.com', 'password123');
    });

    it('should handle complete AI conversation flow', () => {
      // Customer opens widget
      cy.visit('/widget-demo'); // Demo page with embedded widget
      
      // Widget should load
      cy.get('[data-testid="widget-button"]').should('be.visible').click();
      cy.get('[data-testid="widget-panel"]').should('be.visible');
      
      // Customer types initial question
      cy.get('[data-testid="message-input"]')
        .type('Hi, I need help with my billing information{enter}');
      
      // AI should respond within 2 seconds
      cy.get('[data-testid="ai-message"]', { timeout: 2000 })
        .should('be.visible')
        .and('contain', 'billing');
      
      // Customer asks follow-up
      cy.get('[data-testid="message-input"]')
        .type('I want to update my credit card{enter}');
      
      // AI should provide helpful response
      cy.get('[data-testid="ai-message"]').last()
        .should('contain', 'credit card')
        .and('be.visible');
      
      // Check conversation appears in agent dashboard
      cy.visit('/dashboard');
      cy.get('[data-testid="active-conversations"]')
        .should('contain', 'billing information');
    });

    it('should handle AI-to-human handoff', () => {
      cy.visit('/widget-demo');
      
      // Open widget
      cy.get('[data-testid="widget-button"]').click();
      
      // Customer asks complex question that should trigger handoff
      cy.get('[data-testid="message-input"]')
        .type('I need to integrate your API with our custom enterprise system and have specific security requirements{enter}');
      
      // AI should recognize complexity and offer handoff
      cy.get('[data-testid="ai-message"]', { timeout: 3000 })
        .should('contain', 'connect you with a specialist');
      
      // Customer accepts handoff
      cy.get('[data-testid="handoff-accept-button"]').click();
      
      // Should show handoff in progress
      cy.get('[data-testid="handoff-status"]')
        .should('contain', 'Connecting you with an agent');
      
      // Agent should receive notification
      cy.visit('/dashboard');
      cy.get('[data-testid="handoff-notification"]')
        .should('be.visible')
        .and('contain', 'New handoff request');
      
      // Agent accepts handoff
      cy.get('[data-testid="accept-handoff-button"]').click();
      
      // Should see conversation with full context
      cy.get('[data-testid="conversation-context"]')
        .should('contain', 'API integration')
        .and('contain', 'enterprise system');
      
      // Agent can respond
      cy.get('[data-testid="agent-message-input"]')
        .type('I can help you with the API integration. Let me get some details about your requirements.{enter}');
      
      // Message should appear in customer widget
      cy.visit('/widget-demo');
      cy.get('[data-testid="widget-button"]').click();
      cy.get('[data-testid="agent-message"]')
        .should('contain', 'API integration');
    });

    it('should preserve context during handoff', () => {
      cy.visit('/widget-demo');
      cy.get('[data-testid="widget-button"]').click();
      
      // Build conversation history
      const messages = [
        'Hello, I need help with my account',
        'I\'m having trouble accessing my dashboard',
        'I get an error message when I try to log in',
        'The error says "Invalid credentials" but I\'m sure my password is correct'
      ];
      
      messages.forEach((message, index) => {
        cy.get('[data-testid="message-input"]').type(`${message}{enter}`);
        cy.get('[data-testid="ai-message"]').should('have.length', index + 1);
        cy.wait(1000); // Allow AI to respond
      });
      
      // Trigger handoff
      cy.get('[data-testid="message-input"]')
        .type('This is really urgent, I need to speak to a human{enter}');
      
      cy.get('[data-testid="handoff-accept-button"]').click();
      
      // Agent accepts handoff
      cy.visit('/dashboard');
      cy.get('[data-testid="accept-handoff-button"]').click();
      
      // Verify all context is preserved
      cy.get('[data-testid="conversation-history"]')
        .should('contain', 'trouble accessing my dashboard')
        .and('contain', 'Invalid credentials')
        .and('contain', 'password is correct');
      
      // Verify customer info is available
      cy.get('[data-testid="customer-info"]')
        .should('be.visible')
        .and('contain', 'Account Issues');
    });
  });

  describe('Dashboard Analytics', () => {
    beforeEach(() => {
      cy.task('createTestUser', {
        email: 'jam@jam.com',
        role: 'admin',
        organizationId: 'test-org-1'
      });
      cy.login('jam@jam.com', 'password123');
    });

    it('should display real-time metrics', () => {
      cy.visit('/dashboard');
      
      // Check metric cards are present
      cy.get('[data-testid="metric-active-conversations"]')
        .should('be.visible')
        .and('contain', 'Active Conversations');
      
      cy.get('[data-testid="metric-response-time"]')
        .should('be.visible')
        .and('contain', 'Response Time');
      
      cy.get('[data-testid="metric-ai-resolution"]')
        .should('be.visible')
        .and('contain', 'AI Resolution Rate');
      
      cy.get('[data-testid="metric-satisfaction"]')
        .should('be.visible')
        .and('contain', 'Customer Satisfaction');
      
      // Metrics should have actual values
      cy.get('[data-testid="metric-value"]').each(($el) => {
        cy.wrap($el).should('not.be.empty');
      });
    });

    it('should update metrics in real-time', () => {
      cy.visit('/dashboard');
      
      // Get initial conversation count
      cy.get('[data-testid="metric-active-conversations"] [data-testid="metric-value"]')
        .invoke('text')
        .then((initialCount) => {
          // Simulate new conversation in another tab
          cy.task('createTestConversation', { organizationId: 'test-org-1' });
          
          // Wait for real-time update
          cy.wait(2000);
          
          // Check if count increased
          cy.get('[data-testid="metric-active-conversations"] [data-testid="metric-value"]')
            .should('not.contain', initialCount);
        });
    });
  });

  describe('Widget Integration', () => {
    it('should embed widget correctly', () => {
      // Visit page with embedded widget
      cy.visit('/widget-demo');
      
      // Widget button should be positioned correctly
      cy.get('[data-testid="widget-button"]')
        .should('be.visible')
        .and('have.css', 'position', 'fixed')
        .and('have.css', 'bottom')
        .and('have.css', 'right');
      
      // Widget should be responsive
      cy.viewport(375, 667); // Mobile size
      cy.get('[data-testid="widget-button"]').should('be.visible');
      
      cy.viewport(1280, 720); // Desktop size
      cy.get('[data-testid="widget-button"]').should('be.visible');
    });

    it('should handle offline scenarios', () => {
      cy.visit('/widget-demo');
      cy.get('[data-testid="widget-button"]').click();
      
      // Simulate offline
      cy.window().then((win) => {
        win.navigator.onLine = false;
        win.dispatchEvent(new Event('offline'));
      });
      
      // Should show offline message
      cy.get('[data-testid="offline-indicator"]')
        .should('be.visible')
        .and('contain', 'offline');
      
      // Messages should queue
      cy.get('[data-testid="message-input"]')
        .type('This message should be queued{enter}');
      
      cy.get('[data-testid="queued-message"]')
        .should('be.visible')
        .and('contain', 'queued');
      
      // Simulate back online
      cy.window().then((win) => {
        win.navigator.onLine = true;
        win.dispatchEvent(new Event('online'));
      });
      
      // Queued messages should send
      cy.get('[data-testid="sent-message"]')
        .should('contain', 'This message should be queued');
    });
  });
});
