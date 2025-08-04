import { z } from "zod";

// ============================================================================
// Event Categories
// ============================================================================

export const EventCategories = {
  CONVERSATION: "conversation",
  MESSAGE: "message",
  TYPING: "typing",
  PRESENCE: "presence",
  AI: "ai",
  ORGANIZATION: "organization",
} as const;

export type EventCategory = (typeof EventCategories)[keyof typeof EventCategories];

// ============================================================================
// Event Types
// ============================================================================

export const EventTypes = {
  // Conversation Events
  CONVERSATION_CREATED: "conversation.created",
  CONVERSATION_UPDATED: "conversation.updated",
  CONVERSATION_DELETED: "conversation.deleted",
  CONVERSATION_ASSIGNED: "conversation.assigned",
  CONVERSATION_UNASSIGNED: "conversation.unassigned",
  CONVERSATION_CLOSED: "conversation.closed",
  CONVERSATION_REOPENED: "conversation.reopened",

  // Message Events
  MESSAGE_CREATED: "message.created",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  MESSAGE_REACTION_ADDED: "message.reaction.added",
  MESSAGE_REACTION_REMOVED: "message.reaction.removed",

  // Typing Events
  TYPING_START: "typing.start",
  TYPING_STOP: "typing.stop",
  TYPING_CLEAR: "typing.clear",

  // Presence Events
  PRESENCE_ONLINE: "presence.online",
  PRESENCE_OFFLINE: "presence.offline",
  PRESENCE_AWAY: "presence.away",
  PRESENCE_BUSY: "presence.busy",

  // AI Events
  AI_HANDOVER_REQUESTED: "ai.handover.requested",
  AI_HANDOVER_ACCEPTED: "ai.handover.accepted",
  AI_HANDOVER_REJECTED: "ai.handover.rejected",
  AI_HANDOVER_COMPLETED: "ai.handover.completed",
  AI_RESPONSE_STARTED: "ai.response.started",
  AI_RESPONSE_STREAMING: "ai.response.streaming",
  AI_RESPONSE_COMPLETED: "ai.response.completed",
  AI_RESPONSE_FAILED: "ai.response.failed",
  AI_CONFIDENCE_UPDATED: "ai.confidence.updated",
  AI_SUGGESTION_GENERATED: "ai.suggestion.generated",

  // Organization Events
  ORGANIZATION_MEMBER_JOINED: "organization.member.joined",
  ORGANIZATION_MEMBER_LEFT: "organization.member.left",
  ORGANIZATION_SETTINGS_UPDATED: "organization.settings.updated",
  ORGANIZATION_PLAN_UPGRADED: "organization.plan.upgraded",
  ORGANIZATION_PLAN_DOWNGRADED: "organization.plan.downgraded",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ============================================================================
// Event Payloads - Zod Schemas
// ============================================================================

// Base event schema
const BaseEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  organizationId: z.string(),
  userId: z.string().optional(),
});

// Conversation Event Schemas
export const ConversationEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  conversation: z.object({
    id: z.string(),
    subject: z.string().optional(),
    status: z.enum(["open", "closed", "snoozed"]),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    assigneeId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const ConversationAssignmentEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  assigneeId: z.string().nullable(),
  previousAssigneeId: z.string().nullable(),
  assignedBy: z.string(),
});

// Message Event Schemas
export const MessageEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  messageId: z.string(),
  message: z.object({
    id: z.string(),
    content: z.string(),
    from: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      type: z.enum(["user", "ai", "system"]),
    }),
    attachments: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          url: z.string(),
          size: z.number(),
          mimeType: z.string(),
        })
      )
      .optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const MessageReactionEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  messageId: z.string(),
  reaction: z.object({
    emoji: z.string(),
    userId: z.string(),
    userName: z.string(),
  }),
});

// Typing Event Schemas
export const TypingEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    avatar: z.string().optional(),
  }),
  isTyping: z.boolean(),
});

// Presence Event Schemas
export const PresenceEventSchema = BaseEventSchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    avatar: z.string().optional(),
  }),
  status: z.enum(["online", "offline", "away", "busy"]),
  lastSeen: z.number().optional(),
  statusMessage: z.string().optional(),
});

// AI Event Schemas
export const AIHandoverEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  handoverType: z.enum(["human_to_ai", "ai_to_human"]),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.object({
    previousHandler: z.enum(["human", "ai"]),
    newHandler: z.enum(["human", "ai"]),
    handoverRequestedBy: z.string(),
    context: z.record(z.any()).optional(),
  }),
});

