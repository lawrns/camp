/**
 * Human-like agent name generation for AI operators
 * Ensures AI agents appear indistinguishable from human agents
 */

// Pool of realistic human names that sound like support agents
const AGENT_FIRST_NAMES = [
  "Sarah",
  "Emma",
  "John",
  "Michael",
  "Lisa",
  "David",
  "Jennifer",
  "Robert",
  "Jessica",
  "William",
  "Emily",
  "Christopher",
  "Amanda",
  "Daniel",
  "Ashley",
  "James",
  "Melissa",
  "Ryan",
  "Stephanie",
  "Kevin",
  "Laura",
  "Brian",
  "Amy",
  "Mark",
  "Michelle",
  "Eric",
  "Nicole",
  "Steven",
  "Rebecca",
  "Andrew",
];

const AGENT_LAST_INITIALS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "R",
  "S",
  "T",
  "V",
  "W",
  "Y",
  "Z",
];

/**
 * Generate a human-like agent name
 * Format: "FirstName L." (e.g., "Sarah M.", "John K.")
 */
export function generateAgentName(seed?: string): string {
  // If we have a seed (like conversation ID), use it for consistent names
  if (seed) {
    const hash = seed.split("").reduce((acc: any, char: unknown) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);

    const firstNameIndex = Math.abs(hash) % AGENT_FIRST_NAMES.length;
    const lastInitialIndex = Math.abs(hash >> 8) % AGENT_LAST_INITIALS.length;

    return `${AGENT_FIRST_NAMES[firstNameIndex]} ${AGENT_LAST_INITIALS[lastInitialIndex]}.`;
  }

  // Random generation for new conversations
  const firstName = AGENT_FIRST_NAMES[Math.floor(Math.random() * AGENT_FIRST_NAMES.length)];
  const lastInitial = AGENT_LAST_INITIALS[Math.floor(Math.random() * AGENT_LAST_INITIALS.length)];

  return `${firstName} ${lastInitial}.`;
}

/**
 * Get or generate an agent name for a conversation
 * Ensures consistency across handovers
 */
export function getAgentNameForConversation(conversationMetadata?: any, conversationId?: string): string {
  // First, check if we have a preserved original agent name
  if (conversationMetadata?.original_agent_name) {
    return conversationMetadata.original_agent_name;
  }

  // Then check for current agent name
  if (conversationMetadata?.agent_name) {
    return conversationMetadata.agent_name;
  }

  // Generate a consistent name based on conversation ID
  return generateAgentName(conversationId);
}

/**
 * Agent persona configurations
 * Defines behavior patterns without revealing AI nature
 */
export const AGENT_PERSONAS = {
  friendly: {
    tone: "warm and approachable",
    greeting: "Hi there",
    signoff: "Happy to help",
  },
  professional: {
    tone: "courteous and formal",
    greeting: "Good day",
    signoff: "Best regards",
  },
  supportive: {
    tone: "empathetic and understanding",
    greeting: "Hello",
    signoff: "Here to help",
  },
} as const;
