/**
 * E2E Global Setup
 * 
 * Prepares the testing environment with:
 * - Test database setup
 * - Authentication credentials
 * - Real-time channel preparation
 * - Performance monitoring initialization
 */

import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Global Setup...');

  // Initialize Supabase client for test setup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ========================================
  // 1. SETUP TEST USERS AND ORGANIZATIONS
  // ========================================
  console.log('👥 Setting up test users and organizations...');

  const testUsers = [
    {
      email: 'jam@jam.com',
      password: 'password123',
      role: 'agent',
      name: 'Test Agent',
    },
    {
      email: 'customer@test.com', 
      password: 'password123',
      role: 'customer',
      name: 'Test Customer',
    },
    {
      email: 'admin@test.com',
      password: 'password123', 
      role: 'admin',
      name: 'Test Admin',
    },
  ];

  const createdUsers = [];

  for (const user of testUsers) {
    try {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
      }

      if (authUser.user) {
        createdUsers.push({
          ...user,
          id: authUser.user.id,
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      }
    } catch (error) {
      console.log(`ℹ️  User ${user.email} already exists or error:`, error);
    }
  }

  // ========================================
  // 2. SETUP TEST ORGANIZATION
  // ========================================
  console.log('🏢 Setting up test organization...');

  const testOrgId = 'e2e-test-org';
  
  try {
    // Create test organization
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: testOrgId,
        name: 'E2E Test Organization',
        slug: 'e2e-test',
        settings: {
          ai_enabled: true,
          widget_enabled: true,
          notifications_enabled: true,
        },
      });

    if (orgError && !orgError.message.includes('duplicate key')) {
      throw orgError;
    }

    console.log('✅ Test organization ready');
  } catch (error) {
    console.log('ℹ️  Test organization already exists or error:', error);
  }

  // ========================================
  // 3. SETUP TEST CONVERSATIONS
  // ========================================
  console.log('💬 Setting up test conversations...');

  const testConversations = [
    {
      id: 'e2e-conv-1',
      organization_id: testOrgId,
      status: 'active',
      channel: 'widget',
      metadata: {
        widget_session_id: 'e2e-widget-session-1',
        visitor_id: 'e2e-visitor-1',
      },
    },
    {
      id: 'e2e-conv-2', 
      organization_id: testOrgId,
      status: 'active',
      channel: 'email',
      metadata: {
        email_thread_id: 'e2e-email-thread-1',
      },
    },
  ];

  for (const conv of testConversations) {
    try {
      const { error } = await supabase
        .from('conversations')
        .upsert(conv);

      if (error && !error.message.includes('duplicate key')) {
        throw error;
      }

      console.log(`✅ Test conversation ready: ${conv.id}`);
    } catch (error) {
      console.log(`ℹ️  Conversation ${conv.id} already exists or error:`, error);
    }
  }

  // ========================================
  // 4. SETUP AUTHENTICATION STATE
  // ========================================
  console.log('🔐 Setting up authentication state...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page and authenticate test user
  await page.goto('/auth/login');
  
  try {
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'jam@jam.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Save authentication state
    await context.storageState({ path: 'e2e/auth-state.json' });
    console.log('✅ Authentication state saved');
  } catch (error) {
    console.log('⚠️  Could not setup auth state (app may not be running):', error);
  }

  await browser.close();

  // ========================================
  // 5. INITIALIZE MONITORING
  // ========================================
  console.log('📊 Initializing E2E monitoring...');

  // Store test metadata for monitoring
  const testMetadata = {
    startTime: new Date().toISOString(),
    testOrgId,
    testUsers: createdUsers,
    testConversations,
    environment: {
      baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  };

  // Save metadata for tests to use
  require('fs').writeFileSync(
    'e2e/test-metadata.json',
    JSON.stringify(testMetadata, null, 2)
  );

  console.log('✅ E2E Global Setup Complete!');
  console.log('📋 Test Environment Ready:');
  console.log(`   - Organization: ${testOrgId}`);
  console.log(`   - Users: ${createdUsers.length}`);
  console.log(`   - Conversations: ${testConversations.length}`);
  console.log(`   - Auth State: ${require('fs').existsSync('e2e/auth-state.json') ? 'Ready' : 'Not Available'}`);
}

export default globalSetup;
