/**
 * Phrase Filter & Personalization System
 *
 * Filters and personalizes AI responses to make them more human-like
 * by removing robotic phrases and adding personal touches.
 */

export interface PersonalizationContext {
  customerName?: string;
  customerTier?: string;
  previousInteractions?: number;
  organizationName?: string;
  agentName?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  conversationLength?: number;
}

export interface FilteringOptions {
  removeRoboticPhrases?: boolean;
  addPersonalTouches?: boolean;
  adjustFormality?: "increase" | "decrease" | "maintain";
  maxLength?: number;
  preserveStructure?: boolean;
}

/**
 * Robotic phrases to remove or replace
 */
const ROBOTIC_PHRASES = {
  // AI-specific phrases that sound unnatural
  remove: [
    "As an AI",
    "I am an AI",
    "As a language model",
    "I don't have personal experiences",
    "I cannot feel emotions",
    "Based on my training data",
    "According to my knowledge",
    "I was trained to",
    "My programming",
    "I am designed to",
  ],

  // Overly formal phrases to replace
  replace: {
    "I would be happy to assist you": "I'd be happy to help",
    "Please do not hesitate to contact": "Feel free to reach out",
    "I apologize for any inconvenience": "Sorry about that",
    "Thank you for bringing this to my attention": "Thanks for letting me know",
    "I understand your concern": "I get it",
    "Please be advised that": "Just so you know",
    "In order to": "To",
    "At this point in time": "Right now",
    "Due to the fact that": "Because",
    "Please find attached": "I've attached",
    "As per your request": "As you asked",
    "I will proceed to": "I'll",
    "Please allow me to": "Let me",
    "I would like to inform you": "I wanted to let you know",
    "It has come to my attention": "I noticed",
  },
};

/**
 * Human-like conversation starters and connectors
 */
const HUMAN_PHRASES = {
  greetings: {
    morning: ["Good morning!", "Morning!", "Hope you're having a good morning!"],
    afternoon: ["Good afternoon!", "Hope your day is going well!", "Afternoon!"],
    evening: ["Good evening!", "Hope you're having a good evening!", "Evening!"],
  },

  acknowledgments: [
    "Got it!",
    "I see",
    "Ah, okay",
    "Right",
    "Makes sense",
    "I understand",
    "Absolutely",
    "For sure",
    "Definitely",
    "Of course",
  ],

  transitions: [
    "So",
    "Now",
    "Alright",
    "Okay",
    "Let me",
    "Here's what",
    "Actually",
    "By the way",
    "Also",
    "Plus",
    "And",
    "Oh, and",
  ],

  empathy: [
    "That sounds frustrating",
    "I can imagine that's annoying",
    "That must be tough",
    "I totally get that",
    "That makes sense",
    "I hear you",
    "I feel you",
  ],

  enthusiasm: [
    "Great question!",
    "Good point!",
    "Excellent!",
    "Perfect!",
    "Nice!",
    "That's awesome!",
    "Love it!",
    "Fantastic!",
  ],
};

/**
 * Personalization templates
 */
const PERSONALIZATION_TEMPLATES = {
  withName: ["Hi {name}!", "Hey {name}!", "Thanks {name}!", "{name}, here's what I found:", "No problem, {name}!"],

  returningCustomer: [
    "Welcome back!",
    "Good to see you again!",
    "Thanks for coming back to us!",
    "Hope we can help you again today!",
  ],

  premiumCustomer: [
    "As one of our valued premium customers",
    "I'll make sure this gets priority attention",
    "Let me get this sorted out for you right away",
  ],
};

/**
 * Main phrase filtering function
 */
