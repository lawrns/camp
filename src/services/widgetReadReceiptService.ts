import type { NewWidgetReadReceipt, ReaderType, WidgetReadReceipt } from "@/db/schema/widgetReadReceipts";
import { createAdminSupabaseClient } from "@/lib/supabase";

export interface ReadReceiptData {
  messageIds: string[];
  conversationId: string;
  organizationId: string;
  readerId: string;
  readerType?: ReaderType;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface EngagementMetrics {
  messageId: string;
  readerId: string;
  sessionId?: string;
  timeSpentMs?: number;
  viewportVisible?: boolean;
  interactionType?: string;
  scrollDepth?: number;
}

export class WidgetReadReceiptService {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }
  private supabase = createAdminSupabaseClient();

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(data: ReadReceiptData): Promise<WidgetReadReceipt[]> {
    const {
      messageIds,
      conversationId,
      organizationId,
      readerId,
      readerType = "visitor",
      sessionId,
      deviceId,
      ipAddress,
      userAgent,
      metadata,
    } = data;

    // Create read receipts for each message
    const receipts: NewWidgetReadReceipt[] = messageIds.map((messageId: string) => ({
      messageId: parseInt(messageId),
      conversationId: conversationId,
      organizationId: organizationId,
      readerId: readerId,
      readerType: readerType,
      sessionId: sessionId,
      deviceId: deviceId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    }));

    // Store read receipts in message metadata instead of separate table
    for (const messageId of messageIds) {
      const { data: message, error: fetchError } = await this.supabase
        .from("messages")
        .select("metadata")
        .eq("id", messageId)
        .eq("organization_id", this.organizationId)
        .single();

      if (fetchError) {
        continue; // Skip if message not found
      }

      const currentMetadata = message?.metadata || {};
      const readReceipts = currentMetadata.read_receipts || {};
      
      readReceipts[readerId] = {
        reader_type: readerType,
        session_id: sessionId,
        device_id: deviceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: metadata,
        last_read_at: new Date().toISOString(),
      };

      await this.supabase
        .from("messages")
        .update({
          metadata: {
            ...currentMetadata,
            read_receipts: readReceipts,
          },
        })
        .eq("id", messageId)
        .eq("organization_id", this.organizationId);
    }

    // Update message delivery status
    await this.updateMessageDeliveryStatus(messageIds, "read");

    // Broadcast read receipt event
    await this.broadcastReadReceipts(conversationId, organizationId, messageIds, readerId, readerType);

    return []; // Return empty array since we're not using separate table anymore
  }