export const AIResponseEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  messageId: z.string().optional(),
  responseType: z.enum(["start", "streaming", "complete", "failed"]),
  content: z.string().optional(),
  model: z.string().optional(),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

export const AIConfidenceEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  confidence: z.number().min(0).max(1),
  factors: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      weight: z.number(),
    })
  ),
  threshold: z.number(),
  shouldEscalate: z.boolean(),
});

export const AISuggestionEventSchema = BaseEventSchema.extend({
  conversationId: z.string(),
  suggestions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["reply", "action", "knowledge"]),
      content: z.string(),
      confidence: z.number().min(0).max(1),
      metadata: z.record(z.any()).optional(),
    })
  ),
});

// Organization Event Schemas
export const OrganizationMemberEventSchema = BaseEventSchema.extend({
  member: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["owner", "admin", "member", "viewer"]),
    permissions: z.array(z.string()).optional(),
  }),
  action: z.enum(["joined", "left", "updated"]),
});

export const OrganizationSettingsEventSchema = BaseEventSchema.extend({
  settings: z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    features: z.record(z.boolean()).optional(),
  }),
  changedBy: z.string(),
  changes: z.array(
    z.object({
      field: z.string(),
      oldValue: z.any(),
      newValue: z.any(),
    })
  ),
});

export const OrganizationPlanEventSchema = BaseEventSchema.extend({
  plan: z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(["free", "pro", "enterprise"]),
    features: z.array(z.string()).optional(),
    limits: z.record(z.number()).optional(),
  }),
  previousPlan: z
    .object({
      id: z.string(),
      name: z.string(),
      tier: z.enum(["free", "pro", "enterprise"]),
    })
    .optional(),
  changedBy: z.string(),
  action: z.enum(["upgraded", "downgraded"]),
});

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type ConversationEvent = z.infer<typeof ConversationEventSchema>;
export type ConversationAssignmentEvent = z.infer<typeof ConversationAssignmentEventSchema>;
export type MessageEvent = z.infer<typeof MessageEventSchema>;
export type MessageReactionEvent = z.infer<typeof MessageReactionEventSchema>;
export type TypingEvent = z.infer<typeof TypingEventSchema>;
export type PresenceEvent = z.infer<typeof PresenceEventSchema>;
export type AIHandoverEvent = z.infer<typeof AIHandoverEventSchema>;
export type AIResponseEvent = z.infer<typeof AIResponseEventSchema>;
export type AIConfidenceEvent = z.infer<typeof AIConfidenceEventSchema>;
export type AISuggestionEvent = z.infer<typeof AISuggestionEventSchema>;
export type OrganizationMemberEvent = z.infer<typeof OrganizationMemberEventSchema>;
export type OrganizationSettingsEvent = z.infer<typeof OrganizationSettingsEventSchema>;
export type OrganizationPlanEvent = z.infer<typeof OrganizationPlanEventSchema>;

// ============================================================================
// Event Type to Schema Mapping
// ============================================================================

