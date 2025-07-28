/**
 * Conversation State Analyzer
 * Provides autonomous analysis of conversation states for AI operations
 */

export interface ConversationMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationState {
  id: string;
  status: "active" | "idle" | "resolved" | "escalated" | "waiting";
  participantCount: number;
  messageCount: number;
  lastActivity: Date;
  sentiment: "positive" | "negative" | "neutral";
  urgency: "low" | "medium" | "high" | "critical";
  topics: string[];
  resolution?: string | undefined;
}

export interface StateAnalysisResult {
  currentState: ConversationState;
  stateChanges: StateChange[];
  recommendations: string[];
  nextActions: string[];
  confidence: number;
}

export interface StateChange {
  timestamp: Date;
  fromState: string;
  toState: string;
  trigger: string;
  confidence: number;
}

export interface AnalysisConfig {
  enableSentimentAnalysis: boolean;
  enableTopicExtraction: boolean;
  urgencyThresholds: {
    responseTime: number; // minutes
    keywordTriggers: string[];
  };
  stateTransitionRules: Record<string, string[]>;
}

export class ConversationStateAnalyzer {
  private config: AnalysisConfig;
  private stateHistory: Map<string, StateChange[]> = new Map();

  constructor(
    config: AnalysisConfig = {
      enableSentimentAnalysis: true,
      enableTopicExtraction: true,
      urgencyThresholds: {
        responseTime: 30,
        keywordTriggers: ["urgent", "asap", "emergency", "critical"],
      },
      stateTransitionRules: {
        active: ["idle", "resolved", "escalated"],
        idle: ["active", "resolved"],
        waiting: ["active", "escalated"],
        escalated: ["resolved", "active"],
        resolved: ["active"], // Can be reopened
      },
    }
  ) {
    this.config = config;
  }

  async analyzeConversation(conversationId: string, messages: unknown[]): Promise<StateAnalysisResult> {
    // Stub implementation
    const currentState = await this.determineCurrentState(conversationId, messages);
    const stateChanges = this.getStateHistory(conversationId);
    const recommendations = this.generateRecommendations(currentState, messages);
    const nextActions = this.suggestNextActions(currentState, messages);

    return {
      currentState,
      stateChanges,
      recommendations,
      nextActions,
      confidence: 0.85, // Stub confidence score
    };
  }

  private async determineCurrentState(conversationId: string, messages: unknown[]): Promise<ConversationState> {
    // Stub implementation - analyze messages to determine state
    const lastMessage = messages[messages.length - 1];
    const lastActivity = lastMessage ? new Date(lastMessage.timestamp || Date.now()) : new Date();

    // Simple heuristics for state determination
    let status: ConversationState["status"] = "active";
    let urgency: ConversationState["urgency"] = "low";
    let sentiment: ConversationState["sentiment"] = "neutral";

    // Check for urgency keywords
    const messageText = messages
      .map((m: unknown) => m.content || "")
      .join(" ")
      .toLowerCase();
    if (this.config.urgencyThresholds.keywordTriggers.some((keyword) => messageText.includes(keyword))) {
      urgency = "high";
    }

    // Check time since last activity
    const minutesSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60);
    if (minutesSinceLastActivity > this.config.urgencyThresholds.responseTime) {
      status = "idle";
    }

    // Check for resolution indicators
    if (messageText.includes("resolved") || messageText.includes("solved") || messageText.includes("fixed")) {
      status = "resolved";
    }

    // Basic sentiment analysis
    if (messageText.includes("thank") || messageText.includes("great") || messageText.includes("perfect")) {
      sentiment = "positive";
    } else if (messageText.includes("problem") || messageText.includes("issue") || messageText.includes("error")) {
      sentiment = "negative";
    }

