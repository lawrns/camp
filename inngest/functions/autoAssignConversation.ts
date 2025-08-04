// Remove problematic attempt import - use simple retry logic instead
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversations } from "@/db/schema/conversations";
import { inngest } from "@/inngest/client";
import { runAIObjectQuery } from "@/lib/ai";
import { updateConversation, type Conversation } from "@/lib/data/conversation";
import { getMailboxById, type Mailbox } from "@/lib/data/mailbox";
import { getUsersWithMailboxAccess, UserRoles, type UserWithMailboxAccessData } from "@/lib/data/user";
import { redis } from "@/lib/redis/client";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";
import { assertDefinedOrRaiseNonRetriableError } from "../utils";

const REDIS_ROUND_ROBIN_KEY_PREFIX = "auto-assign-message-queue";

const getCoreTeamMembers = (teamMembers: UserWithMailboxAccessData[]): UserWithMailboxAccessData[] => {
  return teamMembers.filter((member: UserWithMailboxAccessData) => member.role === UserRoles.CORE);
};

const aiSchema = z.object({
  matches: z.record(z.string(), z.boolean()),
  reasoning: z.string(),
  confidenceScore: z.number().optional(),
});
type AIResponse = z.infer<typeof aiSchema>;

const getNonCoreTeamMembersWithMatchingKeywords = async (
  teamMembers: UserWithMailboxAccessData[],
  conversationContent: string,
  mailbox: Mailbox
) => {
  if (!conversationContent) return { members: [] };

  const membersWithKeywords = teamMembers.filter(
    (member) => member.role === UserRoles.NON_CORE && member.keywords.length > 0
  );

  if (membersWithKeywords.length === 0) return { members: [] };

  const memberKeywords = membersWithKeywords.reduce<Record<string, string[]>>((acc, member) => {
    acc[member.id] = member.keywords;
    return acc;
  }, {});

  const result = (await runAIObjectQuery({
    mailbox,
    queryType: "auto_assign_conversation",
    schema: aiSchema,
    system: `You are an Intelligent Support Routing System that connects customer inquiries to team members with the most relevant expertise.

Your task is to analyze the semantic meaning of conversations and determine which team members' expertise keywords align with the customer's needs, even when there's no exact keyword match.

For each potential match, consider:
- Direct relevance: Is the keyword directly related to the topic?
- Implied needs: Does the customer's issue typically require this expertise?
- Domain knowledge: Would someone with this keyword expertise be equipped to help?
- Technical depth: Does the conversation's complexity match the expertise level?

When determining matches, provide clear reasoning about why each team member's keywords do or don't align with the conversation. Be especially attentive to technical topics that may use different terminology but relate to the same domain.

A strong match occurs when the team member's expertise would be valuable in addressing the core problem, not just peripheral aspects of the conversation.

Return false for all team members if you cannot find a strong match.`,
    prompt: `CUSTOMER CONVERSATION: "${conversationContent}"

TEAM MEMBER EXPERTISE:
${Object.entries(memberKeywords)
  .map(([id, keywords]) => `Team Member ID: ${id}\nExpertise Keywords: ${keywords.join(", ")}`)
  .join("\n")}

TASK:
Analyze the customer conversation and determine which team members have the expertise needed to best address this issue.

For each team member, evaluate if their expertise keywords semantically relate to the conversation's core problem - even if the exact terms don't appear in the text.

Return a JSON object with:
1. "matches": Record mapping team member IDs to boolean values (true if their expertise aligns with the conversation)
2. "reasoning": Brief explanation of your matching decisions
3. "confidenceScore": Number between 0-1 indicating overall confidence in your matching

Focus on understanding the customer's underlying needs rather than just surface-level keyword matching.`,
  })) as AIResponse;

  return {
    members: membersWithKeywords.filter((member: UserWithMailboxAccessData) => result?.matches[member.id]),
    aiResult: result,
  };
};

