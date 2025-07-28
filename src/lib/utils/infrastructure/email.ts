/**
 * Email infrastructure utilities
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress[];
  from: EmailAddress;
  replyTo?: EmailAddress;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  templateId?: string;
  templateVariables?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  encoding?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface EmailProvider {
  name: string;
  send: (message: EmailMessage) => Promise<EmailSendResult>;
  sendTemplate: (templateId: string, to: EmailAddress[], variables: Record<string, any>) => Promise<EmailSendResult>;
  validateEmail: (email: string) => boolean;
}

// Email validation utility
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Email formatting utilities
export function formatEmailAddress(address: EmailAddress): string {
  if (address.name) {
    return `"${address.name}" <${address.email}>`;
  }
  return address.email;
}

export function parseEmailAddress(addressString: string): EmailAddress {
  const match = addressString.match(/^"?([^"]*?)"?\s*<(.+)>$/);
  if (match && match[1] && match[2]) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }
  return {
    email: addressString.trim(),
  };
}

// Template processing
export function processEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, any>
): { subject: string; htmlBody: string; textBody: string } {
  const processString = (str: string): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] ?? match;
    });
  };

  return {
    subject: processString(template.subject),
    htmlBody: processString(template.htmlBody),
    textBody: processString(template.textBody),
  };
}

// Mock email provider for development
export class MockEmailProvider implements EmailProvider {
  name = "Mock Email Provider";

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: "Mock network error",
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
  }

  async sendTemplate(templateId: string, to: EmailAddress[], variables: Record<string, any>): Promise<EmailSendResult> {
    return this.send({
      to,
      from: { email: "noreply@example.com", name: "Mock Service" },
      subject: `Template ${templateId}`,
      textBody: `Template email with variables: ${JSON.stringify(variables)}`,
    });
  }

  validateEmail(email: string): boolean {
    return validateEmail(email);
  }
}

// Email service class
export class EmailService {
  private provider: EmailProvider;
  private templates = new Map<string, EmailTemplate>();

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Validate email addresses
    const allAddresses = [
      ...message.to,
      message.from,
      ...(message.cc || []),
      ...(message.bcc || []),
      ...(message.replyTo ? [message.replyTo] : []),
    ];

    for (const address of allAddresses) {
      if (!this.provider.validateEmail(address.email)) {
        return {
          success: false,
          error: `Invalid email address: ${address.email}`,
          timestamp: new Date(),
        };
      }
    }

    // Send via provider
    return this.provider.send(message);
  }

  async sendTemplate(
    templateId: string,
    to: EmailAddress[],
    variables: Record<string, any> = {}
  ): Promise<EmailSendResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateId}`,
        timestamp: new Date(),
      };
    }

    const processed = processEmailTemplate(template, variables);

    return this.send({
      to,
      from: { email: "noreply@campfire.com", name: "Campfire" },
      subject: processed.subject,
      htmlBody: processed.htmlBody,
      textBody: processed.textBody,
    });
  }

  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}

// Default email service instance
export const emailService = new EmailService(new MockEmailProvider());

// Register default templates
emailService.registerTemplate({
  id: "welcome",
  name: "Welcome Email",
  subject: "Welcome to {{organizationName}}!",
  htmlBody: `
    <h1>Welcome {{customerName}}!</h1>
    <p>Thank you for contacting {{organizationName}}. We'll get back to you soon.</p>
  `,
  textBody: `
    Welcome {{customerName}}!
    
    Thank you for contacting {{organizationName}}. We'll get back to you soon.
  `,
  variables: ["customerName", "organizationName"],
});

emailService.registerTemplate({
  id: "ticket_created",
  name: "Ticket Created",
  subject: "Ticket #{{ticketNumber}} Created",
  htmlBody: `
    <h1>Your ticket has been created</h1>
    <p>Ticket #{{ticketNumber}}: {{ticketTitle}}</p>
    <p>Status: {{ticketStatus}}</p>
  `,
  textBody: `
    Your ticket has been created
    
    Ticket #{{ticketNumber}}: {{ticketTitle}}
    Status: {{ticketStatus}}
  `,
  variables: ["ticketNumber", "ticketTitle", "ticketStatus"],
});

// Export utilities - already exported above
