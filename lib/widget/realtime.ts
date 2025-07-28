/**
 * Widget Realtime Client - Unified Channel Standards
 * Direct Supabase subscriptions following unified channel naming conventions
 */

import { supabase } from "@/lib/supabase";
import { Message } from "@/types/entities/message";
import { WidgetTypingIndicator } from "@/types/widget";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";

export interface WidgetRealtimeConfig {
  realtimeToken: string;
  organizationId: string;
  sessionId: string;
  channels: {
    conversation: string;
    typing: string;
    presence: string;
  };
}

export interface AgentPresence {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: string;
}

export class WidgetRealtimeClient {
  private supabase: any;
  private config: WidgetRealtimeConfig;
  private channel: any = null;
  private isConnected = false;

  // Event callbacks
  public onMessage?: (message: Message) => void;
  public onTyping?: (typing: WidgetTypingIndicator) => void;
  public onPresence?: (presence: AgentPresence) => void;
  public onConnectionChange?: (connected: boolean) => void;

  constructor(config: WidgetRealtimeConfig) {
    this.config = config;
    // Use the browser client with the special realtime token
    this.supabase = supabase.browser();
  }

  async connect(): Promise<void> {
    try {
      // UNIFIED STANDARD: Use unified channel naming convention
      const channelName = UNIFIED_CHANNELS.conversation(this.config.organizationId, this.config.sessionId);

      this.channel = this.supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${this.config.sessionId}`,
          },
          (payload: any) => {

            if (this.onMessage) {
              this.onMessage(payload.new);
            }
          }
        )
        // UNIFIED EVENTS: Listen for standardized events
        .on("broadcast", { event: UNIFIED_EVENTS.TYPING_START }, (payload: any) => {
          if (this.onTyping) {
            this.onTyping(payload.payload);
          }
        })
        .on("broadcast", { event: UNIFIED_EVENTS.TYPING_STOP }, (payload: any) => {
          if (this.onTyping) {
            this.onTyping(payload.payload);
          }
        })
        .on("broadcast", { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
          if (this.onMessage && payload.payload.message) {
            this.onMessage(payload.payload.message);
          }
        })
        .on("broadcast", { event: UNIFIED_EVENTS.AGENT_STATUS_ONLINE }, (payload: any) => {
          if (this.onPresence) {
            this.onPresence({ ...payload.payload, status: "online" });
          }
        })
        .subscribe((status: string) => {

          this.isConnected = status === "SUBSCRIBED";
          if (this.onConnectionChange) {
            this.onConnectionChange(this.isConnected);
          }
        });
    } catch (error) {

      throw error;
    }
  }

  private widgetJWT: string = "";

  setWidgetJWT(jwt: string): void {
    this.widgetJWT = jwt;
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    // Send via HTTP API (this handles the message creation and realtime broadcast)
    const response = await fetch("/api/widget/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.widgetJWT}`,
      },
      body: JSON.stringify({
        conversationId,
        message: content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    // Simple typing broadcast
    if (this.channel) {
      await this.channel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          conversationId,
          sessionId: this.config.sessionId,
          isTyping,
          timestamp: Date.now(),
        },
      });
    }
  }

  disconnect(): void {
    // Simple cleanup
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // ENHANCED: Bidirectional communication methods
  async broadcastMessage(message: any): Promise<void> {
    if (!this.channel || !this.isConnected) {

      return;
    }

    try {
      await this.channel.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          message,
          conversationId: this.config.sessionId,
          organizationId: this.config.organizationId,
          source: "widget",
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {

    }
  }

  async broadcastTyping(isTyping: boolean, content?: string): Promise<void> {
    if (!this.channel || !this.isConnected) {

      return;
    }

    try {
      await this.channel.send({
        type: "broadcast",
        event: isTyping ? "typing_start" : "typing_stop",
        payload: {
          userId: `visitor_${this.config.organizationId}`,
          userName: "Visitor",
          userType: "visitor",
          isTyping,
          content: content || "",
          conversationId: this.config.sessionId,
          organizationId: this.config.organizationId,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {

    }
  }

  async broadcastReadReceipt(messageId: string): Promise<void> {
    if (!this.channel || !this.isConnected) {

      return;
    }

    try {
      await this.channel.send({
        type: "broadcast",
        event: "read_receipt",
        payload: {
          messageId,
          visitorId: `visitor_${this.config.organizationId}`,
          conversationId: this.config.sessionId,
          organizationId: this.config.organizationId,
          readAt: new Date().toISOString(),
        },
      });

    } catch (error) {

    }
  }
}

/**
 * Initialize widget realtime client
 * Exchanges widget JWT for Supabase realtime token
 */
export async function initializeWidgetRealtime(widgetJWT: string): Promise<WidgetRealtimeClient> {
  // Exchange widget JWT for realtime auth
  const response = await fetch("/api/widget/realtime-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: widgetJWT }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate widget realtime");
  }

  const config: WidgetRealtimeConfig = await response.json();
  const client = new WidgetRealtimeClient(config);

  // Set the original widget JWT for API calls
  client.setWidgetJWT(widgetJWT);

  await client.connect();
  return client;
}

// PostMessage bridge for iframe communication
export function createWidgetPostMessageBridge(client: WidgetRealtimeClient, targetOrigin: string = "*"): void {
  // Listen for messages from parent window
  window.addEventListener("message", async (event) => {
    if (event.data.type === "WIDGET_SEND_MESSAGE") {
      try {
        await client.sendMessage(event.data.conversationId, event.data.content);

        // Confirm message sent
        event.source?.postMessage(
          {
            type: "WIDGET_MESSAGE_SENT",
            messageId: event.data.messageId,
            success: true,
          },
          targetOrigin as any
        );
      } catch (error) {
        event.source?.postMessage(
          {
            type: "WIDGET_MESSAGE_ERROR",
            messageId: event.data.messageId,
            error: (error as Error).message,
          },
          targetOrigin as any
        );
      }
    }

    if (event.data.type === "WIDGET_TYPING") {
      await client.sendTypingIndicator(event.data.conversationId, event.data.isTyping);
    }
  });

  // Send realtime events to parent window
  client.onMessage = (message: Message) => {
    window.parent.postMessage(
      {
        type: "WIDGET_NEW_MESSAGE",
        message,
      },
      targetOrigin
    );
  };

  client.onTyping = (typing: WidgetTypingIndicator) => {
    window.parent.postMessage(
      {
        type: "WIDGET_AGENT_TYPING",
        typing,
      },
      targetOrigin
    );
  };

  client.onPresence = (presence) => {
    window.parent.postMessage(
      {
        type: "WIDGET_AGENT_PRESENCE",
        presence,
      },
      targetOrigin
    );
  };

  client.onConnectionChange = (connected) => {
    window.parent.postMessage(
      {
        type: "WIDGET_CONNECTION_STATUS",
        connected,
      },
      targetOrigin
    );
  };
}
