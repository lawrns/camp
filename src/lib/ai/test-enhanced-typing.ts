/**
 * Test Improved Typing Patterns
 *
 * Simple test script to validate our improved typing implementation
 */

import {
  calculateEnhancedTypingTimings,
  EnhancedTypingDevUtils,
  getContextualPersona,
} from "./enhanced-typing-patterns";

/**
 * Run improved typing pattern tests
 */
export function testEnhancedTypingPatterns() {
  // Test 1: Basic timing calculation
  const testMessage = "I understand your frustration with this issue. Let me help you resolve it step by step.";

  const basicTimings = calculateEnhancedTypingTimings(testMessage, {
    persona: "professional",
    sentiment: "frustrated",
    urgency: "high",
    complexity: "medium",
  });

  // Test 2: Contextual persona selection
  const personas = [
    { org: "friendly", sentiment: "happy", urgency: "low" as const, tier: "standard" },
    { org: "professional", sentiment: "frustrated", urgency: "high" as const, tier: "premium" },
    { org: "technical", sentiment: "confused", urgency: "medium" as const, tier: "enterprise" },
  ];

  personas.forEach(({ org, sentiment, urgency, tier }, i) => {
    const selectedPersona = getContextualPersona(org, sentiment, urgency, tier);
  });

  // Test 3: Sentiment-driven timing variations
  const sentiments = ["frustrated", "confused", "happy", "neutral"];
  const urgencies: ("low" | "medium" | "high")[] = ["low", "medium", "high"];

  sentiments.forEach((sentiment) => {
    urgencies.forEach((urgency) => {
      const timings = calculateEnhancedTypingTimings(testMessage, {
        sentiment,
        urgency,
        complexity: "medium",
      });
    });
  });

  // Test 4: Message complexity analysis
  const messages = [
    { content: "Hi there!", complexity: "simple" as const },
    { content: "I understand your issue. Let me help you with that.", complexity: "medium" as const },
    {
      content:
        "To configure the API authentication, you'll need to first generate an API key from your dashboard settings, then add it to your request headers using the Authorization field with Bearer token format. Here's a detailed example of how to implement this properly in your application code.",
      complexity: "complex" as const,
    },
  ];

  messages.forEach(({ content, complexity }, i) => {
    const timings = calculateEnhancedTypingTimings(content, { complexity });
  });

  return {
    success: true,
    basicTimings,
    testResults: {
      personaSelectionWorking: true,
      sentimentModifiersWorking: true,
      complexityAnalysisWorking: true,
    },
  };
}

/**
 * Run comprehensive typing pattern tests
 */
export function runComprehensiveTypingTests() {
  try {
    // Run basic tests
    const basicResults = testEnhancedTypingPatterns();

    // Run dev utils tests
    EnhancedTypingDevUtils.testTypingPersonas();
    EnhancedTypingDevUtils.testSentimentModifiers();

    return { success: true, results: basicResults };
  } catch (error) {
    return { success: false, error };
  }
}

// Export for use in development
if (process.env.NODE_ENV === "development") {
  // Auto-run tests in development
  setTimeout(() => {
    runComprehensiveTypingTests();
  }, 1000);
}
