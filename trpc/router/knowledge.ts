import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { knowledgeCategories, knowledgeDocuments, knowledgeDocumentVersions } from "@/db/schema/knowledgeDocuments";
import { createAuditMiddleware, createMailboxMiddleware } from "../middleware/tenant";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Real Knowledge service with database connections
class KnowledgeService {
  async listDocuments(
    mailboxId: string,
    options?: {
      category?: string;
      enabled?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const whereConditions = [eq(knowledgeDocuments.mailboxId, mailboxId)];

    if (options?.category) {
      whereConditions.push(eq(knowledgeDocuments.category, options.category));
    }

    if (options?.enabled !== undefined) {
      whereConditions.push(eq(knowledgeDocuments.enabled, options.enabled));
    }

    if (options?.search) {
      whereConditions.push(
        sql`(${knowledgeDocuments.title} ILIKE ${`%${options.search}%`} OR ${knowledgeDocuments.content} ILIKE ${`%${options.search}%`})`
      );
    }

    const documents = await db
      .select({
        id: knowledgeDocuments.id,
        title: knowledgeDocuments.title,
        description: knowledgeDocuments.description,
        sourceType: knowledgeDocuments.sourceType,
        sourceUrl: knowledgeDocuments.sourceUrl,
        tags: knowledgeDocuments.tags,
        category: knowledgeDocuments.category,
        enabled: knowledgeDocuments.enabled,
        createdBy: knowledgeDocuments.createdBy,
        createdAt: knowledgeDocuments.createdAt,
        updatedAt: knowledgeDocuments.updatedAt,
      })
      .from(knowledgeDocuments)
      .where(and(...whereConditions))
      .orderBy(desc(knowledgeDocuments.updatedAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeDocuments)
      .where(and(...whereConditions));

    return {
      documents,
      totalCount: totalCount[0]?.count || 0,
      hasMore: (options?.offset || 0) + documents.length < (totalCount[0]?.count || 0),
    };
  }

  async getDocument(mailboxId: string, documentId: number) {
    const document = await db
      .select()
      .from(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.mailboxId, mailboxId)))
      .limit(1);

    if (!document.length) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Get document versions
    const versions = await db
      .select()
      .from(knowledgeDocumentVersions)
      .where(eq(knowledgeDocumentVersions.documentId, documentId))
      .orderBy(desc(knowledgeDocumentVersions.versionNumber));

    return {
      document: document[0],
      versions,
    };
  }

  async createDocument(mailboxId: string, documentData: unknown) {
    const newDocument = await db
      .insert(knowledgeDocuments)
      .values({
        mailboxId,
        title: documentData.title,
        description: documentData.description,
        content: documentData.content,
        sourceType: documentData.sourceType || "mdx",
        sourceUrl: documentData.sourceUrl,
        tags: documentData.tags || [],
        category: documentData.category,
        enabled: documentData.enabled ?? true,
        createdBy: documentData.createdBy,
        metadata: documentData.metadata || {},
      })
      .returning();

    // Create initial version
    if (newDocument.length > 0 && documentData.content) {
      await db.insert(knowledgeDocumentVersions).values({
        documentId: newDocument[0].id,
        content: documentData.content,
        metadata: documentData.metadata || {},
        versionNumber: 1,
        createdBy: documentData.createdBy,
      });
    }

    return {
      document: newDocument[0],
      created: true,
    };
  }

