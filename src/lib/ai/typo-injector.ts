/**
 * Typo Injection System
 *
 * Creates subtle, realistic typos and corrections to make AI responses
 * appear more human-like. Includes natural correction patterns and timing.
 */

import { HUMAN_AI_CONFIG } from "@/app/config/features";

export interface TypoInjectionOptions {
  probability?: number; // 0-1, chance of introducing typos
  correctionDelay?: number; // ms delay before correction
  maxTyposPerMessage?: number;
  typoTypes?: TypoType[];
  preserveReadability?: boolean;
}

export interface TypoCorrection {
  originalText: string;
  typoText: string;
  correctedText: string;
  typoPosition: number;
  correctionDelay: number;
  typoType: TypoType;
}

export type TypoType =
  | "transposition" // swap adjacent characters
  | "substitution" // wrong character
  | "omission" // missing character
  | "insertion" // extra character
  | "doubling" // double character
  | "autocorrect"; // common autocorrect mistakes

/**
 * Common typo patterns and their corrections
 */
const TYPO_PATTERNS = {
  // Common character substitutions (keyboard proximity)
  substitutions: {
    a: ["s", "q", "w"],
    s: ["a", "d", "w", "e"],
    d: ["s", "f", "e", "r"],
    f: ["d", "g", "r", "t"],
    g: ["f", "h", "t", "y"],
    h: ["g", "j", "y", "u"],
    j: ["h", "k", "u", "i"],
    k: ["j", "l", "i", "o"],
    l: ["k", "o", "p"],
    q: ["w", "a"],
    w: ["q", "e", "a", "s"],
    e: ["w", "r", "s", "d"],
    r: ["e", "t", "d", "f"],
    t: ["r", "y", "f", "g"],
    y: ["t", "u", "g", "h"],
    u: ["y", "i", "h", "j"],
    i: ["u", "o", "j", "k"],
    o: ["i", "p", "k", "l"],
    p: ["o", "l"],
    z: ["x", "a"],
    x: ["z", "c", "s"],
    c: ["x", "v", "d"],
    v: ["c", "b", "f"],
    b: ["v", "n", "g"],
    n: ["b", "m", "h"],
    m: ["n", "j"],
  },

  // Common transposition pairs
  transpositions: [
    ["th", "ht"],
    ["er", "re"],
    ["in", "ni"],
    ["on", "no"],
    ["an", "na"],
    ["he", "eh"],
    ["at", "ta"],
    ["or", "ro"],
    ["it", "ti"],
    ["is", "si"],
    ["to", "ot"],
    ["as", "sa"],
  ],

  // Common autocorrect mistakes
  autocorrects: {
    its: "it's",
    your: "you're",
    there: "their",
    than: "then",
    affect: "effect",
    loose: "lose",
    breath: "breathe",
    advice: "advise",
  },

  // Words that commonly get doubled characters
  doublingTargets: ["ll", "ss", "tt", "nn", "mm", "pp", "cc", "dd"],
};

/**
 * Inject realistic typos into text
 */
export function typoInjector(
  text: string,
  options: TypoInjectionOptions = {}
): { text: string; corrections: TypoCorrection[] } {
  const {
    probability = HUMAN_AI_CONFIG.TYPO_PROBABILITY,
    maxTyposPerMessage = 2,
    typoTypes = ["transposition", "substitution", "omission", "doubling"],
    preserveReadability = true,
  } = options;

  // Don't inject typos in very short messages
  if (text.length < 20) {
    return { text, corrections: [] };
  }

  // Calculate number of typos to inject
  const words = text.split(/\s+/);
  const maxPossibleTypos = Math.min(
    maxTyposPerMessage,
    Math.floor(words.length / 10) // Max 1 typo per 10 words
  );

  let typoCount = 0;
  for (let i = 0; i < maxPossibleTypos; i++) {
    if (Math.random() < probability) {
      typoCount++;
    }
  }

  if (typoCount === 0) {
    return { text, corrections: [] };
  }

  const corrections: TypoCorrection[] = [];
  let modifiedText = text;

  // Inject typos
  for (let i = 0; i < typoCount; i++) {
    const typoType = typoTypes[Math.floor(Math.random() * typoTypes.length)];
    if (!typoType) continue;
    const typoResult = injectSingleTypo(modifiedText, typoType, preserveReadability);

    if (typoResult) {
      modifiedText = typoResult.text;
      corrections.push(typoResult.correction);
    }
  }

  return { text: modifiedText, corrections };
}

