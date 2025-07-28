/**
 * Model Router
 * Provides AI model routing and management capabilities
 */

import { z } from "zod";

export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "mistral" | "local";
  endpoint?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  isEnabled: boolean;
  priority: number; // Higher number = higher priority
  costPerToken: number; // Cost in USD per 1K tokens
  capabilities: ModelCapability[];
}

export interface ModelCapability {
  type: "text-generation" | "code-generation" | "chat" | "embedding" | "image-generation" | "function-calling";
  quality: "low" | "medium" | "high" | "excellent";
  speed: "slow" | "medium" | "fast" | "very-fast";
}

export interface RoutingRule {
  id: string;
  name: string;
  conditions: RoutingCondition[];
  targetModel: string;
  fallbackModels: string[];
  isEnabled: boolean;
  priority: number;
}

export interface ModelSelectionRule extends RoutingRule {
  mailboxId: string;
}

export interface RoutingCondition {
  type: "content-type" | "token-count" | "user-tier" | "time-of-day" | "load-level" | "cost-budget";
  operator: "equals" | "contains" | "greater-than" | "less-than" | "in-range";
  value: string | number | string[] | { min: number; max: number };
}

export interface ModelRequest {
  prompt: string;
  type: "text-generation" | "chat" | "code-generation" | "embedding";
  maxTokens?: number;
  temperature?: number;
  userId?: string;
  userTier?: "free" | "pro" | "enterprise";
  metadata?: Record<string, unknown>;
}

export interface ModelResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    provider: string;
  };
}

export interface LoadBalancingStrategy {
  type: "round-robin" | "weighted" | "least-connections" | "cost-optimized" | "performance-optimized";
  weights?: Record<string, number>; // Model ID -> weight
}

// Zod Schemas for validation
export const ModelSelectionRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  mailboxId: z.string(),
  conditions: z.array(
    z.object({
      type: z.enum(["content-type", "token-count", "user-tier", "time-of-day", "load-level", "cost-budget"]),
      operator: z.enum(["equals", "contains", "greater-than", "less-than", "in-range"]),
      value: z.union([z.string(), z.number(), z.array(z.string()), z.object({ min: z.number(), max: z.number() })]),
    })
  ),
  targetModel: z.string(),
  fallbackModels: z.array(z.string()).default([]),
  isEnabled: z.boolean().default(true),
  priority: z.number().default(50),
});

export class ModelRouter {
  private models: Map<string, ModelConfig> = new Map();
  private rules: Map<string, RoutingRule> = new Map();
  private loadBalancing: LoadBalancingStrategy = { type: "round-robin" };
  private requestCounts: Map<string, number> = new Map();
  private lastUsedIndex = 0;

  constructor() {
    this.initializeDefaultModels();
    this.initializeDefaultRules();
  }

  private initializeDefaultModels(): void {
    const defaultModels: ModelConfig[] = [
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "openai",
        maxTokens: 4096,
        temperature: 0.7,
        isEnabled: true,
        priority: 90,
        costPerToken: 0.03,
        capabilities: [
          { type: "text-generation", quality: "excellent", speed: "medium" },
          { type: "chat", quality: "excellent", speed: "medium" },
          { type: "function-calling", quality: "excellent", speed: "medium" },
        ],
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "openai",
        maxTokens: 4096,
        temperature: 0.7,
        isEnabled: true,
        priority: 70,
        costPerToken: 0.001,
        capabilities: [
          { type: "text-generation", quality: "high", speed: "fast" },
          { type: "chat", quality: "high", speed: "fast" },
          { type: "function-calling", quality: "medium", speed: "fast" },
        ],
      },
      {
        id: "claude-3-sonnet",
        name: "Claude 3 Sonnet",
        provider: "anthropic",
        maxTokens: 4096,
        temperature: 0.7,
        isEnabled: true,
        priority: 85,
        costPerToken: 0.015,
        capabilities: [
          { type: "text-generation", quality: "excellent", speed: "medium" },
          { type: "chat", quality: "excellent", speed: "medium" },
          { type: "code-generation", quality: "high", speed: "medium" },
        ],
      },
    ];

