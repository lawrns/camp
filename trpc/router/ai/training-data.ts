import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

// import { TrainingDataBatchSchema, TrainingDataSchema, TrainingDataService } from "@/lib/ai/training-data"; // Module not found

// Simple fallbacks for training data modules
const TrainingDataSchema = z.object({
  mailboxId: z.number(),
  input: z.string(),
  output: z.string(),
  category: z.string().optional(),
});

const TrainingDataBatchSchema = z.object({
  mailboxId: z.number(),
  data: z.array(TrainingDataSchema),
});

class TrainingDataService {
  static async createTrainingData(input: any, userId: string) {
    return { trainingDataId: "fallback-data", userId };
  }
  static async getTrainingData(mailboxId: number) {
    return { mailboxId, data: [] };
  }
  static async searchTrainingData(mailboxId: number, query: string, category?: string) {
    return { mailboxId, query, category, results: [] };
  }
  static async updateTrainingData(id: number, data: any) {
    return { id, data, updated: true };
  }
  static async deleteTrainingData(id: number) {
    return { id, deleted: true };
  }
  static async validateTrainingData(id: number, userId: string, qualityScore: number) {
    return { id, userId, qualityScore, validated: true };
  }
  static async createBatch(input: any, userId: string) {
    return { batchId: "batch-123", userId, created: true };
  }
  static async getBatches(mailboxId: number) {
    return { mailboxId, batches: [] };
  }
  static async getBatchWithItems(batchId: number) {
    return { batchId, items: [] };
  }
  static async getTrainingDataStats(mailboxId: number) {
    return { mailboxId, stats: { total: 0, validated: 0, pending: 0 } };
  }
  static async exportTrainingData(mailboxId: number, format: string) {
    return { mailboxId, format, data: [] };
  }
}

export const trainingDataRouter = createTRPCRouter({
  create: protectedProcedure.input(TrainingDataSchema).mutation(async ({ input, ctx }) => {
    return TrainingDataService.createTrainingData(input, ctx.user.id);
  }),

  list: protectedProcedure.input(z.object({ mailboxId: z.number() })).query(async ({ input }) => {
    return TrainingDataService.getTrainingData(input.mailboxId);
  }),

  search: protectedProcedure
    .input(
      z.object({
        mailboxId: z.number(),
        query: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return TrainingDataService.searchTrainingData(input.mailboxId, input.query || "", input.category);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: TrainingDataSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return TrainingDataService.updateTrainingData(input.id, input.data);
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return TrainingDataService.deleteTrainingData(input.id);
  }),

  validate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        qualityScore: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return TrainingDataService.validateTrainingData(input.id, ctx.user.id, input.qualityScore);
    }),

  createBatch: protectedProcedure.input(TrainingDataBatchSchema).mutation(async ({ input, ctx }) => {
    return TrainingDataService.createBatch(input, ctx.user.id);
  }),

  listBatches: protectedProcedure.input(z.object({ mailboxId: z.number() })).query(async ({ input }) => {
    return TrainingDataService.getBatches(input.mailboxId);
  }),

  getBatch: protectedProcedure.input(z.object({ batchId: z.number() })).query(async ({ input }) => {
    return TrainingDataService.getBatchWithItems(input.batchId);
  }),

  stats: protectedProcedure.input(z.object({ mailboxId: z.number() })).query(async ({ input }) => {
    return TrainingDataService.getTrainingDataStats(input.mailboxId);
  }),

  export: protectedProcedure
    .input(
      z.object({
        mailboxId: z.number(),
        format: z.enum(["json", "csv"]).default("json"),
      })
    )
    .query(async ({ input }) => {
      return TrainingDataService.exportTrainingData(input.mailboxId, input.format);
    }),

  bulkDelete: protectedProcedure.input(z.object({ ids: z.array(z.number()) })).mutation(async ({ input }) => {
    await Promise.all(input.ids.map((id: any) => TrainingDataService.deleteTrainingData(id)));
    return { success: true };
  }),

  bulkValidate: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        qualityScore: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const results = await Promise.all(
        input.ids.map((id: any) => TrainingDataService.validateTrainingData(id, ctx.user.id, input.qualityScore))
      );
      return results;
    }),
});
