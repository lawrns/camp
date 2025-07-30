/**
 * Sentiment Analysis Service
 * Provides sentiment analysis capabilities for messages and conversations
 */

export type SentimentScore = {
  positive: number;
  negative: number;
  neutral: number;
  compound: number; // Overall sentiment from -1 to 1
};

export type EmotionScores = {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  surprise: number;
  disgust: number;
};

export type SentimentAnalysis = {
  sentiment: SentimentScore;
  emotions: EmotionScores;
  confidence: number;
  language: string;
  keywords: string[];
  urgency: "high" | "medium" | "low";
};

/**
 * Analyze sentiment of a text message
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  // This is a simplified implementation
  // In production, this would use a proper NLP service or model

  const lowerText = text.toLowerCase();

  // Simple keyword-based sentiment scoring
  const positiveWords = [
    "thank",
    "thanks",
    "great",
    "excellent",
    "good",
    "happy",
    "love",
    "wonderful",
    "amazing",
    "fantastic",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "hate",
    "angry",
    "frustrated",
    "disappointed",
    "poor",
    "worst",
    "horrible",
  ];
  const urgentWords = ["urgent", "asap", "immediately", "emergency", "critical", "now", "help"];

  let positiveScore = 0;
  let negativeScore = 0;
  let urgencyScore = 0;

  // Count sentiment indicators
  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeScore++;
  });

  urgentWords.forEach((word) => {
    if (lowerText.includes(word)) urgencyScore++;
  });

  // Calculate sentiment scores
  const total = positiveScore + negativeScore || 1;
  const positive = positiveScore / total;
  const negative = negativeScore / total;
  const neutral = 1 - (positive + negative);
  const compound = (positiveScore - negativeScore) / total;

  // Determine urgency
  let urgency: "high" | "medium" | "low" = "low";
  if (urgencyScore >= 2 || lowerText.includes("!")) {
    urgency = "high";
  } else if (urgencyScore === 1) {
    urgency = "medium";
  }

  // Extract keywords (simple approach)
  const words = text.split(/\s+/).filter((word) => word.length > 4);
  const keywords = [...new Set(words)].slice(0, 5);

  return {
    sentiment: {
      positive: Math.min(1, positive),
      negative: Math.min(1, negative),
      neutral: Math.max(0, neutral),
      compound: Math.max(-1, Math.min(1, compound)),
    },
    emotions: {
      joy: positive * 0.8,
      anger: negative * 0.6,
      fear: negative * 0.3,
      sadness: negative * 0.4,
      surprise: 0.1,
      disgust: negative * 0.2,
    },
    confidence: 0.7, // Fixed confidence for simple implementation
    language: "en",
    keywords,
    urgency,
  };
}

/**
 * Analyze conversation sentiment over time
 */
export function analyzeConversationSentiment(
  messages: Array<{ text: string; timestamp: Date; role: "user" | "agent" }>
): {
  overallSentiment: SentimentAnalysis;
  sentimentTrend: Array<{ timestamp: Date; sentiment: number }>;
  userSentiment: SentimentAnalysis;
  agentSentiment: SentimentAnalysis;
} {
  const userMessages = messages.filter((m) => m.role === "user");
  const agentMessages = messages.filter((m) => m.role === "agent");

  // Analyze user sentiment
  const userText = userMessages.map((m) => m.text).join(" ");
  const userSentiment = analyzeSentiment(userText);

  // Analyze agent sentiment
  const agentText = agentMessages.map((m) => m.text).join(" ");
  const agentSentiment = analyzeSentiment(agentText);

  // Overall sentiment
  const allText = messages.map((m) => m.text).join(" ");
  const overallSentiment = analyzeSentiment(allText);

  // Sentiment trend
  const sentimentTrend = messages.map((message) => ({
    timestamp: message.timestamp,
    sentiment: analyzeSentiment(message.text).sentiment.compound,
  }));

  return {
    overallSentiment,
    sentimentTrend,
    userSentiment,
    agentSentiment,
  };
}

/**
 * Detect emotional state from sentiment
 */