export const EventSchemas = {
  // Conversation Events
  [EventTypes.CONVERSATION_CREATED]: ConversationEventSchema,
  [EventTypes.CONVERSATION_UPDATED]: ConversationEventSchema,
  [EventTypes.CONVERSATION_DELETED]: ConversationEventSchema,
  [EventTypes.CONVERSATION_ASSIGNED]: ConversationAssignmentEventSchema,
  [EventTypes.CONVERSATION_UNASSIGNED]: ConversationAssignmentEventSchema,
  [EventTypes.CONVERSATION_CLOSED]: ConversationEventSchema,
  [EventTypes.CONVERSATION_REOPENED]: ConversationEventSchema,

  // Message Events
  [EventTypes.MESSAGE_CREATED]: MessageEventSchema,
  [EventTypes.MESSAGE_UPDATED]: MessageEventSchema,
  [EventTypes.MESSAGE_DELETED]: MessageEventSchema,
  [EventTypes.MESSAGE_REACTION_ADDED]: MessageReactionEventSchema,
  [EventTypes.MESSAGE_REACTION_REMOVED]: MessageReactionEventSchema,

  // Typing Events
  [EventTypes.TYPING_START]: TypingEventSchema,
  [EventTypes.TYPING_STOP]: TypingEventSchema,
  [EventTypes.TYPING_CLEAR]: TypingEventSchema,

  // Presence Events
  [EventTypes.PRESENCE_ONLINE]: PresenceEventSchema,
  [EventTypes.PRESENCE_OFFLINE]: PresenceEventSchema,
  [EventTypes.PRESENCE_AWAY]: PresenceEventSchema,
  [EventTypes.PRESENCE_BUSY]: PresenceEventSchema,

  // AI Events
  [EventTypes.AI_HANDOVER_REQUESTED]: AIHandoverEventSchema,
  [EventTypes.AI_HANDOVER_ACCEPTED]: AIHandoverEventSchema,
  [EventTypes.AI_HANDOVER_REJECTED]: AIHandoverEventSchema,
  [EventTypes.AI_HANDOVER_COMPLETED]: AIHandoverEventSchema,
  [EventTypes.AI_RESPONSE_STARTED]: AIResponseEventSchema,
  [EventTypes.AI_RESPONSE_STREAMING]: AIResponseEventSchema,
  [EventTypes.AI_RESPONSE_COMPLETED]: AIResponseEventSchema,
  [EventTypes.AI_RESPONSE_FAILED]: AIResponseEventSchema,
  [EventTypes.AI_CONFIDENCE_UPDATED]: AIConfidenceEventSchema,
  [EventTypes.AI_SUGGESTION_GENERATED]: AISuggestionEventSchema,

  // Organization Events
  [EventTypes.ORGANIZATION_MEMBER_JOINED]: OrganizationMemberEventSchema,
  [EventTypes.ORGANIZATION_MEMBER_LEFT]: OrganizationMemberEventSchema,
  [EventTypes.ORGANIZATION_SETTINGS_UPDATED]: OrganizationSettingsEventSchema,
  [EventTypes.ORGANIZATION_PLAN_UPGRADED]: OrganizationPlanEventSchema,
  [EventTypes.ORGANIZATION_PLAN_DOWNGRADED]: OrganizationPlanEventSchema,
} as const;

// ============================================================================
// Event Type to Payload Type Mapping
// ============================================================================

export type EventPayloadMap = {
  // Conversation Events
  [EventTypes.CONVERSATION_CREATED]: ConversationEvent;
  [EventTypes.CONVERSATION_UPDATED]: ConversationEvent;
  [EventTypes.CONVERSATION_DELETED]: ConversationEvent;
  [EventTypes.CONVERSATION_ASSIGNED]: ConversationAssignmentEvent;
  [EventTypes.CONVERSATION_UNASSIGNED]: ConversationAssignmentEvent;
  [EventTypes.CONVERSATION_CLOSED]: ConversationEvent;
  [EventTypes.CONVERSATION_REOPENED]: ConversationEvent;

  // Message Events
  [EventTypes.MESSAGE_CREATED]: MessageEvent;
  [EventTypes.MESSAGE_UPDATED]: MessageEvent;
  [EventTypes.MESSAGE_DELETED]: MessageEvent;
  [EventTypes.MESSAGE_REACTION_ADDED]: MessageReactionEvent;
  [EventTypes.MESSAGE_REACTION_REMOVED]: MessageReactionEvent;

  // Typing Events
  [EventTypes.TYPING_START]: TypingEvent;
  [EventTypes.TYPING_STOP]: TypingEvent;
  [EventTypes.TYPING_CLEAR]: TypingEvent;

  // Presence Events
  [EventTypes.PRESENCE_ONLINE]: PresenceEvent;
  [EventTypes.PRESENCE_OFFLINE]: PresenceEvent;
  [EventTypes.PRESENCE_AWAY]: PresenceEvent;
  [EventTypes.PRESENCE_BUSY]: PresenceEvent;

  // AI Events
  [EventTypes.AI_HANDOVER_REQUESTED]: AIHandoverEvent;
  [EventTypes.AI_HANDOVER_ACCEPTED]: AIHandoverEvent;
  [EventTypes.AI_HANDOVER_REJECTED]: AIHandoverEvent;
  [EventTypes.AI_HANDOVER_COMPLETED]: AIHandoverEvent;
  [EventTypes.AI_RESPONSE_STARTED]: AIResponseEvent;
  [EventTypes.AI_RESPONSE_STREAMING]: AIResponseEvent;
  [EventTypes.AI_RESPONSE_COMPLETED]: AIResponseEvent;
  [EventTypes.AI_RESPONSE_FAILED]: AIResponseEvent;
  [EventTypes.AI_CONFIDENCE_UPDATED]: AIConfidenceEvent;
  [EventTypes.AI_SUGGESTION_GENERATED]: AISuggestionEvent;

  // Organization Events
  [EventTypes.ORGANIZATION_MEMBER_JOINED]: OrganizationMemberEvent;
  [EventTypes.ORGANIZATION_MEMBER_LEFT]: OrganizationMemberEvent;
  [EventTypes.ORGANIZATION_SETTINGS_UPDATED]: OrganizationSettingsEvent;
  [EventTypes.ORGANIZATION_PLAN_UPGRADED]: OrganizationPlanEvent;
  [EventTypes.ORGANIZATION_PLAN_DOWNGRADED]: OrganizationPlanEvent;
};

