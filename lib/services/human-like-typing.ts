"use client";

import { supabase } from "@/lib/supabase/client";

export interface TypingSimulationOptions {
  conversationId: string;
  organizationId: string;
  agentName: string;
  message: string;
  baseWPM?: number; // Words per minute (default: 45-65 WPM)
  variability?: number; // Typing speed variability (default: 0.3)
  pauseProbability?: number; // Probability of pauses (default: 0.15)
  showPreview?: boolean; // Show typing preview (default: false for privacy)
}

export interface TypingEvent {
  type: "typing_start" | "typing_update" | "typing_pause" | "typing_complete";
  timestamp: number;
  previewText?: string;
  progress?: number; // 0-1
  estimatedCompletion?: number; // milliseconds
}

// Realistic agent names for human-like experience
const AGENT_NAMES = [
  "Sarah",
  "Mike",
  "Emma",
  "David",
  "Lisa",
  "Alex",
  "Rachel",
  "Tom",
  "Jessica",
  "Chris",
  "Amanda",
  "Ryan",
  "Nicole",
  "Kevin",
  "Stephanie",
  "Mark",
  "Jennifer",
  "Daniel",
  "Ashley",
  "Matthew",
  "Samantha",
  "Andrew",
  "Lauren",
  "James",
];

export class HumanLikeTypingSimulator {
  private static instance: HumanLikeTypingSimulator;
  private activeSimulations = new Map<string, NodeJS.Timeout[]>();

  static getInstance(): HumanLikeTypingSimulator {
    if (!HumanLikeTypingSimulator.instance) {
      HumanLikeTypingSimulator.instance = new HumanLikeTypingSimulator();
    }
    return HumanLikeTypingSimulator.instance;
  }

  /**
   * Simulate human-like typing for AI responses
   */
  async simulateTyping(options: TypingSimulationOptions, onEvent?: (event: TypingEvent) => void): Promise<void> {
    const {
      conversationId,
      organizationId,
      agentName,
      message,
      baseWPM = 55, // Average human typing speed
      variability = 0.3,
      pauseProbability = 0.15,
      showPreview = false,
    } = options;

    // Clear any existing simulation for this conversation
    this.stopSimulation(conversationId);

    const words = message.split(" ");
    const totalCharacters = message.length;
    const timeouts: NodeJS.Timeout[] = [];

    // Calculate realistic timing
    const avgCharactersPerMinute = baseWPM * 5; // Assuming 5 chars per word
    const baseCharacterDelay = (60 * 1000) / avgCharactersPerMinute; // ms per character

    let currentPosition = 0;
    let currentTime = 0;

    // Start typing indicator
    await this.broadcastTypingEvent(conversationId, organizationId, {
      user_id: `agent_${agentName.toLowerCase()}`,
      user_name: agentName,
      user_type: "agent",
      is_typing: true,
      conversation_id: conversationId,
      organization_id: organizationId,
    });

    // Emit start event
    onEvent?.({
      type: "typing_start",
      timestamp: Date.now(),
      estimatedCompletion: this.calculateEstimatedTime(message, baseWPM),
    });

    // Simulate typing character by character with realistic delays
    for (let i = 0; i < totalCharacters; i++) {
      const char = message[i];

      // Calculate delay for this character
      let charDelay = baseCharacterDelay;

      // Add variability (humans don't type at constant speed)
      charDelay *= 1 + (Math.random() - 0.5) * variability;

      // Longer delays for certain characters
      if (char === " ") {
        charDelay *= 1.2; // Slight pause between words
      } else if (char === "." || char === "!" || char === "?") {
        charDelay *= 2.5; // Pause after sentences
      } else if (char === "," || char === ";") {
        charDelay *= 1.8; // Pause after clauses
      } else if (char.match(/[A-Z]/)) {
        charDelay *= 1.1; // Slightly slower for capitals
      }

      // Random pauses (thinking time)
      if (Math.random() < pauseProbability && i > 10) {
        charDelay += Math.random() * 1500 + 500; // 0.5-2 second pause
      }

      currentTime += charDelay;
      currentPosition = i + 1;

      const timeout = setTimeout(async () => {
        const progress = currentPosition / totalCharacters;
        const previewText = showPreview ? message.slice(0, currentPosition) : undefined;

        // Update typing indicator with preview
        if (showPreview && currentPosition % 5 === 0) {
          // Update every 5 characters
          await this.broadcastTypingEvent(conversationId, organizationId, {
            user_id: `agent_${agentName.toLowerCase()}`,
            user_name: agentName,
            user_type: "agent",
            is_typing: true,
            preview_text: previewText,
            conversation_id: conversationId,
            organization_id: organizationId,
          });
        }

        // Emit update event
        onEvent?.({
          type: "typing_update",
          timestamp: Date.now(),
          previewText,
          progress,
          estimatedCompletion: Math.max(0, this.calculateEstimatedTime(message.slice(currentPosition), baseWPM)),
        });

        // Complete typing
        if (currentPosition >= totalCharacters) {
          await this.completeTyping(conversationId, organizationId, agentName);
          onEvent?.({
            type: "typing_complete",
            timestamp: Date.now(),
            progress: 1,
          });
        }
      }, currentTime);

      timeouts.push(timeout);
    }

    // Store timeouts for cleanup
    this.activeSimulations.set(conversationId, timeouts);
  }

