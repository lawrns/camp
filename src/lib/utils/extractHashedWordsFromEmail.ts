import crypto from "crypto";
import { env } from "@/lib/utils/env-config";

// Simple stemmer replacement for natural package
function simpleStem(word: string): string {
  // Basic stemming rules - remove common suffixes
  const suffixes = ["ing", "ed", "er", "est", "ly", "s"];
  let stemmed = word.toLowerCase();

  for (const suffix of suffixes) {
    if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
      stemmed = stemmed.slice(0, -suffix.length);
      break;
    }
  }

  return stemmed;
}

/**
 * Extract words from email's subject and body. Returns a unique set of hashed words.
 */
export function extractHashedWordsFromEmail(params: {
  emailFrom?: string | null;
  subject?: string | null;
  body?: string | null;
}): string[] {
  const extractedWords: string[] = [];

  if (params.emailFrom) extractedWords.push(params.emailFrom);
  if (params.subject) extractedWords.push(...extractWords(params.subject));
  if (params.body) extractedWords.push(...extractWords(params.body));

  // Stem the words and combine with extracted words
  const stemmedWords = extractedWords.map((word: unknown) => simpleStem(word));
  extractedWords.push(...extractedWords, ...stemmedWords);

  // Hash all words
  const hashedWords = extractedWords.map((word: unknown) => hashWord(word)).filter(Boolean);

  // Create a unique set of hashed words
  return Array.from(new Set(hashedWords));
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word: unknown) => word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter(Boolean);
}

function hashWord(word: string, length = 7): string {
  const fullHash = crypto.createHmac("sha256", env.CRYPTO_SECRET).update(word).digest("base64url");
  return fullHash.slice(0, length);
}
