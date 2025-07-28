// Utility functions for AI Assistant Panel
export const calculateConfidence = (value: number): number => {
  return Math.min(Math.max(value, 0), 1);
};

export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return "text-green-600";
  if (confidence >= 0.6) return "text-yellow-600";
  return "text-red-600";
};

export const getCategoryIcon = (category: string) => "Bot";

export const getSentimentIcon = (sentiment: string) => "Activity";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-[var(--fl-color-success)]";
    case "processing":
    case "thinking":
    case "analyzing":
      return "text-[var(--fl-color-info)]";
    case "error":
      return "text-[var(--fl-color-danger)]";
    case "ready":
      return "text-purple-500";
    default:
      return "text-[var(--fl-color-text-muted)]";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return "CheckCircle";
    case "processing":
    case "thinking":
    case "analyzing":
      return "Clock";
    case "error":
      return "XCircle";
    case "ready":
      return "Sparkles";
    default:
      return "Bot";
  }
};

export const generateMockSentimentHistory = () => {
  const now = new Date();
  return Array.from({ length: 10 }, (_, i) => {
    const time = new Date(now.getTime() - (9 - i) * 2 * 60 * 1000);
    const score = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7
    return {
      time: time.toISOString(),
      score,
      label: score > 0.6 ? "Positive" : score > 0.4 ? "Neutral" : "Negative",
    };
  });
};

export const generateMockSuggestions = () => [
  {
    id: "1",
    content: "Thank you for reaching out! I'd be happy to help you with your account setup.",
    confidence: 0.92,
    category: "greeting" as const,
    intent: "account_help",
    preview: "Thank you for reaching out! I'd be happy to help...",
  },
  {
    id: "2",
    content: "I understand your frustration. Let me look into this issue right away and find a solution for you.",
    confidence: 0.87,
    category: "empathy" as const,
    intent: "issue_resolution",
    preview: "I understand your frustration. Let me look into...",
  },
  {
    id: "3",
    content: "Based on your account details, I can see the issue. Here's how we can resolve this...",
    confidence: 0.84,
    category: "solution" as const,
    intent: "provide_solution",
    preview: "Based on your account details, I can see the issue...",
  },
];
