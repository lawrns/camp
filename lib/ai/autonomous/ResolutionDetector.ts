// Resolution Detector stub
export interface ResolutionSignal {
  type: "explicit" | "implicit" | "behavioral";
  confidence: number; // 0-1
  indicators: string[];
  timestamp: Date;
}

export interface ResolutionAnalysis {
  isResolved: boolean;
  confidence: number; // 0-1
  signals: ResolutionSignal[];
  reasoning: string;
  suggestedActions: string[];
  nextSteps?: string[];
}

export interface ConversationContext {
  id: string;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    timestamp: Date;
  }>;
  customerSatisfaction?: number;
  issueType?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export class ResolutionDetector {
  private static instance: ResolutionDetector | undefined;

  static getInstance(): ResolutionDetector {
    if (!ResolutionDetector.instance) {
      ResolutionDetector.instance = new ResolutionDetector();
    }
    return ResolutionDetector.instance;
  }

  async analyzeResolution(context: ConversationContext): Promise<ResolutionAnalysis> {
    const signals = await this.detectResolutionSignals(context);
    const confidence = this.calculateOverallConfidence(signals);
    const isResolved = confidence > 0.7;
    const reasoning = this.generateReasoning(signals, isResolved);
    const suggestedActions = this.generateSuggestedActions(signals, isResolved);
    const nextSteps = this.generateNextSteps(signals, isResolved);

    return {
      isResolved,
      confidence,
      signals,
      reasoning,
      suggestedActions,
      nextSteps: nextSteps || [],
    };
  }

  private async detectResolutionSignals(context: ConversationContext): Promise<ResolutionSignal[]> {
    const signals: ResolutionSignal[] = [];
    const messages = context.messages;
    const lastMessage = messages[messages.length - 1];
    const recentMessages = messages.slice(-3); // Last 3 messages

    // Explicit resolution signals
    const explicitSignals = this.detectExplicitSignals(recentMessages);
    signals.push(...explicitSignals);

    // Implicit resolution signals
    const implicitSignals = this.detectImplicitSignals(recentMessages);
    signals.push(...implicitSignals);

    // Behavioral resolution signals
    const behavioralSignals = this.detectBehavioralSignals(context);
    signals.push(...behavioralSignals);

    return signals;
  }

  private detectExplicitSignals(messages: ConversationContext["messages"]): ResolutionSignal[] {
    const signals: ResolutionSignal[] = [];
    const explicitPhrases = [
      "thank you",
      "thanks",
      "solved",
      "resolved",
      "fixed",
      "working now",
      "that helps",
      "perfect",
      "exactly what I needed",
      "all set",
      "no more questions",
      "that's all",
      "appreciate it",
    ];

    messages.forEach((message: unknown) => {
      const typedMessage = message as any;
      if (typedMessage.role === "user") {
        const content = typedMessage.content.toLowerCase();
        const foundPhrases = explicitPhrases.filter((phrase: unknown) => content.includes(phrase as string));

        if (foundPhrases.length > 0) {
          signals.push({
            type: "explicit",
            confidence: Math.min(foundPhrases.length * 0.3, 0.9),
            indicators: foundPhrases,
            timestamp: typedMessage.timestamp,
          });
        }
      }
    });

    return signals;
  }

  private detectImplicitSignals(messages: ConversationContext["messages"]): ResolutionSignal[] {
    const signals: ResolutionSignal[] = [];
    const positiveIndicators = [
      "great",
      "awesome",
      "excellent",
      "helpful",
      "clear",
      "understand",
      "makes sense",
      "got it",
      "I see",
    ];

    messages.forEach((message: unknown) => {
      const typedMessage = message as any;
      if (typedMessage.role === "user") {
        const content = typedMessage.content.toLowerCase();
        const foundIndicators = positiveIndicators.filter((indicator: unknown) => content.includes(indicator as string));

        if (foundIndicators.length > 0) {
          signals.push({
            type: "implicit",
            confidence: Math.min(foundIndicators.length * 0.2, 0.7),
            indicators: foundIndicators,
            timestamp: typedMessage.timestamp,
          });
        }
      }
    });

    return signals;
  }

  private detectBehavioralSignals(context: ConversationContext): ResolutionSignal[] {
    const signals: ResolutionSignal[] = [];
    const messages = context.messages;

    // Check for conversation length - very long conversations might indicate unresolved issues
    if (messages.length > 20) {
      signals.push({
        type: "behavioral",
        confidence: -0.2, // Negative signal
        indicators: ["extended_conversation"],
        timestamp: new Date(),
      });
    }

    // Check for message frequency decrease
    const recentMessages = messages.slice(-5);
    if (recentMessages.length >= 3) {
      const userMessages = recentMessages.filter((m: unknown) => (m as any).role === "user");
      if (userMessages.length <= 1) {
        signals.push({
          type: "behavioral",
          confidence: 0.4,
          indicators: ["reduced_user_engagement"],
          timestamp: new Date(),
        });
      }
    }

    // Check customer satisfaction if available
    if (context.customerSatisfaction !== undefined) {
      if (context.customerSatisfaction > 0.7) {
        signals.push({
          type: "behavioral",
          confidence: context.customerSatisfaction,
          indicators: ["high_satisfaction_score"],
          timestamp: new Date(),
        });
      }
    }

    return signals;
  }

  private calculateOverallConfidence(signals: ResolutionSignal[]): number {
    if (signals.length === 0) return 0;

    const explicitSignals = signals.filter((s: unknown) => (s as any).type === "explicit");
    const implicitSignals = signals.filter((s: unknown) => (s as any).type === "implicit");
    const behavioralSignals = signals.filter((s: unknown) => (s as any).type === "behavioral");

    // Weight explicit signals more heavily
    const explicitWeight = 0.6;
    const implicitWeight = 0.3;
    const behavioralWeight = 0.1;

    const explicitScore =
      explicitSignals.reduce((sum: any, s: unknown) => sum + (s as any).confidence, 0) / Math.max(explicitSignals.length, 1);
    const implicitScore =
      implicitSignals.reduce((sum: any, s: unknown) => sum + (s as any).confidence, 0) / Math.max(implicitSignals.length, 1);
    const behavioralScore =
      behavioralSignals.reduce((sum: any, s: unknown) => sum + (s as any).confidence, 0) / Math.max(behavioralSignals.length, 1);

    const weightedScore =
      explicitScore * explicitWeight + implicitScore * implicitWeight + behavioralScore * behavioralWeight;

    return Math.max(0, Math.min(1, weightedScore));
  }

  private generateReasoning(signals: ResolutionSignal[], isResolved: boolean): string {
    if (signals.length === 0) {
      return "No clear resolution signals detected in the conversation.";
    }

    const explicitSignals = signals.filter((s: unknown) => (s as any).type === "explicit");
    const implicitSignals = signals.filter((s: unknown) => (s as any).type === "implicit");

    if (isResolved) {
      let reasoning = "Resolution detected based on ";
      const reasons: string[] = [];

      if (explicitSignals.length > 0) {
        reasons.push(
          `explicit customer confirmation (${explicitSignals.map((s: unknown) => s.indicators.join(", ")).join("; ")})`
        );
      }

      if (implicitSignals.length > 0) {
        reasons.push(
          `positive customer sentiment (${implicitSignals.map((s: unknown) => s.indicators.join(", ")).join("; ")})`
        );
      }

      reasoning += reasons.join(" and ");
      return reasoning + ".";
    } else {
      return "Resolution not clearly indicated. Customer may need additional assistance or clarification.";
    }
  }

  private generateSuggestedActions(signals: ResolutionSignal[], isResolved: boolean): string[] {
    if (isResolved) {
      return [
        "Send follow-up satisfaction survey",
        "Document resolution for knowledge base",
        "Close conversation with summary",
        "Offer additional assistance if needed",
      ];
    } else {
      const actions = ["Continue providing assistance"];

      const hasExplicitSignals = signals.some((s) => s.type === "explicit");
      if (!hasExplicitSignals) {
        actions.push("Ask for explicit confirmation of resolution");
      }

      actions.push("Clarify any remaining questions");
      actions.push("Provide additional resources if helpful");

      return actions;
    }
  }

  private generateNextSteps(signals: ResolutionSignal[], isResolved: boolean): string[] | undefined {
    if (isResolved) {
      return [
        "Monitor for any follow-up questions",
        "Update customer record with resolution",
        "Schedule follow-up if appropriate",
      ];
    } else {
      return [
        "Continue active engagement",
        "Identify specific remaining concerns",
        "Escalate if complexity exceeds current capability",
      ];
    }
  }

  async batchAnalyze(contexts: ConversationContext[]): Promise<Map<string, ResolutionAnalysis>> {
    const results = new Map<string, ResolutionAnalysis>();

    for (const context of contexts) {
      const analysis = await this.analyzeResolution(context);
      results.set(context.id, analysis);
    }

    return results;
  }

  getResolutionMetrics(analyses: ResolutionAnalysis[]): {
    totalAnalyzed: number;
    resolvedCount: number;
    resolutionRate: number;
    averageConfidence: number;
  } {
    const totalAnalyzed = analyses.length;
    const resolvedCount = analyses.filter((a: unknown) => a.isResolved).length;
    const resolutionRate = totalAnalyzed > 0 ? resolvedCount / totalAnalyzed : 0;
    const averageConfidence = analyses.reduce((sum: any, a: unknown) => sum + a.confidence, 0) / Math.max(totalAnalyzed, 1);

    return {
      totalAnalyzed,
      resolvedCount,
      resolutionRate,
      averageConfidence,
    };
  }
}

export const resolutionDetector = ResolutionDetector.getInstance();
export default ResolutionDetector;
