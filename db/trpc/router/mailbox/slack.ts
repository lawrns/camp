import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { disconnectSlack } from "@/lib/data/mailbox";
import { listSlackChannels } from "@/lib/slack/client";
import { mailboxProcedure } from "./procedure";

// TODO: Implement updateSlackChannel function
const updateSlackChannel = async (mailboxId: string, channelId: string) => {
  console.log("updateSlackChannel not implemented:", mailboxId, channelId);
};

export const slackRouter = {
  channels: mailboxProcedure.query(async ({ ctx }) => {
    const slackBotToken = (ctx.mailbox as any).slackBotToken;
    if (!slackBotToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Slack is not connected to this mailbox",
      });
    }

    const channels = await listSlackChannels(slackBotToken);
    return channels.flatMap((channel: any) =>
      channel.id && channel.name ? [{ id: channel.id, name: channel.name }] : []
    );
  }),
  disconnect: mailboxProcedure.mutation(async ({ ctx }) => {
    await disconnectSlack(ctx.mailbox.id.toString());
  }),
  updateChannel: mailboxProcedure
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateSlackChannel(ctx.mailbox.id.toString(), input.channelId);
    }),
};
