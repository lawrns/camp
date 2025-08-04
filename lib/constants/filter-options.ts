/**
 * Filter options for dropdowns and selects
 * Uses enums to ensure type safety and consistency
 */

import {
  ConversationStatus,
  ConversationPriority,
  MessageSentiment,
  AIHandoverStatus,
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_PRIORITY_LABELS,
  MESSAGE_SENTIMENT_LABELS,
  AI_HANDOVER_STATUS_LABELS,
} from "./conversation-enums";

export interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

// ===== STATUS FILTER OPTIONS =====

export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Statuses", description: "Show conversations with any status" },
  ...Object.values(ConversationStatus).map(status => ({
    value: status,
    label: CONVERSATION_STATUS_LABELS[status],
    description: `Show ${CONVERSATION_STATUS_LABELS[status].toLowerCase()} conversations`,
  })),
];

export const ACTIVE_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Active", description: "Show all active conversations" },
  {
    value: ConversationStatus.OPEN,
    label: CONVERSATION_STATUS_LABELS[ConversationStatus.OPEN],
    description: "Show open conversations",
  },
  {
    value: ConversationStatus.PENDING,
    label: CONVERSATION_STATUS_LABELS[ConversationStatus.PENDING],
    description: "Show pending conversations",
  },
  {
    value: ConversationStatus.ESCALATED,
    label: CONVERSATION_STATUS_LABELS[ConversationStatus.ESCALATED],
    description: "Show escalated conversations",
  },
];

// ===== PRIORITY FILTER OPTIONS =====

export const PRIORITY_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Priorities", description: "Show conversations with any priority" },
  ...Object.values(ConversationPriority).map(priority => ({
    value: priority,
    label: CONVERSATION_PRIORITY_LABELS[priority],
    description: `Show ${CONVERSATION_PRIORITY_LABELS[priority].toLowerCase()} priority conversations`,
  })),
];

export const HIGH_PRIORITY_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All High Priority", description: "Show all high priority conversations" },
  {
    value: ConversationPriority.URGENT,
    label: CONVERSATION_PRIORITY_LABELS[ConversationPriority.URGENT],
    description: "Show urgent conversations",
  },
  {
    value: ConversationPriority.CRITICAL,
    label: CONVERSATION_PRIORITY_LABELS[ConversationPriority.CRITICAL],
    description: "Show critical conversations",
  },
  {
    value: ConversationPriority.HIGH,
    label: CONVERSATION_PRIORITY_LABELS[ConversationPriority.HIGH],
    description: "Show high priority conversations",
  },
];

// ===== SENTIMENT FILTER OPTIONS =====

export const SENTIMENT_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Sentiments", description: "Show messages with any sentiment" },
  ...Object.values(MessageSentiment).map(sentiment => ({
    value: sentiment,
    label: MESSAGE_SENTIMENT_LABELS[sentiment],
    description: `Show ${MESSAGE_SENTIMENT_LABELS[sentiment].toLowerCase()} messages`,
  })),
];

export const NEGATIVE_SENTIMENT_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Negative", description: "Show all negative sentiment messages" },
  {
    value: MessageSentiment.ANGRY,
    label: MESSAGE_SENTIMENT_LABELS[MessageSentiment.ANGRY],
    description: "Show angry messages",
  },
  {
    value: MessageSentiment.FRUSTRATED,
    label: MESSAGE_SENTIMENT_LABELS[MessageSentiment.FRUSTRATED],
    description: "Show frustrated messages",
  },
  {
    value: MessageSentiment.NEGATIVE,
    label: MESSAGE_SENTIMENT_LABELS[MessageSentiment.NEGATIVE],
    description: "Show negative messages",
  },
];

// ===== AI HANDOVER FILTER OPTIONS =====

export const AI_HANDOVER_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Modes", description: "Show conversations in any mode" },
  ...Object.values(AIHandoverStatus).map(status => ({
    value: status,
    label: AI_HANDOVER_STATUS_LABELS[status],
    description: `Show ${AI_HANDOVER_STATUS_LABELS[status].toLowerCase()} conversations`,
  })),
];

