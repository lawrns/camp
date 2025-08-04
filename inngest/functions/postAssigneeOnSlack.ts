import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { conversations } from "@/db/schema";
import { AssignEvent, inngest } from "@/inngest/client";
import { SlackIntegrationAdapter } from "@/lib/adapters/SlackIntegrationAdapter";
import { getBaseUrl } from "@/lib/constants";
import { getClerkUser } from "@/lib/data/user";
import { postSlackDM, postSlackMessage } from "@/lib/slack/client";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";

export const notifySlackAssignment = async (conversationId: string, assignEvent: AssignEvent) => {
  if (!(assignEvent as unknown).assignedToId) return "Not posted, no assignee";

  const conversation = assertDefinedOrRaiseNonRetriableError(
    await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        mailbox: true,
      },
    })
  );
  const assignedBy = (assignEvent as unknown).assignedById ? await getClerkUser((assignEvent as unknown).assignedById) : null;

  // Check for Slack configuration using adapter
  const slackConfig = SlackIntegrationAdapter.getSlackConfig(conversation.mailbox);

  if (!SlackIntegrationAdapter.isSlackConfigured(conversation.mailbox)) {
    return "Not posted, mailbox not linked to Slack or missing alert channel";
  }

  const assignee = conversation.assignedToUserId ? await getClerkUser(conversation.assignedToUserId) : null;
  if (!assignee) {
    return "Not posted, no assignee";
  }

  // Process assignee and assigned by users using adapter
  const slackAssignee = SlackIntegrationAdapter.getSlackUser(assignee);
  const slackAssignedBy = assignedBy ? SlackIntegrationAdapter.getSlackUser(assignedBy) : undefined;
  const heading = SlackIntegrationAdapter.formatSlackHeading(
    conversation.customerEmail,
    slackAssignee,
    slackAssignedBy
  );
  const attachments = [
    {
      color: "#EF4444",
      blocks: [
        ...(assignEvent.message
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Note:* ${assignEvent.message}`,
                },
              },
            ]
          : []),
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${getBaseUrl()}/mailboxes/${(conversation.mailbox as unknown).slug}/conversations?id=${
              conversation.uid
            }|View in Helper>`,
          },
        },
      ],
    },
  ];

  if (slackAssignee.slackUserId) {
    await postSlackDM(slackConfig.slackBotToken!, slackAssignee.slackUserId, { text: heading, attachments });
  } else {
    await postSlackMessage(slackConfig.slackBotToken!, {
      text: heading,
      mrkdwn: true,
      channel: slackConfig.slackAlertChannel!,
      attachments,
    });
  }

  return "Posted";
};

export default inngest.createFunction(
  { id: "post-assignee-to-slack" },
  { event: "conversations/assigned" },
  async ({ event, step }) => {
    const {
      data: { conversationId },
    } = event;

    await step.run("handle", async () => {
      return await notifySlackAssignment(conversationId, event.data.assignEvent);
    });
  }
);