/**
 * Inject a single typo of specified type
 */
function injectSingleTypo(
  text: string,
  typoType: TypoType,
  preserveReadability: boolean
): { text: string; correction: TypoCorrection } | null {
  const words = text.split(/\s+/);

  // Find suitable word for typo
  const suitableWords = words.filter(
    (word) =>
      word.length > 3 && // Don't typo very short words
      /^[a-zA-Z]+$/.test(word) && // Only alphabetic words
      !isImportantWord(word) // Don't typo important words
  );

  if (suitableWords.length === 0) return null;

  const targetWord = suitableWords[Math.floor(Math.random() * suitableWords.length)] || "";
  const wordIndex = words.indexOf(targetWord);

  let typoWord: string = targetWord; // Default fallback
  let typoPosition: number;

  switch (typoType) {
    case "transposition":
      typoWord = createTranspositionTypo(targetWord || "");
      break;
    case "substitution":
      typoWord = createSubstitutionTypo(targetWord || "");
      break;
    case "omission":
      typoWord = createOmissionTypo(targetWord || "");
      break;
    case "insertion":
      typoWord = createInsertionTypo(targetWord || "");
      break;
    case "doubling":
      typoWord = createDoublingTypo(targetWord || "");
      break;
    case "autocorrect":
      typoWord = createAutocorrectTypo(targetWord || "");
      break;
    default:
      return null;
  }

  if (!typoWord || typoWord === targetWord) return null;

  // Check readability
  if (preserveReadability && typoWord && !isReadable(typoWord, targetWord || "")) {
    return null;
  }

  // Apply typo
  if (typoWord) {
    words[wordIndex] = typoWord;
  }
  const modifiedText = words.join(" ");
  typoPosition = text.indexOf(targetWord);

  const correction: TypoCorrection = {
    originalText: text,
    typoText: modifiedText,
    correctedText: text, // Will be the final corrected version
    typoPosition,
    correctionDelay: HUMAN_AI_CONFIG.TYPO_CORRECTION_DELAY + Math.random() * 1000,
    typoType,
  };

  return { text: modifiedText, correction };
}

/**
 * Create transposition typo (swap adjacent characters)
 */
