/**
 * AI System Integration Tests
 * Tests the complete AI pipeline including model routing, RAG, and handoff
 */

// Mock external dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

jest.mock('@/lib/redis/client', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('ai', () => ({
  generateText: jest.fn().mockResolvedValue({
    text: 'Mock AI response',
    usage: { totalTokens: 100 },
  }),
  embed: jest.fn().mockResolvedValue({
    embedding: [0.1, 0.2, 0.3],
  }),
}));

describe('AI System Integration', () => {
  describe('Model Router', () => {
    test('should route requests to appropriate models', async () => {
      const { ModelRouter } = await import('@/lib/ai/model-router');
      
      const router = new ModelRouter();
      
      // Test routing for different request types
      const chatRequest = {
        type: 'chat',
        tokenCount: 1000,
        userTier: 'premium',
      };
      
      const model = await router.selectModel(chatRequest);
      expect(model).toBeDefined();
      expect(model.capabilities).toContain('chat');
    });

    test('should handle model fallbacks', async () => {
      const { ModelRouter } = await import('@/lib/ai/model-router');
      
      const router = new ModelRouter();
      
      // Mock primary model failure
      const failingRequest = {
        type: 'chat',
        tokenCount: 5000,
        userTier: 'basic',
        primaryModelDown: true,
      };
      
      const fallbackModel = await router.selectModel(failingRequest);
      expect(fallbackModel).toBeDefined();
      expect(fallbackModel.isEnabled).toBe(true);
    });
  });

  describe('RAG System', () => {
    test('should generate embeddings for knowledge base', async () => {
      const { generateEmbedding } = await import('@/lib/ai/core');
      
      const testContent = 'How do I reset my password?';
      const embedding = await generateEmbedding(testContent);
      
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });

    test('should retrieve relevant knowledge chunks', async () => {
      const { EnhancedRAGService } = await import('@/lib/ai/rag');
      
      const ragService = new EnhancedRAGService();
      
      const context = {
        conversationId: 'test-conv-1',
        organizationId: 'test-org-1',
        messageContent: 'How do I change my billing information?',
        conversationHistory: [],
      };
      
      const response = await ragService.generateResponse(context);
      
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
      expect(typeof response.shouldHandover).toBe('boolean');
    });

    test('should trigger handover for low confidence', async () => {
      const { EnhancedRAGService } = await import('@/lib/ai/rag');
      
      const ragService = new EnhancedRAGService();
      
      // Mock low confidence scenario
      const lowConfidenceContext = {
        conversationId: 'test-conv-2',
        organizationId: 'test-org-1',
        messageContent: 'This is a very complex technical issue that requires human expertise',
        conversationHistory: [],
      };
      
      const response = await ragService.generateResponse(lowConfidenceContext);
      
      // Should recommend handover for complex issues
      expect(response.confidence).toBeLessThan(0.7);
      expect(response.shouldHandover).toBe(true);
    });
  });

  describe('Handoff System', () => {
    test('should trigger handoff successfully', async () => {
      const { triggerHandoff } = await import('@/lib/ai/handoff');
      
      const handoffResponse = await triggerHandoff(
        'test-conversation-1',
        'Customer requested human assistance',
        'medium'
      );
      
      expect(handoffResponse).toBeDefined();
      expect(handoffResponse.success).toBe(true);
      expect(handoffResponse.handoffId).toBeTruthy();
    });

    test('should preserve conversation context during handoff', async () => {
      const { preserveContext } = await import('@/lib/ai/handoff');
      
      const conversationContext = {
        conversationId: 'test-conv-3',
        messages: [
          { role: 'user', content: 'I need help with billing' },
          { role: 'assistant', content: 'I can help you with billing questions' },
        ],
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          tier: 'premium',
        },
      };
      
      const preservedContext = await preserveContext(conversationContext);
      
      expect(preservedContext).toBeDefined();
      expect(preservedContext.summary).toBeTruthy();
      expect(preservedContext.customerInfo).toEqual(conversationContext.customerInfo);
    });

    test('should assign appropriate agent based on skills', async () => {
      const { assignAgent } = await import('@/lib/ai/handoff');
      
      const handoffRequest = {
        conversationId: 'test-conv-4',
        issueType: 'technical',
        priority: 'high',
        requiredSkills: ['javascript', 'api-integration'],
      };
      
      const assignment = await assignAgent(handoffRequest);
      
      expect(assignment).toBeDefined();
      expect(assignment.agent).toBeTruthy();
      expect(assignment.estimatedWaitTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should track AI response times', async () => {
      const { PerformanceMonitor } = await import('@/lib/ai/performance-monitoring');
      
      const monitor = new PerformanceMonitor();
      
      const startTime = Date.now();
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      monitor.recordResponseTime('gpt-4', responseTime);
      
      const metrics = monitor.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeLessThan(5000); // Should be under 5 seconds
    });

    test('should monitor AI confidence scores', async () => {
      const { ConfidenceAnalytics } = await import('@/lib/ai/confidence-analytics');
      
      const analytics = new ConfidenceAnalytics();
      
      const confidenceScores = [0.9, 0.8, 0.7, 0.6, 0.5];
      
      confidenceScores.forEach(score => {
        analytics.recordConfidence(score);
      });
      
      const stats = analytics.getStatistics();
      expect(stats.averageConfidence).toBeCloseTo(0.7, 1);
      expect(stats.handoffRate).toBeGreaterThan(0);
    });
  });

  describe('Security & Compliance', () => {
    test('should sanitize user inputs', async () => {
      const { sanitizeInput } = await import('@/lib/ai/security-compliance-framework');
      
      const maliciousInput = '<script>alert("xss")</script>Hello world';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello world');
    });

    test('should respect rate limits', async () => {
      const { RateLimiter } = await import('@/lib/ai/security-compliance-framework');
      
      const rateLimiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      });
      
      const userId = 'test-user-1';
      
      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        const allowed = await rateLimiter.checkLimit(userId);
        expect(allowed).toBe(true);
      }
      
      // Should block 6th request
      const blocked = await rateLimiter.checkLimit(userId);
      expect(blocked).toBe(false);
    });

    test('should audit AI interactions', async () => {
      const { AuditLogger } = await import('@/lib/ai/security-compliance-framework');
      
      const auditLogger = new AuditLogger();
      
      const interaction = {
        userId: 'test-user-1',
        conversationId: 'test-conv-1',
        action: 'ai_response',
        model: 'gpt-4',
        timestamp: new Date().toISOString(),
      };
      
      await auditLogger.logInteraction(interaction);
      
      const logs = await auditLogger.getLogs('test-user-1');
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Real-time System', () => {
    test('should broadcast AI responses in real-time', async () => {
      const { broadcastAIResponse } = await import('@/lib/realtime');
      
      const response = {
        conversationId: 'test-conv-1',
        content: 'AI generated response',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      };
      
      const broadcast = await broadcastAIResponse(response);
      expect(broadcast.success).toBe(true);
    });

    test('should handle typing indicators during AI processing', async () => {
      const { sendTypingIndicator } = await import('@/lib/realtime');
      
      const typingData = {
        conversationId: 'test-conv-1',
        isTyping: true,
        agentType: 'ai',
      };
      
      const result = await sendTypingIndicator(typingData);
      expect(result.success).toBe(true);
    });
  });
});
