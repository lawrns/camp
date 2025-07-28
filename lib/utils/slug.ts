/**
 * @fileoverview Cryptographically secure slug generation utility
 * @module utils/slug
 */

/**
 * Generates a cryptographically secure random slug
 *
 * Creates a 32-character hexadecimal string using the Web Crypto API.
 * Suitable for:
 * - Unique identifiers
 * - API keys
 * - Session tokens
 * - File identifiers
 *
 * @returns {string} A 32-character hexadecimal slug
 *
 * @example
 * generateSlug() // "a1b2c3d4e5f6789012345678901234567"
 * generateSlug() // "f9e8d7c6b5a4321098765432109876543"
 *
 * @example
 * // Using for unique file uploads
 * const fileId = generateSlug();
 * const fileName = `upload-${fileId}.jpg`;
 */
export const generateSlug = (): string => {
  const SLUG_LENGTH = 32;
  const BYTE_LENGTH = SLUG_LENGTH / 2;

  const array = new Uint8Array(BYTE_LENGTH);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
