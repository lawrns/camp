/**
 * Improved Typing Patterns for Human-like AI
 *
 * Implements burst typing patterns, sentiment-driven timing, and natural pauses
 * to achieve >95% human-likeness score
 */

import { HUMAN_AI_CONFIG } from "@/app/config/features";

export interface TypingPersona {
  name: string;
  wpm: number;
  wpmVariance: number;
  burstFactor: number;
  pauseFrequency: number;
  mistakeRate: number;
  correctionPause: number;
  sentencePause: number;
  thinkingPause: number;
}

export interface BurstPattern {
  duration: number;
  speed: number;
  pause: number;
  words: number;
}

export interface EnhancedTypingTimings {
  totalDelay: number;
  burstPatterns: BurstPattern[];
  sentencePauses: number[];
  thinkingPauses: number[];
  correctionPauses: { position: number; duration: number }[];
  readingTime: number;
  emotionalModifier: number;
  baseWPM: number;
}

/**
 * Predefined typing personas for different agent styles
 */
export const TYPING_PERSONAS: Record<string, TypingPersona> = {
  professional: {
    name: "Professional",
    wpm: 65,
    wpmVariance: 10,
    burstFactor: 1.2,
    pauseFrequency: 0.15,
    mistakeRate: 0.01,
    correctionPause: 800,
    sentencePause: 300,
    thinkingPause: 1200,
  },
  casual: {
    name: "Casual",
    wpm: 55,
    wpmVariance: 15,
    burstFactor: 1.4,
    pauseFrequency: 0.25,
    mistakeRate: 0.03,
    correctionPause: 600,
    sentencePause: 200,
    thinkingPause: 800,
  },
  technical: {
    name: "Technical",
    wpm: 70,
    wpmVariance: 5,
    burstFactor: 1.1,
    pauseFrequency: 0.1,
    mistakeRate: 0.005,
    correctionPause: 1000,
    sentencePause: 400,
    thinkingPause: 1500,
  },
  supportive: {
    name: "Supportive",
    wpm: 50,
    wpmVariance: 12,
    burstFactor: 1.3,
    pauseFrequency: 0.2,
    mistakeRate: 0.02,
    correctionPause: 700,
    sentencePause: 250,
    thinkingPause: 1000,
  },
  urgent: {
    name: "Urgent",
    wpm: 80,
    wpmVariance: 20,
    burstFactor: 1.6,
    pauseFrequency: 0.05,
    mistakeRate: 0.04,
    correctionPause: 400,
    sentencePause: 100,
    thinkingPause: 500,
  },
};

/**
 * Calculate reading time before typing (cognitive load simulation)
 */
export function calculateReadingTime(messageContent: string, complexity: "simple" | "medium" | "complex"): number {
  const words = messageContent.split(/\s+/).length;
  const baseReadingWPM = 200; // Average reading speed

  // Complexity multipliers
  const complexityMultipliers = {
    simple: 1,
    medium: 1.3,
    complex: 1.8,
  };

  const readingTime = (words / baseReadingWPM) * 60 * 1000 * complexityMultipliers[complexity];

  // Add minimum and maximum bounds
  return Math.max(300, Math.min(readingTime, 3000));
}

/**
 * Apply sentiment-driven timing modifications
 */
export function applySentimentModifier(
  baseTimings: any,
  sentiment: string,
  urgency: "low" | "medium" | "high"
): number {
  let modifier = 1.0;

  // Sentiment-based modifications
  switch (sentiment) {
    case "frustrated":
    case "angry":
      modifier = 0.8; // Type faster when dealing with frustrated customers
      break;
    case "confused":
    case "uncertain":
      modifier = 1.3; // Type slower, more thoughtfully
      break;
    case "happy":
    case "satisfied":
      modifier = 1.1; // Slightly slower, more relaxed
      break;
    case "neutral":
      modifier = 1.0;
      break;
    default:
      modifier = 1.0;
  }

  // Urgency modifications
  switch (urgency) {
    case "high":
      modifier *= 0.7; // Much faster for urgent issues
      break;
    case "medium":
      modifier *= 0.9; // Slightly faster
      break;
    case "low":
      modifier *= 1.1; // Slightly slower
      break;
  }

  return modifier;
}

/**
 * Generate burst typing patterns for more natural rhythm
 */