// ============================================================================
// Event Builder Functions
// ============================================================================

/**
 * Creates a typed event with automatic validation
 */
export function createEvent<T extends EventType>(
  type: T,
  payload: Omit<EventPayloadMap[T], "id" | "timestamp">
): EventPayloadMap[T] {
  const schema = EventSchemas[type];
  if (!schema) {
    throw new Error(`Unknown event type: ${type}`);
  }

  const eventData = {
    ...payload,
    id: generateEventId(),
    timestamp: Date.now(),
  };

  return schema.parse(eventData) as EventPayloadMap[T];
}

/**
 * Validates an event payload
 */
export function validateEvent<T extends EventType>(type: T, payload: unknown): payload is EventPayloadMap[T] {
  const schema = EventSchemas[type];
  if (!schema) {
    return false;
  }

  try {
    schema.parse(payload);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses and validates an event payload
 */
export function parseEvent<T extends EventType>(type: T, payload: unknown): EventPayloadMap[T] {
  const schema = EventSchemas[type];
  if (!schema) {
    throw new Error(`Unknown event type: ${type}`);
  }

  return schema.parse(payload) as EventPayloadMap[T];
}

// ============================================================================
// Event Dispatcher/Handler System
// ============================================================================

export type EventHandler<T extends EventType> = (event: EventPayloadMap[T]) => void | Promise<void>;

export type EventHandlerMap = {
  [K in EventType]?: EventHandler<K>[];
};

export class EventDispatcher {
  private handlers: EventHandlerMap = {};
  private globalHandlers: Array<(type: EventType, event: unknown) => void | Promise<void>> = [];

  /**
   * Subscribe to a specific event type
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): () => void {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }

    this.handlers[type]!.push(handler as unknown);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers[type];
      if (handlers) {
        const index = handlers.indexOf(handler as unknown);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: (type: EventType, event: unknown) => void | Promise<void>): () => void {
    this.globalHandlers.push(handler);

    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   */
  async emit<T extends EventType>(type: T, payload: EventPayloadMap[T]): Promise<void> {
    // Validate the event
    const validatedPayload = parseEvent(type, payload);

    // Call specific handlers
    const handlers = this.handlers[type] || [];
    await Promise.all(handlers.map((handler: unknown) => Promise.resolve(handler(validatedPayload as unknown))));

    // Call global handlers
    await Promise.all(this.globalHandlers.map((handler: unknown) => Promise.resolve(handler(type, validatedPayload))));
  }

  /**
   * Remove all handlers for a specific event type
   */
  off(type: EventType): void {
    delete this.handlers[type];
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers = {};
    this.globalHandlers = [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets the category of an event type
 */
export function getEventCategory(type: EventType): EventCategory {
  const [category] = type.split(".");
  return category as EventCategory;
}

/**
 * Filters events by category
 */
export function filterEventsByCategory(types: EventType[], category: EventCategory): EventType[] {
  return types.filter((type: unknown) => getEventCategory(type) === category);
}

// ============================================================================
// Event Builder Convenience Functions
// ============================================================================

export const EventBuilders = {
  // Conversation Events
  conversationCreated: (payload: Omit<ConversationEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.CONVERSATION_CREATED, payload),

  conversationUpdated: (payload: Omit<ConversationEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.CONVERSATION_UPDATED, payload),

  conversationAssigned: (payload: Omit<ConversationAssignmentEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.CONVERSATION_ASSIGNED, payload),

  // Message Events
  messageCreated: (payload: Omit<MessageEvent, "id" | "timestamp">) => createEvent(EventTypes.MESSAGE_CREATED, payload),

  messageUpdated: (payload: Omit<MessageEvent, "id" | "timestamp">) => createEvent(EventTypes.MESSAGE_UPDATED, payload),

  messageReactionAdded: (payload: Omit<MessageReactionEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.MESSAGE_REACTION_ADDED, payload),

  // Typing Events
  typingStart: (payload: Omit<TypingEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.TYPING_START, { ...payload, isTyping: true }),

  typingStop: (payload: Omit<TypingEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.TYPING_STOP, { ...payload, isTyping: false }),

  // Presence Events
  presenceOnline: (payload: Omit<PresenceEvent, "id" | "timestamp" | "status">) =>
    createEvent(EventTypes.PRESENCE_ONLINE, { ...payload, status: "online" }),

  presenceOffline: (payload: Omit<PresenceEvent, "id" | "timestamp" | "status">) =>
    createEvent(EventTypes.PRESENCE_OFFLINE, { ...payload, status: "offline" }),

  presenceAway: (payload: Omit<PresenceEvent, "id" | "timestamp" | "status">) =>
    createEvent(EventTypes.PRESENCE_AWAY, { ...payload, status: "away" }),

  presenceBusy: (payload: Omit<PresenceEvent, "id" | "timestamp" | "status">) =>
    createEvent(EventTypes.PRESENCE_BUSY, { ...payload, status: "busy" }),

  // AI Events
  aiHandoverRequested: (payload: Omit<AIHandoverEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_HANDOVER_REQUESTED, payload),

  aiHandoverAccepted: (payload: Omit<AIHandoverEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_HANDOVER_ACCEPTED, payload),

  aiHandoverRejected: (payload: Omit<AIHandoverEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_HANDOVER_REJECTED, payload),

  aiHandoverCompleted: (payload: Omit<AIHandoverEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_HANDOVER_COMPLETED, payload),

  aiResponseStarted: (payload: Omit<AIResponseEvent, "id" | "timestamp" | "responseType">) =>
    createEvent(EventTypes.AI_RESPONSE_STARTED, { ...payload, responseType: "start" }),

  aiResponseStreaming: (payload: Omit<AIResponseEvent, "id" | "timestamp" | "responseType">) =>
    createEvent(EventTypes.AI_RESPONSE_STREAMING, { ...payload, responseType: "streaming" }),

  aiResponseCompleted: (payload: Omit<AIResponseEvent, "id" | "timestamp" | "responseType">) =>
    createEvent(EventTypes.AI_RESPONSE_COMPLETED, { ...payload, responseType: "complete" }),

  aiResponseFailed: (payload: Omit<AIResponseEvent, "id" | "timestamp" | "responseType">) =>
    createEvent(EventTypes.AI_RESPONSE_FAILED, { ...payload, responseType: "failed" }),

  aiConfidenceUpdated: (payload: Omit<AIConfidenceEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_CONFIDENCE_UPDATED, payload),

  aiSuggestionGenerated: (payload: Omit<AISuggestionEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.AI_SUGGESTION_GENERATED, payload),

  // Organization Events
  organizationMemberJoined: (payload: Omit<OrganizationMemberEvent, "id" | "timestamp" | "action">) =>
    createEvent(EventTypes.ORGANIZATION_MEMBER_JOINED, { ...payload, action: "joined" }),

  organizationMemberLeft: (payload: Omit<OrganizationMemberEvent, "id" | "timestamp" | "action">) =>
    createEvent(EventTypes.ORGANIZATION_MEMBER_LEFT, { ...payload, action: "left" }),

  organizationSettingsUpdated: (payload: Omit<OrganizationSettingsEvent, "id" | "timestamp">) =>
    createEvent(EventTypes.ORGANIZATION_SETTINGS_UPDATED, payload),

  organizationPlanUpgraded: (payload: Omit<OrganizationPlanEvent, "id" | "timestamp" | "action">) =>
    createEvent(EventTypes.ORGANIZATION_PLAN_UPGRADED, { ...payload, action: "upgraded" }),

  organizationPlanDowngraded: (payload: Omit<OrganizationPlanEvent, "id" | "timestamp" | "action">) =>
    createEvent(EventTypes.ORGANIZATION_PLAN_DOWNGRADED, { ...payload, action: "downgraded" }),
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  EventCategories,
  EventTypes,
  EventSchemas,
  EventBuilders,
  EventDispatcher,
  createEvent,
  validateEvent,
  parseEvent,
  getEventCategory,
  filterEventsByCategory,
};
