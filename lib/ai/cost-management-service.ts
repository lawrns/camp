// Cost Management Service stub
export interface CostMetrics {
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  averageCostPerRequest: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ModelCosts {
  modelId: string;
  inputCostPerToken: number; // Cost per 1000 input tokens
  outputCostPerToken: number; // Cost per 1000 output tokens
  provider: string;
}

export interface UsageRecord {
  id: string;
  modelId: string;
  organizationId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  requestType: "chat" | "completion" | "embedding" | "function_call";
  metadata?: Record<string, unknown>;
}

export interface BudgetAlert {
  id: string;
  organizationId: string;
  threshold: number;
  currentSpend: number;
  alertType: "warning" | "critical" | "exceeded";
  triggeredAt: Date;
}

export interface CostOptimizationSuggestion {
  type: "model_switch" | "token_reduction" | "caching" | "batching";
  description: string;
  estimatedSavings: number;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

export class CostManagementService {
  private static instance: CostManagementService | undefined;
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private modelCosts: Map<string, ModelCosts> = new Map();
  private budgetAlerts: Map<string, BudgetAlert[]> = new Map();

  static getInstance(): CostManagementService {
    if (!CostManagementService.instance) {
      CostManagementService.instance = new CostManagementService();
    }
    return CostManagementService.instance;
  }

  constructor() {
    this.initializeModelCosts();
  }

  private initializeModelCosts(): void {
    // Default model costs (per 1000 tokens)
    const defaultCosts: ModelCosts[] = [
      {
        modelId: "gpt-4o",
        inputCostPerToken: 0.005,
        outputCostPerToken: 0.015,
        provider: "openai",
      },
      {
        modelId: "gpt-4o-mini",
        inputCostPerToken: 0.00015,
        outputCostPerToken: 0.0006,
        provider: "openai",
      },
      {
        modelId: "claude-3-5-sonnet-20241022",
        inputCostPerToken: 0.003,
        outputCostPerToken: 0.015,
        provider: "anthropic",
      },
      {
        modelId: "claude-3-haiku-20240307",
        inputCostPerToken: 0.00025,
        outputCostPerToken: 0.00125,
        provider: "anthropic",
      },
    ];

    defaultCosts.forEach((cost: unknown) => {
      this.modelCosts.set(cost.modelId, cost);
    });
  }

  async recordUsage(
    organizationId: string,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    requestType: UsageRecord["requestType"],
    metadata?: Record<string, unknown>
  ): Promise<UsageRecord> {
    const cost = this.calculateCost(modelId, inputTokens, outputTokens);

    const record: UsageRecord = {
      id: this.generateId(),
      modelId,
      organizationId,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date(),
      requestType,
      ...(metadata && { metadata }),
    };

    // Store usage record
    const orgRecords = this.usageRecords.get(organizationId) || [];
    orgRecords.push(record);
    this.usageRecords.set(organizationId, orgRecords);

    // Check budget alerts
    await this.checkBudgetAlerts(organizationId);

    return record;
  }

  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const modelCost = this.modelCosts.get(modelId);
    if (!modelCost) {
      // Default cost if model not found
      return (inputTokens * 0.001 + outputTokens * 0.002) / 1000;
    }

    const inputCost = (inputTokens / 1000) * modelCost.inputCostPerToken;
    const outputCost = (outputTokens / 1000) * modelCost.outputCostPerToken;

    return inputCost + outputCost;
  }