export function generateBurstPatterns(
  content: string,
  persona: TypingPersona,
  emotionalModifier: number
): BurstPattern[] {
  const words = content.split(/\s+/);
  const patterns: BurstPattern[] = [];

  let currentPosition = 0;

  while (currentPosition < words.length) {
    // Determine burst size (2-6 words typically)
    const burstSize = Math.min(words.length - currentPosition, Math.floor(2 + Math.random() * 4));

    const burstWords = words.slice(currentPosition, currentPosition + burstSize);
    const burstText = burstWords.join(" ");

    // Calculate burst speed (faster than average)
    const burstWPM = persona.wpm * persona.burstFactor * emotionalModifier;
    const burstDuration = (burstWords.length / burstWPM) * 60 * 1000;

    // Add natural pause after burst
    const pauseDuration = persona.pauseFrequency * 1000 + Math.random() * 300;

    patterns.push({
      duration: burstDuration,
      speed: burstWPM,
      pause: pauseDuration,
      words: burstSize,
    });

    currentPosition += burstSize;
  }

  return patterns;
}

/**
 * Generate sentence-level pauses (humans pause longer at sentence boundaries)
 */
export function generateSentencePauses(content: string, persona: TypingPersona): number[] {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const pauses: number[] = [];

  sentences.forEach((sentence, index) => {
    if (index < sentences.length - 1) {
      // Don't add pause after last sentence
      // Base sentence pause with variation
      const basePause = persona.sentencePause;
      const variation = basePause * 0.4 * (Math.random() - 0.5); // ±40% variation
      pauses.push(Math.max(100, basePause + variation));
    }
  });

  return pauses;
}

/**
 * Generate thinking pauses for complex content
 */
export function generateThinkingPauses(
  content: string,
  persona: TypingPersona,
  complexity: "simple" | "medium" | "complex"
): number[] {
  const pauses: number[] = [];
  const words = content.split(/\s+/);

  // Complexity-based thinking pause frequency
  const thinkingFrequency = {
    simple: 0.1, // 10% of word boundaries
    medium: 0.2, // 20% of word boundaries
    complex: 0.35, // 35% of word boundaries
  };

  const frequency = thinkingFrequency[complexity];

  for (let i = 0; i < words.length; i++) {
    if (Math.random() < frequency) {
      const thinkingPause = persona.thinkingPause + Math.random() * 500;
      pauses.push(thinkingPause);
    } else {
      pauses.push(0); // No pause
    }
  }

  return pauses;
}

/**
 * Generate correction pauses (simulate typos and backspacing)
 */
export function generateCorrectionPauses(
  content: string,
  persona: TypingPersona
): { position: number; duration: number }[] {
  const corrections: { position: number; duration: number }[] = [];
  const words = content.split(/\s+/);

  words.forEach((word, wordIndex) => {
    if (Math.random() < persona.mistakeRate) {
      // Simulate typo and correction
      const correctionPosition = wordIndex;
      const correctionDuration = persona.correctionPause + Math.random() * 300;

      corrections.push({
        position: correctionPosition,
        duration: correctionDuration,
      });
    }
  });

  return corrections;
}

/**
 * Calculate improved typing timings with all natural patterns
 */
export function calculateEnhancedTypingTimings(
  content: string,
  options: {
    persona?: string;
    sentiment?: string;
    urgency?: "low" | "medium" | "high";
    complexity?: "simple" | "medium" | "complex";
    customPersona?: Partial<TypingPersona>;
  } = {}
): EnhancedTypingTimings {
  const {
    persona = "professional",
    sentiment = "neutral",
    urgency = "medium",
    complexity = "medium",
    customPersona = {},
  } = options;

  // Get base persona
  const basePersona = TYPING_PERSONAS[persona] || TYPING_PERSONAS.professional;
  const typingPersona: TypingPersona = {
    ...basePersona,
    ...(Object.fromEntries(
      Object.entries(customPersona).filter(([_, value]) => value !== undefined)
    ) as Partial<TypingPersona>),
  } as TypingPersona;

  // Calculate emotional modifier
  const emotionalModifier = applySentimentModifier(null, sentiment, urgency);

  // Calculate reading time (cognitive load)
  const readingTime = calculateReadingTime(content, complexity);

  // Generate all pattern types
  const burstPatterns = generateBurstPatterns(content, typingPersona, emotionalModifier);
  const sentencePauses = generateSentencePauses(content, typingPersona);
  const thinkingPauses = generateThinkingPauses(content, typingPersona, complexity);
  const correctionPauses = generateCorrectionPauses(content, typingPersona);

  // Calculate total delay
  const burstTotal = burstPatterns.reduce((sum, pattern) => sum + pattern.duration + pattern.pause, 0);
  const sentenceTotal = sentencePauses.reduce((sum, pause) => sum + pause, 0);
  const thinkingTotal = thinkingPauses.reduce((sum, pause) => sum + pause, 0);
  const correctionTotal = correctionPauses.reduce((sum, correction) => sum + correction.duration, 0);

  const totalDelay = Math.max(
    HUMAN_AI_CONFIG.MIN_RESPONSE_DELAY,
    Math.min(
      readingTime + burstTotal + sentenceTotal + thinkingTotal + correctionTotal,
      HUMAN_AI_CONFIG.MAX_RESPONSE_DELAY
    )
  );

  return {
    totalDelay: Math.round(totalDelay),
    burstPatterns,
    sentencePauses,
    thinkingPauses,
    correctionPauses,
    readingTime: Math.round(readingTime),
    emotionalModifier,
    baseWPM: typingPersona.wpm,
  };
}