export function phraseFilter(content: string, options: FilteringOptions = {}): string {
  let filtered = content;

  const { removeRoboticPhrases = true, adjustFormality = "maintain", maxLength, preserveStructure = true } = options;

  // Remove robotic phrases
  if (removeRoboticPhrases) {
    ROBOTIC_PHRASES.remove.forEach((phrase: unknown) => {
      const regex = new RegExp(phrase, "gi");
      filtered = filtered.replace(regex, "");
    });

    // Replace formal phrases with casual ones
    Object.entries(ROBOTIC_PHRASES.replace).forEach(([formal, casual]) => {
      const regex = new RegExp(formal, "gi");
      filtered = filtered.replace(regex, casual);
    });
  }

  // Adjust formality
  if (adjustFormality === "decrease") {
    filtered = makeCasual(filtered);
  } else if (adjustFormality === "increase") {
    filtered = makeFormal(filtered);
  }

  // Clean up extra spaces and formatting
  filtered = cleanupFormatting(filtered);

  // Truncate if needed
  if (maxLength && filtered.length > maxLength) {
    filtered = truncateGracefully(filtered, maxLength, preserveStructure);
  }

  return filtered;
}

/**
 * Personalize content based on customer context
 */
export function personalize(content: string, context: PersonalizationContext = {}): string {
  let personalized = content;

  // Add greeting based on time of day
  if (context.timeOfDay && !hasGreeting(content)) {
    const greetings = HUMAN_PHRASES.greetings[context.timeOfDay];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    personalized = `${greeting} ${personalized}`;
  }

  // Add customer name if available
  if (context.customerName && shouldAddName(content, context)) {
    personalized = addCustomerName(personalized, context.customerName);
  }

  // Add returning customer acknowledgment
  if (context.previousInteractions && context.previousInteractions > 0) {
    const acknowledgment =
      PERSONALIZATION_TEMPLATES.returningCustomer[
        Math.floor(Math.random() * PERSONALIZATION_TEMPLATES.returningCustomer.length)
      ];
    personalized = `${acknowledgment} ${personalized}`;
  }

  // Add premium customer treatment
  if (context.customerTier === "premium" || context.customerTier === "enterprise") {
    personalized = addPremiumTouch(personalized);
  }

  // Add human-like connectors
  personalized = addHumanConnectors(personalized);

  return personalized;
}

/**
 * Make content more casual
 */
function makeCasual(content: string): string {
  let casual = content;

  // Replace formal contractions
  const contractions = {
    "do not": "don't",
    cannot: "can't",
    "will not": "won't",
    "would not": "wouldn't",
    "should not": "shouldn't",
    "could not": "couldn't",
    "have not": "haven't",
    "has not": "hasn't",
    "had not": "hadn't",
    "is not": "isn't",
    "are not": "aren't",
    "was not": "wasn't",
    "were not": "weren't",
    "I will": "I'll",
    "you will": "you'll",
    "we will": "we'll",
    "they will": "they'll",
    "I would": "I'd",
    "you would": "you'd",
    "we would": "we'd",
    "they would": "they'd",
  };

  Object.entries(contractions).forEach(([formal, contraction]) => {
    const regex = new RegExp(`\\b${formal}\\b`, "gi");
    casual = casual.replace(regex, contraction);
  });

  return casual;
}

/**
 * Make content more formal
 */
function makeFormal(content: string): string {
  let formal = content;

  // Expand contractions
  const expansions = {
    "don't": "do not",
    "can't": "cannot",
    "won't": "will not",
    "wouldn't": "would not",
    "shouldn't": "should not",
    "couldn't": "could not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "I'll": "I will",
    "you'll": "you will",
    "we'll": "we will",
    "they'll": "they will",
    "I'd": "I would",
    "you'd": "you would",
    "we'd": "we would",
    "they'd": "they would",
  };

  Object.entries(expansions).forEach(([contraction, expansion]) => {
    const regex = new RegExp(`\\b${contraction}\\b`, "gi");
    formal = formal.replace(regex, expansion);
  });

  return formal;
}

/**
 * Clean up formatting and extra spaces
 */
function cleanupFormatting(content: string): string {
  return content
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/\s+([.!?])/g, "$1") // Remove space before punctuation
    .replace(/([.!?])\s*([.!?])/g, "$1 $2") // Fix punctuation spacing
    .trim();
}

/**
 * Truncate content gracefully
 */