  /**
   * Update engagement metrics for a message
   * Note: Using messages table metadata field since widget_read_receipts table doesn't exist
   */
  async updateEngagementMetrics(metrics: EngagementMetrics): Promise<void> {
    const { messageId, readerId, sessionId, ...engagementData } = metrics;

    // Store engagement data in message metadata since widget_read_receipts table doesn't exist
    const { data: message, error: fetchError } = await this.supabase
      .from("messages")
      .select("metadata")
      .eq("id", messageId)
      .eq("organization_id", this.organizationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const currentMetadata = message?.metadata || {};
    const readReceipts = currentMetadata.read_receipts || {};
    
    readReceipts[readerId] = {
      ...readReceipts[readerId],
      ...engagementData,
      last_read_at: new Date().toISOString(),
      session_id: sessionId,
    };

    const { error } = await this.supabase
      .from("messages")
      .update({
        metadata: {
          ...currentMetadata,
          read_receipts: readReceipts,
        },
      })
      .eq("id", messageId)
      .eq("organization_id", this.organizationId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get read receipts for a conversation from messages metadata
   */
  async getReadReceipts(
    conversationId: string,
    messageId?: string,
    readerId?: string
  ): Promise<Record<string, WidgetReadReceipt[]>> {
    let query = this.supabase
      .from("messages")
      .select("id, metadata")
      .eq("conversation_id", conversationId)
      .eq("organization_id", this.organizationId)
      .order("created_at", { ascending: false });

    if (messageId) {
      query = query.eq("id", messageId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const readReceipts: Record<string, WidgetReadReceipt[]> = {};
    
    data?.forEach(message => {
      const metadata = message.metadata || {};
      const receipts = metadata.read_receipts || {};
      const msgId = message.id.toString();
      
      Object.entries(receipts).forEach(([readerIdKey, receiptData]: [string, any]) => {
        // Filter by readerId if specified
        if (readerId && readerIdKey !== readerId) {
          return;
        }
        
        if (!readReceipts[msgId]) {
          readReceipts[msgId] = [];
        }
        
        readReceipts[msgId].push({
          id: `${message.id}-${readerIdKey}`,
          messageId: message.id,
          conversationId: conversationId,
          organizationId: this.organizationId,
          readerId: readerIdKey,
          readerType: receiptData.reader_type || 'visitor',
          sessionId: receiptData.session_id,
          deviceId: receiptData.device_id,
          ipAddress: receiptData.ip_address,
          userAgent: receiptData.user_agent,
          metadata: receiptData.metadata || {},
          readAt: receiptData.last_read_at || new Date().toISOString(),
          createdAt: receiptData.last_read_at || new Date().toISOString(),
          updatedAt: receiptData.last_read_at || new Date().toISOString()
        });
      });
    });

    return readReceipts;
  }

  /**
   * Get unread message count for a reader
   */
  async getUnreadCount(conversationId: string, readerId: string, sinceTimestamp?: Date): Promise<number> {
    // Get all messages in conversation with metadata
    const { data: messages } = await this.supabase
      .from("messages")
      .select("id, created_at, metadata")
      .eq("organization_id", this.organizationId)
      .eq("conversation_id", conversationId)
      .gte("created_at", sinceTimestamp?.toISOString() || "2000-01-01");

    if (!messages) return 0;

    // Check which messages have been read by this reader in metadata
    const unreadCount = messages.filter((message: any) => {
      const metadata = message.metadata || {};
      const readReceipts = metadata.read_receipts || {};
      return !readReceipts[readerId];
    }).length;

    return unreadCount;
  }

  /**
   * Check if a message has been read by a specific reader
   */
  async isMessageRead(messageId: string, readerId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("messages")
      .select("metadata")
      .eq("id", messageId)
      .eq("organization_id", this.organizationId)
      .single();

    if (error || !data) return false;

    const metadata = data.metadata || {};
    const readReceipts = metadata.read_receipts || {};
    return !!readReceipts[readerId];
  }

  /**
   * Get engagement analytics for messages
   */
  async getEngagementAnalytics(conversationId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("messages")
      .select("id, metadata")
      .eq("conversation_id", conversationId)
      .eq("organization_id", this.organizationId);

    if (error) {
      throw error;
    }

    // Calculate analytics from message metadata
    const analytics = (data || []).reduce((acc: any, message: any) => {
      const msgId = message.id.toString();
      const metadata = message.metadata || {};
      const readReceipts = metadata.read_receipts || {};
      
      if (!acc[msgId]) {
        acc[msgId] = {
          totalReads: 0,
          avgTimeSpent: 0,
          viewportVisibleCount: 0,
          interactions: {},
        };
      }

      Object.values(readReceipts).forEach((receipt: any) => {
        acc[msgId].totalReads++;
        if (receipt.timeSpentMs) {
          acc[msgId].avgTimeSpent =
            (acc[msgId].avgTimeSpent * (acc[msgId].totalReads - 1) + receipt.timeSpentMs) / acc[msgId].totalReads;
        }
        if (receipt.viewportVisible) {
          acc[msgId].viewportVisibleCount++;
        }
        if (receipt.interactionType) {
          acc[msgId].interactions[receipt.interactionType] =
            (acc[msgId].interactions[receipt.interactionType] || 0) + 1;
        }
      });

      return acc;
    }, {});

    return analytics;
  }

  /**
   * Update message status in metadata
   */
  private async updateMessageDeliveryStatus(messageIds: string[], status: "read"): Promise<void> {
    for (const messageId of messageIds) {
      const { data: message, error: fetchError } = await this.supabase
        .from("messages")
        .select("metadata")
        .eq("id", messageId)
        .eq("organization_id", this.organizationId)
        .single();

      if (fetchError) {
        continue; // Skip if message not found
      }

      const currentMetadata = message?.metadata || {};
      await this.supabase
        .from("messages")
        .update({ 
          metadata: {
            ...currentMetadata,
            delivery_status: status,
            status_updated_at: new Date().toISOString()
          }
        })
        .eq("id", messageId)
        .eq("organization_id", this.organizationId);
    }
  }

  /**
   * Broadcast read receipt events
   */
  private async broadcastReadReceipts(
    conversationId: string,
    organizationId: string,
    messageIds: string[],
    readerId: string,
    readerType: ReaderType
  ): Promise<void> {
    try {
      const channel = this.supabase.channel(`conversation:${organizationId}:${conversationId}`);
      await channel.send({
        type: "broadcast",
        event: "read_receipts",
        payload: {
          messageIds,
          readerId,
          readerType,
          conversationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {}
  }
}

// Export factory function instead of singleton
export const createWidgetReadReceiptService = (organizationId: string) => {
  return new WidgetReadReceiptService(organizationId);
};
