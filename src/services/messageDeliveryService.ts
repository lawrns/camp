/**
 * @deprecated This service has been moved to lib/core/messaging
 * This file provides backward compatibility
 */

// import { getMessageService } from "@/lib/core/messaging"; // TODO: Re-enable when messaging service is implemented
import { supabase } from "@/lib/supabase";

// Legacy compatibility class
class MessageDeliveryService {
  async markAsDelivered(mid: string, uid: string) {
    // Get organization context from user metadata
    const {
      data: { user },
    } = await supabase.browser().auth.getUser();
    const organizationId = user?.user_metadata?.organization_id;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    // Need conversation ID - for legacy compatibility, extract from message
    const { data: message } = await supabase
      .browser()
      .from("conversation_messages")
      .select("conversation_id")
      .eq("id", mid)
      .single();

    if (!message) {
      throw new Error("Message not found");
    }

    // TODO: Re-implement when messaging service is available
    // const service = getMessageService();
    // const result = await service.markDelivered({
    //   messageId: mid,
    //   conversationId: message.conversation_id,
    //   userId: uid,
    //   organizationId,
    // });

    // if (result.error) {
    //   throw new Error(result.error.message);
    // }

    // For now, just update directly - using messages table instead
    await supabase
      .browser()
      .from("messages")
      .update({
        delivery_status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", mid);
  }

  async markAsRead(mid: string, uid: string) {
    // Get organization context from user metadata
    const {
      data: { user },
    } = await supabase.browser().auth.getUser();
    const organizationId = user?.user_metadata?.organization_id;

    if (!organizationId) {
      throw new Error("Organization context required");
    }

    // Need conversation ID - for legacy compatibility, extract from message
    const { data: message } = await supabase
      .browser()
      .from("messages")
      .select("conversation_id")
      .eq("id", mid)
      .single();

    if (!message) {
      throw new Error("Message not found");
    }

    // TODO: Re-implement when messaging service is available
    // const service = getMessageService();
    // const result = await service.markRead({
    //   messageId: mid,
    //   conversationId: message.conversation_id,
    //   userId: uid,
    //   organizationId,
    // });

    // if (result.error) {
    //   throw new Error(result.error.message);
    // }

    // For now, just update directly - using messages table instead
    await supabase
      .browser()
      .from("messages")
      .update({
        read_status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("id", mid);
  }
}

export const messageDeliveryService = new MessageDeliveryService();
