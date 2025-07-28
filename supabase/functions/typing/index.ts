import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TypingRequest {
  conversationId: string;
  operatorId: string;
  message: string;
  wpm?: number;
  variance?: number;
  accuracy?: number;
}

interface TypingCharacter {
  char: string;
  delay: number;
  isTypo?: boolean;
  correction?: string;
}

// Natural typing patterns
const PAUSE_PATTERNS = {
  sentence_end: { chars: [".", "!", "?"], min: 300, max: 700 },
  comma: { chars: [","], min: 150, max: 300 },
  word_break: { chars: [" "], min: 50, max: 150 },
  thinking: { interval: 50, min: 500, max: 2000 }, // Every ~50 chars
};

// Common typos and their corrections
const COMMON_TYPOS = {
  the: ["teh", "hte"],
  and: ["adn", "nad"],
  that: ["taht", "htat"],
  with: ["wiht", "wtih"],
  have: ["ahve", "hvae"],
  from: ["form", "fomr"],
  they: ["tehy", "htey"],
  would: ["woudl", "wuold"],
  there: ["theer", "tehre"],
  their: ["thier", "theri"],
};

// Time of day speed adjustments
function getTimeOfDayMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 0.85; // Morning: slower
  if (hour >= 10 && hour < 14) return 1.1; // Mid-day: faster
  if (hour >= 14 && hour < 18) return 1.0; // Afternoon: normal
  if (hour >= 18 && hour < 22) return 0.9; // Evening: slightly slower
  return 0.8; // Night: slowest
}

// Calculate natural typing sequence
function generateTypingSequence(
  text: string,
  wpm: number = 55,
  variance: number = 0.15,
  accuracy: number = 0.97
): TypingCharacter[] {
  const sequence: TypingCharacter[] = [];
  const timeMultiplier = getTimeOfDayMultiplier();
  const effectiveWpm = wpm * timeMultiplier;

  // Base delay per character (ms)
  const baseDelay = 60000 / (effectiveWpm * 5);

  let charCount = 0;
  let lastThinkingPause = 0;

  const words = text.split(" ");

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    if (!word) continue;

    // Check if we should introduce a typo
    const shouldTypo = Math.random() > accuracy && word.length > 3;
    let typoIntroduced = false;

    // Check for common typo patterns
    const typoOptions = COMMON_TYPOS[word.toLowerCase() as keyof typeof COMMON_TYPOS];
    const typoVersion = shouldTypo && typoOptions ? typoOptions[Math.floor(Math.random() * typoOptions.length)] : null;

    // Type the word
    const charsToType = typoVersion || word;

    for (let i = 0; i < charsToType.length; i++) {
      const char = charsToType[i];
      let delay = baseDelay * (1 + (Math.random() - 0.5) * variance);

      // Add character-specific pauses
      for (const [pauseType, pattern] of Object.entries(PAUSE_PATTERNS)) {
        if (pauseType !== "thinking" && pattern.chars.includes(char)) {
          delay += pattern.min + Math.random() * (pattern.max - pattern.min);
          break;
        }
      }

      sequence.push({ char, delay: Math.round(delay) });
      charCount++;

      // Add thinking pause every ~50 characters
      if (charCount - lastThinkingPause > 50 && Math.random() > 0.7) {
        const thinkingDelay =
          PAUSE_PATTERNS.thinking.min + Math.random() * (PAUSE_PATTERNS.thinking.max - PAUSE_PATTERNS.thinking.min);
        sequence.push({
          char: "",
          delay: Math.round(thinkingDelay),
        });
        lastThinkingPause = charCount;
      }
    }

    // If we introduced a typo, add backspace and correction
    if (typoVersion) {
      // Pause before realizing the typo
      sequence.push({ char: "", delay: 200 + Math.random() * 300 });

      // Backspace the typo
      for (let i = 0; i < typoVersion.length; i++) {
        sequence.push({
          char: "\b",
          delay: 50 + Math.random() * 30,
          isTypo: true,
        });
      }

      // Type the correct word
      for (const char of word) {
        const delay = baseDelay * 0.8 * (1 + (Math.random() - 0.5) * variance);
        sequence.push({
          char,
          delay: Math.round(delay),
          correction: word,
        });
      }
    }

    // Add space after word (except last word)
    if (wordIndex < words.length - 1) {
      const spaceDelay =
        PAUSE_PATTERNS.word_break.min + Math.random() * (PAUSE_PATTERNS.word_break.max - PAUSE_PATTERNS.word_break.min);
      sequence.push({
        char: " ",
        delay: Math.round(spaceDelay),
      });
    }
  }

  return sequence;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { conversationId, operatorId, message, wpm, variance, accuracy } = (await req.json()) as TypingRequest;

    // Get operator's typing characteristics
    const { data: operator } = await supabaseClient
      .from("operators")
      .select("typing_speed_wpm, typing_variance, typing_accuracy")
      .eq("id", operatorId)
      .single();

    const typingWpm = wpm || operator?.typing_speed_wpm || 55;
    const typingVariance = variance || operator?.typing_variance || 0.15;
    const typingAccuracy = accuracy || operator?.typing_accuracy || 0.97;

    // Generate typing sequence
    const sequence = generateTypingSequence(message, typingWpm, typingVariance, typingAccuracy);

    // Start typing indicator
    await supabaseClient.from("typing_indicators").upsert({
      conversation_id: conversationId,
      operator_id: operatorId,
      is_typing: true,
      preview_text: "",
      current_position: 0,
      started_typing_at: new Date().toISOString(),
    });

    // Simulate typing character by character
    let currentText = "";
    let currentPosition = 0;

    for (const { char, delay, isTypo } of sequence) {
      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (char === "\b") {
        // Backspace
        currentText = currentText.slice(0, -1);
        currentPosition--;
      } else if (char) {
        // Add character
        currentText += char;
        currentPosition++;
      }

      // Update typing indicator with preview
      await supabaseClient
        .from("typing_indicators")
        .update({
          preview_text: currentText,
          current_position: currentPosition,
          last_character_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .eq("operator_id", operatorId);
    }

    // Calculate total typing duration
    const totalDuration = sequence.reduce((sum, { delay }) => sum + delay, 0);

    // Clear typing indicator
    await supabaseClient
      .from("typing_indicators")
      .update({
        is_typing: false,
        preview_text: "",
      })
      .eq("conversation_id", conversationId)
      .eq("operator_id", operatorId);

    return new Response(
      JSON.stringify({
        success: true,
        duration: totalDuration,
        characterCount: currentText.length,
        wpm: typingWpm,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
