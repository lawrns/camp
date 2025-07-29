import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/ai/openai';
import { analyseSentiment } from '@/lib/ai/sentiment';

interface SuggestionRequest {
  conversationId: string;
  organizationId: string; // Using existing organizations table
  messageContent: string;
  conversationHistory: Array<{
    id: string;
    content: string;
    senderType: string;
    timestamp: string;
  }>;
}

interface AISuggestion {
  id: string;
  content: string;
  confidence: number;
  tone: 'professional' | 'friendly' | 'empathetic' | 'technical';
  category: 'quick_reply' | 'detailed_response' | 'escalation';
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    
    const {
      conversationId,
      organizationId,
      messageContent,
      conversationHistory
    } = body;

    // Validate required fields
    if (!conversationId || !organizationId || !messageContent) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, organizationId, messageContent' },
        { status: 400 }
      );
    }

    // Analyze the customer message
    const sentiment = await analyseSentiment(messageContent);
    const urgency = determineUrgency(messageContent);
    const category = categorizeMessage(messageContent);

    // Generate suggestions based on context
    const suggestions = await generateSuggestions({
      messageContent,
      sentiment,
      urgency,
      category,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        sentiment,
        urgency,
        category,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Reply suggestions API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function generateSuggestions({
  messageContent,
  sentiment,
  urgency,
  category,
  conversationHistory,
}: {
  messageContent: string;
  sentiment: string;
  urgency: string;
  category: string;
  conversationHistory: any[];
}): Promise<AISuggestion[]> {
  const suggestions: AISuggestion[] = [];

  try {
    // Generate context-aware suggestions using OpenAI
    const contextPrompt = buildContextPrompt(messageContent, sentiment, urgency, category, conversationHistory);
    
    const aiResponse = await openaiService.generateCompletion({
      system: "You are an expert customer service assistant. Generate 3 different reply suggestions for the agent to choose from. Each should have a different tone and approach. Return as JSON array with fields: content, tone, category, reasoning.",
      prompt: contextPrompt,
      temperature: 0.7,
      maxTokens: 800,
      functionId: "reply-suggestions",
    });

    // Parse AI response
    try {
      const aiSuggestions = JSON.parse(aiResponse.text);
      
      if (Array.isArray(aiSuggestions)) {
        aiSuggestions.forEach((suggestion, index) => {
          suggestions.push({
            id: `ai-${Date.now()}-${index}`,
            content: suggestion.content || '',
            confidence: calculateConfidence(suggestion, sentiment, urgency),
            tone: suggestion.tone || 'professional',
            category: suggestion.category || 'detailed_response',
            reasoning: suggestion.reasoning || 'AI-generated response',
          });
        });
      }
    } catch (parseError) {
      console.error('Error parsing AI suggestions:', parseError);
    }
  } catch (aiError) {
    console.error('Error generating AI suggestions:', aiError);
  }

  // Add fallback rule-based suggestions if AI fails or returns insufficient results
  if (suggestions.length < 2) {
    suggestions.push(...generateRuleBasedSuggestions(messageContent, sentiment, urgency, category));
  }

  // Ensure we have at least 2-3 suggestions
  return suggestions.slice(0, 3);
}

function buildContextPrompt(
  messageContent: string,
  sentiment: string,
  urgency: string,
  category: string,
  conversationHistory: any[]
): string {
  const historyContext = conversationHistory.length > 0 
    ? `Previous conversation context: ${conversationHistory.slice(-3).map(msg => `${msg.senderType}: ${msg.content}`).join('\n')}`
    : 'This is the start of the conversation.';

  return `
Customer message: "${messageContent}"
Sentiment: ${sentiment}
Urgency: ${urgency}
Category: ${category}

${historyContext}

Generate 3 different reply suggestions that an agent could use to respond to this customer message. Each suggestion should:
1. Be appropriate for the sentiment and urgency
2. Have a different tone (professional, friendly, empathetic, or technical)
3. Be categorized as quick_reply, detailed_response, or escalation
4. Include reasoning for why this response would be effective

Format as JSON array with objects containing: content, tone, category, reasoning
`;
}

function generateRuleBasedSuggestions(
  messageContent: string,
  sentiment: string,
  urgency: string,
  category: string
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const lowerMessage = messageContent.toLowerCase();

  // Quick acknowledgment
  suggestions.push({
    id: `rule-quick-${Date.now()}`,
    content: getQuickReply(sentiment, category),
    confidence: 0.8,
    tone: sentiment === 'negative' ? 'empathetic' : 'professional',
    category: 'quick_reply',
    reasoning: 'Quick acknowledgment to show responsiveness',
  });

  // Detailed response
  suggestions.push({
    id: `rule-detailed-${Date.now()}`,
    content: getDetailedResponse(messageContent, sentiment, category),
    confidence: 0.7,
    tone: 'professional',
    category: 'detailed_response',
    reasoning: 'Comprehensive response addressing the customer\'s needs',
  });

  // Escalation if needed
  if (urgency === 'high' || sentiment === 'angry' || lowerMessage.includes('manager')) {
    suggestions.push({
      id: `rule-escalation-${Date.now()}`,
      content: getEscalationResponse(sentiment),
      confidence: 0.9,
      tone: 'empathetic',
      category: 'escalation',
      reasoning: 'Escalation recommended due to urgency or negative sentiment',
    });
  }

  return suggestions;
}

function getQuickReply(sentiment: string, category: string): string {
  if (sentiment === 'negative' || sentiment === 'frustrated') {
    return "I understand your frustration, and I'm here to help resolve this for you right away.";
  }
  
  if (category === 'technical') {
    return "Thank you for reaching out. I'll help you troubleshoot this technical issue.";
  }
  
  return "Thank you for contacting us. I'll be happy to assist you with this.";
}

function getDetailedResponse(messageContent: string, sentiment: string, category: string): string {
  const lowerMessage = messageContent.toLowerCase();
  
  if (lowerMessage.includes('refund') || lowerMessage.includes('cancel')) {
    return "I understand you're looking for information about refunds/cancellations. Let me review your account and provide you with the available options and next steps.";
  }
  
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('not working')) {
    return "I see you're experiencing a technical issue. To help resolve this quickly, could you please provide more details about when this started and any error messages you're seeing?";
  }
  
  if (category === 'billing') {
    return "I'll be happy to help you with your billing inquiry. Let me review your account details and provide you with accurate information about your charges.";
  }
  
  return "I've reviewed your message and I'm here to help. Let me gather some additional information to provide you with the best possible solution.";
}

function getEscalationResponse(sentiment: string): string {
  if (sentiment === 'angry') {
    return "I sincerely apologize for the inconvenience you've experienced. I'm escalating this to my supervisor who will personally ensure this is resolved to your satisfaction.";
  }
  
  return "I want to make sure you receive the best possible assistance. Let me connect you with a specialist who can provide more detailed help with your specific situation.";
}

function determineUrgency(message: string): string {
  const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'broken', 'down'];
  const lowerMessage = message.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  }
  
  return 'normal';
}

function categorizeMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('bill') || lowerMessage.includes('charge')) {
    return 'billing';
  }
  
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('technical')) {
    return 'technical';
  }
  
  if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('password')) {
    return 'account';
  }
  
  return 'general';
}

function calculateConfidence(suggestion: any, sentiment: string, urgency: string): number {
  let confidence = 0.7; // Base confidence
  
  // Adjust based on sentiment match
  if (sentiment === 'negative' && suggestion.tone === 'empathetic') {
    confidence += 0.2;
  }
  
  // Adjust based on urgency
  if (urgency === 'high' && suggestion.category === 'escalation') {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 0.95);
}
