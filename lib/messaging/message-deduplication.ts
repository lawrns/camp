/**
 * Message Deduplication System
 *
 * Comprehensive deduplication logic for preventing duplicate messages
 * in real-time scenarios across all message handling paths
 */

import { supabase } from "@/lib/supabase/consolidated-exports";

export interface MessageIdentifier {
  id?: string;
  tempId?: string;
  conversationId: string;
  content: string;
  senderType: string;
  senderId?: string;
  timestamp: string;
  contentHash?: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingMessageId?: string;
  reason?: string;
  action: "insert" | "skip" | "update";
}

export interface DeduplicationOptions {
  timeWindowMs?: number; // Time window for content-based deduplication
  enableContentHashing?: boolean;
  enableIdBasedDedup?: boolean;
  enableTimestampDedup?: boolean;
  strictMode?: boolean; // More aggressive deduplication
}

/**
 * Message Deduplication Manager
 */
export class MessageDeduplicationManager {
  private processedIds = new Set<string>();
  private contentHashes = new Map<string, { messageId: string; timestamp: number }>();
  private recentMessages = new Map<string, MessageIdentifier[]>(); // conversationId -> recent messages
  private options: Required<DeduplicationOptions>;

  constructor(options: DeduplicationOptions = {}) {
    this.options = {
      timeWindowMs: options.timeWindowMs || 30000, // 30 seconds
      enableContentHashing: options.enableContentHashing ?? true,
      enableIdBasedDedup: options.enableIdBasedDedup ?? true,
      enableTimestampDedup: options.enableTimestampDedup ?? true,
      strictMode: options.strictMode ?? false,
    };

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Check if a message is a duplicate
   */
  async checkDuplicate(message: MessageIdentifier): Promise<DeduplicationResult> {
    // 1. ID-based deduplication (most reliable)
    if (this.options.enableIdBasedDedup && message.id) {
      if (this.processedIds.has(message.id)) {
        return {
          isDuplicate: true,
          existingMessageId: message.id,
          reason: "ID already processed",
          action: "skip",
        };
      }

      // Check database for existing message with this ID
      const existingById = await this.checkDatabaseById(message.id);
      if (existingById.isDuplicate) {
        this.processedIds.add(message.id);
        return existingById;
      }
    }

    // 2. Temporary ID deduplication (for optimistic updates)
    if (message.tempId && this.processedIds.has(message.tempId)) {
      return {
        isDuplicate: true,
        existingMessageId: message.tempId,
        reason: "Temporary ID already processed",
        action: "skip",
      };
    }

    // 3. Content-based deduplication
    if (this.options.enableContentHashing) {
      const contentResult = await this.checkContentDuplicate(message);
      if (contentResult.isDuplicate) {
        return contentResult;
      }
    }

    // 4. Timestamp-based deduplication (for rapid-fire duplicates)
    if (this.options.enableTimestampDedup) {
      const timestampResult = this.checkTimestampDuplicate(message);
      if (timestampResult.isDuplicate) {
        return timestampResult;
      }
    }

    // 5. Strict mode: additional checks
    if (this.options.strictMode) {
      const strictResult = await this.strictModeCheck(message);
      if (strictResult.isDuplicate) {
        return strictResult;
      }
    }

    // Not a duplicate - mark as processed
    this.markAsProcessed(message);
    return {
      isDuplicate: false,
      action: "insert",
    };
  }

  /**
   * Mark a message as processed
   */
  markAsProcessed(message: MessageIdentifier): void {
    if (message.id) {
      this.processedIds.add(message.id);
    }
    if (message.tempId) {
      this.processedIds.add(message.tempId);
    }

    // Add to recent messages for conversation
    if (!this.recentMessages.has(message.conversationId)) {
      this.recentMessages.set(message.conversationId, []);
    }

    const recent = this.recentMessages.get(message.conversationId)!;
    recent.push(message);

    // Keep only recent messages (last 50 per conversation)
    if (recent.length > 50) {
      recent.splice(0, recent.length - 50);
    }

    // Content hash tracking
    if (this.options.enableContentHashing && message.content) {
      const hash = this.generateContentHash(message);
      this.contentHashes.set(hash, {
        messageId: message.id || message.tempId || "unknown",
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Check database for existing message by ID
   */
  private async checkDatabaseById(messageId: string): Promise<DeduplicationResult> {
    try {
      const supabaseClient = supabase.browser();
      const { data: existing, error } = await supabaseClient
        .from("messages")
        .select("id, created_at")
        .eq("id", messageId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned

        return { isDuplicate: false, action: "insert" };
      }

      if (existing) {
        return {
          isDuplicate: true,
          existingMessageId: existing.id,
          reason: "Message ID exists in database",
          action: "skip",
        };
      }

      return { isDuplicate: false, action: "insert" };
    } catch (error) {

      return { isDuplicate: false, action: "insert" };
    }
  }

  /**
   * Check for content-based duplicates
   */
  private async checkContentDuplicate(message: MessageIdentifier): Promise<DeduplicationResult> {
    const hash = this.generateContentHash(message);

    // Check in-memory cache first
    const cached = this.contentHashes.get(hash);
    if (cached && Date.now() - cached.timestamp < this.options.timeWindowMs) {
      return {
        isDuplicate: true,
        existingMessageId: cached.messageId,
        reason: "Content hash match in cache",
        action: "skip",
      };
    }

    // Check database for recent messages with same content
    try {
      const supabaseClient = supabase.browser();
      const timeThreshold = new Date(Date.now() - this.options.timeWindowMs).toISOString();

      const { data: existing, error } = await supabaseClient
        .from("messages")
        .select("id, content, created_at")
        .eq("conversation_id", message.conversationId)
        .eq("content", message.content.trim())
        .eq("sender_type", message.senderType)
        .gte("created_at", timeThreshold)
        .limit(1);

      if (error) {

        return { isDuplicate: false, action: "insert" };
      }

      if (existing && existing.length > 0) {
        return {
          isDuplicate: true,
          existingMessageId: existing[0].id,
          reason: "Identical content found in database",
          action: "skip",
        };
      }

      return { isDuplicate: false, action: "insert" };
    } catch (error) {

      return { isDuplicate: false, action: "insert" };
    }
  }

  /**
   * Check for timestamp-based duplicates (rapid-fire prevention)
   */
  private checkTimestampDuplicate(message: MessageIdentifier): DeduplicationResult {
    const recent = this.recentMessages.get(message.conversationId) || [];
    const messageTime = new Date(message.timestamp).getTime();

    // Look for messages from same sender within 1 second
    const duplicates = recent.filter((recent) => {
      const recentTime = new Date(recent.timestamp).getTime();
      return (
        recent.senderType === message.senderType &&
        recent.senderId === message.senderId &&
        Math.abs(messageTime - recentTime) < 1000 && // Within 1 second
        recent.content.trim() === message.content.trim()
      );
    });

    if (duplicates.length > 0) {
      return {
        isDuplicate: true,
        existingMessageId: duplicates[0].id || duplicates[0].tempId,
        reason: "Rapid-fire duplicate detected",
        action: "skip",
      };
    }

    return { isDuplicate: false, action: "insert" };
  }

  /**
   * Strict mode additional checks
   */
  private async strictModeCheck(message: MessageIdentifier): Promise<DeduplicationResult> {
    // Check for messages with very similar content (fuzzy matching)
    const recent = this.recentMessages.get(message.conversationId) || [];
    const messageContent = message.content.trim().toLowerCase();

    for (const recentMsg of recent) {
      const recentContent = recentMsg.content.trim().toLowerCase();

      // Skip if different senders
      if (recentMsg.senderType !== message.senderType) continue;

      // Check similarity (simple Levenshtein-like check)
      const similarity = this.calculateSimilarity(messageContent, recentContent);

      if (similarity > 0.9) {
        // 90% similar
        const timeDiff = new Date(message.timestamp).getTime() - new Date(recentMsg.timestamp).getTime();

        if (timeDiff < this.options.timeWindowMs) {
          return {
            isDuplicate: true,
            existingMessageId: recentMsg.id || recentMsg.tempId,
            reason: `Similar content detected (${Math.round(similarity * 100)}% match)`,
            action: "skip",
          };
        }
      }
    }

    return { isDuplicate: false, action: "insert" };
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(message: MessageIdentifier): string {
    const content = `${message.conversationId}:${message.senderType}:${message.senderId || ""}:${message.content.trim()}`;
    return this.simpleHash(content);
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.options.timeWindowMs * 2; // Keep entries for 2x the time window

    // Clean content hashes
    for (const [hash, data] of this.contentHashes.entries()) {
      if (now - data.timestamp > maxAge) {
        this.contentHashes.delete(hash);
      }
    }

    // Clean recent messages
    for (const [conversationId, messages] of this.recentMessages.entries()) {
      const filtered = messages.filter((msg) => {
        const msgTime = new Date(msg.timestamp).getTime();
        return now - msgTime < maxAge;
      });

      if (filtered.length === 0) {
        this.recentMessages.delete(conversationId);
      } else {
        this.recentMessages.set(conversationId, filtered);
      }
    }

    // Clean processed IDs (keep a reasonable number)
    if (this.processedIds.size > 10000) {
      const idsArray = Array.from(this.processedIds);
      this.processedIds.clear();
      // Keep the most recent 5000 IDs
      idsArray.slice(-5000).forEach((id) => this.processedIds.add(id));
    }
  }

  /**
   * Clear all deduplication data
   */
  clear(): void {
    this.processedIds.clear();
    this.contentHashes.clear();
    this.recentMessages.clear();
  }

  /**
   * Get deduplication statistics
   */
  getStats(): {
    processedIds: number;
    contentHashes: number;
    recentMessages: number;
    totalConversations: number;
  } {
    return {
      processedIds: this.processedIds.size,
      contentHashes: this.contentHashes.size,
      recentMessages: Array.from(this.recentMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      totalConversations: this.recentMessages.size,
    };
  }
}

// Global deduplication manager instance
export const messageDeduplicator = new MessageDeduplicationManager({
  timeWindowMs: 30000, // 30 seconds
  enableContentHashing: true,
  enableIdBasedDedup: true,
  enableTimestampDedup: true,
  strictMode: false,
});

// Strict deduplicator for high-frequency scenarios
export const strictMessageDeduplicator = new MessageDeduplicationManager({
  timeWindowMs: 60000, // 1 minute
  enableContentHashing: true,
  enableIdBasedDedup: true,
  enableTimestampDedup: true,
  strictMode: true,
});

/**
 * Wrapper function for creating messages with deduplication
 */
export async function createMessageWithDeduplication(
  messageData: {
    id?: string;
    tempId?: string;
    conversationId: string;
    organizationId: string;
    content: string;
    senderType: "customer" | "agent" | "visitor" | "system";
    senderId?: string;
    senderName?: string;
    senderEmail?: string;
    metadata?: any;
  },
  options: {
    useStrictMode?: boolean;
    skipDeduplication?: boolean;
    tableName?: string;
  } = {}
): Promise<{
  success: boolean;
  message?: any;
  isDuplicate?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    // Skip deduplication if requested
    if (options.skipDeduplication) {
      return await insertMessage(messageData, options.tableName);
    }

    // Choose deduplicator based on mode
    const deduplicator = options.useStrictMode ? strictMessageDeduplicator : messageDeduplicator;

    // Check for duplicates
    const deduplicationResult = await deduplicator.checkDuplicate({
      id: messageData.id,
      tempId: messageData.tempId,
      conversationId: messageData.conversationId,
      content: messageData.content,
      senderType: messageData.senderType,
      senderId: messageData.senderId,
      timestamp: new Date().toISOString(),
    });

    if (deduplicationResult.isDuplicate) {

      return {
        success: false,
        isDuplicate: true,
        reason: deduplicationResult.reason,
      };
    }

    // Insert the message
    const result = await insertMessage(messageData, options.tableName);

    if (result.success && result.message) {
      // Mark as processed in deduplicator
      deduplicator.markAsProcessed({
        id: result.message.id,
        tempId: messageData.tempId,
        conversationId: messageData.conversationId,
        content: messageData.content,
        senderType: messageData.senderType,
        senderId: messageData.senderId,
        timestamp: result.message.created_at || new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Insert message into database
 */
async function insertMessage(
  messageData: any,
  tableName: string = "messages"
): Promise<{ success: boolean; message?: any; error?: string }> {
  try {
    const supabaseClient = supabase.admin();

    const insertData = {
      id: messageData.id,
      conversation_id: messageData.conversationId,
      organization_id: messageData.organizationId,
      content: messageData.content,
      sender_type: messageData.senderType,
      sender_id: messageData.senderId,
      sender_name: messageData.senderName,
      sender_email: messageData.senderEmail,
      created_at: new Date().toISOString(),
      metadata: messageData.metadata || {},
    };

    // Remove undefined values
    Object.keys(insertData).forEach((key) => {
      if (insertData[key] === undefined) {
        delete insertData[key];
      }
    });

    const { data: message, error } = await supabaseClient.from(tableName).insert(insertData).select().single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}
