/**
 * Comprehensive E2E Test Data Setup
 * Creates standardized test data for reliable E2E testing
 */

import { createClient } from '@supabase/supabase-js';

// Standardized test data constants
export const TEST_DATA = {
  ORGANIZATION: {
    id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    name: 'E2E Test Organization',
    slug: 'e2e-test-org',
    settings: {
      widget_enabled: true,
      realtime_enabled: true,
      ai_enabled: true,
    }
  },
  USERS: {
    AGENT: {
      email: 'jam@jam.com',
      password: 'password123',
      name: 'Test Agent',
      role: 'agent',
    },
    ADMIN: {
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'admin',
    },
    CUSTOMER: {
      email: 'customer@test.com',
      password: 'password123',
      name: 'Test Customer',
      role: 'customer',
    }
  },
  CONVERSATIONS: {
    ACTIVE: {
      id: '48eedfba-2568-4231-bb38-2ce20420900d',
      status: 'active',
      title: 'Test Active Conversation',
    },
    CLOSED: {
      id: '12345678-1234-1234-1234-123456789012',
      status: 'closed',
      title: 'Test Closed Conversation',
    }
  }
} as const;

export class E2ETestDataSetup {
  private supabase: unknown;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables for test setup');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Setup complete test environment
   */
  async setupTestEnvironment(): Promise<void> {
    console.log('🧪 Setting up E2E test environment...');

    try {
      await this.setupOrganization();
      await this.setupUsers();
      await this.setupConversations();
      await this.setupMessages();
      await this.setupPresence();
      
      console.log('✅ E2E test environment setup complete');
    } catch (error) {
      console.error('❌ Test environment setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup test organization
   */
  private async setupOrganization(): Promise<void> {
    console.log('🏢 Setting up test organization...');

    const { error } = await this.supabase
      .from('organizations')
      .upsert({
        id: TEST_DATA.ORGANIZATION.id,
        name: TEST_DATA.ORGANIZATION.name,
        slug: TEST_DATA.ORGANIZATION.slug,
        settings: TEST_DATA.ORGANIZATION.settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error && !error.message.includes('duplicate key')) {
      console.error('Organization setup error:', error);
      throw error;
    }

    console.log(`✅ Organization setup: ${TEST_DATA.ORGANIZATION.name}`);
  }

  /**
   * Setup test users with proper authentication and profiles
   */
  private async setupUsers(): Promise<void> {
    console.log('👥 Setting up test users...');

    for (const [userType, userData] of Object.entries(TEST_DATA.USERS)) {
      try {
        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: userData.role,
            organization_id: TEST_DATA.ORGANIZATION.id,
          },
        });

        if (authError && !authError.message.includes('already registered')) {
          console.error(`Auth error for ${userData.email}:`, authError);
          continue;
        }

        const userId = authUser?.user?.id;
        if (!userId) {
          // Try to find existing user
          const { data: existingUsers } = await this.supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users?.find((u: unknown) => u.email === userData.email);
          if (!existingUser) {
            console.error(`Could not create or find user: ${userData.email}`);
            continue;
          }
        }

        const finalUserId = userId || existingUsers?.users?.find((u: unknown) => u.email === userData.email)?.id;

        // Create profile
        const { error: profileError } = await this.supabase
          .from('profiles')
          .upsert({
            id: finalUserId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            organization_id: TEST_DATA.ORGANIZATION.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError && !profileError.message.includes('duplicate key')) {
          console.error(`Profile error for ${userData.email}:`, profileError);
        }

        // Setup initial presence
        const { error: presenceError } = await this.supabase
          .from('user_presence')
          .upsert({
            user_id: finalUserId,
            organization_id: TEST_DATA.ORGANIZATION.id,
            status: 'offline',
            lastSeenAt: new Date().toISOString(),
            metadata: {
              userName: userData.name,
              user_email: userData.email,
              setup_by: 'e2e_test_setup'
            }
          });

        if (presenceError && !presenceError.message.includes('duplicate key')) {
          console.error(`Presence error for ${userData.email}:`, presenceError);
        }

        console.log(`✅ User setup: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`Failed to setup user ${userData.email}:`, error);
      }
    }
  }

  /**
   * Setup test conversations
   */
  private async setupConversations(): Promise<void> {
    console.log('💬 Setting up test conversations...');

    for (const [convType, convData] of Object.entries(TEST_DATA.CONVERSATIONS)) {
      try {
        const { error } = await this.supabase
          .from('conversations')
          .upsert({
            id: convData.id,
            organization_id: TEST_DATA.ORGANIZATION.id,
            title: convData.title,
            status: convData.status,
            customerEmail: TEST_DATA.USERS.CUSTOMER.email,
            customerName: TEST_DATA.USERS.CUSTOMER.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
          });

        if (error && !error.message.includes('duplicate key')) {
          console.error(`Conversation setup error for ${convType}:`, error);
        } else {
          console.log(`✅ Conversation setup: ${convData.title}`);
        }
      } catch (error) {
        console.error(`Failed to setup conversation ${convType}:`, error);
      }
    }
  }

  /**
   * Setup test messages
   */
  private async setupMessages(): Promise<void> {
    console.log('📝 Setting up test messages...');

    const testMessages = [
      {
        conversation_id: TEST_DATA.CONVERSATIONS.ACTIVE.id,
        organization_id: TEST_DATA.ORGANIZATION.id,
        content: 'Hello, I need help with my account',
        senderEmail: TEST_DATA.USERS.CUSTOMER.email,
        senderName: TEST_DATA.USERS.CUSTOMER.name,
        senderType: 'visitor',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      },
      {
        conversation_id: TEST_DATA.CONVERSATIONS.ACTIVE.id,
        organization_id: TEST_DATA.ORGANIZATION.id,
        content: 'Hi! I\'d be happy to help you with your account. What specific issue are you experiencing?',
        senderEmail: TEST_DATA.USERS.AGENT.email,
        senderName: TEST_DATA.USERS.AGENT.name,
        senderType: 'operator',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
      },
      {
        conversation_id: TEST_DATA.CONVERSATIONS.ACTIVE.id,
        organization_id: TEST_DATA.ORGANIZATION.id,
        content: 'I can\'t log into my dashboard',
        senderEmail: TEST_DATA.USERS.CUSTOMER.email,
        senderName: TEST_DATA.USERS.CUSTOMER.name,
        senderType: 'visitor',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      }
    ];

    for (const message of testMessages) {
      try {
        const { error } = await this.supabase
          .from('messages')
          .upsert(message);

        if (error && !error.message.includes('duplicate key')) {
          console.error('Message setup error:', error);
        }
      } catch (error) {
        console.error('Failed to setup message:', error);
      }
    }

    console.log(`✅ Messages setup: ${testMessages.length} test messages`);
  }

  /**
   * Setup initial presence data
   */
  private async setupPresence(): Promise<void> {
    console.log('👤 Setting up test presence data...');

    // This was already handled in setupUsers, but we can add additional presence scenarios here
    console.log('✅ Presence setup complete');
  }

  /**
   * Cleanup test data (for test isolation)
   */
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      // Clean up in reverse dependency order
      await this.supabase.from('messages').delete().eq('organization_id', TEST_DATA.ORGANIZATION.id);
      await this.supabase.from('conversations').delete().eq('organization_id', TEST_DATA.ORGANIZATION.id);
      await this.supabase.from('user_presence').delete().eq('organization_id', TEST_DATA.ORGANIZATION.id);
      await this.supabase.from('typing_indicators').delete().eq('organization_id', TEST_DATA.ORGANIZATION.id);
      
      // Note: We don't delete users/profiles as they might be needed across tests
      
      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }

  /**
   * Verify test data integrity
   */
  async verifyTestData(): Promise<boolean> {
    console.log('🔍 Verifying test data integrity...');

    try {
      // Check organization exists
      const { data: org } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('id', TEST_DATA.ORGANIZATION.id)
        .single();

      if (!org) {
        console.error('❌ Test organization not found');
        return false;
      }

      // Check users exist
      for (const userData of Object.values(TEST_DATA.USERS)) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (!profile) {
          console.error(`❌ Test user profile not found: ${userData.email}`);
          return false;
        }
      }

      // Check conversations exist
      for (const convData of Object.values(TEST_DATA.CONVERSATIONS)) {
        const { data: conv } = await this.supabase
          .from('conversations')
          .select('id')
          .eq('id', convData.id)
          .single();

        if (!conv) {
          console.error(`❌ Test conversation not found: ${convData.id}`);
          return false;
        }
      }

      console.log('✅ Test data integrity verified');
      return true;
    } catch (error) {
      console.error('❌ Test data verification failed:', error);
      return false;
    }
  }
}
