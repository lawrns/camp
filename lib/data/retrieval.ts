/**
 * Data Retrieval Functions
 * Provides data fetching utilities for AI and other services
 */

import type { Mailbox } from "./mailbox";

export interface MetadataOptions {
  includeConversations?: boolean;
  includeFAQs?: boolean;
  includeKnowledge?: boolean;
  timeWindow?: {
    days: number;
  };
}

export interface ConversationMetadata {
  id: number;
  title?: string;
  summary?: string;
  topics?: string[];
  sentiment?: string;
  resolution?: string;
  customerSatisfaction?: number;
}

export interface FAQMetadata {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  popularity?: number;
}

export interface KnowledgeMetadata {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  lastUpdated: Date;
}

export interface RetrievalMetadata {
  conversations: ConversationMetadata[];
  faqs: FAQMetadata[];
  knowledge: KnowledgeMetadata[];
  totalCount: number;
}

/**
 * Fetch metadata for AI context
 */
export async function fetchMetadata(organizationId: string, options: MetadataOptions = {}): Promise<RetrievalMetadata> {
  const {
    includeConversations = true,
    includeFAQs = true,
    includeKnowledge = true,
    timeWindow = { days: 30 },
  } = options;

  // Mock implementation - in real app, this would query the database
  const metadata: RetrievalMetadata = {
    conversations: [],
    faqs: [],
    knowledge: [],
    totalCount: 0,
  };

  if (includeConversations) {
    metadata.conversations = [
      {
        id: 1,
        title: "Password reset issue",
        summary: "Customer unable to reset password due to email delivery issues",
        topics: ["authentication", "email", "password"],
        sentiment: "frustrated",
        resolution: "Email server configuration fixed",
        customerSatisfaction: 4,
      },
      {
        id: 2,
        title: "Billing inquiry",
        summary: "Customer asking about upcoming charge",
        topics: ["billing", "payment", "subscription"],
        sentiment: "neutral",
        resolution: "Explained billing cycle",
        customerSatisfaction: 5,
      },
    ];
  }

  if (includeFAQs) {
    metadata.faqs = [
      {
        id: "faq-1",
        question: "How do I reset my password?",
        answer: "Click on 'Forgot Password' on the login page and follow the instructions.",
        category: "authentication",
        tags: ["password", "reset", "login"],
        popularity: 95,
      },
      {
        id: "faq-2",
        question: "How do I update my billing information?",
        answer: "Go to Settings > Billing and click 'Update Payment Method'.",
        category: "billing",
        tags: ["billing", "payment", "update"],
        popularity: 87,
      },
    ];
  }

  if (includeKnowledge) {
    metadata.knowledge = [
      {
        id: "kb-1",
        title: "Authentication Troubleshooting Guide",
        content: "Step-by-step guide for resolving common authentication issues...",
        category: "troubleshooting",
        tags: ["authentication", "troubleshooting", "guide"],
        lastUpdated: new Date(),
      },
      {
        id: "kb-2",
        title: "Billing FAQ",
        content: "Comprehensive billing information and common questions...",
        category: "billing",
        tags: ["billing", "faq", "payment"],
        lastUpdated: new Date(),
      },
    ];
  }

  metadata.totalCount = metadata.conversations.length + metadata.faqs.length + metadata.knowledge.length;

  return metadata;
}

/**
 * Get past conversations prompt for AI context
 */
export function getPastConversationsPrompt(
  conversations: ConversationMetadata[],
  maxConversations: number = 5
): string {
  const relevantConversations = conversations.slice(0, maxConversations);

  if (relevantConversations.length === 0) {
    return "No past conversations available for context.";
  }

  const conversationSummaries = relevantConversations
    .map((conv) => {
      return `- ${conv.title}: ${conv.summary} (Sentiment: ${conv.sentiment}, Resolution: ${conv.resolution})`;
    })
    .join("\n");

  return `Past conversations for context:\n${conversationSummaries}`;
}