  /**
   * Stop typing simulation
   */
  stopSimulation(conversationId: string): void {
    const timeouts = this.activeSimulations.get(conversationId);
    if (timeouts) {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      this.activeSimulations.delete(conversationId);
    }
  }

  /**
   * Complete typing and stop indicator
   */
  private async completeTyping(conversationId: string, organizationId: string, agentName: string): Promise<void> {
    await this.broadcastTypingEvent(conversationId, organizationId, {
      user_id: `agent_${agentName.toLowerCase()}`,
      user_name: agentName,
      user_type: "agent",
      is_typing: false,
      conversation_id: conversationId,
      organization_id: organizationId,
    });

    // Clean up
    this.stopSimulation(conversationId);

  }

  /**
   * Broadcast typing event via Supabase Realtime
   */
  private async broadcastTypingEvent(conversationId: string, organizationId: string, eventData: any): Promise<void> {
    const channel = supabase.channel(`org:${organizationId}:conv:${conversationId}`);

    await channel.send({
      type: "broadcast",
      event: "typing_indicator",
      payload: {
        ...eventData,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Calculate estimated typing time
   */
  private calculateEstimatedTime(text: string, wpm: number): number {
    const words = text.split(" ").length;
    const minutes = words / wpm;
    return Math.round(minutes * 60 * 1000); // Convert to milliseconds
  }

  /**
   * Get random agent name
   */
  static getRandomAgentName(): string {
    return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  }

  /**
   * Simulate AI response with human-like typing
   */
  async simulateAIResponse(
    conversationId: string,
    organizationId: string,
    aiResponse: string,
    onComplete?: (agentName: string) => void
  ): Promise<string> {
    const agentName = HumanLikeTypingSimulator.getRandomAgentName();

    // Add human-like delays before starting to type (1-3 seconds)
    const initialDelay = Math.random() * 2000 + 1000;

    return new Promise((resolve) => {
      setTimeout(async () => {
        await this.simulateTyping(
          {
            conversationId,
            organizationId,
            agentName,
            message: aiResponse,
            baseWPM: 45 + Math.random() * 20, // 45-65 WPM variation
            showPreview: false, // Don't show preview for privacy
          },
          (event) => {
            if (event.type === "typing_complete") {
              onComplete?.(agentName);
              resolve(agentName);
            }
          }
        );
      }, initialDelay);
    });
  }

  /**
   * Create typing delay that matches human patterns
   */
  static createHumanDelay(text: string, baseWPM: number = 55): number {
    const words = text.split(" ").length;
    const baseTime = (words / baseWPM) * 60 * 1000; // Base typing time

    // Add thinking time (10-30% of typing time)
    const thinkingTime = baseTime * (0.1 + Math.random() * 0.2);

    // Add initial delay (1-3 seconds)
    const initialDelay = 1000 + Math.random() * 2000;

    return Math.round(baseTime + thinkingTime + initialDelay);
  }
}

// Export singleton instance
export const typingSimulator = HumanLikeTypingSimulator.getInstance();
