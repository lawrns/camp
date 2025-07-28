import { TRPCRouterRecord } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { websiteCrawls, websitePages, websites } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";
import { mailboxProcedure } from "./procedure";

const fetchPageTitle = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Helper Website Crawler" },
    });
    const html = await response.text();

    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    return titleMatch?.[1] ? titleMatch[1].trim() : new URL(url).hostname;
  } catch (error) {
    return new URL(url).hostname;
  }
};

export const websitesRouter = {
  list: mailboxProcedure.query(async ({ ctx }) => {
    const websitesList = await db.query.websites.findMany({
      where: and(eq(websites.mailboxId, ctx.mailbox.id), isNull(websites.deletedAt)),
      orderBy: [asc(websites.createdAt)],
      with: {
        crawls: {
          limit: 1,
          orderBy: desc(websiteCrawls.createdAt),
        },
      },
    });

    const websiteIds = websitesList.map((w: any) => w.id);

    const pageCounts =
      websiteIds.length > 0
        ? await db
            .select({
              websiteId: websitePages.websiteId,
              count: sql<number>`count(*)::int`,
            })
            .from(websitePages)
            .where(and(inArray(websitePages.websiteId, websiteIds), isNull(websitePages.deletedAt)))
            .groupBy(websitePages.websiteId)
        : [];

    return websitesList.map((website: any) => ({
      ...website,
      latestCrawl: website.crawls[0],
      pagesCount: pageCounts.find((c) => c.websiteId === website.id)?.count ?? 0,
    }));
  }),

  create: mailboxProcedure
    .input(
      z.object({
        url: z.string().url(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const urlWithProtocol = /^https?:\/\//i.test(input.url) ? input.url : `https://${input.url}`;

      const name = input.name || (await fetchPageTitle(urlWithProtocol));

      const website = await db
        .insert(websites)
        .values({
          mailboxId: ctx.mailbox.id,
          name,
          url: urlWithProtocol,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then(takeUniqueOrThrow);

      // Trigger initial crawl
      const crawl = await db
        .insert(websiteCrawls)
        .values({
          websiteId: website.id,
          name: `Initial crawl for ${website.name}`,
          status: "pending",
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then(takeUniqueOrThrow);

      await inngest.send({
        name: "websites/crawl.create",
        data: {
          websiteId: website.id,
          crawlId: crawl.id,
        },
      });

      return website;
    }),

  delete: mailboxProcedure
    .input(
      z.object({
        websiteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      await db
        .update(websitePages)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(websitePages.websiteId, input.websiteId));

      await db
        .update(websites)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(and(eq(websites.id, input.websiteId), eq(websites.mailboxId, ctx.mailbox.id)));

      return { success: true };
    }),

  triggerCrawl: mailboxProcedure
    .input(
      z.object({
        websiteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const website = assertDefined(
        await db.query.websites.findFirst({
          where: and(eq(websites.id, input.websiteId), eq(websites.mailboxId, ctx.mailbox.id)),
        })
      );

      const existingCrawl = await db.query.websiteCrawls.findFirst({
        where: and(eq(websiteCrawls.websiteId, website.id), eq(websiteCrawls.status, "loading")),
      });

      if (existingCrawl) {
        throw new Error("A crawl is already in progress");
      }

      const crawl = await db
        .insert(websiteCrawls)
        .values({
          websiteId: website.id,
          name: `Manual crawl for ${website.name}`,
          status: "pending",
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then(takeUniqueOrThrow);

      await inngest.send({
        name: "websites/crawl.create",
        data: {
          websiteId: website.id,
          crawlId: crawl.id,
        },
      });

      return crawl;
    }),
} satisfies TRPCRouterRecord;
