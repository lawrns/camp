// AI Model Registry stub
export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "mistral" | "ollama";
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsSystemPrompts: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  maxContextLength: number;
}

export interface RegisteredModel extends ModelConfig {
  capabilities: ModelCapabilities;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelRegistry {
  private static instance: ModelRegistry | undefined;
  private models: Map<string, RegisteredModel> = new Map();

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  // Static convenience methods
  static async getABTest(testId: string): Promise<any> {
    // TODO: Implement A/B test retrieval
    return {
      id: testId,
      name: "Test " + testId,
      status: "active",
      variants: [],
    };
  }

  static async startABTest(testId: string): Promise<any> {
    // TODO: Implement A/B test start
    return { success: true };
  }

  static async getDeployments(modelVersionId?: string): Promise<any[]> {
    // TODO: Implement deployments retrieval
    return [];
  }

  registerModel(config: ModelConfig, capabilities: ModelCapabilities): void {
    const model: RegisteredModel = {
      ...config,
      capabilities,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.models.set(config.id, model);
  }

  getModel(id: string): RegisteredModel | undefined {
    return this.models.get(id);
  }

  getAllModels(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  getActiveModels(): RegisteredModel[] {
    return this.getAllModels().filter((model: unknown) => model.isActive);
  }

  getModelsByProvider(provider: ModelConfig["provider"]): RegisteredModel[] {
    return this.getAllModels().filter((model: unknown) => model.provider === provider);
  }

  updateModel(id: string, updates: Partial<ModelConfig>): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    const updatedModel = {
      ...model,
      ...updates,
      updatedAt: new Date(),
    };

    this.models.set(id, updatedModel);
    return true;
  }

  deactivateModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    model.isActive = false;
    model.updatedAt = new Date();
    return true;
  }

  activateModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    model.isActive = true;
    model.updatedAt = new Date();
    return true;
  }
}

// Default models for stub
const registry = ModelRegistry.getInstance();

// Register some default models
registry.registerModel(
  {
    id: "gpt-4o",
    name: "GPT-4 Optimized",
    provider: "openai",
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    supportsStreaming: true,
    supportsSystemPrompts: true,
    supportsFunctionCalling: true,
    supportsVision: true,
    maxContextLength: 128000,
  }
);

registry.registerModel(
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    supportsStreaming: true,
    supportsSystemPrompts: true,
    supportsFunctionCalling: true,
    supportsVision: true,
    maxContextLength: 200000,
  }
);

export const modelRegistry = registry;
export default ModelRegistry;
