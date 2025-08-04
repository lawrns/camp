/**
 * AI Cost Management Service
 * Handles AI-specific billing and cost calculations
 */

import { supabase } from "@/lib/supabase";

export interface BillingSummary {
  totalTokens: number;
  overageTokens: number;
  usageCostCents: number;
  averageCostPerToken: number;
  averageCostPerRequest: number;
  conversations: number;
  messages: number;
  totalRequests: number;
  modelBreakdown: Record<string, any>;
}

export class AICostManagementService {
  private supabase = supabase.admin();

  async generateBillingPeriodSummary(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    includedTokens: number
  ): Promise<BillingSummary> {
    // Calculate AI usage for the period
    const { data: aiUsage } = await this.supabase
      .from("ai_processing_logs")
      .select("input_tokens, output_tokens, processing_cost, model")
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    const totalTokens =
      aiUsage?.reduce((sum: unknown, log: unknown) => sum + ((log as unknown).input_tokens || 0) + ((log as unknown).output_tokens || 0), 0) || 0;

    const totalCost = aiUsage?.reduce((sum: unknown, log: unknown) => sum + ((log as unknown).processing_cost || 0), 0) || 0;

    const overageTokens = Math.max(0, totalTokens - includedTokens);
    const usageCostCents = Math.round(totalCost * 100); // Convert to cents

    // Get conversation and message counts
    const { count: conversationCount } = await this.supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    const { count: messageCount } = await this.supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    // Calculate model breakdown
    const modelBreakdown: Record<string, any> = {};
    if (aiUsage) {
      aiUsage.forEach((log: unknown) => {
        const typedLog = log as unknown;
        const model = typedLog.model || "unknown";
        if (!modelBreakdown[model]) {
          modelBreakdown[model] = {
            requests: 0,
            tokens: 0,
            cost: 0,
          };
        }
        modelBreakdown[model].requests++;
        modelBreakdown[model].tokens += (typedLog.input_tokens || 0) + (typedLog.output_tokens || 0);
        modelBreakdown[model].cost += typedLog.processing_cost || 0;
      });
    }

    const totalRequests = aiUsage?.length || 0;
    const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    return {
      totalTokens,
      overageTokens,
      usageCostCents,
      averageCostPerToken: totalTokens > 0 ? usageCostCents / totalTokens : 0,
      averageCostPerRequest: averageCostPerRequest * 100, // Convert to cents
      conversations: conversationCount || 0,
      messages: messageCount || 0,
      totalRequests,
      modelBreakdown,
    };
  }

  async generateOptimizationRecommendations(organizationId: string, daysBack: number): Promise<any[]> {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysBack);

    // Analyze usage patterns and generate recommendations
    const recommendations: unknown[] = [];

    // Get AI usage data
    const { data: aiUsage } = await this.supabase
      .from("ai_processing_logs")
      .select("model, input_tokens, output_tokens, processing_cost")
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    if (!aiUsage || aiUsage.length === 0) {
      return recommendations;
    }

    // Analyze model usage
    const modelStats: Record<string, { count: number; cost: number; tokens: number }> = {};
    aiUsage.forEach((log: unknown) => {
      const typedLog = log as unknown;
      const model = typedLog.model || "unknown";
      if (!modelStats[model]) {
        modelStats[model] = { count: 0, cost: 0, tokens: 0 };
      }
      modelStats[model].count++;
      modelStats[model].cost += typedLog.processing_cost || 0;
      modelStats[model].tokens += (typedLog.input_tokens || 0) + (typedLog.output_tokens || 0);
    });

    // Add recommendations based on usage patterns
    Object.entries(modelStats).forEach(([model, stats]) => {
      if (model.includes("gpt-4") && stats.cost > 10) {
        const potentialSavings = Math.round(stats.cost * 0.7 * 100); // 70% savings in cents
        recommendations.push({
          id: `opt-${Date.now()}-1`,
          type: "model_optimization",
          title: "Consider using GPT-4o mini for simple queries",
          description: `You're using ${model} extensively. For simpler queries, GPT-4o mini can provide similar quality at 70% lower cost.`,
          potentialSavingsCents: potentialSavings,
          priority: "high",
          effort: "low",
          impact: "high",
          implementationSteps: [
            "Identify simple queries that don't require advanced reasoning",
            "Update AI model selection logic to use GPT-4o mini for these queries",
            "Monitor quality metrics to ensure acceptable performance",
          ],
          metadata: {
            currentModel: model,
            suggestedModel: "gpt-4o-mini",
            currentMonthlyCost: stats.cost,
            estimatedMonthlyCost: stats.cost * 0.3,
          },
        });
      }

      // Token optimization recommendation
      if (stats.tokens > 1000000) {
        const avgTokensPerRequest = Math.round(stats.tokens / stats.count);
        if (avgTokensPerRequest > 2000) {
          const potentialSavings = Math.round(stats.cost * 0.3 * 100); // 30% savings
          recommendations.push({
            id: `opt-${Date.now()}-2`,
            type: "token_reduction",
            title: "Optimize prompts to reduce token usage",
            description: `Average request uses ${avgTokensPerRequest} tokens. Optimizing prompts could reduce costs by 30%.`,
            potentialSavingsCents: potentialSavings,
            priority: "medium",
            effort: "medium",
            impact: "medium",
            implementationSteps: [
              "Review and optimize system prompts for conciseness",
              "Implement prompt compression techniques",
              "Use prompt templates with variable injection",
            ],
            metadata: {
              currentAvgTokens: avgTokensPerRequest,
              targetAvgTokens: Math.round(avgTokensPerRequest * 0.7),
              affectedModel: model,
            },
          });
        }
      }
    });

    // Add caching recommendation if high request volume
    const totalRequests = aiUsage.length;
    if (totalRequests > 1000) {
      const avgCost = aiUsage.reduce((sum: unknown, log: unknown) => sum + ((log as unknown).processing_cost || 0), 0) / totalRequests;
      const potentialSavings = Math.round(totalRequests * avgCost * 0.4 * 100); // 40% cache hit rate
      recommendations.push({
        id: `opt-${Date.now()}-3`,
        type: "caching",
        title: "Implement response caching",
        description: "High request volume detected. Caching frequently asked questions could reduce costs by 40%.",
        potentialSavingsCents: potentialSavings,
        priority: "high",
        effort: "medium",
        impact: "high",
        implementationSteps: [
          "Identify frequently repeated queries",
          "Implement Redis or in-memory caching layer",
          "Set appropriate cache TTL based on content type",
        ],
        metadata: {
          totalRequests,
          estimatedCacheHitRate: 0.4,
          avgRequestCost: avgCost,
        },
      });
    }

    return recommendations;
  }
}

// Helper function to generate invoice numbers
export async function generateInvoiceNumber(supabase: unknown, organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  // Get the count of invoices for this org this month
  const { count } = await supabase
    .from("ai_billing_invoices")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", new Date(year, new Date().getMonth(), 1).toISOString())
    .lte("created_at", new Date(year, new Date().getMonth() + 1, 0).toISOString());

  const sequence = String((count || 0) + 1).padStart(4, "0");
  return `INV-${year}${month}-${sequence}`;
}
