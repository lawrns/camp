import { generateAIResponse } from '@/lib/ai/core';
import { triggerHandoff } from '@/lib/ai/handoff';
import { jest } from '@jest/globals';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'Test AI response'
            }
          }]
        }))
      }
    }
  }))
}));

describe('AI Core Functions', () => {
  test('AI generates response within 2s', async () => {
    const start = Date.now();
    const response = await generateAIResponse('Test query');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(2000);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  test('AI response is not empty', async () => {
    const response = await generateAIResponse('Hello, how can you help me?');
    expect(response.length).toBeGreaterThan(0);
  });

  test('Handoff triggers successfully', async () => {
    const conversationId = 'test-conversation-id';
    await expect(triggerHandoff(conversationId)).resolves.not.toThrow();
  });

  test('AI handles empty query gracefully', async () => {
    const response = await generateAIResponse('');
    expect(response).toBeDefined();
  });

  test('AI handles long query efficiently', async () => {
    const longQuery = 'A'.repeat(1000);
    const start = Date.now();
    const response = await generateAIResponse(longQuery);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(3000);
    expect(response).toBeDefined();
  });
});