/**
 * Test Data Manager
 * 
 * Handles test data creation, cleanup, and verification for E2E tests.
 * This ensures tests have consistent, isolated data and proper cleanup.
 */

import { createClient } from '@supabase/supabase-js';

export interface TestData {
  organizationId: string;
  conversationId: string;
  userId: string;
  messages: Array<{
    id: string;
    content: string;
    senderType: 'visitor' | 'agent';
    timestamp: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    role: 'agent' | 'admin' | 'customer';
  }>;
}

export class TestDataManager {
  private supabase: unknown;
  private testData: TestData | null = null;
  private cleanupTasks: Array<() => Promise<void>> = [];
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  /**
   * Create fresh test data for a test run
   */
  async createTestData(): Promise<TestData> {
    console.log('🧪 Creating fresh test data...');
    
    try {
      // Create test organization
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .insert({
          name: `Test Organization ${Date.now()}`,
          slug: `test-org-${Date.now()}`,
          settings: {
            widget: {
              enabled: true,
              primaryColor: '#3B82F6',
              welcomeMessage: 'How can we help you today?'
            }
          }
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      // Create test users
      const testUsers = [
        {
          email: 'test-agent@example.com',
          password: 'password123',
          role: 'agent',
          name: 'Test Agent'
        },
        {
          email: 'test-customer@example.com',
          password: 'password123',
          role: 'customer',
          name: 'Test Customer'
        }
      ];
      
      const createdUsers = [];
      for (const userData of testUsers) {
        const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: userData.role,
            organization_id: org.id
          }
        });
        
        if (authError && !authError.message.includes('already registered')) {
          throw authError;
        }
        
        if (authUser?.user) {
          createdUsers.push({
            id: authUser.user.id,
            email: userData.email,
            role: userData.role
          });
        }
      }
      
      // Create test conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations')
        .insert({
          organization_id: org.id,
          customerEmail: 'test-customer@example.com',
          customerName: 'Test Customer',
          status: 'open',
          priority: 'medium',
          subject: 'Test conversation'
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      // Create test messages
      const testMessages = [
        {
          conversation_id: conversation.id,
          content: 'Hello, I need help with my account',
          senderType: 'visitor',
          senderEmail: 'test-customer@example.com',
          senderName: 'Test Customer'
        },
        {
          conversation_id: conversation.id,
          content: 'Hi! I\'d be happy to help you with your account. What specific issue are you experiencing?',
          senderType: 'agent',
          senderEmail: 'test-agent@example.com',
          senderName: 'Test Agent'
        }
      ];
      
      const createdMessages = [];
      for (const messageData of testMessages) {
        const { data: message, error: msgError } = await this.supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single();
        
        if (msgError) throw msgError;
        
        createdMessages.push({
          id: message.id,
          content: message.content,
          senderType: message.senderType,
          timestamp: message.created_at
        });
      }
      
      this.testData = {
        organizationId: org.id,
        conversationId: conversation.id,
        userId: createdUsers[0]?.id || '',
        messages: createdMessages,
        users: createdUsers
      };
      
      // Add cleanup tasks
      this.cleanupTasks.push(async () => {
        await this.cleanupTestData();
      });
      
      console.log('✅ Test data created successfully');
      console.log('📊 Test data summary:', {
        organizationId: this.testData.organizationId,
        conversationId: this.testData.conversationId,
        messageCount: this.testData.messages.length,
        userCount: this.testData.users.length
      });
      
      return this.testData;
      
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      throw error;
    }
  }
  
  /**
   * Get current test data
   */
  getTestData(): TestData | null {
    return this.testData;
  }
  
  /**
   * Add a message to the test conversation
   */
  async addTestMessage(content: string, senderType: 'visitor' | 'agent', senderEmail: string, senderName: string): Promise<string> {
    if (!this.testData) {
      throw new Error('No test data available. Call createTestData() first.');
    }
    
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: this.testData.conversationId,
        content,
        senderType: senderType,
        senderEmail: senderEmail,
        senderName: senderName
      })
      .select()
      .single();
    
    if (error) throw error;
    
    this.testData.messages.push({
      id: message.id,
      content: message.content,
      senderType: message.senderType,
      timestamp: message.created_at
    });
    