    return {
      id: conversationId,
      status,
      participantCount: new Set(messages.map((m: unknown) => m.senderId || m.userId)).size,
      messageCount: messages.length,
      lastActivity,
      sentiment,
      urgency,
      topics: this.extractTopics(messages),
      resolution: status === "resolved" ? "Issue resolved successfully" : undefined,
    };
  }

  private extractTopics(messages: unknown[]): string[] {
    if (!this.config.enableTopicExtraction) {
      return [];
    }

    // Stub implementation - extract common topics
    const text = messages
      .map((m: unknown) => m.content || "")
      .join(" ")
      .toLowerCase();
    const commonTopics = ["billing", "technical", "support", "feature", "bug", "account", "payment"];

    return commonTopics.filter((topic: unknown) => text.includes(topic));
  }

  private generateRecommendations(state: ConversationState, messages: unknown[]): string[] {
    const recommendations: string[] = [];

    if (state.urgency === "high" || state.urgency === "critical") {
      recommendations.push("Prioritize immediate response due to high urgency");
    }

    if (state.sentiment === "negative") {
      recommendations.push("Use empathetic language to address customer concerns");
    }

    if (state.status === "idle" && state.messageCount > 0) {
      recommendations.push("Follow up to ensure customer satisfaction");
    }

    if (state.participantCount > 2) {
      recommendations.push("Consider consolidating conversation participants");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring conversation progress");
    }

    return recommendations;
  }

  private suggestNextActions(state: ConversationState, messages: unknown[]): string[] {
    const actions: string[] = [];

    switch (state.status) {
      case "active":
        if (state.urgency === "high") {
          actions.push("Respond within 5 minutes");
        } else {
          actions.push("Respond within standard SLA timeframe");
        }
        break;

      case "idle":
        actions.push("Send follow-up message to re-engage");
        break;

      case "waiting":
        actions.push("Check if customer has provided requested information");
        break;

      case "escalated":
        actions.push("Assign to senior agent or specialist");
        break;

      case "resolved":
        actions.push("Send satisfaction survey");
        break;
    }

    return actions;
  }

  private getStateHistory(conversationId: string): StateChange[] {
    return this.stateHistory.get(conversationId) || [];
  }

  recordStateChange(conversationId: string, change: StateChange): void {
    if (!this.stateHistory.has(conversationId)) {
      this.stateHistory.set(conversationId, []);
    }
    this.stateHistory.get(conversationId)!.push(change);
  }

  async predictNextState(
    currentState: ConversationState,
    context?: any
  ): Promise<{
    predictedState: string;
    probability: number;
    reasoning: string;
  }> {
    // Stub implementation
    const possibleStates = this.config.stateTransitionRules[currentState.status] || [];

    if (possibleStates.length === 0) {
      return {
        predictedState: currentState.status,
        probability: 0.9,
        reasoning: "No valid state transitions available",
      };
    }

    // Simple prediction logic
    let predictedState: string = possibleStates[0] || currentState.status;
    let probability = 0.7;
    let reasoning = "Based on conversation patterns";

    if (currentState.urgency === "critical" && possibleStates.includes("escalated")) {
      predictedState = "escalated";
      probability = 0.9;
      reasoning = "High urgency indicates likely escalation";
    } else if (currentState.sentiment === "positive" && possibleStates.includes("resolved")) {
      predictedState = "resolved";
      probability = 0.8;
      reasoning = "Positive sentiment suggests resolution";
    }

    // Ensure we return a valid state from possible states
    if (possibleStates.length > 0 && !possibleStates.includes(predictedState)) {
      predictedState = possibleStates[0] || currentState.status;
    }

    return { predictedState, probability, reasoning };
  }

  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  clearHistory(conversationId?: string): void {
    if (conversationId) {
      this.stateHistory.delete(conversationId);
    } else {
      this.stateHistory.clear();
    }
  }
}

// Default instance
export const conversationStateAnalyzer = new ConversationStateAnalyzer();

// Utility functions
export function createStateAnalyzer(config?: AnalysisConfig): ConversationStateAnalyzer {
  return new ConversationStateAnalyzer(config);
}

export function isValidStateTransition(fromState: string, toState: string, rules: Record<string, string[]>): boolean {
  return rules[fromState]?.includes(toState) || false;
}
