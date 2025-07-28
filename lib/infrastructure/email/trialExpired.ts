/**
 * Trial expired email service
 */

import { Resend } from "resend";

interface TrialExpiredEmailData {
  organizationId: string;
  organizationName: string;
  adminEmail: string;
  adminName: string;
  trialEndDate: Date;
  billingUrl: string;
}

interface EmailConfig {
  from: string;
  replyTo?: string;
  apiKey: string;
}

export class TrialExpiredEmailService {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  async sendTrialExpiredEmail(data: TrialExpiredEmailData): Promise<void> {
    try {
      const emailHtml = this.generateTrialExpiredEmailHtml(data);
      const emailText = this.generateTrialExpiredEmailText(data);

      const emailOptions: any = {
        from: this.config.from,
        to: data.adminEmail,
        subject: `${data.organizationName} - Trial Expired`,
        html: emailHtml,
        text: emailText,
      };

      if (this.config.replyTo !== undefined) {
        emailOptions.replyTo = this.config.replyTo;
      }

      await this.resend.emails.send(emailOptions);
    } catch (error) {
      throw error;
    }
  }

  private generateTrialExpiredEmailHtml(data: TrialExpiredEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Trial Expired - ${data.organizationName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e2e8f0;
              border-radius: 0 0 8px 8px;
            }
            .cta-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Trial Expired</h1>
            <p>Your Campfire trial has ended</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.adminName},</p>
            
            <p>Your trial for <strong>${data.organizationName}</strong> expired on ${data.trialEndDate.toLocaleDateString()}.</p>
            
            <p>To continue using Campfire and keep your customer conversations running smoothly, please upgrade to a paid plan.</p>
            
            <p>Here's what you'll get with a paid plan:</p>
            <ul>
              <li>Unlimited conversations</li>
              <li>Advanced AI features</li>
              <li>Team collaboration tools</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
            </ul>
            
            <p>
              <a href="${data.billingUrl}" class="cta-button">Upgrade Now</a>
            </p>
            
            <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The Campfire Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${data.adminEmail} for ${data.organizationName}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTrialExpiredEmailText(data: TrialExpiredEmailData): string {
    return `
Hi ${data.adminName},

Your trial for ${data.organizationName} expired on ${data.trialEndDate.toLocaleDateString()}.

To continue using Campfire and keep your customer conversations running smoothly, please upgrade to a paid plan.

Here's what you'll get with a paid plan:
- Unlimited conversations
- Advanced AI features
- Team collaboration tools
- Priority support
- Advanced analytics

Upgrade now: ${data.billingUrl}

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Campfire Team

---
This email was sent to ${data.adminEmail} for ${data.organizationName}
    `.trim();
  }
}

// Default service instance
export const trialExpiredEmailService = new TrialExpiredEmailService({
  from: "Campfire <noreply@campfire.com>",
  replyTo: "support@campfire.com",
  apiKey: process.env.RESEND_API_KEY || "",
});

// Helper function to send trial expired email
export async function sendTrialExpiredEmail(data: TrialExpiredEmailData): Promise<void> {
  return trialExpiredEmailService.sendTrialExpiredEmail(data);
}
