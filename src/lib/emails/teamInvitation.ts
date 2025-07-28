/**
 * Team Invitation Email Service
 *
 * Handles sending team invitation emails
 */

export interface TeamInvitationData {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteToken: string;
  inviteUrl: string;
}

export const sendTeamInvitation = async (recipientEmail: string, data: TeamInvitationData) => {
  // In a real implementation, this would integrate with an email service
  // like SendGrid, Resend, or similar

  const emailContent = `
    <h2>You've been invited to join ${data.organizationName}</h2>
    <p>${data.inviterName} (${data.inviterEmail}) has invited you to join their team on Campfire.</p>
    <p><a href="${data.inviteUrl}">Accept Invitation</a></p>
    <p>If you can't click the link, copy and paste this URL into your browser:</p>
    <p>${data.inviteUrl}</p>
  `;

  // Mock implementation - in production, replace with actual email service

  // Return success for now
  return { success: true, messageId: `mock_${Date.now()}` };
};

export const generateInviteUrl = (
  token: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3012"
) => {
  return `${baseUrl}/invite/accept?token=${token}`;
};
