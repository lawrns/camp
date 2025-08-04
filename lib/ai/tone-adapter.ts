/**
 * Tone Adaptation System
 *
 * Builds appropriate system prompts and examples based on detected sentiment,
 * organization persona, and conversation context for human-like AI responses.
 */

import { TONE_CONFIG, type AvailableTone } from "@/app/config/features";
import { analyzeSentiment, getRecommendedTone, type SentimentAnalysis } from "./sentiment";

export interface ToneContext {
  systemPrompt: string;
  examples: Array<{ role: "user" | "assistant"; content: string }>;
  tone: AvailableTone;
  adaptationReason: string;
  responseGuidelines: string[];
}

export interface ToneAdaptationInput {
  userMessage: string;
  organizationPersona?: string;
  conversationHistory?: Array<{ content: string; senderType: string }>;
  customerInfo?: {
    tier?: string;
    previousInteractions?: number;
    satisfactionScore?: number;
  };
  contextualInfo?: {
    subject?: string;
    category?: string;
    urgency?: "low" | "medium" | "high";
  };
}

/**
 * Tone-specific system prompts and examples
 */
const TONE_TEMPLATES = {
  friendly: {
    systemPrompt: `You are a helpful and friendly customer support assistant. Respond in a warm, approachable tone that makes customers feel welcome and valued. Use casual but professional language, show genuine interest in helping, and maintain a positive attitude throughout the conversation.`,

    examples: [
      {
        role: "user" as const,
        content: "I need help with my account settings",
      },
      {
        role: "assistant" as const,
        content:
          "Hi there! I'd be happy to help you with your account settings. What specifically would you like to update or change? I'm here to make this as easy as possible for you!",
      },
    ],

    guidelines: [
      "Use warm greetings and friendly language",
      "Show enthusiasm for helping",
      "Use contractions and casual phrasing when appropriate",
      "Express empathy and understanding",
      "End with encouraging or supportive statements",
    ],
  },

  empathetic: {
    systemPrompt: `You are a compassionate and understanding customer support assistant. The customer appears to be experiencing frustration or difficulty. Respond with genuine empathy, acknowledge their feelings, and focus on providing reassuring, solution-oriented help. Your tone should be calm, patient, and supportive.`,

    examples: [
      {
        role: "user" as const,
        content: "I'm so frustrated! This has been broken for hours and I can't get any work done!",
      },
      {
        role: "assistant" as const,
        content:
          "I completely understand your frustration, and I'm truly sorry this issue has been disrupting your work. That must be really stressful, especially when you have important things to get done. Let me help you resolve this right away so we can get you back on track.",
      },
    ],

    guidelines: [
      "Acknowledge and validate the customer's emotions",
      'Use phrases like "I understand" and "I\'m sorry"',
      "Focus on immediate solutions and relief",
      "Avoid minimizing their concerns",
      "Provide reassurance and confidence in resolution",
    ],
  },

  technical: {
    systemPrompt: `You are a knowledgeable technical support specialist. The customer has a technical question or issue that requires detailed, accurate information. Respond with clear, precise explanations while remaining accessible. Use appropriate technical terminology but explain complex concepts in understandable terms.`,

    examples: [
      {
        role: "user" as const,
        content: "I'm getting a 403 error when trying to access the API endpoint",
      },
      {
        role: "assistant" as const,
        content:
          "A 403 error indicates an authentication or permission issue with your API request. This typically means your API key either doesn't have the required permissions for that endpoint, or there might be an issue with how the authorization header is formatted. Let me help you troubleshoot this step by step.",
      },
    ],

    guidelines: [
      "Use precise technical language when appropriate",
      "Provide step-by-step instructions",
      'Explain the "why" behind technical issues',
      "Offer multiple solution approaches",
      "Include relevant documentation or resource links",
    ],
  },

  professional: {
    systemPrompt: `You are a professional customer service representative. Maintain a formal, courteous tone that conveys competence and reliability. Use proper business language, be direct and efficient in your communication, while remaining helpful and respectful.`,

    examples: [
      {
        role: "user" as const,
        content: "I need information about upgrading my business plan",
      },
      {
        role: "assistant" as const,
        content:
          "Thank you for your inquiry regarding plan upgrades. I would be pleased to provide you with information about our business plan options and help you determine the most suitable upgrade for your requirements. May I ask about your current usage needs and any specific features you are looking to access?",
      },
    ],

    guidelines: [
      "Use formal language and complete sentences",
      "Avoid contractions and casual expressions",
      "Be direct and efficient in communication",
      "Maintain professional courtesy throughout",
      "Focus on business value and outcomes",
    ],
  },
} as const;

/**
 * Build tone context based on user message and organization settings
 */