function truncateGracefully(content: string, maxLength: number, preserveStructure: boolean): string {
  if (content.length <= maxLength) return content;

  if (preserveStructure) {
    // Try to truncate at sentence boundary
    const sentences = content.split(/[.!?]+/);
    let truncated = "";

    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxLength - 3) break;
      truncated += sentence + ".";
    }

    return truncated || content.substring(0, maxLength - 3) + "...";
  }

  return content.substring(0, maxLength - 3) + "...";
}

/**
 * Check if content already has a greeting
 */
function hasGreeting(content: string): boolean {
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
    /^(morning|afternoon|evening)/i,
  ];

  return greetingPatterns.some((pattern) => pattern.test(content.trim()));
}

/**
 * Determine if customer name should be added
 */
function shouldAddName(content: string, context: PersonalizationContext): boolean {
  // Don't add name if it's already there
  if (context.customerName && content.toLowerCase().includes(context.customerName.toLowerCase())) {
    return false;
  }

  // Add name for shorter, personal responses
  return content.length < 200 && Math.random() < 0.3; // 30% chance
}

/**
 * Add customer name to content
 */
function addCustomerName(content: string, name: string): string {
  const templates = PERSONALIZATION_TEMPLATES.withName;
  const template = templates[Math.floor(Math.random() * templates.length)];

  if (!template) return content;

  // If template is a greeting, prepend it
  if (template.startsWith("Hi") || template.startsWith("Hey")) {
    return template.replace("{name}", name) + " " + content;
  }

  // Otherwise, try to integrate it naturally
  return template.replace("{name}", name) + " " + content;
}

/**
 * Add premium customer treatment
 */
function addPremiumTouch(content: string): string {
  // Subtle premium treatment - don't overdo it
  if (Math.random() < 0.2) {
    // 20% chance
    const touches = PERSONALIZATION_TEMPLATES.premiumCustomer;
    const touch = touches[Math.floor(Math.random() * touches.length)];
    return `${touch}, ${content.toLowerCase()}`;
  }

  return content;
}

/**
 * Add human-like connectors and acknowledgments
 */
function addHumanConnectors(content: string): string {
  let improved = content;

  // Add acknowledgment at the beginning sometimes
  if (Math.random() < 0.15) {
    // 15% chance
    const acknowledgments = HUMAN_PHRASES.acknowledgments;
    const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    improved = `${ack}! ${enhanced}`;
  }

  // Add transition words
  if (enhanced.includes(". ") && Math.random() < 0.2) {
    // 20% chance for multi-sentence responses
    const transitions = HUMAN_PHRASES.transitions;
    const transition = transitions[Math.floor(Math.random() * transitions.length)];
    improved = enhanced.replace(". ", `. ${transition}, `);
  }

  return enhanced;
}

/**
 * Development utilities for testing phrase filtering
 */
export const PhraseFilterDevUtils = {
  /**
   * Test phrase filtering with sample content
   */
  testPhraseFiltering() {
    if (process.env.NODE_ENV !== "development") return;

    const testContent = [
      "As an AI, I would be happy to assist you with your inquiry. Please do not hesitate to contact me if you need further assistance.",
      "I apologize for any inconvenience this may have caused. I will proceed to resolve this issue for you immediately.",
      "Thank you for bringing this to my attention. Based on my training data, I can provide you with the following information.",
      "I understand your concern and I am designed to help you with this type of question.",
    ];

    testContent.forEach((content, i) => {
      const filtered = phraseFilter(content, { adjustFormality: "decrease" });
    });
  },

  /**
   * Test personalization
   */
  testPersonalization() {
    if (process.env.NODE_ENV !== "development") return;

    const testContent = "I can help you with that billing question.";
    const contexts = [
      { customerName: "John", timeOfDay: "morning" as const },
      { customerName: "Sarah", previousInteractions: 3, customerTier: "premium" },
      { timeOfDay: "evening" as const, conversationLength: 1 },
    ];

    contexts.forEach((context, i) => {
      const personalized = personalize(testContent, context);
    });
  },
} as const;
