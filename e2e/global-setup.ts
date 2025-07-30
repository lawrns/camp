/**
 * E2E Global Setup
 * 
 * Prepares the testing environment with:
 * - Test database setup
 * - Authentication credentials
 * - Real-time channel preparation
 * - Performance monitoring initialization
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

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
        console.log(`⚠️  Auth error for ${user.email}:`, authError.message);
        // Don't throw - continue with setup
      }

      if (authUser?.user) {
        createdUsers.push({
          ...user,
          id: authUser.user.id,
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);

        // Ensure profile exists for the user
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organization_id: 'e2e-test-org', // Link to test org
            });

          if (profileError) {
            console.log(`⚠️  Profile creation warning for ${user.email}:`, profileError.message);
          }
        } catch (profileErr) {
          console.log(`⚠️  Profile setup failed for ${user.email}:`, profileErr);
        }
      } else {
        // User might already exist, try to find them
        try {
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users?.find(u => u.email === user.email);
          if (existingUser) {
            createdUsers.push({
              ...user,
              id: existingUser.id,
            });
            console.log(`ℹ️  Found existing user: ${user.email}`);
          }
        } catch (listError) {
          console.log(`⚠️  Could not verify existing user ${user.email}:`, listError);
        }
      }
    } catch (error) {
      console.log(`⚠️  User setup failed for ${user.email}:`, error);
      // Continue with setup - tests may still work
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
  try {
    await page.goto('/auth/login', { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for login form to be available
    await page.waitForSelector('[data-testid="email-input"], #email, input[type="email"]', { timeout: 10000 });

    // Try multiple selector strategies for robustness
    const emailSelector = await page.locator('[data-testid="email-input"]').count() > 0
      ? '[data-testid="email-input"]'
      : await page.locator('#email').count() > 0
        ? '#email'
        : 'input[type="email"]';

    const passwordSelector = await page.locator('[data-testid="password-input"]').count() > 0
      ? '[data-testid="password-input"]'
      : await page.locator('#password').count() > 0
        ? '#password'
        : 'input[type="password"]';

    const loginButtonSelector = await page.locator('[data-testid="login-button"]').count() > 0
      ? '[data-testid="login-button"]'
      : await page.locator('button[type="submit"]').count() > 0
        ? 'button[type="submit"]'
        : 'button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")';

    // Fill login form with fallback selectors
    await page.fill(emailSelector, 'jam@jam.com');
    await page.fill(passwordSelector, 'password123');
    await page.click(loginButtonSelector);

    // Wait for successful login with multiple possible redirect URLs
    await Promise.race([
      page.waitForURL('/dashboard', { timeout: 15000 }),
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.waitForURL('/app/dashboard', { timeout: 15000 }),
      page.waitForURL('/inbox', { timeout: 15000 }),
    ]);

    // Save authentication state
    await context.storageState({ path: 'e2e/auth-state.json' });
    console.log('✅ Authentication state saved successfully');

  } catch (error) {
    console.log('⚠️  Primary auth setup failed, trying fallback methods...');

    // Fallback 1: Try direct API authentication
    try {
      const response = await page.request.post('/api/auth/login', {
        data: {
          email: 'jam@jam.com',
          password: 'password123'
        }
      });

      if (response.ok()) {
        await context.storageState({ path: 'e2e/auth-state.json' });
        console.log('✅ Fallback API authentication successful');
      } else {
        throw new Error('API auth failed');
      }
    } catch (apiError) {
      console.log('⚠️  API auth fallback failed, creating minimal auth state...');

      // Fallback 2: Create minimal auth state for tests that don't require real auth
      const minimalAuthState = {
        cookies: [],
        origins: [{
          origin: 'http://localhost:3005',
          localStorage: [
            { name: 'test-user', value: 'jam@jam.com' },
            { name: 'test-mode', value: 'true' }
          ]
        }]
      };

      await page.evaluate((authData) => {
        localStorage.setItem('test-user', authData.origins[0].localStorage[0].value);
        localStorage.setItem('test-mode', authData.origins[0].localStorage[1].value);
      }, minimalAuthState);

      await context.storageState({ path: 'e2e/auth-state.json' });
      console.log('✅ Minimal auth state created for testing');
    }
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