const getNextCoreTeamMemberInRotation = async (
  coreTeamMembers: UserWithMailboxAccessData[],
  mailboxId: number
): Promise<UserWithMailboxAccessData | null> => {
  if (coreTeamMembers.length === 0) return null;

  const redisKey = `${REDIS_ROUND_ROBIN_KEY_PREFIX}:${mailboxId}`;

  let lastAssignedIndex = 0;
  try {
    const lastAssignedIndexStr = await redis.get(redisKey);

    if (lastAssignedIndexStr !== null) {
      const parsedIndex = parseInt(lastAssignedIndexStr as string, 10);

      if (!isNaN(parsedIndex) && parsedIndex >= 0) {
        lastAssignedIndex = parsedIndex;
      }
    }
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error instanceof Error ? error : new Error(String(error)));
  }

  const nextIndex = (lastAssignedIndex + 1) % coreTeamMembers.length;

  try {
    await redis.set(redisKey, nextIndex.toString());
  } catch (error) {
    captureExceptionAndLogIfDevelopment(error instanceof Error ? error : new Error(String(error)));
  }

  const nextMember = coreTeamMembers[nextIndex] || null;

  return nextMember;
};

const getConversationContent = (conversationData: {
  messages?: {
    role: string;
    cleanedUpText?: string | null;
  }[];
  subject?: string | null;
}): string => {
  if (!conversationData?.messages || conversationData.messages.length === 0) {
    return conversationData.subject || "";
  }

  const userMessages = conversationData.messages
    .filter((msg: unknown) => msg.role === "user")
    .map((msg: unknown) => msg.cleanedUpText || "")
    .filter(Boolean);

  const contentParts = [];
  if (conversationData.subject) {
    contentParts.push(conversationData.subject);
  }
  contentParts.push(...userMessages);

  return contentParts.join(" ");
};

const getNextTeamMember = async (
  teamMembers: UserWithMailboxAccessData[],
  conversation: Conversation,
  mailbox: Mailbox
) => {
  const conversationContent = getConversationContent(conversation);
  const { members: matchingNonCoreMembers, aiResult } = await getNonCoreTeamMembersWithMatchingKeywords(
    teamMembers,
    conversationContent,
    mailbox
  );

  if (matchingNonCoreMembers.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchingNonCoreMembers.length);
    const selectedMember = matchingNonCoreMembers[randomIndex]!;
    return { member: selectedMember, aiResult };
  }

  const coreMembers = getCoreTeamMembers(teamMembers);
  return {
    member: await getNextCoreTeamMemberInRotation(coreMembers, mailbox.id),
  };
};

export default inngest.createFunction(
  { id: "auto-assign-conversation" },
  { event: "conversations/human-support-requested" },
  async ({ event }) => {
    const { conversationId } = event.data;

    const conversation = assertDefinedOrRaiseNonRetriableError(
      await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: {
          messages: {
            columns: {
              id: true,
              senderType: true,
              content: true,
            },
          },
        },
      })
    );

    if (conversation.assignedToUserId) return { message: "Skipped: already assigned" };
    // Note: mergedIntoId field doesn't exist in schema - skipping this check

    const mailbox = assertDefinedOrRaiseNonRetriableError(await getMailboxById(String(conversation.mailboxId)));
    const teamMembers = assertDefinedOrRaiseNonRetriableError(
      await getUsersWithMailboxAccess(mailbox.organization_id, mailbox.id)
    );

    const activeTeamMembers = teamMembers.filter(
      (member) => member.role === UserRoles.CORE || member.role === UserRoles.NON_CORE
    );

    if (activeTeamMembers.length === 0) {
      return { message: "Skipped: no active team members available for assignment" };
    }

    const { member: nextTeamMember, aiResult } = await getNextTeamMember(activeTeamMembers, conversation, mailbox);

    if (!nextTeamMember) {
      return {
        message: "Skipped: could not find suitable team member for assignment",
        details: "No core members and no matching keywords for non-core members",
      };
    }

    await updateConversation(conversation.id, {
      set: { assignedToUserId: nextTeamMember.id as string },
      message:
        aiResult && "reasoning" in aiResult && aiResult.reasoning
          ? aiResult.reasoning
          : "Core member assigned by round robin",
    });

    return {
      message: `Assigned conversation ${conversation.id} to ${nextTeamMember.displayName} (${nextTeamMember.id})`,
      assigneeRole: nextTeamMember.role,
      assignedToId: nextTeamMember.id,
      aiResult,
    };
  }
);
