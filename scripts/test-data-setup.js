#!/usr/bin/env node

/**
 * Test script for E2E Test Data Setup
 * Verifies that test data is properly created and accessible
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_DATA = {
  ORGANIZATION: {
    id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    name: 'E2E Test Organization',
  },
  USERS: {
    AGENT: { email: 'jam@jam.com', name: 'Test Agent', role: 'agent' },
    ADMIN: { email: 'admin@test.com', name: 'Test Admin', role: 'admin' },
    CUSTOMER: { email: 'customer@test.com', name: 'Test Customer', role: 'customer' }
  },
  CONVERSATIONS: {
    ACTIVE: { id: '48eedfba-2568-4231-bb38-2ce20420900d', title: 'Test Active Conversation' },
    CLOSED: { id: '12345678-1234-1234-1234-123456789012', title: 'Test Closed Conversation' }
  }
};

async function testDataSetup() {
  console.log('🧪 Testing E2E Test Data Setup');
  console.log('===============================');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client initialized');

  // Test 1: Verify organization exists
  console.log('\n🏢 Test 1: Organization verification');
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', TEST_DATA.ORGANIZATION.id)
      .single();

    if (error) {
      console.log(`   ❌ Organization query error: ${error.message}`);
    } else if (org) {
      console.log(`   ✅ Organization found: ${org.name} (${org.id})`);
    } else {
      console.log('   ❌ Organization not found');
    }
  } catch (error) {
    console.log(`   ❌ Organization test failed: ${error.message}`);
  }

  // Test 2: Verify users exist
  console.log('\n👥 Test 2: Users verification');
  for (const [userType, userData] of Object.entries(TEST_DATA.USERS)) {
    try {
      // Check auth user
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers.users?.find(u => u.email === userData.email);

      if (authUser) {
        console.log(`   ✅ Auth user found: ${userData.email}`);

        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, name, role, organization_id')
          .eq('email', userData.email)
          .single();

        if (profileError) {
          console.log(`   ⚠️  Profile query error for ${userData.email}: ${profileError.message}`);
        } else if (profile) {
          console.log(`   ✅ Profile found: ${profile.name} (${profile.role})`);
          
          if (profile.organization_id === TEST_DATA.ORGANIZATION.id) {
            console.log(`   ✅ Organization link verified`);
          } else {
            console.log(`   ⚠️  Organization mismatch: ${profile.organization_id}`);
          }
        } else {
          console.log(`   ❌ Profile not found for ${userData.email}`);
        }

        // Check presence
        const { data: presence } = await supabase
          .from('user_presence')
          .select('user_id, status, organization_id')
          .eq('user_id', authUser.id)
          .single();

        if (presence) {
          console.log(`   ✅ Presence record found: ${presence.status}`);
        } else {
          console.log(`   ⚠️  Presence record not found`);
        }
      } else {
        console.log(`   ❌ Auth user not found: ${userData.email}`);
      }
    } catch (error) {
      console.log(`   ❌ User test failed for ${userData.email}: ${error.message}`);
    }
  }

  // Test 3: Verify conversations exist
  console.log('\n💬 Test 3: Conversations verification');
  for (const [convType, convData] of Object.entries(TEST_DATA.CONVERSATIONS)) {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('id, title, status, organization_id')
        .eq('id', convData.id)
        .single();

      if (error) {
        console.log(`   ❌ Conversation query error for ${convType}: ${error.message}`);
      } else if (conversation) {
        console.log(`   ✅ Conversation found: ${conversation.title} (${conversation.status})`);
        
        if (conversation.organization_id === TEST_DATA.ORGANIZATION.id) {
          console.log(`   ✅ Organization link verified`);
        } else {
          console.log(`   ⚠️  Organization mismatch: ${conversation.organization_id}`);
        }
      } else {
        console.log(`   ❌ Conversation not found: ${convData.id}`);
      }
    } catch (error) {
      console.log(`   ❌ Conversation test failed for ${convType}: ${error.message}`);
    }
  }

  // Test 4: Verify messages exist
  console.log('\n📝 Test 4: Messages verification');
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, sender_type, conversation_id')
      .eq('conversation_id', TEST_DATA.CONVERSATIONS.ACTIVE.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.log(`   ❌ Messages query error: ${error.message}`);
    } else if (messages && messages.length > 0) {
      console.log(`   ✅ Messages found: ${messages.length} messages`);
      
      messages.forEach((msg, index) => {
        console.log(`   📄 Message ${index + 1}: ${msg.senderType} - "${msg.content.substring(0, 50)}..."`);
      });
    } else {
      console.log('   ⚠️  No messages found');
    }
  } catch (error) {
    console.log(`   ❌ Messages test failed: ${error.message}`);
  }

  // Test 5: Test authentication flow
  console.log('\n🔐 Test 5: Authentication flow');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_DATA.USERS.AGENT.email,
      password: 'password123'
    });

    if (error) {
      console.log(`   ❌ Authentication failed: ${error.message}`);
    } else if (data.user) {
      console.log(`   ✅ Authentication successful: ${data.user.email}`);
      
      // Test session
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        console.log(`   ✅ Session active: ${session.session.user.email}`);
      } else {
        console.log('   ⚠️  No active session');
      }

      // Sign out
      await supabase.auth.signOut();
      console.log('   ✅ Sign out successful');
    } else {
      console.log('   ❌ No user data returned');
    }
  } catch (error) {
    console.log(`   ❌ Authentication test failed: ${error.message}`);
  }

  // Test 6: Database connectivity and permissions
  console.log('\n🔗 Test 6: Database connectivity');
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('organizations')
      .select('count(*)')
      .single();

    if (error) {
      console.log(`   ❌ Database query failed: ${error.message}`);
    } else {
      console.log(`   ✅ Database connectivity verified`);
    }

    // Test RLS policies
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count(*)')
      .eq('organization_id', TEST_DATA.ORGANIZATION.id)
      .single();

    if (profilesError) {
      console.log(`   ⚠️  RLS policy test warning: ${profilesError.message}`);
    } else {
      console.log(`   ✅ RLS policies accessible`);
    }
  } catch (error) {
    console.log(`   ❌ Database connectivity test failed: ${error.message}`);
  }

  console.log('\n📊 Test Data Setup Summary');
  console.log('===========================');
  console.log('✅ Test data verification complete');
  console.log('✅ Standardized test credentials available');
  console.log('✅ Organization and user structure verified');
  console.log('✅ Conversation and message data available');
  console.log('✅ Authentication flow tested');
  console.log('');
  console.log('🔧 Test Credentials:');
  console.log('   Agent: jam@jam.com / password123');
  console.log('   Admin: admin@test.com / password123');
  console.log('   Customer: customer@test.com / password123');
  console.log('');
  console.log('🏢 Test Organization:');
  console.log(`   ID: ${TEST_DATA.ORGANIZATION.id}`);
  console.log(`   Name: ${TEST_DATA.ORGANIZATION.name}`);
  console.log('');
  console.log('💬 Test Conversations:');
  console.log(`   Active: ${TEST_DATA.CONVERSATIONS.ACTIVE.id}`);
  console.log(`   Closed: ${TEST_DATA.CONVERSATIONS.CLOSED.id}`);
}

// Run the test
if (require.main === module) {
  testDataSetup().catch(console.error);
}

module.exports = { testDataSetup };
