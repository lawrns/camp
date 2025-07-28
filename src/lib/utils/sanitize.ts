/**
 * @fileoverview Secure HTML sanitization utilities for preventing XSS attacks
 * @module utils/sanitize
 *
 * This module provides comprehensive sanitization functions to prevent Cross-Site Scripting (XSS)
 * attacks in user-generated content. It includes HTML sanitization, escaping, and safe DOM manipulation.
 *
 * Security features:
 * - Whitelist-based tag filtering
 * - Attribute validation and sanitization
 * - Protocol validation for URLs
 * - Event handler removal
 * - Directory traversal prevention
 *
 * @example
 * ```typescript
 * import { sanitizeHtml, escapeHtml } from '@/lib/utils/sanitize';
 *
 * // Sanitize user HTML content
 * const safe = sanitizeHtml('<script>alert("XSS")</script><p>Hello</p>');
 * // Result: '<p>Hello</p>'
 *
 * // Escape plain text for HTML display
 * const escaped = escapeHtml('Hello <world>');
 * // Result: 'Hello &lt;world&gt;'
 * ```
 */

// List of allowed HTML tags for message content
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "a",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "h5",
  "h6",
];

// List of allowed attributes for specific tags
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  code: ["class"],
  pre: ["class"],
};

// Regex patterns for dangerous content
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
const DANGEROUS_ATTRS = /^on\w+/i;

/**
 * Sanitizes HTML content to prevent XSS attacks using a whitelist approach
 *
 * This function removes dangerous elements and attributes while preserving
 * safe formatting. It's suitable for sanitizing user-generated content.
 *
 * @param {string} html - Raw HTML string to sanitize
 * @param {Object} options - Sanitization options
 * @param {string[]} [options.allowedTags] - List of allowed HTML tags (defaults to ALLOWED_TAGS)
 * @param {Record<string, string[]>} [options.allowedAttributes] - Map of allowed attributes per tag
 * @param {boolean} [options.stripDangerousProtocols=true] - Whether to remove dangerous URL protocols
 * @returns {string} Sanitized HTML string safe for insertion into the DOM
 *
 * @example
 * // Basic usage
 * sanitizeHtml('<script>alert("XSS")</script><p>Safe content</p>')
 * // Returns: '<p>Safe content</p>'
 *
 * @example
 * // Custom allowed tags
 * sanitizeHtml('<div><span>Text</span></div>', {
 *   allowedTags: ['div', 'span']
 * })
 * // Returns: '<div><span>Text</span></div>'
 */
export function sanitizeHtml(
  html: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    stripDangerousProtocols?: boolean;
  } = {}
): string {
  const {
    allowedTags = ALLOWED_TAGS,
    allowedAttributes = ALLOWED_ATTRIBUTES,
    stripDangerousProtocols = true,
  } = options;

  // Create a temporary container
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Recursively clean all elements
  function cleanElement(element: Element): void {
    // Remove disallowed tags
    const tagName = element.tagName.toLowerCase();
    if (!allowedTags.includes(tagName)) {
      element.remove();
      return;
    }

    // Clean attributes
    const attributes = Array.from(element.attributes);
    for (const attr of attributes) {
      const attrName = attr.name.toLowerCase();

      // Remove event handlers
      if (DANGEROUS_ATTRS.test(attrName)) {
        element.removeAttribute(attr.name);
        continue;
      }

      // Check if attribute is allowed for this tag
      const allowedForTag = allowedAttributes[tagName] || [];
      if (!allowedForTag.includes(attrName)) {
        element.removeAttribute(attr.name);
        continue;
      }

      // Sanitize URLs
      if (stripDangerousProtocols && (attrName === "href" || attrName === "src")) {
        if (DANGEROUS_PROTOCOLS.test(attr.value)) {
          element.removeAttribute(attr.name);
        }
      }
    }

    // Clean child elements
    const children = Array.from(element.children);
    for (const child of children) {
      cleanElement(child);
    }
  }

  // Clean all top-level elements
  const topElements = Array.from(temp.children);
  for (const element of topElements) {
    cleanElement(element);
  }

  // Remove any script tags that might have been missed
  const scripts = temp.querySelectorAll("script, style, iframe, object, embed, form");
  scripts.forEach((el: any) => el.remove());

  return temp.innerHTML;
}

/**
 * Escapes HTML special characters to prevent injection attacks
 *
 * Converts characters that have special meaning in HTML to their
 * HTML entity equivalents. Use this for displaying plain text in HTML.
 *
 * @param {string} text - Plain text to escape
 * @returns {string} Escaped HTML string safe for insertion as text content
 *
 * @example
 * escapeHtml('Hello <world> & "friends"')
 * // Returns: 'Hello &lt;world&gt; &amp; &quot;friends&quot;'
 *
 * @example
 * // Preventing XSS in user input
 * const userInput = '<img src=x onerror=alert("XSS")>';
 * const safe = escapeHtml(userInput);
 * // Returns: '&lt;img src=x onerror=alert(&quot;XSS&quot;)&gt;'
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Converts plain text to safe HTML with basic formatting
 * 
 * Automatically converts line breaks to <br> tags and URLs to clickable links
 * while maintaining security through proper escaping.
 * 
 * @param {string} text - Plain text with potential line breaks and URLs
 * @returns {string} Safe HTML string with basic formatting applied
 * 
 * @example
 * textToHtml('Hello
Visit https://example.com')
 * // Returns: 'Hello<br>Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>'
 */
export function textToHtml(text: string): string {
  // Escape HTML first
  const escaped = escapeHtml(text);

  // Convert line breaks to <br> tags
  const withBreaks = escaped.replace(/\n/g, "<br>");

  // Convert URLs to links (safely)
  const withLinks = withBreaks.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return withLinks;
}

/**
 * Sanitize user input for display in messages
 * Allows basic formatting but prevents XSS
 */
export function sanitizeMessageContent(content: string): string {
  // First, try to parse as markdown-like content
  let html = content;

  // Convert basic markdown
  html = html
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Then sanitize the resulting HTML
  return sanitizeHtml(html);
}

/**
 * Create a safe text node that can be inserted into the DOM
 */
export function createSafeTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Safely set the text content of an element
 */
export function setSafeText(element: HTMLElement, text: string): void {
  element.textContent = text;
}

/**
 * Safely set HTML content with sanitization
 */
export function setSafeHtml(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeHtml(html);
}

/**
 * Check if a URL is safe to use
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return !DANGEROUS_PROTOCOLS.test(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize file names to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal patterns
  return fileName
    .replace(/\.\./g, "")
    .replace(/[\/\\]/g, "")
    .replace(/^\./, "")
    .trim();
}
