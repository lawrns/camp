/**
 * AI Service for Campfire V2
 * Provides intelligent responses and conversation analysis
 */

export interface AIResponse {
  content: string;
  confidence: number;
  intent: string;
  suggestions?: string[];
  escalate?: boolean;
}

export interface ConversationContext {
  messages: Array<{
    content: string;
    sender_type: string;
    timestamp: Date;
  }>;
  customerInfo?: {
    name?: string;
    email?: string;
    previousInteractions?: number;
  };
}

class AIService {
  private apiKey: string | null = null;

  constructor() {
    // In production, this would be your AI service API key
    this.apiKey = process.env.NEXT_PUBLIC_AI_API_KEY || null;
  }

  /**
   * Generate an intelligent response based on conversation context
   */
  async generateResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      // For demo purposes, we'll use rule-based responses
      // In production, this would call OpenAI, Claude, or your AI service
      return this.generateRuleBasedResponse(userMessage, context);
    } catch (error) {
      console.error('AI Service error:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Analyze conversation sentiment and intent
   */
  async analyzeMessage(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    intent: string;
    confidence: number;
    keywords: string[];
  }> {
    // Simple rule-based analysis for demo
    const lowerMessage = message.toLowerCase();
    
    // Sentiment analysis
    const positiveWords = ['thank', 'great', 'awesome', 'love', 'perfect', 'excellent'];
    const negativeWords = ['problem', 'issue', 'broken', 'error', 'frustrated', 'angry', 'terrible'];
    
    const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (hasPositive && !hasNegative) sentiment = 'positive';
    if (hasNegative && !hasPositive) sentiment = 'negative';

    // Intent detection
    let intent = 'general_inquiry';
    if (lowerMessage.includes('account') || lowerMessage.includes('login')) {
      intent = 'account_support';
    } else if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      intent = 'billing_inquiry';
    } else if (lowerMessage.includes('technical') || lowerMessage.includes('bug')) {
      intent = 'technical_support';
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      intent = 'cancellation_request';
    }

    // Extract keywords
    const keywords = lowerMessage
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);

    return {
      sentiment,
      intent,
      confidence: 0.75,
      keywords,
    };
  }

  /**
   * Determine if conversation should be escalated to human agent
   */
  shouldEscalate(
    message: string,
    conversationHistory: ConversationContext,
    aiConfidence: number
  ): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Escalation triggers
    const escalationKeywords = [
      'speak to human',
      'talk to person',
      'human agent',
      'manager',
      'supervisor',
      'this is ridiculous',
      'terrible service',
      'cancel my account',
      'legal action',
      'complaint'
    ];

    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    // Escalate if confidence is low or explicit request
    return hasEscalationKeyword || aiConfidence < 0.6;
  }

  /**
   * Generate rule-based responses for demo
   */
  private generateRuleBasedResponse(
    userMessage: string,
    context: ConversationContext
  ): AIResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Account-related queries
    if (lowerMessage.includes('account') || lowerMessage.includes('login')) {
      return {
        content: "I'd be happy to help you with your account! Can you tell me more about the specific issue you're experiencing? For security reasons, I'll need to verify some information with you.",
        confidence: 0.85,
        intent: 'account_support',
        suggestions: [
          'Reset password',
          'Update account information',
          'Account verification'
        ]
      };
    }

    // Billing queries
    if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return {
        content: "I can help you with billing questions! Whether it's about your current charges, payment methods, or billing history, I'm here to assist. What specific billing question do you have?",
        confidence: 0.80,
        intent: 'billing_inquiry',
        suggestions: [
          'View billing history',
          'Update payment method',
          'Explain charges'
        ]
      };
    }

    // Technical support
    if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return {
        content: "I understand you're experiencing a technical issue. Let me help you troubleshoot this. Can you describe what happened and any error messages you saw?",
        confidence: 0.75,
        intent: 'technical_support',
        suggestions: [
          'Clear browser cache',
          'Check internet connection',
          'Try different browser'
        ]
      };
    }

    // Cancellation requests
    if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return {
        content: "I'm sorry to hear you're considering cancellation. Before we proceed, I'd love to understand what's prompting this decision. Is there anything we can do to address your concerns?",
        confidence: 0.70,
        intent: 'cancellation_request',
        escalate: true,
        suggestions: [
          'Speak with retention specialist',
          'Explore alternative plans',
          'Provide feedback'
        ]
      };
    }

    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        content: "Hello! Welcome to Campfire support. I'm here to help you with any questions or issues you might have. How can I assist you today?",
        confidence: 0.90,
        intent: 'greeting'
      };
    }

    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return {
        content: "You're very welcome! I'm glad I could help. Is there anything else you need assistance with today?",
        confidence: 0.85,
        intent: 'gratitude'
      };
    }

    // Default response
    return {
      content: "I understand you need help, and I'm here to assist you! Could you provide a bit more detail about what you're looking for? This will help me give you the most accurate information.",
      confidence: 0.60,
      intent: 'general_inquiry',
      suggestions: [
        'Account questions',
        'Billing inquiries',
        'Technical support',
        'General information'
      ]
    };
  }

  /**
   * Fallback response when AI service fails
   */
  private getFallbackResponse(): AIResponse {
    return {
      content: "I apologize, but I'm experiencing some technical difficulties right now. Let me connect you with one of our human agents who can better assist you.",
      confidence: 0.0,
      intent: 'system_error',
      escalate: true
    };
  }

  /**
   * Generate suggested responses for agents
   */
  async generateAgentSuggestions(
    conversationContext: ConversationContext
  ): Promise<string[]> {
    const lastMessage = conversationContext.messages[conversationContext.messages.length - 1];
    
    if (!lastMessage) {
      return [
        "Hello! How can I help you today?",
        "Thanks for contacting us. What can I assist you with?",
        "Hi there! I'm here to help with any questions you have."
      ];
    }

    const analysis = await this.analyzeMessage(lastMessage.content);
    
    switch (analysis.intent) {
      case 'account_support':
        return [
          "I'd be happy to help with your account. Can you verify your email address?",
          "Let me look into your account details. One moment please.",
          "For security, I'll need to verify some information first."
        ];
      
      case 'billing_inquiry':
        return [
          "I can help you with billing questions. What specifically would you like to know?",
          "Let me pull up your billing information. One moment please.",
          "I see you have a billing question. How can I assist?"
        ];
      
      case 'technical_support':
        return [
          "I understand you're having a technical issue. Let's troubleshoot this together.",
          "Can you describe the exact steps that led to this problem?",
          "Let me help you resolve this technical issue."
        ];
      
      default:
        return [
          "Thanks for reaching out! How can I help you today?",
          "I'm here to assist you. What questions do you have?",
          "Let me know how I can help resolve this for you."
        ];
    }
  }
}

export const aiService = new AIService();
