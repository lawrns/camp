/**
 * Conversation status, priority, and sentiment enums
 * Replaces magic strings throughout the application for better type safety
 */

// ===== CONVERSATION STATUS =====

export enum ConversationStatus {
  OPEN = "open",
  PENDING = "pending",
  RESOLVED = "resolved",
  CLOSED = "closed",
  ARCHIVED = "archived",
  ESCALATED = "escalated",
  SPAM = "spam",
}

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  [ConversationStatus.OPEN]: "Open",
  [ConversationStatus.PENDING]: "Pending",
  [ConversationStatus.RESOLVED]: "Resolved",
  [ConversationStatus.CLOSED]: "Closed",
  [ConversationStatus.ARCHIVED]: "Archived",
  [ConversationStatus.ESCALATED]: "Escalated",
  [ConversationStatus.SPAM]: "Spam",
};

export const CONVERSATION_STATUS_COLORS: Record<ConversationStatus, {
  background: string;
  text: string;
  border: string;
}> = {
  [ConversationStatus.OPEN]: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
  },
  [ConversationStatus.PENDING]: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  [ConversationStatus.RESOLVED]: {
    background: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-200",
  },
  [ConversationStatus.CLOSED]: {
    background: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
  },
  [ConversationStatus.ARCHIVED]: {
    background: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
  },
  [ConversationStatus.ESCALATED]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
  [ConversationStatus.SPAM]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
};

// ===== CONVERSATION PRIORITY =====

export enum ConversationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
  CRITICAL = "critical",
}

export const CONVERSATION_PRIORITY_LABELS: Record<ConversationPriority, string> = {
  [ConversationPriority.LOW]: "Low",
  [ConversationPriority.MEDIUM]: "Medium",
  [ConversationPriority.HIGH]: "High",
  [ConversationPriority.URGENT]: "Urgent",
  [ConversationPriority.CRITICAL]: "Critical",
};

export const CONVERSATION_PRIORITY_COLORS: Record<ConversationPriority, {
  background: string;
  text: string;
  border: string;
}> = {
  [ConversationPriority.LOW]: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
  },
  [ConversationPriority.MEDIUM]: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  [ConversationPriority.HIGH]: {
    background: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-200",
  },
  [ConversationPriority.URGENT]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
  [ConversationPriority.CRITICAL]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
};

export const CONVERSATION_PRIORITY_ORDER: Record<ConversationPriority, number> = {
  [ConversationPriority.LOW]: 1,
  [ConversationPriority.MEDIUM]: 2,
  [ConversationPriority.HIGH]: 3,
  [ConversationPriority.URGENT]: 4,
  [ConversationPriority.CRITICAL]: 5,
};

// ===== MESSAGE SENTIMENT =====

export enum MessageSentiment {
  POSITIVE = "positive",
  NEUTRAL = "neutral",
  NEGATIVE = "negative",
  FRUSTRATED = "frustrated",
  ANGRY = "angry",
  SATISFIED = "satisfied",
  CONFUSED = "confused",
}

export const MESSAGE_SENTIMENT_LABELS: Record<MessageSentiment, string> = {
  [MessageSentiment.POSITIVE]: "Positive",
  [MessageSentiment.NEUTRAL]: "Neutral",
  [MessageSentiment.NEGATIVE]: "Negative",
  [MessageSentiment.FRUSTRATED]: "Frustrated",
  [MessageSentiment.ANGRY]: "Angry",
  [MessageSentiment.SATISFIED]: "Satisfied",
  [MessageSentiment.CONFUSED]: "Confused",
};

export const MESSAGE_SENTIMENT_COLORS: Record<MessageSentiment, {
  background: string;
  text: string;
  border: string;
}> = {
  [MessageSentiment.POSITIVE]: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
  },
  [MessageSentiment.NEUTRAL]: {
    background: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
  },
  [MessageSentiment.NEGATIVE]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
  [MessageSentiment.FRUSTRATED]: {
    background: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-200",
  },
  [MessageSentiment.ANGRY]: {
    background: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
  [MessageSentiment.SATISFIED]: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
  },
  [MessageSentiment.CONFUSED]: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  },
};

// ===== AI HANDOVER STATUS =====

