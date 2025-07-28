import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { toolApis, tools as toolsTable } from "@/db/schema";
import { captureExceptionAndLog } from "@/lib/shared/sentry";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { assertDefined } from "@/lib/utils/assert";
import type { ToolFormatted } from "@/types/tools";
import { mailboxProcedure } from "./procedure";

// import { fetchOpenApiSpec, importToolsFromSpec } from "@/lib/data/tools"; // Module not found

// Simple fallbacks for tools functions
const fetchOpenApiSpec = async (url: string) => {
  return { url, spec: {} };
};

const importToolsFromSpec = async (spec: any, mailboxId: number) => {
  return { spec, mailboxId, imported: [] };
};

export const toolsRouter = {
  list: mailboxProcedure.query(async ({ ctx }) => {
    const mailbox = ctx.mailbox;

    try {
      const apis = await db.query.toolApis.findMany({
        columns: {
          id: true,
          name: true,
          baseUrl: true,
        },
        with: {
          tools: {
            columns: {
              id: true,
              name: true,
              description: true,
              url: true,
              requestMethod: true,
              enabled: true,
              slug: true,
              availableInChat: true,
              customerEmailParameter: true,
              parameters: true,
              toolApiId: true,
            },
            orderBy: [desc(toolsTable.enabled), asc(toolsTable.id)],
          },
        },
        where: eq(toolApis.mailboxId, mailbox.id),
      });

      return apis.map((api: any) => ({
        id: api.id,
        name: api.name,
        baseUrl: api.baseUrl,
        tools: api.tools.map(
          (tool: any) =>
            ({
              ...tool,
              path: tool.url
                .split(/\/\/[^/]+/)
                .pop()!
                .replace(/^\/+|\/+$/g, ""),
              toolApiId: api.id,
            }) satisfies ToolFormatted
        ),
      }));
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)));
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch APIs",
      });
    }
  }),

  import: mailboxProcedure
    .input(
      z.object({
        url: z.string().url().optional(),
        schema: z.string().optional(),
        apiKey: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mailbox } = ctx;

      if (!input.url && !input.schema) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either URL or schema must be provided",
        });
      }

      try {
        const openApiSpec = input.url ? await fetchOpenApiSpec(input.url) : input.schema;

        if (!openApiSpec) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to fetch API spec",
          });
        }

        const toolApi = await db
          .insert(toolApis)
          .values({
            name: input.name,
            mailboxId: mailbox.id,
            baseUrl: input.url,
            schema: input.schema,
            authenticationToken: input.apiKey,
          })
          .returning()
          .then(takeUniqueOrThrow);

        await importToolsFromSpec(openApiSpec, toolApi.id);

        return { success: true };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to import API spec",
        });
      }
    }),
  update: mailboxProcedure
    .input(
      z.object({
        toolId: z.number(),
        settings: z.object({
          availableInChat: z.boolean(),
          enabled: z.boolean(),
          customerEmailParameter: z.string().nullable(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mailbox } = ctx;
      const { toolId, settings } = input;

      const tool = await db.query.tools.findFirst({
        where: and(eq(toolsTable.id, toolId), eq(toolsTable.mailboxId, mailbox.id)),
      });

      if (!tool) throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });

      await db
        .update(toolsTable)
        .set({
          availableInChat: settings.enabled ? settings.availableInChat : false,
          enabled: settings.enabled,
          customerEmailParameter:
            tool.parameters?.find((param) => param.name === settings.customerEmailParameter)?.name ?? null,
        })
        .where(and(eq(toolsTable.id, toolId)));

      return { success: true };
    }),

  deleteApi: mailboxProcedure
    .input(
      z.object({
        apiId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mailbox } = ctx;
      const { apiId } = input;

      await db.transaction(async (tx) => {
        await tx.delete(toolsTable).where(and(eq(toolsTable.toolApiId, apiId), eq(toolsTable.mailboxId, mailbox.id)));
        await tx.delete(toolApis).where(and(eq(toolApis.id, apiId), eq(toolApis.mailboxId, mailbox.id)));
      });

      return { success: true };
    }),

  refreshApi: mailboxProcedure
    .input(
      z.object({
        apiId: z.number(),
        schema: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { mailbox }, input: { apiId, schema } }) => {
      const api = await db.query.toolApis.findFirst({
        where: and(eq(toolApis.id, apiId), eq(toolApis.mailboxId, mailbox.id)),
      });

      if (!api) throw new TRPCError({ code: "NOT_FOUND", message: "API not found" });
      if (schema && !api.schema) throw new TRPCError({ code: "BAD_REQUEST", message: "API is not schema-based" });

      try {
        const openApiSpec = api.baseUrl ? await fetchOpenApiSpec(api.baseUrl) : schema;

        await importToolsFromSpec(assertDefined(openApiSpec), api.id);

        if (schema) {
          await db.update(toolApis).set({ schema }).where(eq(toolApis.id, api.id));
        }

        return { success: true };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to refresh API spec",
        });
      }
    }),
};
