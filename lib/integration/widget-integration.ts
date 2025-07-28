/**
 * Widget Integration Layer
 * Connects the architectural patterns with existing widget components
 * Follows GUIDE.md specifications for widget functionality
 */
import React from 'react';
import { useWidgetStore } from '../state/widget-state';
import { sanitizeMessage, validateMessageContent } from '../security/input-sanitization';
import { widgetLogger } from '../monitoring/structured-logging';

export interface WidgetIntegrationConfig {
  organizationId: string;
  conversationId?: string;
  enableSecurity: boolean;
  enableMonitoring: boolean;
}

export class WidgetIntegration {
  private config: WidgetIntegrationConfig;

  constructor(config: WidgetIntegrationConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    widgetLogger.info('Widget integration initialized', {
      organizationId: this.config.organizationId,
      conversationId: this.config.conversationId,
      features: {
        security: this.config.enableSecurity,
        monitoring: this.config.enableMonitoring
      }
    });
  }

  /**
   * Connect widget state management
   */
  public connectStateManagement() {
    const store = useWidgetStore.getState();
    
    // Initialize widget state
    store.setOrganizationId(this.config.organizationId);
    if (this.config.conversationId) {
      store.setConversationId(this.config.conversationId);
    }

    widgetLogger.info('Widget state management connected', {
      organizationId: this.config.organizationId
    });

    return store;
  }

  /**
   * Connect security features
   */
  public connectSecurity() {
    if (!this.config.enableSecurity) {
      widgetLogger.info('Security features disabled');
      return;
    }

    // Validate and sanitize incoming messages
    const store = useWidgetStore.getState();
    const originalAddMessage = store.addMessage;

    store.addMessage = (message) => {
      // Sanitize message content
      const sanitizedContent = sanitizeMessage(message.content);
      
      // Validate message
      const validation = validateMessageContent(sanitizedContent);
      if (!validation.isValid) {
        widgetLogger.warn('Message validation failed', {
          errors: validation.errors,
          messageId: message.id
        });
        return;
      }

      // Add sanitized message
      originalAddMessage({
        ...message,
        content: sanitizedContent
      });
    };

    widgetLogger.info('Security features connected');
  }

  /**
   * Connect monitoring and observability
   */
  public connectMonitoring() {
    if (!this.config.enableMonitoring) {
      widgetLogger.info('Monitoring disabled');
      return;
    }

    // Log monitoring connection
    widgetLogger.info('Widget monitoring connected', {
      organizationId: this.config.organizationId,
      conversationId: this.config.conversationId
    });
  }

  /**
   * Send a message with full integration
   */
  public async sendMessage(content: string): Promise<boolean> {
    try {
      // Security: Validate and sanitize
      if (this.config.enableSecurity) {
        const validation = validateMessageContent(content);
        if (!validation.isValid) {
          widgetLogger.warn('Message validation failed', { errors: validation.errors });
          return false;
        }
        content = sanitizeMessage(content);
      }

      // State: Add optimistic message
      const store = useWidgetStore.getState();
      const messageId = `temp-${Date.now()}`;
      store.addMessage({
        id: messageId,
        content,
        senderType: 'customer',
        timestamp: new Date(),
        metadata: {}
      });

      // Monitoring: Track message sent
      if (this.config.enableMonitoring) {
        widgetLogger.info('Message sent', {
          messageId,
          contentLength: content.length,
          organizationId: this.config.organizationId
        });
      }

      return true;
    } catch (error) {
      widgetLogger.error('Failed to send message', error as Error, { content });
      return false;
    }
  }

  /**
   * Clean up all connections
   */
  public cleanup() {
    widgetLogger.info('Widget integration cleaned up');
  }
}

/**
 * React hook for widget integration
 */
export function useWidgetIntegration(config: WidgetIntegrationConfig) {
  const [integration, setIntegration] = React.useState<WidgetIntegration | null>(null);

  React.useEffect(() => {
    const widgetIntegration = new WidgetIntegration(config);
    setIntegration(widgetIntegration);

    // Connect all features
    widgetIntegration.connectStateManagement();
    widgetIntegration.connectSecurity();
    widgetIntegration.connectMonitoring();

    return () => {
      widgetIntegration.cleanup();
    };
  }, [config.organizationId, config.conversationId]);

  return integration;
} 