// ===== SORT OPTIONS =====

export interface SortOption {
  value: string;
  label: string;
  field: string;
  direction: "asc" | "desc";
  description?: string;
}

export const CONVERSATION_SORT_OPTIONS: SortOption[] = [
  {
    value: "newest",
    label: "Newest First",
    field: "updated_at",
    direction: "desc",
    description: "Show most recently updated conversations first",
  },
  {
    value: "oldest",
    label: "Oldest First",
    field: "updated_at",
    direction: "asc",
    description: "Show least recently updated conversations first",
  },
  {
    value: "priority_high",
    label: "Priority (High to Low)",
    field: "priority",
    direction: "desc",
    description: "Show highest priority conversations first",
  },
  {
    value: "priority_low",
    label: "Priority (Low to High)",
    field: "priority",
    direction: "asc",
    description: "Show lowest priority conversations first",
  },
  {
    value: "customer_name",
    label: "Customer Name (A-Z)",
    field: "customer_name",
    direction: "asc",
    description: "Sort by customer name alphabetically",
  },
  {
    value: "unread_count",
    label: "Unread Messages",
    field: "unread_count",
    direction: "desc",
    description: "Show conversations with most unread messages first",
  },
];

// ===== TIME RANGE OPTIONS =====

export const TIME_RANGE_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Time", description: "Show conversations from any time period" },
  { value: "today", label: "Today", description: "Show conversations from today" },
  { value: "yesterday", label: "Yesterday", description: "Show conversations from yesterday" },
  { value: "this_week", label: "This Week", description: "Show conversations from this week" },
  { value: "last_week", label: "Last Week", description: "Show conversations from last week" },
  { value: "this_month", label: "This Month", description: "Show conversations from this month" },
  { value: "last_month", label: "Last Month", description: "Show conversations from last month" },
  { value: "last_7_days", label: "Last 7 Days", description: "Show conversations from the last 7 days" },
  { value: "last_30_days", label: "Last 30 Days", description: "Show conversations from the last 30 days" },
  { value: "last_90_days", label: "Last 90 Days", description: "Show conversations from the last 90 days" },
];

// ===== ASSIGNMENT FILTER OPTIONS =====

export const ASSIGNMENT_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All Assignments", description: "Show all conversations regardless of assignment" },
  { value: "assigned_to_me", label: "Assigned to Me", description: "Show conversations assigned to me" },
  { value: "unassigned", label: "Unassigned", description: "Show unassigned conversations" },
  { value: "assigned_to_others", label: "Assigned to Others", description: "Show conversations assigned to other team members" },
  { value: "ai_assigned", label: "AI Assigned", description: "Show conversations assigned to AI" },
];

// ===== UTILITY FUNCTIONS =====

/**
 * Get filter options by category
 */
export function getFilterOptions(category: string): FilterOption[] {
  switch (category) {
    case "status":
      return STATUS_FILTER_OPTIONS;
    case "priority":
      return PRIORITY_FILTER_OPTIONS;
    case "sentiment":
      return SENTIMENT_FILTER_OPTIONS;
    case "ai_handover":
      return AI_HANDOVER_FILTER_OPTIONS;
    case "time_range":
      return TIME_RANGE_FILTER_OPTIONS;
    case "assignment":
      return ASSIGNMENT_FILTER_OPTIONS;
    default:
      return [];
  }
}

/**
 * Get sort options
 */
export function getSortOptions(): SortOption[] {
  return CONVERSATION_SORT_OPTIONS;
}

/**
 * Find filter option by value
 */
export function findFilterOption(options: FilterOption[], value: string): FilterOption | undefined {
  return options.find(option => option.value === value);
}

/**
 * Get filter option label by value
 */
export function getFilterOptionLabel(category: string, value: string): string {
  const options = getFilterOptions(category);
  const option = findFilterOption(options, value);
  return option?.label || value;
}