  async updateDocument(mailboxId: string, documentId: number, updates: unknown) {
    // Verify document exists and belongs to mailbox
    const existingDocument = await db
      .select()
      .from(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.mailboxId, mailboxId)))
      .limit(1);

    if (!existingDocument.length) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Update document
    const updatedDocument = await db
      .update(knowledgeDocuments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId))
      .returning();

    // Create new version if content changed
    if (updates.content && updates.content !== existingDocument[0].content) {
      const latestVersion = await db
        .select({ versionNumber: knowledgeDocumentVersions.versionNumber })
        .from(knowledgeDocumentVersions)
        .where(eq(knowledgeDocumentVersions.documentId, documentId))
        .orderBy(desc(knowledgeDocumentVersions.versionNumber))
        .limit(1);

      const nextVersionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

      await db.insert(knowledgeDocumentVersions).values({
        documentId,
        content: updates.content,
        metadata: updates.metadata || {},
        versionNumber: nextVersionNumber,
        createdBy: updates.updatedBy || existingDocument[0].createdBy,
      });
    }

    return {
      document: updatedDocument[0],
      updated: true,
    };
  }

  async deleteDocument(mailboxId: string, documentId: number) {
    // Verify document exists and belongs to mailbox
    const existingDocument = await db
      .select()
      .from(knowledgeDocuments)
      .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.mailboxId, mailboxId)))
      .limit(1);

    if (!existingDocument.length) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Delete document (cascade will handle versions and categories)
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId));

    return {
      deleted: true,
      documentId,
    };
  }

  async listCategories(mailboxId: string) {
    const categories = await db
      .select()
      .from(knowledgeCategories)
      .where(eq(knowledgeCategories.mailboxId, mailboxId))
      .orderBy(knowledgeCategories.name);

    // Get document counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const documentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(knowledgeDocuments)
          .where(and(eq(knowledgeDocuments.mailboxId, mailboxId), eq(knowledgeDocuments.category, category.name)));

        return {
          ...category,
          documentCount: documentCount[0]?.count || 0,
        };
      })
    );

    return {
      categories: categoriesWithCounts,
    };
  }

  async createCategory(mailboxId: string, categoryData: unknown) {
    const newCategory = await db
      .insert(knowledgeCategories)
      .values({
        mailboxId,
        name: categoryData.name,
        description: categoryData.description,
        parentId: categoryData.parentId,
      })
      .returning();

    return {
      category: newCategory[0],
      created: true,
    };
  }

  async updateCategory(mailboxId: string, categoryId: number, updates: unknown) {
    // Verify category exists and belongs to mailbox
    const existingCategory = await db
      .select()
      .from(knowledgeCategories)
      .where(and(eq(knowledgeCategories.id, categoryId), eq(knowledgeCategories.mailboxId, mailboxId)))
      .limit(1);

    if (!existingCategory.length) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const updatedCategory = await db
      .update(knowledgeCategories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeCategories.id, categoryId))
      .returning();

    return {
      category: updatedCategory[0],
      updated: true,
    };
  }

  async deleteCategory(mailboxId: string, categoryId: number) {
    // Verify category exists and belongs to mailbox
    const existingCategory = await db
      .select()
      .from(knowledgeCategories)
      .where(and(eq(knowledgeCategories.id, categoryId), eq(knowledgeCategories.mailboxId, mailboxId)))
      .limit(1);

    if (!existingCategory.length) {
      throw new Error(`Category ${categoryId} not found`);
    }

    // Check if category has documents
    const documentsInCategory = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeDocuments)
      .where(
        and(eq(knowledgeDocuments.mailboxId, mailboxId), eq(knowledgeDocuments.category, existingCategory[0].name))
      );

    if ((documentsInCategory[0]?.count || 0) > 0) {
      throw new Error(`Cannot delete category with existing documents. Move or delete documents first.`);
    }

    await db.delete(knowledgeCategories).where(eq(knowledgeCategories.id, categoryId));

    return {
      deleted: true,
      categoryId,
    };
  }

  async searchDocuments(
    mailboxId: string,
    query: string,
    options?: {
      category?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const whereConditions = [
      eq(knowledgeDocuments.mailboxId, mailboxId),
      eq(knowledgeDocuments.enabled, true),
      sql`(${knowledgeDocuments.title} ILIKE ${`%${query}%`} OR ${knowledgeDocuments.content} ILIKE ${`%${query}%`} OR array_to_string(${knowledgeDocuments.tags}, ' ') ILIKE ${`%${query}%`})`,
    ];

    if (options?.category) {
      whereConditions.push(eq(knowledgeDocuments.category, options.category));
    }

    const results = await db
      .select({
        id: knowledgeDocuments.id,
        title: knowledgeDocuments.title,
        description: knowledgeDocuments.description,
        category: knowledgeDocuments.category,
        tags: knowledgeDocuments.tags,
        // Add relevance scoring based on where the match occurs
        relevance: sql<number>`
          CASE
            WHEN ${knowledgeDocuments.title} ILIKE ${`%${query}%`} THEN 3
            WHEN ${knowledgeDocuments.description} ILIKE ${`%${query}%`} THEN 2
            WHEN array_to_string(${knowledgeDocuments.tags}, ' ') ILIKE ${`%${query}%`} THEN 1
            ELSE 0
          END
        `,
      })
      .from(knowledgeDocuments)
      .where(and(...whereConditions))
      .orderBy(sql`relevance DESC, ${knowledgeDocuments.updatedAt} DESC`)
      .limit(options?.limit || 20)
      .offset(options?.offset || 0);

    return {
      results,
      query,
      totalResults: results.length,
    };
  }
}

const knowledgeService = new KnowledgeService();

// Validation schema for knowledge document
const knowledgeDocumentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  sourceType: z.enum(["markdown", "text", "html", "mdx"]).default("mdx"),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  enabled: z.boolean().optional().default(true),
});

// Validation schema for categories
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

