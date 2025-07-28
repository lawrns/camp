/**
 * Setup Test User Script
 * Creates a test user and organization for E2E testing
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupTestUser() {
  console.log('🔧 Setting up test user and organization...');

  try {
    // 1. Create test user
    const testUser = {
      email: 'test@campfire.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        organization_id: 'test-org-123'
      }
    };

    console.log('📧 Creating test user:', testUser.email);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: testUser.user_metadata
    });

    if (userError) {
      console.error('❌ Failed to create user:', userError);
      return;
    }

    console.log('✅ User created:', userData.user.id);

    // 2. Create test organization
    const testOrg = {
      id: 'test-org-123',
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for E2E testing'
    };

    console.log('🏢 Creating test organization:', testOrg.name);
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([testOrg])
      .select()
      .single();

    if (orgError) {
      console.error('❌ Failed to create organization:', orgError);
      return;
    }

    console.log('✅ Organization created:', orgData.id);

    // 3. Create test mailbox
    const testMailbox = {
      id: 1,
      name: 'Test Mailbox',
      email: 'test@test-org.com',
      organization_id: testOrg.id,
      settings: {
        auto_reply: false,
        business_hours: {
          enabled: false
        }
      }
    };

    console.log('📬 Creating test mailbox');
    const { data: mailboxData, error: mailboxError } = await supabase
      .from('mailboxes')
      .insert([testMailbox])
      .select()
      .single();

    if (mailboxError) {
      console.error('❌ Failed to create mailbox:', mailboxError);
      return;
    }

    console.log('✅ Mailbox created:', mailboxData.id);

    // 4. Create organization member
    const testMember = {
      user_id: userData.user.id,
      organization_id: testOrg.id,
      mailbox_id: mailboxData.id,
      role: 'owner',
      status: 'active'
    };

    console.log('👤 Creating organization member');
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .insert([testMember])
      .select()
      .single();

    if (memberError) {
      console.error('❌ Failed to create organization member:', memberError);
      return;
    }

    console.log('✅ Organization member created:', memberData.id);

    // 5. Create test conversation
    const testConversation = {
      id: 'test-conv-123',
      title: 'Test Conversation',
      status: 'open',
      priority: 'medium',
      organization_id: testOrg.id,
      mailbox_id: mailboxData.id,
      customer_id: 'test-customer-123',
      assigned_agent_id: userData.user.id
    };

    console.log('💬 Creating test conversation');
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert([testConversation])
      .select()
      .single();

    if (convError) {
      console.error('❌ Failed to create conversation:', convError);
      return;
    }

    console.log('✅ Conversation created:', convData.id);

    // 6. Create test message
    const testMessage = {
      id: 'test-msg-123',
      conversation_id: convData.id,
      content: 'Hello! This is a test message for E2E testing.',
      sender_type: 'customer',
      sender_name: 'Test Customer',
      organization_id: testOrg.id
    };

    console.log('💭 Creating test message');
    const { data: msgData, error: msgError } = await supabase
      .from('conversation_messages')
      .insert([testMessage])
      .select()
      .single();

    if (msgError) {
      console.error('❌ Failed to create message:', msgError);
      return;
    }

    console.log('✅ Message created:', msgData.id);

    console.log('\n🎉 Test setup completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    console.log('Organization ID:', testOrg.id);
    console.log('Conversation ID:', convData.id);
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('\n📝 You can now use these credentials for E2E testing');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupTestUser(); 