export function buildToneContext(
  userMessage: string,
  organizationPersona: string = "friendly",
  conversationHistory: Array<{ content: string; senderType: string }> = []
): ToneContext {
  // Analyze sentiment of the current message
  const sentimentAnalysis = analyzeSentiment(userMessage);

  // Get recommended tone based on sentiment
  const recommendedTone = getRecommendedTone(sentimentAnalysis);

  // Determine final tone (balance between org persona and sentiment)
  const finalTone = selectOptimalTone(
    organizationPersona as AvailableTone,
    recommendedTone as AvailableTone,
    sentimentAnalysis
  );

  // Get tone template
  const template = TONE_TEMPLATES[finalTone];

  // Adapt system prompt based on context
  const adaptedPrompt = adaptSystemPrompt(template.systemPrompt, sentimentAnalysis, conversationHistory);

  // Generate adaptation reason
  const adaptationReason = generateAdaptationReason(organizationPersona, recommendedTone, finalTone, sentimentAnalysis);

  return {
    systemPrompt: adaptedPrompt,
    examples: template.examples,
    tone: finalTone,
    adaptationReason,
    responseGuidelines: template.guidelines,
  };
}

/**
 * Advanced tone context building with full input
 */
export function buildAdvancedToneContext(input: ToneAdaptationInput): ToneContext {
  const {
    userMessage,
    organizationPersona = "friendly",
    conversationHistory = [],
    customerInfo,
    contextualInfo,
  } = input;

  // Analyze current message sentiment
  const sentimentAnalysis = analyzeSentiment(userMessage);

  // Get base tone recommendation
  let recommendedTone = getRecommendedTone(sentimentAnalysis) as AvailableTone;

  // Adjust based on customer tier
  if (customerInfo?.tier === "enterprise" || customerInfo?.tier === "premium") {
    if (recommendedTone === "friendly") {
      recommendedTone = "professional"; // Higher tier customers get more formal tone
    }
  }

  // Adjust based on urgency
  if (contextualInfo?.urgency === "high" && recommendedTone === "friendly") {
    recommendedTone = "empathetic"; // High urgency needs empathy
  }

  // Adjust based on customer satisfaction history
  if (customerInfo?.satisfactionScore && customerInfo.satisfactionScore < 3) {
    recommendedTone = "empathetic"; // Unhappy customers need extra care
  }

  // Select optimal tone
  const finalTone = selectOptimalTone(organizationPersona as AvailableTone, recommendedTone, sentimentAnalysis);

  // Get and adapt template
  const template = TONE_TEMPLATES[finalTone];
  const adaptedPrompt = adaptSystemPromptAdvanced(
    template.systemPrompt,
    sentimentAnalysis,
    conversationHistory,
    customerInfo,
    contextualInfo
  );

  // Generate contextual examples
  const contextualExamples = generateContextualExamples(finalTone, sentimentAnalysis, contextualInfo);

  const adaptationReason = generateAdvancedAdaptationReason(
    organizationPersona,
    recommendedTone,
    finalTone,
    sentimentAnalysis,
    customerInfo,
    contextualInfo
  );

  return {
    systemPrompt: adaptedPrompt,
    examples: contextualExamples.length > 0 ? contextualExamples : template.examples,
    tone: finalTone,
    adaptationReason,
    responseGuidelines: template.guidelines,
  };
}

/**
 * Select optimal tone balancing organization preference and sentiment needs
 */
function selectOptimalTone(
  orgTone: AvailableTone,
  sentimentTone: AvailableTone,
  analysis: SentimentAnalysis
): AvailableTone {
  // High confidence sentiment analysis overrides org preference
  if (analysis.confidence > 0.7) {
    return sentimentTone;
  }

  // For moderate confidence, blend tones
  if (analysis.confidence > 0.4) {
    // If org wants professional but sentiment suggests empathetic, compromise
    if (orgTone === "professional" && sentimentTone === "empathetic") {
      return "empathetic"; // Customer needs take priority
    }

    // If org wants friendly but sentiment suggests technical, use technical
    if (orgTone === "friendly" && sentimentTone === "technical") {
      return "technical"; // Technical issues need technical responses
    }

    return sentimentTone;
  }

  // Low confidence, use organization preference
  return orgTone;
}

/**
 * Adapt system prompt based on sentiment and context
 */
function adaptSystemPrompt(
  basePrompt: string,
  analysis: SentimentAnalysis,
  history: Array<{ content: string; senderType: string }>
): string {
  let adaptedPrompt = basePrompt;

  // Add urgency context
  if (analysis.urgency === "high") {
    adaptedPrompt += " The customer has indicated this is urgent, so prioritize quick, actionable solutions.";
  }

  // Add complexity context
  if (analysis.complexity === "complex") {
    adaptedPrompt += " This appears to be a complex issue that may require detailed explanation and multiple steps.";
  }

  // Add conversation context
  if (history.length > 3) {
    adaptedPrompt += " This is an ongoing conversation, so reference previous context when appropriate.";
  }

  // Add emotion-specific guidance
  if (analysis.emotions.includes("frustrated")) {
    adaptedPrompt += " The customer is showing signs of frustration, so be extra patient and understanding.";
  }

  return adaptedPrompt;
}