/**
 * Search for relevant knowledge based on query
 */
export async function searchKnowledge(
  organizationId: string,
  query: string,
  limit: number = 10
): Promise<KnowledgeMetadata[]> {
  // Mock implementation - in real app, this would use vector search
  const allKnowledge = await fetchMetadata(organizationId, {
    includeConversations: false,
    includeFAQs: false,
    includeKnowledge: true,
  });

  // Simple text matching for demo
  const searchTerms = query.toLowerCase().split(" ");

  return allKnowledge.knowledge
    .filter((kb) => {
      const searchText = `${kb.title} ${kb.content} ${kb.tags?.join(" ")}`.toLowerCase();
      return searchTerms.some((term) => searchText.includes(term));
    })
    .slice(0, limit);
}

/**
 * Search for relevant FAQs based on query
 */
export async function searchFAQs(organizationId: string, query: string, limit: number = 5): Promise<FAQMetadata[]> {
  // Mock implementation - in real app, this would use vector search
  const allFAQs = await fetchMetadata(organizationId, {
    includeConversations: false,
    includeFAQs: true,
    includeKnowledge: false,
  });

  // Simple text matching for demo
  const searchTerms = query.toLowerCase().split(" ");

  return allFAQs.faqs
    .filter((faq) => {
      const searchText = `${faq.question} ${faq.answer} ${faq.tags?.join(" ")}`.toLowerCase();
      return searchTerms.some((term) => searchText.includes(term));
    })
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

/**
 * Get conversation context for AI
 */
export async function getConversationContext(
  organizationId: string,
  conversationId: string,
  options: {
    includeHistory?: boolean;
    includeSimilar?: boolean;
    includeKnowledge?: boolean;
  } = {}
): Promise<{
  history: ConversationMetadata[];
  similar: ConversationMetadata[];
  knowledge: KnowledgeMetadata[];
}> {
  const { includeHistory = true, includeSimilar = true, includeKnowledge = true } = options;

  const context = {
    history: [] as ConversationMetadata[],
    similar: [] as ConversationMetadata[],
    knowledge: [] as KnowledgeMetadata[],
  };

  if (includeHistory) {
    const metadata = await fetchMetadata(organizationId, { includeConversations: true });
    context.history = metadata.conversations.filter((c) => c.id !== conversationId);
  }

  if (includeSimilar) {
    // Mock similar conversations
    context.similar = context.history.slice(0, 3);
  }

  if (includeKnowledge) {
    const metadata = await fetchMetadata(organizationId, { includeKnowledge: true });
    context.knowledge = metadata.knowledge;
  }

  return context;
}

/**
 * Fetch prompt retrieval data for AI context
 * This function provides knowledge base and website data for AI prompts
 */
export async function fetchPromptRetrievalData(
  mailbox: Mailbox,
  prompt: string,
  conversationId: string | null
): Promise<{
  knowledgeBank: string | null;
  websitePagesPrompt: string | null;
}> {
  // Mock implementation - in real app, this would query knowledge base and website data
  const knowledgeBank = `
# Knowledge Base Context

## Authentication Issues
- Password reset: Use 'Forgot Password' link
- Account locked: Contact support after 3 failed attempts
- Email verification: Check spam folder

## Billing Information
- Billing cycle: Monthly on signup date
- Payment methods: Credit card, PayPal
- Refund policy: 30-day money back guarantee

## Common Solutions
- Clear browser cache for login issues
- Check internet connection for sync problems
- Update app for latest features
`;

  const websitePagesPrompt = `
# Website Pages Context

## Help Center
- FAQ section with common questions
- Video tutorials for setup
- Contact form for complex issues

## Product Documentation
- Getting started guide
- API documentation
- Integration examples

## Support Resources
- Live chat during business hours
- Email support: support@example.com
- Community forum for peer help
`;

  return {
    knowledgeBank,
    websitePagesPrompt,
  };
}