export const knowledgeRouter = createTRPCRouter({
  // Get all knowledge documents for a mailbox
  getDocuments: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        category: z.string().optional(),
        enabled: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("knowledge.getDocuments"))
    .query(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as string;

      try {
        return await knowledgeService.listDocuments(validatedMailboxId, {
          category: input.category,
          enabled: input.enabled,
          search: input.search,
          limit: input.limit,
          offset: input.offset,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch knowledge documents",
          cause: error,
        });
      }
    }),

  // Get a single knowledge document
  getDocument: publicProcedure
    .input(z.object({ mailboxId: z.string(), documentId: z.number() }))
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("knowledge.getDocument"))
    .query(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as string;

      try {
        return await knowledgeService.getDocument(validatedMailboxId, input.documentId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch knowledge document",
          cause: error,
        });
      }
    }),

  // Create a new knowledge document
  createDocument: publicProcedure
    .input(z.object({ mailboxId: z.string(), document: knowledgeDocumentSchema }))
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("knowledge.createDocument"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as string;
      const { user } = ctx;

      try {
        return await knowledgeService.createDocument(validatedMailboxId, {
          ...input.document,
          createdBy: user?.id || "",
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create knowledge document",
          cause: error,
        });
      }
    }),

  // Update an existing knowledge document
  updateDocument: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        documentId: z.number(),
        document: knowledgeDocumentSchema.partial(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("knowledge.updateDocument"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.updateDocument((validatedMailboxId || 1).toString(), input.documentId, input.document);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update knowledge document",
          cause: error,
        });
      }
    }),

  // Delete a knowledge document
  deleteDocument: publicProcedure
    .input(z.object({ mailboxId: z.string(), documentId: z.number() }))
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin"] }))
    .use(createAuditMiddleware("knowledge.deleteDocument"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.deleteDocument((validatedMailboxId || 1).toString(), input.documentId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete knowledge document",
          cause: error,
        });
      }
    }),

  // Get categories
  getCategories: publicProcedure
    .input(z.object({ mailboxId: z.string() }))
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("knowledge.getCategories"))
    .query(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.listCategories((validatedMailboxId || 1).toString());
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch knowledge categories",
          cause: error,
        });
      }
    }),

  // Create category
  createCategory: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        category: categorySchema,
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("knowledge.createCategory"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.createCategory((validatedMailboxId || 1).toString(), input.category);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create knowledge category",
          cause: error,
        });
      }
    }),

  // Update category
  updateCategory: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        categoryId: z.number(),
        category: categorySchema.partial(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent"] }))
    .use(createAuditMiddleware("knowledge.updateCategory"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.updateCategory((validatedMailboxId || 1).toString(), input.categoryId, input.category);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update knowledge category",
          cause: error,
        });
      }
    }),

  // Delete category
  deleteCategory: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        categoryId: z.number(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin"] }))
    .use(createAuditMiddleware("knowledge.deleteCategory"))
    .mutation(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as number;

      try {
        return await knowledgeService.deleteCategory((validatedMailboxId || 1).toString(), input.categoryId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete knowledge category",
          cause: error,
        });
      }
    }),

  // Search knowledge documents
  searchDocuments: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        query: z.string().min(1, "Search query is required"),
        category: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("knowledge.searchDocuments"))
    .query(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as string;

      try {
        return await knowledgeService.searchDocuments(validatedMailboxId, input.query, {
          category: input.category,
          limit: input.limit,
          offset: input.offset,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search knowledge documents",
          cause: error,
        });
      }
    }),

  // Get analytics for knowledge base
  getAnalytics: publicProcedure
    .input(
      z.object({
        mailboxId: z.string(),
        timeRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
      })
    )
    .use(createMailboxMiddleware({ requiredRoles: ["owner", "admin", "agent", "viewer"] }))
    .use(createAuditMiddleware("knowledge.getAnalytics"))
    .query(async ({ ctx, input }) => {
      const validatedMailboxId = (ctx as unknown).validatedMailboxId as string;

      try {
        // Get basic analytics
        const totalDocuments = await db
          .select({ count: sql<number>`count(*)` })
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.mailboxId, validatedMailboxId));

        const enabledDocuments = await db
          .select({ count: sql<number>`count(*)` })
          .from(knowledgeDocuments)
          .where(and(eq(knowledgeDocuments.mailboxId, validatedMailboxId), eq(knowledgeDocuments.enabled, true)));

        const totalCategories = await db
          .select({ count: sql<number>`count(*)` })
          .from(knowledgeCategories)
          .where(eq(knowledgeCategories.mailboxId, validatedMailboxId));

        // Get documents by source type
        const documentsByType = await db
          .select({
            sourceType: knowledgeDocuments.sourceType,
            count: sql<number>`count(*)`,
          })
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.mailboxId, validatedMailboxId))
          .groupBy(knowledgeDocuments.sourceType);

        return {
          summary: {
            totalDocuments: totalDocuments[0]?.count || 0,
            enabledDocuments: enabledDocuments[0]?.count || 0,
            totalCategories: totalCategories[0]?.count || 0,
            enabledPercentage:
              totalDocuments[0]?.count > 0
                ? Math.round(((enabledDocuments[0]?.count || 0) / totalDocuments[0].count) * 100)
                : 0,
          },
          documentsByType,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch knowledge analytics",
          cause: error,
        });
      }
    }),
});