    for (const model of defaultModels) {
      this.models.set(model.id, model);
      this.requestCounts.set(model.id, 0);
    }
  }

  private initializeDefaultRules(): void {
    const defaultRules: RoutingRule[] = [
      {
        id: "free-tier-rule",
        name: "Free Tier Users",
        conditions: [{ type: "user-tier", operator: "equals", value: "free" }],
        targetModel: "gpt-3.5-turbo",
        fallbackModels: [],
        isEnabled: true,
        priority: 100,
      },
      {
        id: "large-context-rule",
        name: "Large Context Requests",
        conditions: [{ type: "token-count", operator: "greater-than", value: 2000 }],
        targetModel: "gpt-4-turbo",
        fallbackModels: ["claude-3-sonnet"],
        isEnabled: true,
        priority: 80,
      },
      {
        id: "code-generation-rule",
        name: "Code Generation Requests",
        conditions: [{ type: "content-type", operator: "equals", value: "code-generation" }],
        targetModel: "claude-3-sonnet",
        fallbackModels: ["gpt-4-turbo"],
        isEnabled: true,
        priority: 70,
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  async routeRequest(request: ModelRequest): Promise<string> {
    // Find the best model based on routing rules
    const selectedModel = this.selectModel(request);

    if (!selectedModel) {
      throw new Error("No suitable model found for request");
    }

    // Update request count for load balancing
    const currentCount = this.requestCounts.get(selectedModel) || 0;
    this.requestCounts.set(selectedModel, currentCount + 1);

    return selectedModel;
  }

  private selectModel(request: ModelRequest): string | null {
    // Apply routing rules in priority order
    const sortedRules = Array.from(this.rules.values())
      .filter((rule: RoutingRule) => rule.isEnabled)
      .sort((a: RoutingRule, b: RoutingRule) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.matchesRule(request, rule)) {
        // Check if target model is available
        const targetModel = this.models.get(rule.targetModel);
        if (targetModel && targetModel.isEnabled) {
          return rule.targetModel;
        }

        // Try fallback models
        for (const fallbackId of rule.fallbackModels) {
          const fallbackModel = this.models.get(fallbackId);
          if (fallbackModel && fallbackModel.isEnabled) {
            return fallbackId;
          }
        }
      }
    }

    // No rules matched, use load balancing strategy
    return this.selectByLoadBalancing(request);
  }

  private matchesRule(request: ModelRequest, rule: RoutingRule): boolean {
    return rule.conditions.every((condition: RoutingCondition) => this.matchesCondition(request, condition));
  }

  private matchesCondition(request: ModelRequest, condition: RoutingCondition): boolean {
    switch (condition.type) {
      case "content-type":
        return this.compareValues(request.type, condition.operator, condition.value);

      case "token-count":
        const tokenCount = this.estimateTokenCount(request.prompt);
        return this.compareValues(tokenCount, condition.operator, condition.value);

      case "user-tier":
        return this.compareValues(request.userTier || "free", condition.operator, condition.value);

      case "time-of-day":
        const hour = new Date().getHours();
        return this.compareValues(hour, condition.operator, condition.value);

      default:
        return false;
    }
  }

  private compareValues(
    actual: string | number,
    operator: string,
    expected: string | number | string[] | { min: number; max: number }
  ): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;

      case "contains":
        return typeof actual === "string" && typeof expected === "string" && actual.includes(expected);

      case "greater-than":
        return typeof actual === "number" && typeof expected === "number" && actual > expected;

      case "less-than":
        return typeof actual === "number" && typeof expected === "number" && actual < expected;

      case "in-range":
        if (typeof actual === "number" && typeof expected === "object" && "min" in expected && "max" in expected) {
          return actual >= expected.min && actual <= expected.max;
        }
        return false;

      default:
        return false;
    }
  }

  private selectByLoadBalancing(request: ModelRequest): string | null {
    const availableModels = Array.from(this.models.values()).filter((model: ModelConfig) => model.isEnabled);

    if (availableModels.length === 0) return null;

    switch (this.loadBalancing.type) {
      case "round-robin":
        this.lastUsedIndex = (this.lastUsedIndex + 1) % availableModels.length;
        return availableModels[this.lastUsedIndex]?.id || "";

      case "weighted":
        return this.selectWeightedModel(availableModels);

      case "least-connections":
        return this.selectLeastUsedModel(availableModels);

      case "cost-optimized":
        return this.selectCostOptimizedModel(availableModels);

      case "performance-optimized":
        return this.selectPerformanceOptimizedModel(availableModels, request);

      default:
        return availableModels[0]?.id || "";
    }
  }

  private selectWeightedModel(models: ModelConfig[]): string {
    const weights = this.loadBalancing.weights || {};
    const totalWeight = models.reduce((sum: number, model: ModelConfig) => sum + (weights[model.id] || 1), 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const model of models) {
      currentWeight += weights[model.id] || 1;
      if (random <= currentWeight) {
        return model.id;
      }
    }

    return models[0]?.id || "";
  }

  private selectLeastUsedModel(models: ModelConfig[]): string {
    return models.reduce((least: ModelConfig, current: ModelConfig) => {
      const leastCount = this.requestCounts.get(least.id) || 0;
      const currentCount = this.requestCounts.get(current.id) || 0;
      return currentCount < leastCount ? current : least;
    }).id;
  }

  private selectCostOptimizedModel(models: ModelConfig[]): string {
    return models.reduce((cheapest: ModelConfig, current: ModelConfig) =>
      current.costPerToken < cheapest.costPerToken ? current : cheapest
    ).id;
  }

  private selectPerformanceOptimizedModel(models: ModelConfig[], request: ModelRequest): string {
    // Filter models by capability
    const suitableModels = models.filter((model: ModelConfig) =>
      model.capabilities.some((cap: ModelCapability) => cap.type === request.type)
    );

    if (suitableModels.length === 0) return models[0]?.id || "";

    // Select based on quality and speed
    return suitableModels.reduce((best: ModelConfig, current: ModelConfig) => {
      const bestCap = best.capabilities.find((cap: ModelCapability) => cap.type === request.type);
      const currentCap = current.capabilities.find((cap: ModelCapability) => cap.type === request.type);

      if (!bestCap) return current;
      if (!currentCap) return best;

      // Prioritize quality, then speed
      const qualityScore: Record<string, number> = { low: 1, medium: 2, high: 3, excellent: 4 };
      const speedScore: Record<string, number> = { slow: 1, medium: 2, fast: 3, "very-fast": 4 };

      const bestScore =
        (qualityScore[bestCap?.quality || "low"] || 1) * 2 + (speedScore[bestCap?.speed || "slow"] || 1);
      const currentScore =
        (qualityScore[currentCap?.quality || "low"] || 1) * 2 + (speedScore[currentCap?.speed || "slow"] || 1);

      return currentScore > bestScore ? current : best;
    }).id;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async processRequest(request: ModelRequest): Promise<ModelResponse> {
    const modelId = await this.routeRequest(request);
    const model = this.models.get(modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Simulate processing
    const startTime = Date.now();

    // Stub response generation
    const response = this.generateStubResponse(request, model);

    const processingTime = Date.now() - startTime;

    return {
      content: response,
      model: modelId,
      usage: {
        promptTokens: this.estimateTokenCount(request.prompt),
        completionTokens: this.estimateTokenCount(response),
        totalTokens: this.estimateTokenCount(request.prompt + response),
        cost: this.calculateCost(request.prompt + response, model.costPerToken),
      },
      metadata: {
        processingTime,
        timestamp: new Date(),
        provider: model.provider,
      },
    };
  }

  private generateStubResponse(request: ModelRequest, model: ModelConfig): string {
    // Generate a stub response based on request type
    switch (request.type) {
      case "text-generation":
        return `This is a generated text response from ${model.name}. The request was: "${request.prompt.slice(0, 50)}..."`;

      case "chat":
        return `Hello! I'm ${model.name}. I understand you asked: "${request.prompt.slice(0, 50)}...". How can I help you further?`;

      case "code-generation":
        return `// Generated by ${model.name}\nfunction example() {\n  // Implementation based on: ${request.prompt.slice(0, 30)}...\n  return "Hello World";\n}`;

      case "embedding":
        return "[0.1, 0.2, 0.3, ...]"; // Stub embedding representation

      default:
        return `Response generated by ${model.name}`;
    }
  }

  private calculateCost(text: string, costPerToken: number): number {
    const tokens = this.estimateTokenCount(text);
    return (tokens / 1000) * costPerToken;
  }

  // Management methods
  addModel(model: ModelConfig): void {
    this.models.set(model.id, model);
    this.requestCounts.set(model.id, 0);
  }

  removeModel(modelId: string): boolean {
    this.requestCounts.delete(modelId);
    return this.models.delete(modelId);
  }

  updateModel(modelId: string, updates: Partial<ModelConfig>): boolean {
    const existing = this.models.get(modelId);
    if (!existing) return false;

    this.models.set(modelId, { ...existing, ...updates });
    return true;
  }

  addRule(rule: RoutingRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  updateLoadBalancing(strategy: LoadBalancingStrategy): void {
    this.loadBalancing = strategy;
  }

  getModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  getRules(): RoutingRule[] {
    return Array.from(this.rules.values());
  }

  getStats(): {
    totalRequests: number;
    modelUsage: Record<string, number>;
    averageResponseTime: number;
  } {
    const totalRequests = Array.from(this.requestCounts.values()).reduce(
      (sum: number, count: number) => sum + count,
      0
    );
    const modelUsage: Record<string, number> = {};

    this.requestCounts.forEach((count, modelId) => {
      modelUsage[modelId] = count;
    });

    return {
      totalRequests,
      modelUsage,
      averageResponseTime: 250, // Stub average
    };
  }

  // Methods for rule management
  async createRule(ruleInput: {
    name?: string;
    mailboxId?: string;
    conditions?: Array<{
      type?: "content-type" | "token-count" | "user-tier" | "time-of-day" | "load-level" | "cost-budget";
      operator?: "equals" | "contains" | "greater-than" | "less-than" | "in-range";
      value?: string | number | string[] | { min?: number; max?: number };
    }>;
    targetModel?: string;
    fallbackModels?: string[];
    isEnabled?: boolean;
    priority?: number;
  }): Promise<ModelSelectionRule> {
    const id = `rule-${Date.now()}`;

    // Convert optional conditions to required RoutingCondition format
    const conditions: RoutingCondition[] = (ruleInput.conditions || []).map(condition => ({
      type: condition.type || "content-type",
      operator: condition.operator || "equals",
      value: condition.value || ""
    }));

    const newRule: ModelSelectionRule = {
      id,
      name: ruleInput.name || "Unnamed Rule",
      mailboxId: ruleInput.mailboxId || "",
      conditions,
      targetModel: ruleInput.targetModel || "gpt-3.5-turbo",
      fallbackModels: ruleInput.fallbackModels || [],
      isEnabled: ruleInput.isEnabled ?? true,
      priority: ruleInput.priority ?? 50,
    };
    this.rules.set(id, newRule);
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<ModelSelectionRule>): Promise<ModelSelectionRule | null> {
    const existing = this.rules.get(ruleId);
    if (!existing) return null;

    const updated = { ...existing, ...updates } as ModelSelectionRule;
    this.rules.set(ruleId, updated);
    return updated;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    return this.rules.delete(ruleId);
  }

  async getModelSelectionRules(mailboxId?: string): Promise<ModelSelectionRule[]> {
    const rules = Array.from(this.rules.values());
    if (mailboxId) {
      return rules.filter(
        (rule: RoutingRule) => "mailboxId" in rule && (rule as ModelSelectionRule).mailboxId === mailboxId
      ) as ModelSelectionRule[];
    }
    return rules as ModelSelectionRule[];
  }
}

// Default instance
export const modelRouter = new ModelRouter();

// Utility functions
export function routeToModel(request: ModelRequest): Promise<string> {
  return modelRouter.routeRequest(request);
}

export function processModelRequest(request: ModelRequest): Promise<ModelResponse> {
  return modelRouter.processRequest(request);
}

export function getAvailableModels(): ModelConfig[] {
  return modelRouter.getModels().filter((model: ModelConfig) => model.isEnabled);
}
