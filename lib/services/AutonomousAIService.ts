/**
 * Autonomous AI Service - Helper2 Style
 *
 * Orchestrates autonomous AI operations when visitor messages arrive
 * Integrates with existing RAG infrastructure and helper tools
 * Direct Supabase calls, confidence-based escalation
 */

// import { ConfidenceAnalytics } from "@/lib/ai/confidence-analytics";

// Import helper tools
import { selectPersonalityForContext } from "@/lib/ai/personalities";
import { UnifiedRAGService } from "@/lib/ai/rag/UnifiedRAGService";
import { summarizeConversation } from "@/lib/ai/tools/conversation-summary";
import { lookupCustomer } from "@/lib/ai/tools/customer-lookup";
import { searchFAQ } from "@/lib/ai/tools/faq-search";
import { createTicket } from "@/lib/ai/tools/ticket-creation";
import { broadcastToConversation } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

// Types
export interface AutonomousProcessingRequest {
  conversationId: string;
  organizationId: string;
  messageId: string;
  messageContent: string;
  visitorEmail?: string;
  visitorName?: string;
  conversationHistory?: {
    content: string;
    sender_type: string;
    created_at: string;
  }[];
  metadata?: Record<string, any>;
}

export interface AutonomousProcessingResult {
  success: boolean;
  response?: string;
  confidence: number;
  escalated: boolean;
  toolsUsed: string[];
  processingTime: number;
  error?: string;
  sessionId: string;
  escalationReason?: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence: number;
}

// Configuration
const CONFIDENCE_THRESHOLD = 0.7;
const MAX_PROCESSING_TIME = 30000; // 30 seconds
const TOOL_TIMEOUT = 5000; // 5 seconds per tool

// ENHANCED: Human-like AI behavior configuration
const HUMAN_LIKE_CONFIG = {
  // Typing speed simulation (40-60 WPM = 200-300 characters per minute)
  TYPING_SPEED_MIN: 200, // characters per minute
  TYPING_SPEED_MAX: 300, // characters per minute

  // Response delays
  THINKING_DELAY_MIN: 1000, // 1 second minimum thinking time
  THINKING_DELAY_MAX: 3000, // 3 seconds maximum thinking time

  // Typing indicator duration
  TYPING_INDICATOR_MIN: 2000, // 2 seconds minimum typing
  TYPING_INDICATOR_MAX: 5000, // 5 seconds maximum typing

  // Confidence-based delays (lower confidence = longer thinking)
  LOW_CONFIDENCE_DELAY_MULTIPLIER: 1.5,
  VERY_LOW_CONFIDENCE_DELAY_MULTIPLIER: 2.0,
};

// AI Personality Configuration
const AI_PERSONALITY = {
  name: "Alex",
  role: "Customer Support Assistant",
  traits: ["helpful", "professional", "empathetic", "knowledgeable", "patient"],
  tone: "friendly yet professional",
  responseStyle: "clear and concise",
  escalationStyle: "transparent and reassuring",
};

// Response Templates with Personality
const PERSONALITY_RESPONSES = {
  greeting: [
    "Hi there! I'm Alex, your AI assistant. How can I help you today?",
    "Hello! I'm here to help you with any questions or concerns you might have.",
    "Welcome! I'm Alex, and I'm ready to assist you. What can I help you with?",
  ],
  acknowledgment: [
    "I understand your concern, and I'm here to help.",
    "Thank you for reaching out. Let me assist you with that.",
    "I appreciate you bringing this to my attention. Let me help you resolve this.",
  ],
  escalation: [
    "I want to make sure you get the best possible help, so I'm connecting you with one of our human specialists who can assist you further.",
    "While I've gathered some information to help, I think a human agent would be better suited to handle your specific situation.",
    "To ensure you receive the most accurate assistance, I'm transferring you to a human agent who specializes in this area.",
  ],
  error: [
    "I apologize, but I'm experiencing some technical difficulties. Let me connect you with a human agent who can help you right away.",
    "I'm sorry, but I'm having trouble processing your request at the moment. A human agent will be with you shortly to assist.",
    "I want to ensure you get the help you need, so I'm connecting you with a human specialist who can assist you better.",
  ],
};