export function detectEmotionalState(sentiment: SentimentAnalysis): {
  state: "happy" | "angry" | "sad" | "neutral" | "frustrated" | "confused";
  confidence: number;
} {
  const { emotions, sentiment: scores } = sentiment;

  // Determine primary emotional state
  if (scores.compound > 0.5 && emotions.joy > 0.5) {
    return { state: "happy", confidence: emotions.joy };
  } else if (emotions.anger > 0.6 || (scores.negative > 0.7 && emotions.anger > 0.4)) {
    return { state: "angry", confidence: emotions.anger };
  } else if (emotions.sadness > 0.5) {
    return { state: "sad", confidence: emotions.sadness };
  } else if (scores.negative > 0.6 && sentiment.urgency === "high") {
    return { state: "frustrated", confidence: scores.negative };
  } else if (sentiment.keywords.some((k) => ["confused", "understand", "help", "?"].includes(k))) {
    return { state: "confused", confidence: 0.6 };
  } else {
    return { state: "neutral", confidence: scores.neutral };
  }
}

/**
 * Generate sentiment-based response suggestions
 */
export function generateSentimentBasedSuggestions(sentiment: SentimentAnalysis): {
  tone: "empathetic" | "professional" | "cheerful" | "apologetic";
  openingPhrases: string[];
  closingPhrases: string[];
} {
  const emotionalState = detectEmotionalState(sentiment);

  switch (emotionalState.state) {
    case "angry":
    case "frustrated":
      return {
        tone: "apologetic",
        openingPhrases: [
          "I understand your frustration, and I'm here to help.",
          "I apologize for any inconvenience this has caused.",
          "I can see this has been a difficult experience for you.",
        ],
        closingPhrases: [
          "Thank you for your patience as we work through this.",
          "I'm committed to resolving this for you.",
          "Please let me know if there's anything else I can help with.",
        ],
      };

    case "sad":
      return {
        tone: "empathetic",
        openingPhrases: [
          "I'm sorry to hear you're experiencing this.",
          "I understand this situation is challenging.",
          "Thank you for sharing this with me.",
        ],
        closingPhrases: [
          "I'm here to support you through this.",
          "Please don't hesitate to reach out if you need anything.",
          "We're here to help make this better.",
        ],
      };

    case "happy":
      return {
        tone: "cheerful",
        openingPhrases: [
          "I'm delighted to help you today!",
          "Thank you for reaching out!",
          "It's great to hear from you!",
        ],
        closingPhrases: [
          "Have a wonderful day!",
          "It was a pleasure assisting you!",
          "Feel free to reach out anytime!",
        ],
      };

    default:
      return {
        tone: "professional",
        openingPhrases: ["Thank you for contacting us.", "I'm here to assist you.", "How can I help you today?"],
        closingPhrases: [
          "Is there anything else I can help you with?",
          "Thank you for your time.",
          "Please let me know if you have any other questions.",
        ],
      };
  }
}

/**
 * Get recommended tone based on sentiment analysis
 */
export function getRecommendedTone(sentiment: SentimentAnalysis): "friendly" | "empathetic" | "technical" | "professional" {
  // High negative sentiment suggests empathetic response
  if (sentiment.sentiment.compound < -0.3) {
    return "empathetic";
  }

  // Technical keywords suggest technical tone
  const technicalKeywords = ["api", "code", "error", "bug", "technical", "integration", "configuration"];
  const hasTechnicalContent = sentiment.keywords.some(keyword => 
    technicalKeywords.some(tech => keyword.toLowerCase().includes(tech))
  );
  
  if (hasTechnicalContent) {
    return "technical";
  }

  // High urgency suggests professional tone
  if (sentiment.urgency === "high") {
    return "professional";
  }

  // Frustrated or confused emotions suggest empathetic tone
  if (sentiment.emotions.anger > 0.5 || sentiment.emotions.sadness > 0.5) {
    return "empathetic";
  }

  // Default to friendly for neutral/positive sentiment
  return "friendly";
}

/**
 * Calculate sentiment velocity (rate of change)
 */
export function calculateSentimentVelocity(sentimentTrend: Array<{ timestamp: Date; sentiment: number }>): number {
  if (sentimentTrend.length < 2) return 0;

  const recent = sentimentTrend.slice(-5); // Last 5 data points
  if (recent.length < 2) return 0;

  const firstPoint = recent[0];
  const lastPoint = recent[recent.length - 1];

  if (!firstPoint || !lastPoint) {
    return 0;
  }

  const timeDiff = lastPoint.timestamp.getTime() - firstPoint.timestamp.getTime();
  const sentimentDiff = lastPoint.sentiment - firstPoint.sentiment;

  // Return sentiment change per minute
  return (sentimentDiff / timeDiff) * 60000;
}
