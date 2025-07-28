/**
 * Widget Ticket Conversion Utilities
 *
 * Helper functions for converting widget conversations to tickets
 */

export interface TicketConversionOptions {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  tags?: string[];
  assigneeId?: string;
  dueDate?: string;
  includeConversationHistory?: boolean;
  notifyCustomer?: boolean;
  metadata?: Record<string, any>;
}

export interface TicketConversionResult {
  success: boolean;
  ticket?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    ticketNumber?: string;
    createdAt: string;
  };
  error?: string;
  details?: any;
}

export interface ConversionCheckResult {
  canConvert: boolean;
  alreadyConverted: boolean;
  ticketId?: string;
  conversationStatus: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Convert a widget conversation to a support ticket
 */
export async function convertConversationToTicket(
  conversationId: string,
  options: TicketConversionOptions
): Promise<TicketConversionResult> {
  try {
    const response = await fetch(`/api/widget/conversations/${conversationId}/convert-to-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to convert conversation to ticket",
        details: result.details,
      };
    }

    return result;
  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Check if a conversation can be converted to a ticket
 */
export async function checkConversionEligibility(conversationId: string): Promise<ConversionCheckResult> {
  try {
    const response = await fetch(`/api/widget/conversations/${conversationId}/convert-to-ticket`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to check conversion eligibility");
    }

    return await response.json();
  } catch (error) {

    return {
      canConvert: false,
      alreadyConverted: false,
      conversationStatus: "unknown",
    };
  }
}

/**
 * Generate a default ticket title from conversation content
 */
export function generateTicketTitle(
  conversationSubject?: string,
  firstMessage?: string,
  customerName?: string
): string {
  // Use conversation subject if available
  if (conversationSubject && conversationSubject.trim()) {
    return conversationSubject.trim();
  }

  // Extract title from first message
  if (firstMessage) {
    const cleaned = firstMessage.trim();
    if (cleaned.length <= 50) {
      return cleaned;
    }

    // Truncate at word boundary
    const truncated = cleaned.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 20 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
  }

  // Fallback title
  const customerPart = customerName ? ` from ${customerName}` : "";
  return `Support Request${customerPart}`;
}

/**
 * Generate ticket description from conversation
 */
export function generateTicketDescription(
  conversationMessages: Array<{
    content: string;
    sender_type: string;
    sender_name?: string;
    created_at: string;
  }>,
  includeHistory: boolean = true
): string {
  if (!conversationMessages || conversationMessages.length === 0) {
    return "No conversation content available.";
  }

  if (!includeHistory) {
    // Just use the first customer message
    const firstCustomerMessage = conversationMessages.find(
      (msg) => msg.sender_type === "customer" || msg.sender_type === "visitor"
    );
    return firstCustomerMessage?.content || conversationMessages[0].content;
  }

  // Include full conversation history
  const sortedMessages = [...conversationMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const history = sortedMessages
    .map((msg) => {
      const timestamp = new Date(msg.created_at).toLocaleString();
      const sender = msg.sender_name || msg.sender_type;
      return `[${timestamp}] ${sender}: ${msg.content}`;
    })
    .join("\n");

  return `Conversation History:\n\n${history}`;
}

/**
 * Determine appropriate ticket priority based on conversation content
 */
export function suggestTicketPriority(
  conversationContent: string,
  conversationPriority?: string
): "low" | "medium" | "high" | "urgent" {
  // Use existing conversation priority if available
  if (conversationPriority && ["low", "medium", "high", "urgent"].includes(conversationPriority)) {
    return conversationPriority as "low" | "medium" | "high" | "urgent";
  }

  const content = conversationContent.toLowerCase();

  // Urgent keywords
  const urgentKeywords = [
    "urgent",
    "emergency",
    "critical",
    "down",
    "broken",
    "not working",
    "can't access",
    "unable to",
    "error",
    "bug",
    "issue",
    "problem",
  ];

  // High priority keywords
  const highKeywords = ["important", "asap", "soon", "quickly", "help", "support needed"];

  // Low priority keywords
  const lowKeywords = ["question", "inquiry", "information", "how to", "tutorial", "guide"];

  if (urgentKeywords.some((keyword) => content.includes(keyword))) {
    return "urgent";
  }

  if (highKeywords.some((keyword) => content.includes(keyword))) {
    return "high";
  }

  if (lowKeywords.some((keyword) => content.includes(keyword))) {
    return "low";
  }

  return "medium"; // Default priority
}

/**
 * Suggest ticket category based on conversation content
 */
export function suggestTicketCategory(conversationContent: string): string {
  const content = conversationContent.toLowerCase();

  const categoryKeywords = {
    "Technical Support": ["error", "bug", "not working", "broken", "technical", "code", "api"],
    "Billing & Payments": ["billing", "payment", "invoice", "charge", "subscription", "refund"],
    "Account Management": ["account", "login", "password", "profile", "settings", "access"],
    "Product Information": ["how to", "tutorial", "guide", "feature", "functionality"],
    "General Inquiry": ["question", "information", "inquiry", "help", "support"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      return category;
    }
  }

  return "General Inquiry"; // Default category
}

/**
 * Validate ticket conversion options
 */
export function validateTicketOptions(options: TicketConversionOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.title || options.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (options.title && options.title.length > 200) {
    errors.push("Title must be 200 characters or less");
  }

  if (options.priority && !["low", "medium", "high", "urgent"].includes(options.priority)) {
    errors.push("Priority must be one of: low, medium, high, urgent");
  }

  if (options.dueDate) {
    const dueDate = new Date(options.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push("Due date must be a valid date");
    } else if (dueDate < new Date()) {
      errors.push("Due date cannot be in the past");
    }
  }

  if (options.tags && options.tags.length > 10) {
    errors.push("Maximum 10 tags allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format ticket conversion result for display
 */
export function formatConversionResult(result: TicketConversionResult): string {
  if (result.success && result.ticket) {
    return `Ticket ${result.ticket.ticketNumber || result.ticket.id} created successfully`;
  }

  if (result.error) {
    return `Failed to create ticket: ${result.error}`;
  }

  return "Unknown error occurred during ticket conversion";
}