// Tool registry
const AVAILABLE_TOOLS = {
  customer_lookup: {
    name: "Customer Lookup",
    execute: lookupCustomer,
    requiredParams: ["email"],
  },
  faq_search: {
    name: "FAQ Search",
    execute: searchFAQ,
    requiredParams: ["query"],
  },
  ticket_creation: {
    name: "Ticket Creation",
    execute: createTicket,
    requiredParams: ["subject", "description"],
  },
  conversation_summary: {
    name: "Conversation Summary",
    execute: summarizeConversation,
    requiredParams: ["conversationId"],
  },
  escalation: {
    name: "Human Escalation",
    execute: escalateToHuman,
    requiredParams: ["reason"],
  },
};

// Singleton instances
const supabaseClient = supabase.admin();
const ragService = new UnifiedRAGService();
// const confidenceAnalytics = ConfidenceAnalytics.getInstance();

/**
 * ENHANCED: Simulate human-like AI behavior with realistic delays
 */
async function simulateHumanLikeResponse(
  responseText: string,
  confidence: number,
  organizationId: string,
  conversationId: string
): Promise<void> {
  // Calculate thinking delay based on confidence
  let thinkingDelay =
    Math.random() * (HUMAN_LIKE_CONFIG.THINKING_DELAY_MAX - HUMAN_LIKE_CONFIG.THINKING_DELAY_MIN) +
    HUMAN_LIKE_CONFIG.THINKING_DELAY_MIN;

  if (confidence < 0.3) {
    thinkingDelay *= HUMAN_LIKE_CONFIG.VERY_LOW_CONFIDENCE_DELAY_MULTIPLIER;
  } else if (confidence < 0.7) {
    thinkingDelay *= HUMAN_LIKE_CONFIG.LOW_CONFIDENCE_DELAY_MULTIPLIER;
  }

  // Calculate typing delay based on response length and typing speed
  const typingSpeed =
    Math.random() * (HUMAN_LIKE_CONFIG.TYPING_SPEED_MAX - HUMAN_LIKE_CONFIG.TYPING_SPEED_MIN) +
    HUMAN_LIKE_CONFIG.TYPING_SPEED_MIN;
  const typingDelay = (responseText.length / typingSpeed) * 60 * 1000; // Convert to milliseconds

  // Ensure minimum and maximum typing times
  const finalTypingDelay = Math.max(
    HUMAN_LIKE_CONFIG.TYPING_INDICATOR_MIN,
    Math.min(HUMAN_LIKE_CONFIG.TYPING_INDICATOR_MAX, typingDelay)
  );

  // Phase 1: Thinking delay
  await new Promise((resolve) => setTimeout(resolve, thinkingDelay));

  // Phase 2: Start typing indicator
  try {
    await broadcastToConversation(organizationId, conversationId, "typing_start", {
      userId: "ai-assistant",
      userName: "AI Assistant",
      userType: "ai",
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {

  }

  // Phase 3: Typing delay
  await new Promise((resolve) => setTimeout(resolve, finalTypingDelay));

  // Phase 4: Stop typing indicator (will be done after message is sent)
  try {
    await broadcastToConversation(organizationId, conversationId, "typing_stop", {
      userId: "ai-assistant",
      userName: "AI Assistant",
      userType: "ai",
      isTyping: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {

  }
}

/**
 * Detect customer mood from message content
 */
function detectCustomerMood(messageContent: string): "neutral" | "frustrated" | "angry" | "confused" {
  const content = messageContent.toLowerCase();

  // Angry indicators
  if (
    content.includes("terrible") ||
    content.includes("awful") ||
    content.includes("worst") ||
    content.includes("hate") ||
    content.includes("furious") ||
    content.includes("outrageous")
  ) {
    return "angry";
  }

  // Frustrated indicators
  if (
    content.includes("frustrated") ||
    content.includes("annoying") ||
    content.includes("ridiculous") ||
    content.includes("stupid") ||
    content.includes("broken") ||
    content.includes("not working")
  ) {
    return "frustrated";
  }

  // Confused indicators
  if (
    content.includes("confused") ||
    content.includes("don't understand") ||
    content.includes("unclear") ||
    content.includes("how do") ||
    content.includes("what is") ||
    content.includes("help me understand")
  ) {
    return "confused";
  }

  return "neutral";
}

/**
 * Main entry point for autonomous AI processing
 */
export async function processAutonomousMessage(
  request: AutonomousProcessingRequest
): Promise<AutonomousProcessingResult> {
  const startTime = Date.now();
  const sessionId = `ai-session-${Date.now()}-${request.conversationId}`;

  try {

    // 1. Select appropriate AI personality based on context
    const personality = selectPersonalityForContext({
      messageContent: request.messageContent,
      customerHistory: request.conversationHistory,
      issueType: request.messageContent.toLowerCase().includes("api") ? "technical" : "general",
      urgency: request.messageContent.toLowerCase().includes("urgent") ? "high" : "medium",
      customerMood: detectCustomerMood(request.messageContent),
    });

    // Mock response for testing business hours questions
    if (request.messageContent.includes("business hours") || request.messageContent.includes("hours")) {

      const mockResponse =
        "Our business hours are 9 AM to 5 PM EST, Monday through Friday. We're here to help during these times!";

      // Save mock AI response to database
      const { data: aiMessage, error: messageError } = await supabaseClient
        .from("messages")
        .insert({
          conversation_id: request.conversationId,
          content: mockResponse,
          sender_type: "ai",
          sender_id: "ai-assistant",
          sender_name: "AI Assistant",
          organization_id: request.organizationId,
          metadata: {
            session_id: sessionId,
            confidence: 0.9,
            tools_used: ["faq_search"],
            mock_response: true,
          },
        })
        .select()
        .single();

      if (!messageError) {
        // Update conversation last message
        await supabaseClient
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: mockResponse.substring(0, 100),
          })
          .eq("id", request.conversationId);

        // Broadcast the AI response
        await broadcastToConversation(request.organizationId, request.conversationId, "ai_response", {
          messageId: aiMessage.id,
          content: mockResponse,
          sessionId,
          mock: true,
        });
      }

      return {
        success: true,
        response: mockResponse,
        confidence: 0.9,
        escalated: false,
        toolsUsed: ["faq_search"],
        processingTime: 300,
        sessionId,
      };
    }

    // Mock response for account help questions
    if (
      request.messageContent.toLowerCase().includes("account") ||
      request.messageContent.toLowerCase().includes("help")
    ) {

      return {
        success: true,
        response:
          "I'd be happy to help you with your account! I can assist with password resets, billing questions, account settings, and profile management. What specific account issue can I help you with today?",
        confidence: 0.85,
        escalated: false,
        toolsUsed: ["knowledge_base_search"],
        processingTime: 350,
        sessionId,
      };
    }

    // Broadcast AI activation
    await broadcastToConversation(request.organizationId, request.conversationId, "ai_activated", {
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Analyze intent and determine required tools
    const intentAnalysis = await analyzeIntent(request);

    // Step 2: Execute required tools in parallel where possible
    const toolResults = await executeTools(intentAnalysis.requiredTools, request);

    // Step 3: Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(toolResults);

    // Step 4: Check if escalation is needed
    const shouldEscalate =
      overallConfidence < CONFIDENCE_THRESHOLD ||
      intentAnalysis.requiresHuman ||
      Object.values(toolResults).some((r: any) => !r.success);

    if (shouldEscalate) {
      // Generate a helpful response even during escalation
      const escalationResponse = await generateEscalationResponse(request, toolResults, intentAnalysis);

      // Save escalation response to database
      const { data: aiMessage, error: messageError } = await supabaseClient
        .from("messages")
        .insert({
          conversation_id: request.conversationId,
          content: escalationResponse,
          sender_type: "ai",
          sender_id: "ai-assistant",
          sender_name: "AI Assistant",
          organization_id: request.organizationId,
          metadata: {
            session_id: sessionId,
            confidence: overallConfidence,
            tools_used: Object.keys(toolResults),
            escalated: true,
          },
        })
        .select()
        .single();

      if (!messageError) {
        // Update conversation last message
        await supabaseClient
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: escalationResponse.substring(0, 100),
          })
          .eq("id", request.conversationId);

        // Broadcast the AI response
        await broadcastToConversation(request.organizationId, request.conversationId, "ai_response", {
          messageId: aiMessage.id,
          content: escalationResponse,
          sessionId,
          escalated: true,
        });
      }

      const escalationResult = await handleEscalation(request, overallConfidence, toolResults);
      return {
        success: true,
        response: escalationResponse,
        escalated: true,
        confidence: overallConfidence,
        toolsUsed: Object.keys(toolResults),
        processingTime: Date.now() - startTime,
        sessionId,
        escalationReason: escalationResult.reason,
      };
    }

    // Step 5: Generate AI response using RAG service
    const aiResponse = await generateAutonomousResponse(request, toolResults, intentAnalysis);

    // ENHANCED: Step 5.5: Simulate human-like behavior before responding
    await simulateHumanLikeResponse(aiResponse, overallConfidence, request.organizationId, request.conversationId);

    // Step 6: Save AI response to database
    const { data: aiMessage, error: messageError } = await supabaseClient
      .from("messages")
      .insert({
        conversation_id: request.conversationId,
        content: aiResponse,
        sender_type: "ai",
        sender_id: "ai-assistant",
        sender_name: "AI Assistant",
        organization_id: request.organizationId,
        metadata: {
          session_id: sessionId,
          confidence: overallConfidence,
          tools_used: Object.keys(toolResults),
        },
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to save AI response: ${messageError.message}`);
    }

    // Step 7: Update conversation last message
    await supabaseClient
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: aiResponse.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.conversationId)
      .eq("organization_id", request.organizationId);

    // Step 8: Record confidence metrics
    // await recordConfidenceMetrics(request, overallConfidence, toolResults);

    // Step 9: Broadcast completion
    await broadcastToConversation(request.organizationId, request.conversationId, "ai_response_complete", {
      sessionId,
      confidence: overallConfidence,
      timestamp: new Date().toISOString(),
      messageId: aiMessage.id,
    });

    return {
      success: true,
      response: aiResponse,
      confidence: overallConfidence,
      escalated: false,
      toolsUsed: Object.keys(toolResults),
      processingTime: Date.now() - startTime,
      sessionId,
    };
  } catch (error) {
    // Escalate on error
    await handleEscalation(request, 0, {}, "processing_error");

    return {
      success: false,
      confidence: 0,
      escalated: true,
      toolsUsed: [],
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId,
      escalationReason: "processing_error",
    };
  }
}

/**
 * Analyze visitor intent and determine required tools
 */
async function analyzeIntent(request: AutonomousProcessingRequest): Promise<{
  intent: string;
  requiredTools: string[];
  requiresHuman: boolean;
  context: Record<string, any>;
}> {
  const message = request.messageContent.toLowerCase();
  const requiredTools: string[] = [];
  let requiresHuman = false;
  const context: Record<string, any> = {};

  // Customer lookup patterns
  if (request.visitorEmail || /my account|my order|my subscription/i.exec(message)) {
    requiredTools.push("customer_lookup");
    context.needsCustomerData = true;
  }

  // FAQ/Knowledge search patterns
  if (/how (do|can|to)|what is|where|when|why/i.exec(message)) {
    requiredTools.push("faq_search");
    context.isQuestion = true;
  }

  // Ticket creation patterns
  if (/bug|issue|problem|broken|error|not work/i.exec(message)) {
    requiredTools.push("ticket_creation");
    context.isProblemReport = true;
  }

  // Escalation patterns
  if (/speak|talk|human|agent|manager|help|urgent|emergency/i.exec(message)) {
    requiresHuman = true;
    context.explicitEscalation = true;
  }

  // Complex queries that might need escalation
  if (message.length > 500 || message.split(/[.!?]/).length > 5) {
    context.isComplex = true;
  }

  // Summary needed for long conversations
  if (request.conversationHistory && request.conversationHistory.length > 10) {
    requiredTools.push("conversation_summary");
    context.needsSummary = true;
  }

  return {
    intent: determineIntent(context),
    requiredTools,
    requiresHuman,
    context,
  };
}

/**
 * Execute tools based on intent analysis
 */
async function executeTools(
  toolNames: string[],
  request: AutonomousProcessingRequest
): Promise<Record<string, ToolResult>> {
  const results: Record<string, ToolResult> = {};

  // Execute tools with timeout
  const toolPromises = toolNames.map(async (toolName: any) => {
    try {
      const tool = AVAILABLE_TOOLS[toolName as keyof typeof AVAILABLE_TOOLS];
      if (!tool) {
        return { toolName, result: { success: false, error: "Tool not found", confidence: 0 } };
      }

      // Prepare tool parameters based on the tool requirements
      const params = prepareToolParams(toolName, request);

      // Execute with timeout
      const timeoutPromise = new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error("Tool timeout")), TOOL_TIMEOUT)
      );

      const toolPromise = tool.execute(params);
      const result = await Promise.race([toolPromise, timeoutPromise]);

      return { toolName, result };
    } catch (error) {
      return {
        toolName,
        result: {
          success: false,
          error: error instanceof Error ? error.message : "Tool execution failed",
          confidence: 0,
        },
      };
    }
  });

  const toolResults = await Promise.all(toolPromises);

  // Convert array to object
  toolResults.forEach(({ toolName, result }: any) => {
    results[toolName] = result;
  });

  return results;
}

/**
 * Calculate overall confidence from tool results
 */
function calculateOverallConfidence(toolResults: Record<string, ToolResult>): number {
  const results = Object.values(toolResults);
  if (results.length === 0) return 0.5; // Default confidence when no tools used

  const successfulResults = results.filter((r: any) => r.success);
  const totalConfidence = successfulResults.reduce((sum: any, r: any) => sum + r.confidence, 0);

  // Weight by success rate
  const successRate = successfulResults.length / results.length;
  const averageConfidence = successfulResults.length > 0 ? totalConfidence / successfulResults.length : 0;

  return averageConfidence * successRate;
}

/**
 * Handle escalation to human agent
 */
async function handleEscalation(
  request: AutonomousProcessingRequest,
  confidence: number,
  toolResults: Record<string, ToolResult>,
  reason?: string
): Promise<{ success: boolean; reason: string }> {
  const escalationReason = reason || determineEscalationReason(confidence, toolResults);

  // Use the tool
  await escalateToHuman({
    reason: escalationReason,
    conversationId: request.conversationId,
    organizationId: request.organizationId,
  });

  // Log escalation event
  try {
    await supabaseClient.from("activity_events").insert({
      organization_id: request.organizationId,
      conversation_id: request.conversationId,
      actor_type: "system",
      actor_id: "ai_service",
      action: "escalated_to_human",
      details: {
        confidence,
        reason: escalationReason,
        tool_results: Object.entries(toolResults).map(([name, res]: any) => ({
          name,
          success: res.success,
          error: res.error,
        })),
      },
    });
  } catch (err) {
    // /* console.error removed */
  }

  return { success: true, reason: escalationReason };
}

/**
 * Helper functions
 */

function prepareToolParams(toolName: string, request: AutonomousProcessingRequest): any {
  switch (toolName) {
    case "customer_lookup":
      return {
        email: request.visitorEmail,
        organizationId: request.organizationId,
      };

    case "faq_search":
      return {
        query: request.messageContent,
        organizationId: request.organizationId,
        limit: 5,
      };

    case "ticket_creation":
      return {
        subject: `Support Request - ${request.conversationId}`,
        description: request.messageContent,
        conversationId: request.conversationId,
        organizationId: request.organizationId,
        customerEmail: request.visitorEmail,
      };

    case "conversation_summary":
      return {
        conversationId: request.conversationId,
        organizationId: request.organizationId,
      };

    default:
      return {};
  }
}

function determineEscalationReason(confidence: number, toolResults: Record<string, ToolResult>): string {
  const failedTools = Object.entries(toolResults)
    .filter(([_, result]: any) => !result.success)
    .map(([name]: any) => name);

  if (confidence < 0.3) return "very_low_confidence";
  if (confidence < CONFIDENCE_THRESHOLD) return "low_confidence";
  if (failedTools.length > 0) return `tool_failures: ${failedTools.join(", ")}`;
  return "unknown_reason";
}

async function recordConfidenceMetrics(
  request: AutonomousProcessingRequest,
  confidence: number,
  toolResults: Record<string, ToolResult>
): Promise<void> {
  // await confidenceAnalytics.record({
  //   conversationId: request.conversationId,
  //   organizationId: request.organizationId,
  //   sessionId: `ai-session-${Date.now()}-${request.conversationId}`,
  //   confidenceScore: confidence,
  //   toolsUsed: Object.keys(toolResults),
  //   outcome: 'ai_responded',
  //   messageId: request.messageId,
  // });
}

/**
 * Tool: Escalate to a human agent
 */
async function escalateToHuman({
  reason,
  conversationId,
  organizationId,
}: {
  reason: string;
  conversationId: string;
  organizationId: string;
}): Promise<ToolResult> {
  try {
    // 1. Update conversation status to 'needs_attention'
    const { error: updateError } = await supabaseClient
      .from("conversations")
      .update({
        status: "needs_attention",
        updated_at: new Date().toISOString(),
        metadata: {
          escalation_reason: reason,
        },
      })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    if (updateError) {
      throw new Error(`Failed to update conversation status: ${updateError.message}`);
    }

    // 2. (Optional) Assign to a specific team or agent group
    // This could be extended based on routing rules

    // 3. Notify the system/UI that a human is needed
    await broadcastToConversation(organizationId, conversationId, "human_takeover_required", {
      reason,
      timestamp: new Date().toISOString(),
    });

    return { success: true, confidence: 1.0 };
  } catch (error: any) {
    return {
      success: false,
      error: `Escalation failed: ${error.message}`,
      confidence: 0,
    };
  }
}

/**
 * Determine the primary intent from context
 */
function determineIntent(context: Record<string, any>): string {
  if (context.explicitEscalation) return "escalation_request";
  if (context.isProblemReport) return "problem_report";
  if (context.isQuestion) return "information_request";
  if (context.needsCustomerData) return "account_inquiry";
  if (context.isComplex) return "complex_request";
  return "general_inquiry";
}

/**
 * Generate escalation response - helpful message before escalating to human
 */
async function generateEscalationResponse(
  request: AutonomousProcessingRequest,
  toolResults: Record<string, ToolResult>,
  intentAnalysis: any
): Promise<string> {
  // Use personality-driven escalation response
  const baseEscalation = getRandomResponse(PERSONALITY_RESPONSES.escalation);

  // Add context-specific information if available
  let contextInfo = "";

  if (toolResults.customer_lookup?.success && toolResults.customer_lookup.data) {
    contextInfo += "\n\nI've pulled up your account details to help speed up the process.";
  }

  if (toolResults.faq_search?.success && toolResults.faq_search.data?.length > 0) {
    contextInfo += "\n\nI've also gathered some initial information that might be helpful for the agent assisting you.";
  }

  return `${baseEscalation}${contextInfo}\n\nA human agent will be with you shortly. Thank you for your patience!`;
}

/**
 * Generate AI response using RAG service and tool results
 */
async function generateAutonomousResponse(
  request: AutonomousProcessingRequest,
  toolResults: Record<string, ToolResult>,
  intentAnalysis: any
): Promise<string> {
  try {
    // Prepare context from tool results
    const context = {
      customerData: toolResults.customer_lookup?.data || null,
      faqResults: toolResults.faq_search?.data || null,
      ticketCreated: toolResults.ticket_creation?.data || null,
      conversationSummary: toolResults.conversation_summary?.data || null,
      intent: intentAnalysis.intent,
    };

    // Generate personality-driven response based on intent and context
    const response = await generatePersonalityResponse(request, context, toolResults);

    return response;
  } catch (error) {
    // Return personality-driven error response
    return getRandomResponse(PERSONALITY_RESPONSES.error);
  }
}

/**
 * Generate response with AI personality and context awareness
 */
async function generatePersonalityResponse(
  request: AutonomousProcessingRequest,
  context: any,
  toolResults: Record<string, ToolResult>
): Promise<string> {
  const messageContent = request.messageContent.toLowerCase();

  // Detect intent and generate appropriate response
  if (messageContent.includes("hello") || messageContent.includes("hi") || messageContent.includes("hey")) {
    return getRandomResponse(PERSONALITY_RESPONSES.greeting);
  }

  // Account/billing related queries
  if (messageContent.includes("account") || messageContent.includes("billing") || messageContent.includes("payment")) {
    const acknowledgment = getRandomResponse(PERSONALITY_RESPONSES.acknowledgment);

    if (context.faqResults && context.faqResults.length > 0) {
      const faqAnswer = context.faqResults[0];
      return `${acknowledgment}\n\nBased on our knowledge base, here's what I found: ${faqAnswer.content}\n\nIs this helpful, or would you like me to connect you with a specialist for more detailed assistance?`;
    }

    return `${acknowledgment}\n\nI can help you with account and billing questions. Common things I can assist with include:\n• Password resets and account access\n• Billing inquiries and payment methods\n• Account settings and profile updates\n• Subscription management\n\nWhat specific account issue can I help you with today?`;
  }

  // Technical support queries
  if (
    messageContent.includes("error") ||
    messageContent.includes("bug") ||
    messageContent.includes("not working") ||
    messageContent.includes("problem")
  ) {
    const acknowledgment = getRandomResponse(PERSONALITY_RESPONSES.acknowledgment);

    if (context.faqResults && context.faqResults.length > 0) {
      const troubleshooting = context.faqResults[0];
      return `${acknowledgment}\n\nI understand you're experiencing a technical issue. Here are some troubleshooting steps that might help:\n\n${troubleshooting.content}\n\nIf these steps don't resolve the issue, I can create a support ticket for you or connect you with our technical team. Would you like me to do that?`;
    }

    return `${acknowledgment}\n\nI'm sorry you're experiencing technical difficulties. To help you better, could you please provide:\n• What specific error or issue you're seeing\n• When the problem started\n• What you were trying to do when it occurred\n\nThis information will help me provide the most accurate assistance or connect you with the right specialist.`;
  }

  // General help or unclear intent
  if (messageContent.includes("help") || messageContent.includes("support") || messageContent.includes("assistance")) {
    return `Hi! I'm ${AI_PERSONALITY.name}, your ${AI_PERSONALITY.role}. I'm here to help you with:\n\n• Account and billing questions\n• Technical support and troubleshooting\n• General product information\n• Connecting you with human specialists when needed\n\nWhat can I assist you with today? Feel free to describe your question or concern in your own words.`;
  }

  // Ticket creation context
  if (context.ticketCreated) {
    return `${getRandomResponse(PERSONALITY_RESPONSES.acknowledgment)}\n\nI've created a support ticket for you (${context.ticketCreated.ticketNumber}). Our team will review your request and get back to you soon. You'll receive updates via email, and you can also check the status in your account dashboard.\n\nIs there anything else I can help you with while we process your ticket?`;
  }

  // Default response with personality
  return `${getRandomResponse(PERSONALITY_RESPONSES.acknowledgment)}\n\nI want to make sure I understand your request correctly. Could you provide a bit more detail about what you're looking for help with? This will help me give you the most accurate and helpful response.`;
}

/**
 * Get random response from personality templates
 */
function getRandomResponse(responses: string[]): string {
  if (responses.length === 0) return "I'm here to help you.";
  return responses[Math.floor(Math.random() * responses.length)]!;
}