    return message.id;
  }
  
  /**
   * Verify test data integrity
   */
  async verifyTestData(): Promise<boolean> {
    if (!this.testData) {
      console.log('⚠️ No test data to verify');
      return false;
    }
    
    try {
      // Verify organization exists
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select()
        .eq('id', this.testData.organizationId)
        .single();
      
      if (orgError || !org) {
        console.log('❌ Organization verification failed');
        return false;
      }
      
      // Verify conversation exists
      const { data: conv, error: convError } = await this.supabase
        .from('conversations')
        .select()
        .eq('id', this.testData.conversationId)
        .single();
      
      if (convError || !conv) {
        console.log('❌ Conversation verification failed');
        return false;
      }
      
      // Verify messages exist
      const { data: messages, error: msgError } = await this.supabase
        .from('messages')
        .select()
        .eq('conversation_id', this.testData.conversationId);
      
      if (msgError || !messages || messages.length !== this.testData.messages.length) {
        console.log('❌ Messages verification failed');
        return false;
      }
      
      console.log('✅ Test data verification passed');
      return true;
      
    } catch (error) {
      console.error('❌ Test data verification error:', error);
      return false;
    }
  }
  
  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    if (!this.testData) {
      console.log('⚠️ No test data to clean up');
      return;
    }
    
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete messages
      await this.supabase
        .from('messages')
        .delete()
        .eq('conversation_id', this.testData.conversationId);
      
      // Delete conversation
      await this.supabase
        .from('conversations')
        .delete()
        .eq('id', this.testData.conversationId);
      
      // Delete users
      for (const user of this.testData.users) {
        try {
          await this.supabase.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.log(`⚠️ Failed to delete user ${user.email}:`, error);
        }
      }
      
      // Delete organization
      await this.supabase
        .from('organizations')
        .delete()
        .eq('id', this.testData.organizationId);
      
      this.testData = null;
      this.cleanupTasks = [];
      
      console.log('✅ Test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Test data cleanup error:', error);
      throw error;
    }
  }
  
  /**
   * Execute cleanup tasks
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Executing cleanup tasks...');
    
    for (const cleanupTask of this.cleanupTasks) {
      try {
        await cleanupTask();
      } catch (error) {
        console.error('⚠️ Cleanup task failed:', error);
      }
    }
    
    this.cleanupTasks = [];
  }
  
  /**
   * Create test data with specific configuration
   */
  async createTestDataWithConfig(config: {
    messageCount?: number;
    includeAttachments?: boolean;
    conversationStatus?: 'open' | 'closed' | 'pending';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<TestData> {
    const testData = await this.createTestData();
    
    // Add additional messages if requested
    if (config.messageCount && config.messageCount > testData.messages.length) {
      const additionalCount = config.messageCount - testData.messages.length;
      
      for (let i = 0; i < additionalCount; i++) {
        const isAgent = i % 2 === 1; // Alternate between visitor and agent
        const senderType = isAgent ? 'agent' : 'visitor';
        const senderEmail = isAgent ? 'test-agent@example.com' : 'test-customer@example.com';
        const senderName = isAgent ? 'Test Agent' : 'Test Customer';
        
        await this.addTestMessage(
          `Additional test message ${i + 1}`,
          senderType,
          senderEmail,
          senderName
        );
      }
    }
    
    // Update conversation status if specified
    if (config.conversationStatus) {
      await this.supabase
        .from('conversations')
        .update({ status: config.conversationStatus })
        .eq('id', testData.conversationId);
    }
    
    // Update conversation priority if specified
    if (config.priority) {
      await this.supabase
        .from('conversations')
        .update({ priority: config.priority })
        .eq('id', testData.conversationId);
    }
    
    return testData;
  }
}

// Export singleton instance
export const testDataManager = new TestDataManager();

// Export helper functions
export const TestDataHelpers = {
  /**
   * Create test data for a specific test
   */
  async setupTestData(config?: {
    messageCount?: number;
    includeAttachments?: boolean;
    conversationStatus?: 'open' | 'closed' | 'pending';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<TestData> {
    return testDataManager.createTestDataWithConfig(config || {});
  },
  
  /**
   * Clean up test data after a test
   */
  async cleanupTestData(): Promise<void> {
    return testDataManager.cleanup();
  },
  
  /**
   * Get current test data
   */
  getCurrentTestData(): TestData | null {
    return testDataManager.getTestData();
  },
  
  /**
   * Add a test message
   */
  async addTestMessage(content: string, senderType: 'visitor' | 'agent', senderEmail: string, senderName: string): Promise<string> {
    return testDataManager.addTestMessage(content, senderType, senderEmail, senderName);
  }
};

export default testDataManager; 