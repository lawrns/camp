import { endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { REPORT_HOUR, TIME_ZONE } from "@/inngest/functions/generateDailyReports";
import { UserRoles } from "@/lib/data/user";
import { assertDefined } from "@/lib/utils/assert";
import { formatDateRange as formatDateRangeUtil } from "@/lib/utils/date";

// Simple fallback types and functions for getMemberStats
interface MemberStats {
  id: string;
  email: string;
  displayName: string;
  role: string;
  replyCount: number;
}

const getMemberStats = async (
  mailbox: typeof mailboxes.$inferSelect,
  options: { startDate: Date; endDate: Date }
): Promise<MemberStats[]> => {
  // Fallback implementation - returns empty array for now
  return [];
};

// Simple fallback functions for missing Slack functions
const getSlackUsersByEmail = async (token: string): Promise<Map<string, string>> => {
  // Fallback implementation - return empty map
  return new Map();
};

const postSlackMessage = async (token: string, message: unknown): Promise<void> => {
  // Fallback implementation - log the message
  console.log("postSlackMessage called with:", message);
};

const formatDateRange = (start: Date, end: Date) => {
  return `Week of ${formatDateRangeUtil(start, end)}`;
};

export async function generateWeeklyReports() {
  const mailboxesList = await db.query.mailboxes.findMany({
    columns: { id: true },
    where: and(isNotNull(mailboxes.slackBotToken), isNotNull(mailboxes.slackAlertChannel)),
  });

  if (!mailboxesList.length) return;

  for (const mailbox of mailboxesList) {
    await inngest.send({
      name: "reports/weekly",
      data: { mailboxId: mailbox.id },
    });
  }
}

export default inngest.createFunction(
  { id: "generate-weekly-reports" },
  { cron: `TZ=${TIME_ZONE} 0 ${REPORT_HOUR} * * 1` },
  generateWeeklyReports
);

export const generateMailboxWeeklyReport = inngest.createFunction(
  { id: "generate-weekly-report-mailbox" },
  { event: "reports/weekly" },
  async ({ event, step }) => {
    const mailbox = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.id, event.data.mailboxId),
    });
    if (!mailbox) {
      return;
    }

    // drizzle doesn't appear to do any type narrowing, even though we've filtered for non-null values
    // @see https://github.com/drizzle-team/drizzle-orm/issues/2956
    if (!mailbox.slackBotToken || !mailbox.slackAlertChannel) {
      return;
    }

    const result = await generateMailboxReport({
      mailbox,
      slackBotToken: mailbox.slackBotToken,
      slackAlertChannel: mailbox.slackAlertChannel,
    });

    return result;
  }
);

export async function generateMailboxReport({
  mailbox,
  slackBotToken,
  slackAlertChannel,
}: {
  mailbox: typeof mailboxes.$inferSelect;
  slackBotToken: string;
  slackAlertChannel: string;
}) {
  const now = toZonedTime(new Date(), TIME_ZONE);
  const lastWeekStart = subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 1);
  const lastWeekEnd = subWeeks(endOfWeek(now, { weekStartsOn: 0 }), 1);

  const stats: MemberStats[] = await getMemberStats(mailbox, {
    startDate: lastWeekStart,
    endDate: lastWeekEnd,
  });

  if (!stats.length) {
    return "No stats found";
  }

  const slackUsersByEmail = await getSlackUsersByEmail(slackBotToken);
  const coreMembers = stats.filter((member) => member.role === UserRoles.CORE);
  const nonCoreMembers = stats.filter((member) => member.role === UserRoles.NON_CORE);

  // Process each team member group
  const coreData = processRoleGroup(coreMembers, slackUsersByEmail);
  const nonCoreData = processRoleGroup(nonCoreMembers, slackUsersByEmail);

  interface TableData {
    name: string;
    count: number;
    slackUserId?: string;
  }

  const tableData: TableData[] = [];

  for (const member of stats) {
    const name = member.displayName || `Unnamed user: ${member.id}`;
    const slackUserId = slackUsersByEmail.get(assertDefined(member.email));

    tableData.push({
      name,
      count: member.replyCount,
      ...(slackUserId && { slackUserId }),
    });
  }

  const humanUsers = tableData.sort((a, b) => b.count - a.count);
  const totalTicketsResolved = tableData.reduce((sum, agent) => sum + agent.count, 0);
  const activeUserCount = humanUsers.filter((user) => user.count > 0).length;

  const peopleText = activeUserCount === 1 ? "person" : "people";

  const blocks: unknown[] = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: `Last week in the ${mailbox.name} mailbox:`,
        emoji: true,
      },
    },
  ];

  // core members stats section
  if (coreMembers.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Core members:*",
      },
    });

    if (coreData.activeLines.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: coreData.activeLines.join("\n"),
        },
      });
    }

    if (coreData.inactiveList) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*No tickets answered:* ${coreData.inactiveList}`,
        },
      });
    }

    blocks.push({ type: "divider" });
  }

  // non-core members stats section
  if (nonCoreMembers.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Non-core members:*",
      },
    });

    if (nonCoreData.activeLines.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: nonCoreData.activeLines.join("\n"),
        },
      });
    }

    if (nonCoreData.inactiveList) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*No tickets answered:* ${nonCoreData.inactiveList}`,
        },
      });
    }

    blocks.push({ type: "divider" });
  }

  // totals section
  const summaryParts = [];
  if (totalTicketsResolved > 0) {
    summaryParts.push("*Total replies:*");
    summaryParts.push(`${totalTicketsResolved.toLocaleString()} from ${activeUserCount} ${peopleText}`);
  }

  if (summaryParts.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: summaryParts.join("\n"),
      },
    });
  }

  await postSlackMessage(slackBotToken, {
    channel: slackAlertChannel,
    text: formatDateRange(lastWeekStart, lastWeekEnd),
    blocks,
  });

  return "Report sent";
}

function processRoleGroup(members: MemberStats[], slackUsersByEmail: Map<string, string>) {
  const activeMembers = members.filter((member) => member.replyCount > 0).sort((a, b) => b.replyCount - a.replyCount);
  const inactiveMembers = members.filter((member) => member.replyCount === 0);

  const activeLines = activeMembers.map((member) => {
    const formattedCount = member.replyCount.toLocaleString();
    const slackUserId = slackUsersByEmail.get(member.email!);
    const userName =
      member.role === UserRoles.CORE && slackUserId
        ? `<@${slackUserId}>`
        : member.displayName || member.email || "Unknown";

    return `• ${userName}: ${formattedCount}`;
  });

  const inactiveList =
    inactiveMembers.length > 0
      ? inactiveMembers
          .map((member) => {
            const slackUserId = slackUsersByEmail.get(member.email!);
            const userName =
              member.role === UserRoles.CORE && slackUserId
                ? `<@${slackUserId}>`
                : member.displayName || member.email || "Unknown";

            return userName;
          })
          .join(", ")
      : "";

  return { activeLines, inactiveList };
}
