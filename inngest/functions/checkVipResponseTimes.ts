import { KnownBlock } from "@slack/web-api";
import { and, desc, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { conversations, mailboxes, platformCustomers } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { formatDuration } from "@/inngest/functions/checkAssignedTicketResponseTimes";
import { getBaseUrl } from "@/lib/constants";
import { postSlackMessage } from "@/lib/slack/client";

export default inngest.createFunction(
  { id: "check-vip-response-times" },
  { cron: "0 * * * *" }, // Run every hour
  async () => {
    const mailboxesList = await db.query.mailboxes.findMany({
      where: and(
        isNotNull(mailboxes.vipThreshold),
        isNotNull(mailboxes.vipExpectedResponseHours),
        isNotNull(mailboxes.vipChannelId),
        isNotNull(mailboxes.slackBotToken)
      ),
    });

    if (!mailboxesList.length) return;

    for (const mailbox of mailboxesList) {
      const overdueVipConversations = await db
        .select({
          name: platformCustomers.name,
          subject: conversations.subject,
          slug: conversations.uid,
          lastUserEmailCreatedAt: conversations.lastActiveAt,
        })
        .from(conversations)
        .innerJoin(platformCustomers, eq(conversations.customerEmail, platformCustomers.email))
        .where(
          and(
            eq(conversations.mailboxId, mailbox.id),
            isNull(conversations.assignedToUserId),
            // isNull(conversations.mergedIntoId), // Field doesn't exist in schema
            eq(conversations.status, "open"),
            gt(
              sql`EXTRACT(EPOCH FROM (NOW() - ${conversations.lastActiveAt})) / 3600`,
              mailbox.vipExpectedResponseHours!
            ),
            gt(sql`CAST(${platformCustomers.value} AS INTEGER)`, (mailbox.vipThreshold ?? 0) * 100)
          )
        )
        .orderBy(desc(conversations.lastUserEmailCreatedAt));

      if (!overdueVipConversations.length) continue;

      const blocks: KnownBlock[] = [
        {
          type: "section" as const,
          text: {
            type: "mrkdwn",
            text: [
              `🚨 *${overdueVipConversations.length} ${overdueVipConversations.length === 1 ? "VIP" : "VIPs"} ${overdueVipConversations.length === 1 ? "has" : "have"} been waiting over ${
                mailbox.vipExpectedResponseHours ?? 0
              } ${mailbox.vipExpectedResponseHours === 1 ? "hour" : "hours"}*\n`,
              ...overdueVipConversations
                .slice(0, 10)
                .map(
                  (conversation) =>
                    `• <${getBaseUrl()}/mailboxes/${mailbox.slug}/conversations?id=${conversation.slug}|${conversation.subject?.replace(/\|<>/g, "") ?? "No subject"}> (${conversation.name}, ${formatDuration(conversation.lastUserEmailCreatedAt!)} since last reply)`
                ),
              ...(overdueVipConversations.length > 10 ? [`(and ${overdueVipConversations.length - 10} more)`] : []),
            ].join("\n"),
          },
        },
      ];

      await postSlackMessage(mailbox.slackBotToken!, {
        channel: mailbox.vipChannelId!,
        text: `VIP Response Time Alert for ${mailbox.name}`,
        blocks,
      });
    }

    return { success: true };
  }
);