/**
 * Simulate improved typing with all natural patterns
 */
export async function simulateEnhancedTyping(
  content: string,
  options: {
    persona?: string;
    sentiment?: string;
    urgency?: "low" | "medium" | "high";
    complexity?: "simple" | "medium" | "complex";
    onProgress?: (progress: {
      content: string;
      percentage: number;
      phase: "reading" | "thinking" | "typing" | "pausing" | "correcting";
    }) => void;
  } = {}
): Promise<{ success: boolean; duration: number; timings: EnhancedTypingTimings }> {
  const startTime = Date.now();
  const timings = calculateEnhancedTypingTimings(content, options);

  try {
    // Phase 1: Reading/comprehension time
    if (options.onProgress) {
      options.onProgress({ content: "", percentage: 0, phase: "reading" });
    }
    await delay(timings.readingTime);

    // Phase 2: Progressive typing with burst patterns and pauses
    const words = content.split(/\s+/);
    let currentContent = "";
    let wordIndex = 0;

    for (const pattern of timings.burstPatterns) {
      // Type burst of words
      if (options.onProgress) {
        options.onProgress({
          content: currentContent,
          percentage: (wordIndex / words.length) * 100,
          phase: "typing",
        });
      }

      const burstWords = words.slice(wordIndex, wordIndex + pattern.words);
      const wordsInBurst = burstWords.length;

      // Type each word in the burst with micro-pauses
      for (let i = 0; i < wordsInBurst; i++) {
        currentContent += (wordIndex > 0 ? " " : "") + burstWords[i];
        wordIndex++;

        // Check for correction pause
        const correction = timings.correctionPauses.find((c) => c.position === wordIndex - 1);
        if (correction) {
          if (options.onProgress) {
            options.onProgress({
              content: currentContent,
              percentage: (wordIndex / words.length) * 100,
              phase: "correcting",
            });
          }
          await delay(correction.duration);
        }

        // Small pause between words within burst
        if (i < wordsInBurst - 1) {
          await delay(pattern.duration / wordsInBurst);
        }
      }

      // Pause after burst
      if (options.onProgress) {
        options.onProgress({
          content: currentContent,
          percentage: (wordIndex / words.length) * 100,
          phase: "pausing",
        });
      }
      await delay(pattern.pause);
    }

    // Final progress update
    if (options.onProgress) {
      options.onProgress({
        content: currentContent,
        percentage: 100,
        phase: "typing",
      });
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      timings,
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      timings,
    };
  }
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get appropriate persona based on context
 */
export function getContextualPersona(
  organizationPersona: string,
  sentiment: string,
  urgency: "low" | "medium" | "high",
  customerTier?: string
): string {
  // High urgency always uses urgent persona
  if (urgency === "high") {
    return "urgent";
  }

  // Frustrated customers get more professional response
  if (sentiment === "frustrated" || sentiment === "angry") {
    return "professional";
  }

  // Technical issues get technical persona
  if (organizationPersona === "technical") {
    return "technical";
  }

  // Premium customers get professional treatment
  if (customerTier === "premium" || customerTier === "enterprise") {
    return "professional";
  }

  // Default mapping
  const personaMapping: Record<string, string> = {
    friendly: "casual",
    professional: "professional",
    technical: "technical",
    empathetic: "supportive",
  };

  return personaMapping[organizationPersona] || "professional";
}

/**
 * Development utilities for testing improved typing patterns
 */
export const EnhancedTypingDevUtils = {
  /**
   * Test all typing personas
   */
  testTypingPersonas() {
    if (process.env.NODE_ENV !== "development") return;

    const testMessage = "I understand your frustration with this issue. Let me help you resolve it step by step.";

    Object.entries(TYPING_PERSONAS).forEach(([name, persona]) => {
      const timings = calculateEnhancedTypingTimings(testMessage, { persona: name });
    });
  },

  /**
   * Test sentiment-driven modifications
   */
  testSentimentModifiers() {
    if (process.env.NODE_ENV !== "development") return;

    const testMessage = "I can help you with that right away.";
    const testCases = [
      { sentiment: "frustrated", urgency: "high" as const },
      { sentiment: "confused", urgency: "medium" as const },
      { sentiment: "happy", urgency: "low" as const },
      { sentiment: "neutral", urgency: "medium" as const },
    ];

    testCases.forEach(({ sentiment, urgency }) => {
      const timings = calculateEnhancedTypingTimings(testMessage, { sentiment, urgency });
    });
  },
};
