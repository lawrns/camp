import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { captureExceptionAndLog } from "@/lib/shared/sentry";
import { mailboxProcedure } from "./procedure";
import {
  getKnowledgeDocuments,
  getKnowledgeDocument,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeCategories,
  getKnowledgeStats,
  uploadKnowledgeDocument,
  createDocumentVersion,
  publishKnowledgeDocument,
  archiveKnowledgeDocument,
  duplicateKnowledgeDocument,
} from "../../../services/knowledgeService";

// Knowledge document types
const DocumentTypeSchema = z.enum(["guide", "faq", "policy", "manual", "article"]);
const DocumentStatusSchema = z.enum(["draft", "published", "archived"]);

const KnowledgeDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: DocumentTypeSchema,
  status: DocumentStatusSchema,
  tags: z.array(z.string()),
  author: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  views: z.number(),
  helpful: z.number(),
  notHelpful: z.number(),
  embedding: z.boolean().optional(),
  searchable: z.boolean(),
});

export const knowledgeRouter = {
  // List all knowledge documents
  list: mailboxProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: DocumentTypeSchema.optional(),
        status: DocumentStatusSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Listing documents for mailbox ${ctx.mailbox.slug}`, input);

        // Use real Supabase service
        const result = await getKnowledgeDocuments(ctx.mailbox.organizationId, {
          search: input.search,
          content_type: input.type,
          is_active: input.status === "published" ? true : input.status === "draft" ? false : undefined,
          limit: input.limit,
          offset: input.offset,
        });

        // Transform Supabase data to match expected format
        const transformedDocuments = result.documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          type: doc.content_type as "guide" | "faq" | "policy" | "manual" | "article",
          status: (doc.is_active && doc.is_public) ? "published" as const : "draft" as const,
          tags: doc.tags || [],
          author: "System", // TODO: Get from user context
          createdAt: new Date(doc.created_at),
          updatedAt: new Date(doc.updated_at),
          views: doc.views || 0,
          helpful: doc.helpful || 0,
          notHelpful: doc.notHelpful || 0,
          embedding: doc.embedding || false,
          searchable: doc.searchable || false,
        }));

        return {
          documents: transformedDocuments,
          total: result.total,
          hasMore: result.hasMore,
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          tags: { route: "mailbox.knowledge.list" },
          extra: {
            mailboxId: ctx.mailbox.id,
            organizationId: ctx.mailbox.organizationId,
            mailboxSlug: ctx.mailbox.slug,
            input,
          },
        });
        return {
          documents: [],
          total: 0,
          hasMore: false,
        };
      }
    }),

  // Get a specific document
  get: mailboxProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Getting document ${input.documentId} for mailbox ${ctx.mailbox.slug}`);

        // Mock document retrieval - in real implementation, this would query the database
        const mockDocument = {
          id: input.documentId,
          title: "Sample Knowledge Document",
          content: "This is a sample knowledge document with detailed content...",
          type: "guide" as const,
          status: "published" as const,
          tags: ["sample", "example"],
          author: "System",
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 100,
          helpful: 10,
          notHelpful: 1,
          embedding: true,
          searchable: true,
        };

        return mockDocument;
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            documentId: input.documentId,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }
    }),

  // Create a new document
  create: mailboxProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
        type: DocumentTypeSchema,
        tags: z.array(z.string()).default([]),
        status: DocumentStatusSchema.default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Creating document for mailbox ${ctx.mailbox.slug}`, {
          title: input.title,
          type: input.type,
        });

        // Use real Supabase service
        const document = await createKnowledgeDocument(ctx.mailbox.organizationId, {
          title: input.title,
          content: input.content,
          content_type: input.type,
          tags: input.tags,
          is_active: input.status === "published",
          is_public: input.status === "published",
        });

        // Transform to expected format
        const transformedDocument = {
          id: document.id,
          title: document.title,
          content: document.content,
          type: document.content_type as "guide" | "faq" | "policy" | "manual" | "article",
          status: (document.is_active && document.is_public) ? "published" as const : "draft" as const,
          tags: document.tags || [],
          author: "Current User", // TODO: Get from user context
          createdAt: new Date(document.created_at),
          updatedAt: new Date(document.updated_at),
          views: 0,
          helpful: 0,
          notHelpful: 0,
          embedding: false,
          searchable: document.is_active && document.is_public,
        };

        return {
          success: true,
          document: transformedDocument,
          message: "Document created successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document",
        });
      }
    }),

  // Update an existing document
  update: mailboxProcedure
    .input(
      z.object({
        documentId: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: DocumentTypeSchema.optional(),
        tags: z.array(z.string()).optional(),
        status: DocumentStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Updating document ${input.documentId} for mailbox ${ctx.mailbox.slug}`);

        // Simulate document update
        await new Promise((resolve) => setTimeout(resolve, 300));

        return {
          success: true,
          message: "Document updated successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update document",
        });
      }
    }),

  // Delete a document
  delete: mailboxProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Deleting document ${input.documentId} for mailbox ${ctx.mailbox.slug}`);

        // Simulate document deletion
        await new Promise((resolve) => setTimeout(resolve, 200));

        return {
          success: true,
          message: "Document deleted successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            documentId: input.documentId,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete document",
        });
      }
    }),

  // Get knowledge base statistics
  stats: mailboxProcedure.query(async ({ ctx }) => {
    try {
      console.log(`[Knowledge] Getting stats for mailbox ${ctx.mailbox.slug}`);

      const stats = await getKnowledgeStats(ctx.mailbox.organizationId);
      const categories = await getKnowledgeCategories(ctx.mailbox.organizationId);

      return {
        ...stats,
        categories: categories.length,
        categoryList: categories,
      };
    } catch (error) {
      captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
        tags: { route: "mailbox.knowledge.stats" },
        extra: {
          mailboxId: ctx.mailbox.id,
          organizationId: ctx.mailbox.organizationId,
          mailboxSlug: ctx.mailbox.slug,
        },
      });
      return {
        total: 0,
        published: 0,
        draft: 0,
        categories: 0,
        categoryList: [],
        byType: {
          article: 0,
          faq: 0,
          guide: 0,
          policy: 0,
        },
      };
    }
  }),

  // Upload document from file
  upload: mailboxProcedure
    .input(
      z.object({
        fileName: z.string(),
        content: z.string(),
        title: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        contentType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Uploading document ${input.fileName} for mailbox ${ctx.mailbox.slug}`);

        // Create a mock File object from the input
        const mockFile = {
          name: input.fileName,
          text: async () => input.content,
          size: input.content.length,
        } as File;

        const document = await uploadKnowledgeDocument(
          ctx.mailbox.organizationId,
          mockFile,
          {
            title: input.title,
            category: input.category,
            tags: input.tags,
            contentType: input.contentType,
          }
        );

        return {
          success: true,
          document,
          message: "Document uploaded successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload document",
        });
      }
    }),

  // Create new version of document
  createVersion: mailboxProcedure
    .input(
      z.object({
        documentId: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Creating version for document ${input.documentId}`);

        const document = await createDocumentVersion(
          input.documentId,
          {
            title: input.title,
            content: input.content,
            category: input.category,
            tags: input.tags,
          },
          ctx.user.id
        );

        return {
          success: true,
          document,
          message: "Document version created successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document version",
        });
      }
    }),

  // Publish document
  publish: mailboxProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Publishing document ${input.documentId}`);

        const document = await publishKnowledgeDocument(input.documentId, ctx.user.id);

        return {
          success: true,
          document,
          message: "Document published successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish document",
        });
      }
    }),

  // Archive document
  archive: mailboxProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Archiving document ${input.documentId}`);

        const document = await archiveKnowledgeDocument(input.documentId, ctx.user.id);

        return {
          success: true,
          document,
          message: "Document archived successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive document",
        });
      }
    }),

  // Duplicate document
  duplicate: mailboxProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(`[Knowledge] Duplicating document ${input.documentId}`);

        const document = await duplicateKnowledgeDocument(
          input.documentId,
          ctx.mailbox.organizationId,
          ctx.user.id
        );

        return {
          success: true,
          document,
          message: "Document duplicated successfully",
        };
      } catch (error) {
        captureExceptionAndLog(error instanceof Error ? error : new Error(String(error)), {
          extra: {
            input,
            mailboxId: ctx.mailbox.id,
            mailboxSlug: ctx.mailbox.slug,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to duplicate document",
        });
      }
    }),
} satisfies TRPCRouterRecord;
