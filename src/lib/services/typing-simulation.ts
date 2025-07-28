import { supabase } from "@/lib/supabase";

interface TypingConfig {
  wpm: number;
  variance: number;
  accuracy: number;
}

interface TypingEvent {
  char: string;
  delay: number;
  position: number;
}

export class TypingSimulationService {
  private static instance: TypingSimulationService;
  private activeSimulations = new Map<string, AbortController>();

  static getInstance(): TypingSimulationService {
    if (!this.instance) {
      this.instance = new TypingSimulationService();
    }
    return this.instance;
  }

  /**
   * Calculate natural typing duration for a message
   */
  calculateTypingDuration(message: string, config: Partial<TypingConfig> = {}): number {
    const { wpm = 55, variance = 0.15 } = config;

    // Base calculation
    const charCount = message.length;
    const wordsCount = charCount / 5;
    const baseMinutes = wordsCount / wpm;
    const baseDuration = baseMinutes * 60 * 1000;

    // Add variance
    const varianceFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    let duration = baseDuration * varianceFactor;

    // Add pauses for punctuation
    const sentences = (message.match(/[.!?]/g) || []).length;
    const commas = (message.match(/,/g) || []).length;

    duration += sentences * (400 + Math.random() * 300); // 400-700ms per sentence
    duration += commas * (200 + Math.random() * 100); // 200-300ms per comma

    // Add thinking pauses (every ~50 chars)
    const thinkingPauses = Math.floor(charCount / 50);
    duration += thinkingPauses * (750 + Math.random() * 1250); // 750-2000ms thinking

    // Ensure minimum 1 second
    return Math.max(1000, Math.round(duration));
  }

  /**
   * Start typing simulation for a message
   */
  async startTypingSimulation(
    conversationId: string,
    operatorId: string,
    message: string,
    config: Partial<TypingConfig> = {}
  ): Promise<void> {
    // Cancel any existing simulation for this conversation
    this.stopTypingSimulation(conversationId);

    // Create abort controller for this simulation
    const abortController = new AbortController();
    this.activeSimulations.set(conversationId, abortController);

    try {
      // Initialize typing indicator
      await supabase.from("typing_indicators").upsert({
        conversation_id: conversationId,
        operator_id: operatorId,
        is_typing: true,
        preview_text: "",
        current_position: 0,
        started_typing_at: new Date().toISOString(),
      });

      // Generate typing events
      const events = this.generateTypingEvents(message, config);
      let currentText = "";

      // Simulate typing
      for (const event of events) {
        // Check if simulation was cancelled
        if (abortController.signal.aborted) {
          break;
        }

        // Wait for delay
        await this.delay(event.delay);

        // Update preview text
        if (event.char === "\b") {
          currentText = currentText.slice(0, -1);
        } else {
          currentText += event.char;
        }

        // Update typing indicator
        await supabase
          .from("typing_indicators")
          .update({
            preview_text: currentText,
            current_position: event.position,
            last_character_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .eq("operator_id", operatorId);
      }
    } finally {
      // Clear typing indicator
      await supabase
        .from("typing_indicators")
        .update({
          is_typing: false,
          preview_text: "",
        })
        .eq("conversation_id", conversationId)
        .eq("operator_id", operatorId);

      // Remove from active simulations
      this.activeSimulations.delete(conversationId);
    }
  }

  /**
   * Stop typing simulation for a conversation
   */
  stopTypingSimulation(conversationId: string): void {
    const controller = this.activeSimulations.get(conversationId);
    if (controller) {
      controller.abort();
      this.activeSimulations.delete(conversationId);
    }
  }

  /**
   * Generate typing events for character-by-character simulation
   */
  private generateTypingEvents(message: string, config: Partial<TypingConfig> = {}): TypingEvent[] {
    const { wpm = 55, variance = 0.15, accuracy = 0.97 } = config;
    const events: TypingEvent[] = [];

    // Base delay per character
    const baseDelay = 60000 / (wpm * 5);

    // Time of day adjustment
    const hour = new Date().getHours();
    let speedMultiplier = 1;
    if (hour >= 6 && hour < 10)
      speedMultiplier = 0.85; // Morning: slower
    else if (hour >= 10 && hour < 14)
      speedMultiplier = 1.1; // Mid-day: faster
    else if (hour >= 14 && hour < 18)
      speedMultiplier = 1.0; // Afternoon: normal
    else if (hour >= 18 && hour < 22)
      speedMultiplier = 0.9; // Evening: slower
    else speedMultiplier = 0.8; // Night: slowest

    const adjustedBaseDelay = baseDelay / speedMultiplier;

    let position = 0;
    let lastThinkingPause = 0;

    // Process each character
    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      if (!char) continue; // Skip if undefined
      let delay = adjustedBaseDelay * (1 + (Math.random() - 0.5) * variance);

      // Add pauses for punctuation
      if ([".", "!", "?"].includes(char)) {
        delay += 400 + Math.random() * 300; // Sentence end
      } else if (char === ",") {
        delay += 200 + Math.random() * 100; // Comma
      } else if (char === " ") {
        delay += 50 + Math.random() * 100; // Word break
      }

      // Add thinking pause every ~50 characters
      if (position - lastThinkingPause > 50 && Math.random() > 0.7) {
        events.push({
          char: "",
          delay: 750 + Math.random() * 1250,
          position,
        });
        lastThinkingPause = position;
      }

      // Simulate typos
      if (Math.random() > accuracy && i > 0 && i < message.length - 1) {
        // Add typo
        const typoChar = this.getTypoCharacter(char);
        events.push({
          char: typoChar,
          delay: Math.round(delay),
          position: position++,
        });

        // Pause before correction
        events.push({
          char: "",
          delay: 200 + Math.random() * 300,
          position,
        });

        // Backspace
        events.push({
          char: "\b",
          delay: 50 + Math.random() * 30,
          position: --position,
        });
      }

      // Add the actual character
      events.push({
        char,
        delay: Math.round(delay),
        position: position++,
      });
    }

    return events;
  }

  /**
   * Get a typo character for simulation
   */
  private getTypoCharacter(original: string): string {
    const nearbyKeys: { [key: string]: string[] } = {
      a: ["s", "q"],
      b: ["v", "n"],
      c: ["x", "v"],
      d: ["s", "f"],
      e: ["w", "r"],
      f: ["d", "g"],
      g: ["f", "h"],
      h: ["g", "j"],
      i: ["u", "o"],
      j: ["h", "k"],
      k: ["j", "l"],
      l: ["k", "p"],
      m: ["n", ","],
      n: ["b", "m"],
      o: ["i", "p"],
      p: ["o", "l"],
      q: ["w", "a"],
      r: ["e", "t"],
      s: ["a", "d"],
      t: ["r", "y"],
      u: ["y", "i"],
      v: ["c", "b"],
      w: ["q", "e"],
      x: ["z", "c"],
      y: ["t", "u"],
      z: ["x", "a"],
    };

    const lower = original.toLowerCase();
    const nearby = nearbyKeys[lower];

    if (nearby && nearby.length > 0) {
      const typo = nearby[Math.floor(Math.random() * nearby.length)];
      if (!typo) return original;
      return original === lower ? typo : typo.toUpperCase();
    }

    return original;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const typingSimulation = TypingSimulationService.getInstance();
