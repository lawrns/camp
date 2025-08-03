describe('AI-Human Handoff Flow', () => {
  beforeEach(() => {
    // Login as test user
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('jam@jam.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should trigger handoff from AI to human agent', () => {
    // Navigate to a conversation
    cy.get('[data-testid="conversation-item"]').first().click();
    
    // Verify AI is handling the conversation
    cy.get('[data-testid="conversation-status"]').should('contain', 'AI Assistant');
    
    // Trigger handoff
    cy.get('[data-testid="handoff-button"]').click();
    
    // Confirm handoff dialog
    cy.get('[data-testid="handoff-confirm"]').click();
    
    // Verify handoff was successful
    cy.get('[data-testid="conversation-status"]').should('contain', 'Human Agent');
    cy.get('[data-testid="handoff-notification"]').should('be.visible');
  });

  it('should preserve conversation context during handoff', () => {
    // Start a conversation with AI
    cy.get('[data-testid="new-conversation"]').click();
    cy.get('[data-testid="message-input"]').type('I need help with my order #12345');
    cy.get('[data-testid="send-button"]').click();
    
    // Wait for AI response
    cy.get('[data-testid="ai-message"]').should('be.visible');
    
    // Trigger handoff
    cy.get('[data-testid="handoff-button"]').click();
    cy.get('[data-testid="handoff-confirm"]').click();
    
    // Verify context is preserved
    cy.get('[data-testid="conversation-history"]').should('contain', 'order #12345');
    cy.get('[data-testid="handoff-context"]').should('be.visible');
  });

  it('should notify human agents of pending handoffs', () => {
    // Switch to agent view
    cy.get('[data-testid="agent-mode"]').click();
    
    // Create a handoff from another session (simulate)
    cy.request('POST', '/api/conversations/handoff', {
      conversationId: 'test-conversation-1',
      reason: 'Complex technical issue'
    });
    
    // Verify notification appears
    cy.get('[data-testid="handoff-notification"]').should('be.visible');
    cy.get('[data-testid="pending-handoffs"]').should('contain', '1');
    
    // Accept handoff
    cy.get('[data-testid="accept-handoff"]').click();
    
    // Verify agent is now handling the conversation
    cy.get('[data-testid="active-conversations"]').should('contain', 'test-conversation-1');
  });

  it('should handle handoff rejection gracefully', () => {
    // Navigate to conversation
    cy.get('[data-testid="conversation-item"]').first().click();
    
    // Trigger handoff
    cy.get('[data-testid="handoff-button"]').click();
    
    // Cancel handoff
    cy.get('[data-testid="handoff-cancel"]').click();
    
    // Verify conversation remains with AI
    cy.get('[data-testid="conversation-status"]').should('contain', 'AI Assistant');
    cy.get('[data-testid="handoff-dialog"]').should('not.exist');
  });

  it('should track handoff metrics', () => {
    // Navigate to analytics
    cy.get('[data-testid="analytics-tab"]').click();
    
    // Verify handoff metrics are displayed
    cy.get('[data-testid="handoff-rate"]').should('be.visible');
    cy.get('[data-testid="avg-handoff-time"]').should('be.visible');
    cy.get('[data-testid="handoff-reasons"]').should('be.visible');
  });
});