/**
 * Advanced system prompt adaptation with full context
 */
function adaptSystemPromptAdvanced(
  basePrompt: string,
  analysis: SentimentAnalysis,
  history: Array<{ content: string; senderType: string }>,
  customerInfo?: ToneAdaptationInput["customerInfo"],
  contextualInfo?: ToneAdaptationInput["contextualInfo"]
): string {
  let adaptedPrompt = adaptSystemPrompt(basePrompt, analysis, history);

  // Add customer tier context
  if (customerInfo?.tier) {
    adaptedPrompt += ` This is a ${customerInfo.tier} tier customer, so provide appropriate level of service and attention.`;
  }

  // Add subject context
  if (contextualInfo?.subject) {
    adaptedPrompt += ` The conversation is about: ${contextualInfo.subject}.`;
  }

  // Add satisfaction context
  if (customerInfo?.satisfactionScore && customerInfo.satisfactionScore < 3) {
    adaptedPrompt +=
      " This customer has had previous negative experiences, so be extra careful to provide excellent service.";
  }

  return adaptedPrompt;
}

/**
 * Generate contextual examples based on tone and sentiment
 */
function generateContextualExamples(
  tone: AvailableTone,
  analysis: SentimentAnalysis,
  contextualInfo?: ToneAdaptationInput["contextualInfo"]
): Array<{ role: "user" | "assistant"; content: string }> {
  // For now, return empty array to use default examples
  // This can be expanded to generate dynamic examples based on context
  return [];
}

/**
 * Generate explanation for tone adaptation decision
 */
function generateAdaptationReason(
  orgTone: string,
  recommendedTone: string,
  finalTone: AvailableTone,
  analysis: SentimentAnalysis
): string {
  if (orgTone === finalTone) {
    return `Using organization's preferred ${finalTone} tone`;
  }

  if (recommendedTone === finalTone) {
    return `Adapted to ${finalTone} tone based on detected ${analysis.sentiment} sentiment (${Math.round(analysis.confidence * 100)}% confidence)`;
  }

  return `Balanced ${orgTone} preference with ${recommendedTone} sentiment needs, resulting in ${finalTone} tone`;
}

/**
 * Generate advanced adaptation reason with full context
 */
function generateAdvancedAdaptationReason(
  orgTone: string,
  recommendedTone: string,
  finalTone: AvailableTone,
  analysis: SentimentAnalysis,
  customerInfo?: ToneAdaptationInput["customerInfo"],
  contextualInfo?: ToneAdaptationInput["contextualInfo"]
): string {
  let reason = generateAdaptationReason(orgTone, recommendedTone, finalTone, analysis);

  const factors: string[] = [];

  if (customerInfo?.tier && ["enterprise", "premium"].includes(customerInfo.tier)) {
    factors.push(`${customerInfo.tier} customer tier`);
  }

  if (contextualInfo?.urgency === "high") {
    factors.push("high urgency");
  }

  if (analysis.complexity === "complex") {
    factors.push("complex issue");
  }

  if (customerInfo?.satisfactionScore && customerInfo.satisfactionScore < 3) {
    factors.push("previous negative experience");
  }

  if (factors.length > 0) {
    reason += `. Additional factors: ${factors.join(", ")}`;
  }

  return reason;
}

/**
 * Development utilities for testing tone adaptation
 */
export const ToneAdapterDevUtils = {
  /**
   * Test tone adaptation with various scenarios
   */
  testToneAdaptation() {
    if (process.env.NODE_ENV !== "development") return;

    const testScenarios = [
      {
        message: "I'm so frustrated! This keeps breaking!",
        orgPersona: "friendly",
        description: "Frustrated customer with friendly org",
      },
      {
        message: "I need help configuring the API authentication",
        orgPersona: "professional",
        description: "Technical question with professional org",
      },
      {
        message: "Thank you so much! This is exactly what I needed!",
        orgPersona: "professional",
        description: "Happy customer with professional org",
      },
      {
        message: "I have a question about my billing",
        orgPersona: "friendly",
        description: "Neutral inquiry with friendly org",
      },
    ];

    testScenarios.forEach((scenario, i) => {
      const context = buildToneContext(scenario.message, scenario.orgPersona);
    });
  },

  /**
   * Test advanced tone adaptation
   */
  testAdvancedToneAdaptation() {
    if (process.env.NODE_ENV !== "development") return;

    const advancedScenario: ToneAdaptationInput = {
      userMessage: "This is urgent! Our production system is down and we're losing money!",
      organizationPersona: "friendly",
      customerInfo: {
        tier: "enterprise",
        satisfactionScore: 2,
      },
      contextualInfo: {
        urgency: "high",
        category: "technical",
      },
    };

    const context = buildAdvancedToneContext(advancedScenario);
  },
} as const;