export enum AIHandoverStatus {
  AI_ACTIVE = "ai_active",
  HUMAN_ACTIVE = "human_active",
  HANDOVER_REQUESTED = "handover_requested",
  HANDOVER_COMPLETED = "handover_completed",
  MIXED_MODE = "mixed_mode",
}

export const AI_HANDOVER_STATUS_LABELS: Record<AIHandoverStatus, string> = {
  [AIHandoverStatus.AI_ACTIVE]: "AI Active",
  [AIHandoverStatus.HUMAN_ACTIVE]: "Human Active",
  [AIHandoverStatus.HANDOVER_REQUESTED]: "Handover Requested",
  [AIHandoverStatus.HANDOVER_COMPLETED]: "Handover Completed",
  [AIHandoverStatus.MIXED_MODE]: "Mixed Mode",
};

export const AI_HANDOVER_STATUS_COLORS: Record<AIHandoverStatus, {
  background: string;
  text: string;
  border: string;
}> = {
  [AIHandoverStatus.AI_ACTIVE]: {
    background: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-200",
  },
  [AIHandoverStatus.HUMAN_ACTIVE]: {
    background: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-200",
  },
  [AIHandoverStatus.HANDOVER_REQUESTED]: {
    background: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  [AIHandoverStatus.HANDOVER_COMPLETED]: {
    background: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
  },
  [AIHandoverStatus.MIXED_MODE]: {
    background: "bg-indigo-50",
    text: "text-indigo-900",
    border: "border-indigo-200",
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get status configuration by string value
 */
export function getStatusConfig(status: string) {
  const statusEnum = status as ConversationStatus;
  return {
    label: CONVERSATION_STATUS_LABELS[statusEnum] || status,
    colors: CONVERSATION_STATUS_COLORS[statusEnum] || CONVERSATION_STATUS_COLORS[ConversationStatus.OPEN],
  };
}

/**
 * Get priority configuration by string value
 */
export function getPriorityConfig(priority: string) {
  const priorityEnum = priority as ConversationPriority;
  return {
    label: CONVERSATION_PRIORITY_LABELS[priorityEnum] || priority,
    colors: CONVERSATION_PRIORITY_COLORS[priorityEnum] || CONVERSATION_PRIORITY_COLORS[ConversationPriority.MEDIUM],
    order: CONVERSATION_PRIORITY_ORDER[priorityEnum] || 0,
  };
}

/**
 * Get sentiment configuration by string value
 */
export function getSentimentConfig(sentiment: string) {
  const sentimentEnum = sentiment as MessageSentiment;
  return {
    label: MESSAGE_SENTIMENT_LABELS[sentimentEnum] || sentiment,
    colors: MESSAGE_SENTIMENT_COLORS[sentimentEnum] || MESSAGE_SENTIMENT_COLORS[MessageSentiment.NEUTRAL],
  };
}

/**
 * Get AI handover status configuration by string value
 */
export function getAIHandoverConfig(status: string) {
  const statusEnum = status as AIHandoverStatus;
  return {
    label: AI_HANDOVER_STATUS_LABELS[statusEnum] || status,
    colors: AI_HANDOVER_STATUS_COLORS[statusEnum] || AI_HANDOVER_STATUS_COLORS[AIHandoverStatus.HUMAN_ACTIVE],
  };
}

/**
 * Check if a status is valid
 */
export function isValidStatus(status: string): status is ConversationStatus {
  return Object.values(ConversationStatus).includes(status as ConversationStatus);
}

/**
 * Check if a priority is valid
 */
export function isValidPriority(priority: string): priority is ConversationPriority {
  return Object.values(ConversationPriority).includes(priority as ConversationPriority);
}

/**
 * Check if a sentiment is valid
 */
export function isValidSentiment(sentiment: string): sentiment is MessageSentiment {
  return Object.values(MessageSentiment).includes(sentiment as MessageSentiment);
}

/**
 * Get all available statuses as array
 */
export function getAllStatuses(): ConversationStatus[] {
  return Object.values(ConversationStatus);
}

/**
 * Get all available priorities as array
 */
export function getAllPriorities(): ConversationPriority[] {
  return Object.values(ConversationPriority);
}

/**
 * Get all available sentiments as array
 */
export function getAllSentiments(): MessageSentiment[] {
  return Object.values(MessageSentiment);
}
