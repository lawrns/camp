/**
 * AI Guardrails - PII filtering and safety checks
 */

/**
 * Sanitize text by removing PII (Personal Identifiable Information)
 */
export function sanitize(text: string): string {
  // Email pattern
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  // Phone patterns (US format)
  const phone = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const phoneIntl = /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;

  // SSN pattern
  const ssn = /\b\d{3}-\d{2}-\d{4}\b/g;

  // Credit card patterns
  const creditCard = /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g;

  // Apply redactions
  let redacted = text;
  redacted = redacted.replace(email, "[redacted email]");
  redacted = redacted.replace(phone, "[redacted phone]");
  redacted = redacted.replace(phoneIntl, "[redacted phone]");
  redacted = redacted.replace(ssn, "[redacted SSN]");
  redacted = redacted.replace(creditCard, "[redacted card]");

  return redacted;
}

/**
 * Calculate hallucination score based on response and source materials
 */
export function hallucinationScore(response: string, sources: Array<{ snippet: string }>): number {
  if (!sources || sources.length === 0) {
    return 1.0; // No sources = high hallucination risk
  }

  // Convert to lowercase for comparison
  const lowerResponse = response.toLowerCase();

  // Check if response contains content from sources
  let matchedContent = 0;
  const totalWords = response.split(/\s+/).length;

  for (const source of sources) {
    const lowerSnippet = source.snippet.toLowerCase();
    const words = lowerSnippet.split(/\s+/);

    // Count matching word sequences
    for (const word of words) {
      if (lowerResponse.includes(word) && word.length > 3) {
        matchedContent++;
      }
    }
  }

  // Calculate score (0 = no hallucination, 1 = complete hallucination)
  const matchRatio = matchedContent / totalWords;
  return Math.max(0, 1 - matchRatio * 2); // Give bonus for matching content
}

/**
 * Check if response contains inappropriate content
 */
export function checkInappropriateContent(text: string): boolean {
  // List of inappropriate terms (simplified for demo)
  const inappropriate = [
    "hate",
    "kill",
    "attack",
    "violence",
    "racist",
    "sexist",
    "discriminate",
    "harass",
    "abuse",
    "threat",
  ];

  const lowerText = text.toLowerCase();
  return inappropriate.some((term) => lowerText.includes(term));
}

/**
 * Apply all guardrails to AI response
 */
export function applyGuardrails(
  response: string,
  sources: Array<{ snippet: string }> = []
): {
  text: string;
  hallucinationScore: number;
  wasFiltered: boolean;
  filterReasons: string[];
} {
  const filterReasons: string[] = [];

  // Check for inappropriate content
  if (checkInappropriateContent(response)) {
    filterReasons.push("inappropriate_content");
    response = "I apologize, but I cannot provide that type of response. How else can I help you today?";
  }

  // Apply PII filtering
  const sanitized = sanitize(response);
  if (sanitized !== response) {
    filterReasons.push("pii_redacted");
  }

  // Calculate hallucination score
  const score = hallucinationScore(response, sources);
  if (score > 0.8) {
    filterReasons.push("high_hallucination_risk");
  }

  return {
    text: sanitized,
    hallucinationScore: score,
    wasFiltered: filterReasons.length > 0,
    filterReasons,
  };
}
