/**
 * Email Infrastructure Service
 * Provides email sending capabilities for the application
 */

export interface EmailOptions {
  to: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  template?: {
    name: string;
    data: Record<string, any>;
  };
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: "attachment" | "inline";
  cid?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Mock implementation - in real app, this would use a service like SendGrid, AWS SES, etc.

    // Validate required fields
    if (!options.to || !options.subject) {
      throw new Error("Missing required fields: to, subject");
    }

    if (!options.text && !options.html && !options.template) {
      throw new Error("Email must have text, html, or template content");
    }

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock message ID
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  organizationName: string
): Promise<EmailResult> {
  return sendEmail({
    to: userEmail,
    subject: `Welcome to ${organizationName}!`,
    template: {
      name: "welcome",
      data: {
        userName,
        organizationName,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    },
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetToken: string,
  userName?: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

  return sendEmail({
    to: userEmail,
    subject: "Reset your password",
    template: {
      name: "password-reset",
      data: {
        userName: userName || "User",
        resetUrl,
        expiresIn: "24 hours",
      },
    },
  });
}

/**
 * Send an invitation email
 */
export async function sendInvitationEmail(
  inviteEmail: string,
  inviterName: string,
  organizationName: string,
  inviteToken: string
): Promise<EmailResult> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inviteToken}`;

  return sendEmail({
    to: inviteEmail,
    subject: `${inviterName} invited you to join ${organizationName}`,
    template: {
      name: "invitation",
      data: {
        inviterName,
        organizationName,
        inviteUrl,
        expiresIn: "7 days",
      },
    },
  });
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  userEmail: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<EmailResult> {
  return sendEmail({
    to: userEmail,
    subject: title,
    template: {
      name: "notification",
      data: {
        title,
        message,
        actionUrl,
        actionText,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
      },
    },
  });
}

/**
 * Send a conversation summary email
 */
export async function sendConversationSummaryEmail(
  userEmail: string,
  conversationId: string,
  summary: string,
  customerName?: string
): Promise<EmailResult> {
  const conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inbox?conversation=${conversationId}`;

  return sendEmail({
    to: userEmail,
    subject: `Conversation summary: ${customerName || "Customer conversation"}`,
    template: {
      name: "conversation-summary",
      data: {
        conversationId,
        summary,
        customerName: customerName || "Customer",
        conversationUrl,
      },
    },
  });
}

/**
 * Send a bulk email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; data?: Record<string, any> }>,
  template: string,
  commonData: Record<string, any> = {}
): Promise<EmailResult[]> {
  const results = await Promise.all(
    recipients.map(async ({ email, data = {} }) => {
      return sendEmail({
        to: email,
        subject: commonData.subject || "Notification",
        template: {
          name: template,
          data: { ...commonData, ...data },
        },
      });
    })
  );

  return results;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || "noreply@campfire.ai",
    replyTo: process.env.EMAIL_REPLY_TO || "support@campfire.ai",
    provider: process.env.EMAIL_PROVIDER || "mock",
    apiKey: process.env.EMAIL_API_KEY,
    templates: {
      welcome: "welcome-template",
      "password-reset": "password-reset-template",
      invitation: "invitation-template",
      notification: "notification-template",
      "conversation-summary": "conversation-summary-template",
    },
  };
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return !!(config.apiKey || config.provider === "mock");
}