  async getCostMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<CostMetrics> {
    const records = this.usageRecords.get(organizationId) || [];
    const filteredRecords = records.filter(
      (record: unknown) => record.timestamp >= startDate && record.timestamp <= endDate
    );

    const totalCost = filteredRecords.reduce((sum: unknown, record: unknown) => sum + record.cost, 0);
    const inputTokens = filteredRecords.reduce((sum: unknown, record: unknown) => sum + record.inputTokens, 0);
    const outputTokens = filteredRecords.reduce((sum: unknown, record: unknown) => sum + record.outputTokens, 0);
    const requestCount = filteredRecords.length;
    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0;

    return {
      totalCost,
      inputTokens,
      outputTokens,
      requestCount,
      averageCostPerRequest,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  async getUsageByModel(organizationId: string, startDate: Date, endDate: Date): Promise<Map<string, CostMetrics>> {
    const records = this.usageRecords.get(organizationId) || [];
    const filteredRecords = records.filter(
      (record: unknown) => record.timestamp >= startDate && record.timestamp <= endDate
    );

    const modelUsage = new Map<string, UsageRecord[]>();
    filteredRecords.forEach((record: unknown) => {
      const modelRecords = modelUsage.get(record.modelId) || [];
      modelRecords.push(record);
      modelUsage.set(record.modelId, modelRecords);
    });

    const result = new Map<string, CostMetrics>();
    modelUsage.forEach((modelRecords, modelId) => {
      const totalCost = modelRecords.reduce((sum: unknown, record: unknown) => sum + record.cost, 0);
      const inputTokens = modelRecords.reduce((sum: unknown, record: unknown) => sum + record.inputTokens, 0);
      const outputTokens = modelRecords.reduce((sum: unknown, record: unknown) => sum + record.outputTokens, 0);
      const requestCount = modelRecords.length;
      const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0;

      result.set(modelId, {
        totalCost,
        inputTokens,
        outputTokens,
        requestCount,
        averageCostPerRequest,
        period: { start: startDate, end: endDate },
      });
    });

    return result;
  }

  async setBudgetAlert(
    organizationId: string,
    threshold: number,
    alertType: BudgetAlert["alertType"] = "warning"
  ): Promise<void> {
    const currentSpend = await this.getCurrentMonthSpend(organizationId);

    if (currentSpend >= threshold) {
      const alert: BudgetAlert = {
        id: this.generateId(),
        organizationId,
        threshold,
        currentSpend,
        alertType,
        triggeredAt: new Date(),
      };

      const orgAlerts = this.budgetAlerts.get(organizationId) || [];
      orgAlerts.push(alert);
      this.budgetAlerts.set(organizationId, orgAlerts);
    }
  }

  private async checkBudgetAlerts(organizationId: string): Promise<void> {
    const currentSpend = await this.getCurrentMonthSpend(organizationId);

    // Example thresholds - in real implementation, these would be configurable
    const thresholds = [
      { amount: 100, type: "warning" as const },
      { amount: 500, type: "critical" as const },
      { amount: 1000, type: "exceeded" as const },
    ];

    for (const threshold of thresholds) {
      if (currentSpend >= threshold.amount) {
        await this.setBudgetAlert(organizationId, threshold.amount, threshold.type);
      }
    }
  }

  private async getCurrentMonthSpend(organizationId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const metrics = await this.getCostMetrics(organizationId, startOfMonth, endOfMonth);
    return metrics.totalCost;
  }

  async getOptimizationSuggestions(organizationId: string): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];
    const records = this.usageRecords.get(organizationId) || [];

    if (records.length === 0) {
      return suggestions;
    }

    // Analyze usage patterns
    const modelUsage = new Map<string, number>();
    records.forEach((record: unknown) => {
      const currentCost = modelUsage.get(record.modelId) || 0;
      modelUsage.set(record.modelId, currentCost + record.cost);
    });

    // Suggest cheaper models for high-usage expensive models
    modelUsage.forEach((cost, modelId) => {
      if (cost > 50 && modelId.includes("gpt-4")) {
        suggestions.push({
          type: "model_switch",
          description: `Consider using GPT-4o-mini for simpler tasks instead of ${modelId}`,
          estimatedSavings: cost * 0.7, // Estimate 70% savings
          effort: "low",
          impact: "high",
        });
      }
    });

    // Suggest token reduction for high token usage
    const totalTokens = records.reduce((sum: unknown, record: unknown) => sum + record.inputTokens + record.outputTokens, 0);
    if (totalTokens > 1000000) {
      // 1M tokens
      suggestions.push({
        type: "token_reduction",
        description: "Implement prompt optimization to reduce token usage",
        estimatedSavings: totalTokens * 0.001 * 0.3, // Estimate 30% token reduction
        effort: "medium",
        impact: "medium",
      });
    }

    // Suggest caching for repeated requests
    const requestTypes = records.map((r: unknown) => r.requestType);
    const uniqueRequests = new Set(requestTypes).size;
    if (requestTypes.length > uniqueRequests * 2) {
      suggestions.push({
        type: "caching",
        description: "Implement response caching for frequently repeated requests",
        estimatedSavings: records.length * 0.002 * 0.4, // Estimate 40% cache hit rate
        effort: "medium",
        impact: "high",
      });
    }

    return suggestions;
  }

  async exportUsageData(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: "csv" | "json" = "json"
  ): Promise<string> {
    const records = this.usageRecords.get(organizationId) || [];
    const filteredRecords = records.filter(
      (record: unknown) => record.timestamp >= startDate && record.timestamp <= endDate
    );

    if (format === "json") {
      return JSON.stringify(filteredRecords, null, 2);
    } else {
      // CSV format
      const headers = "id,modelId,inputTokens,outputTokens,cost,timestamp,requestType";
      const rows = filteredRecords.map(
        (record) =>
          `${record.id},${record.modelId},${record.inputTokens},${record.outputTokens},${record.cost},${record.timestamp.toISOString()},${record.requestType}`
      );
      return [headers, ...rows].join("\n");
    }
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getModelCosts(): Map<string, ModelCosts> {
    return new Map(this.modelCosts);
  }

  updateModelCosts(modelId: string, costs: Partial<ModelCosts>): void {
    const existing = this.modelCosts.get(modelId);
    if (existing) {
      this.modelCosts.set(modelId, { ...existing, ...costs });
    } else {
      this.modelCosts.set(modelId, {
        modelId,
        inputCostPerToken: 0.001,
        outputCostPerToken: 0.002,
        provider: "unknown",
        ...costs,
      });
    }
  }

  getBudgetAlerts(organizationId: string): BudgetAlert[] {
    return this.budgetAlerts.get(organizationId) || [];
  }
}

export const costManagementService = CostManagementService.getInstance();