function createTranspositionTypo(word: string): string {
  if (word.length < 4) return word;

  // Try common transposition patterns first
  for (const [correct, typo] of TYPO_PATTERNS.transpositions) {
    if (correct && typo && word.includes(correct)) {
      return word.replace(correct, typo);
    }
  }

  // Random transposition
  const pos = Math.floor(Math.random() * (word.length - 1));
  const chars = word.split("");
  [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
  return chars.join("");
}

/**
 * Create substitution typo (wrong character)
 */
function createSubstitutionTypo(word: string): string {
  const pos = Math.floor(Math.random() * word.length);
  const char = word[pos]?.toLowerCase() || "";
  const substitutes = TYPO_PATTERNS.substitutions[char as keyof typeof TYPO_PATTERNS.substitutions];

  if (!substitutes || substitutes.length === 0) return word;

  const substitute = substitutes[Math.floor(Math.random() * substitutes.length)];
  if (!substitute) return word;

  const chars = word.split("");
  const originalChar = word[pos];
  if (originalChar) {
    chars[pos] = originalChar === originalChar.toUpperCase() ? substitute.toUpperCase() : substitute;
  }
  return chars.join("");
}

/**
 * Create omission typo (missing character)
 */
function createOmissionTypo(word: string): string {
  if (word.length < 4) return word;

  const pos = Math.floor(Math.random() * word.length);
  return word.slice(0, pos) + word.slice(pos + 1);
}

/**
 * Create insertion typo (extra character)
 */
function createInsertionTypo(word: string): string {
  const pos = Math.floor(Math.random() * (word.length + 1));
  const char = word[Math.max(0, pos - 1)] || "e"; // Default to 'e' if at start
  return word.slice(0, pos) + char + word.slice(pos);
}

/**
 * Create doubling typo (double character)
 */
function createDoublingTypo(word: string): string {
  // Look for characters that commonly get doubled
  for (const target of TYPO_PATTERNS.doublingTargets) {
    if (target && target[0] && word.includes(target[0]) && !word.includes(target)) {
      return word.replace(target[0], target);
    }
  }

  // Random doubling
  const pos = Math.floor(Math.random() * word.length);
  return word.slice(0, pos + 1) + word[pos] + word.slice(pos + 1);
}

/**
 * Create autocorrect typo
 */
function createAutocorrectTypo(word: string): string {
  const lowerWord = (word || "").toLowerCase();

  // Check if word can be "autocorrected" to something else
  for (const [correct, incorrect] of Object.entries(TYPO_PATTERNS.autocorrects)) {
    if (lowerWord === correct) {
      return word[0] === word[0]?.toUpperCase() ? incorrect.charAt(0).toUpperCase() + incorrect.slice(1) : incorrect;
    }
  }

  return word;
}

/**
 * Check if a word is important and shouldn't be typo'd
 */
function isImportantWord(word: string): boolean {
  const important = [
    "password",
    "email",
    "account",
    "login",
    "security",
    "payment",
    "billing",
    "price",
    "cost",
    "money",
    "api",
    "url",
    "link",
    "code",
    "error",
  ];

  return important.includes(word.toLowerCase());
}

/**
 * Check if typo maintains readability
 */
function isReadable(typoWord: string, originalWord: string): boolean {
  // Don't allow typos that make words unrecognizable
  const similarity = calculateSimilarity(typoWord, originalWord);
  return similarity > 0.6; // At least 60% similar
}

/**
 * Calculate similarity between two words
 */
function calculateSimilarity(word1: string, word2: string): number {
  const longer = word1.length > word2.length ? word1 : word2;
  const shorter = word1.length > word2.length ? word2 : word1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0]?.[i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j]?.[0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]?.[i] = Math.min(
        (matrix[j]?.[i - 1] || 0) + 1, // deletion
        (matrix[j - 1]?.[i] || 0) + 1, // insertion
        (matrix[j - 1]?.[i - 1] || 0) + indicator // substitution
      );
    }
  }

  return matrix[str2.length]?.[str1.length] || 0;
}

/**
 * Generate correction sequence for typos
 */
export function generateCorrectionSequence(
  originalText: string,
  corrections: TypoCorrection[]
): Array<{ text: string; delay: number; action: "type" | "correct" }> {
  const sequence: Array<{ text: string; delay: number; action: "type" | "correct" }> = [];

  // Start with the typo text
  let currentText = originalText;
  corrections.forEach((correction: unknown) => {
    currentText = correction.typoText;
  });

  sequence.push({ text: currentText, delay: 0, action: "type" });

  // Add corrections with delays
  corrections.forEach((correction: unknown) => {
    sequence.push({
      text: correction.correctedText,
      delay: correction.correctionDelay,
      action: "correct",
    });
  });

  return sequence;
}

/**
 * Development utilities for testing typo injection
 */
export const TypoInjectorDevUtils = {
  /**
   * Test typo injection with sample text
   */
  testTypoInjection() {
    if (process.env.NODE_ENV !== "development") return;

    const testTexts = [
      "I can help you with that billing question.",
      "Let me check your account settings and see what we can do.",
      "The integration process is straightforward and should only take a few minutes.",
      "Thank you for your patience while we resolve this issue.",
    ];

    testTexts.forEach((text, i) => {
      const result = typoInjector(text, { probability: 0.8 }); // High probability for testing

      result.corrections.forEach((correction, j) => {});
    });
  },

  /**
   * Test specific typo types
   */
  testTypoTypes() {
    if (process.env.NODE_ENV !== "development") return;

    const testWord = "example";
    const typoTypes: TypoType[] = ["transposition", "substitution", "omission", "insertion", "doubling"];

    typoTypes.forEach((type: unknown) => {
      const result = injectSingleTypo(testWord, type, true);
    });
  },
} as const;
