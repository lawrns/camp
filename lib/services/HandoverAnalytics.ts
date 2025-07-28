import { supabase } from "@/lib/supabase";

export interface HandoverMetrics {
  totalHandovers: number;
  successRate: number;
  averageHandoverTime: number;
  handoversByType: Record<string, number>;
  handoversByPersona: Record<string, number>;
  failureReasons: Record<string, number>;
  peakHandoverHours: number[];
}

export interface HandoverEvent {
  id: string;
  conversationId: string;
  organizationId: string;
  fromHandler: "ai" | "human";
  toHandler: "ai" | "human";
  persona?: string;
  success: boolean;
  duration: number;
  errorReason?: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * HandoverAnalytics Service
 * Tracks and analyzes handover events for insights and optimization
 */
export class HandoverAnalytics {
  private static instance: HandoverAnalytics;
  private supabase = supabase.browser();
  private eventQueue: HandoverEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  static getInstance(): HandoverAnalytics {
    if (!HandoverAnalytics.instance) {
      HandoverAnalytics.instance = new HandoverAnalytics();
    }
    return HandoverAnalytics.instance;
  }

  /**
   * Track a handover event
   */
  async trackHandover(event: Omit<HandoverEvent, "id" | "timestamp">) {
    const handoverEvent: HandoverEvent = {
      ...event,
      id: `handover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.eventQueue.push(handoverEvent);

    // Flush if queue is large
    if (this.eventQueue.length >= 10) {
      await this.flush();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
    }
  }

  /**
   * Track handover start
   */
  trackHandoverStart(
    conversationId: string,
    organizationId: string,
    from: "ai" | "human",
    to: "ai" | "human",
    userId: string,
    persona?: string
  ): string {
    const eventId = `handover-start-${Date.now()}`;

    // Store start event in session storage for duration tracking
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        eventId,
        JSON.stringify({
          conversationId,
          organizationId,
          from,
          to,
          userId,
          persona,
          startTime: Date.now(),
        })
      );
    }

    return eventId;
  }

  /**
   * Track handover completion
   */
  async trackHandoverComplete(eventId: string, success: boolean, errorReason?: string, metadata?: Record<string, any>) {
    if (typeof window === "undefined") return;

    const startDataStr = sessionStorage.getItem(eventId);
    if (!startDataStr) return;

    const startData = JSON.parse(startDataStr);
    const duration = Date.now() - startData.startTime;

    await this.trackHandover({
      conversationId: startData.conversationId,
      organizationId: startData.organizationId,
      fromHandler: startData.from,
      toHandler: startData.to,
      persona: startData.persona,
      success,
      duration,
      ...(errorReason !== undefined && { errorReason }),
      userId: startData.userId,
      ...(metadata !== undefined && { metadata }),
    });

    // Clean up
    sessionStorage.removeItem(eventId);
  }

  /**
   * Get handover metrics for a time period
   */
  async getMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<HandoverMetrics> {
    try {
      // Flush pending events first
      await this.flush();

      const { data: events, error } = await this.supabase
        .from("handover_analytics")
        .select("*")
        .eq("organization_id", organizationId)
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      if (error) throw error;

      if (!events || events.length === 0) {
        return this.getEmptyMetrics();
      }

      // Calculate metrics
      const totalHandovers = events.length;
      const successfulHandovers = events.filter((e: any) => e.success).length;
      const successRate = (successfulHandovers / totalHandovers) * 100;

      const totalDuration = events.reduce((sum: any, e: any) => sum + (e.duration || 0), 0);
      const averageHandoverTime = totalDuration / totalHandovers;

      const handoversByType = events.reduce(
        (acc: any, e: any) => {
          const type = `${e.from_handler}_to_${e.to_handler}`;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const handoversByPersona = events
        .filter((e: any) => e.persona)
        .reduce(
          (acc: any, e: any) => {
            acc[e.persona!] = (acc[e.persona!] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

      const failureReasons = events
        .filter((e: any) => !e.success && e.error_reason)
        .reduce(
          (acc: any, e: any) => {
            acc[e.error_reason!] = (acc[e.error_reason!] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

      const peakHandoverHours = this.calculatePeakHours(events);

      return {
        totalHandovers,
        successRate,
        averageHandoverTime,
        handoversByType,
        handoversByPersona,
        failureReasons,
        peakHandoverHours,
      };
    } catch (error) {
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get conversation handover history
   */
  async getConversationHistory(conversationId: string): Promise<HandoverEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from("handover_analytics")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw error;

      return data?.map(this.mapDatabaseEventToHandoverEvent) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Flush events to database
   */
  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await this.supabase.from("handover_analytics").insert(
        events.map((e: any) => ({
          id: e.id,
          conversation_id: e.conversationId,
          organization_id: e.organizationId,
          from_handler: e.fromHandler,
          to_handler: e.toHandler,
          persona: e.persona,
          success: e.success,
          duration: e.duration,
          error_reason: e.errorReason,
          user_id: e.userId,
          timestamp: e.timestamp,
          metadata: e.metadata,
        }))
      );

      if (error) throw error;
    } catch (error) {
      // Re-add events to queue on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds

    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  /**
   * Calculate peak handover hours
   */
  private calculatePeakHours(events: any[]): number[] {
    const hourCounts = new Array(24).fill(0);

    events.forEach((event: any) => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour]++;
    });

    // Find top 3 peak hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((item: any) => item.hour);
  }

  /**
   * Map database event to HandoverEvent
   */
  private mapDatabaseEventToHandoverEvent(dbEvent: any): HandoverEvent {
    return {
      id: dbEvent.id,
      conversationId: dbEvent.conversation_id,
      organizationId: dbEvent.organization_id,
      fromHandler: dbEvent.from_handler,
      toHandler: dbEvent.to_handler,
      persona: dbEvent.persona,
      success: dbEvent.success,
      duration: dbEvent.duration,
      errorReason: dbEvent.error_reason,
      userId: dbEvent.user_id,
      timestamp: dbEvent.timestamp,
      metadata: dbEvent.metadata,
    };
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): HandoverMetrics {
    return {
      totalHandovers: 0,
      successRate: 0,
      averageHandoverTime: 0,
      handoversByType: {},
      handoversByPersona: {},
      failureReasons: {},
      peakHandoverHours: [],
    };
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}
