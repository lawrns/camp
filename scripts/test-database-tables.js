/**
 * Test Database Tables Script
 * Check if required tables exist and are accessible
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseTables() {
  console.log('🔍 Testing Database Tables\n');
  
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful:', loginData.user.email);

    // Step 2: Test table access
    console.log('\n2. Testing table access...');
    
    // Test organizations table
    console.log('\n   Testing organizations table...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (orgError) {
      console.log('   ❌ Organizations table error:', orgError.message);
    } else {
      console.log('   ✅ Organizations table accessible:', orgs?.length || 0, 'records');
    }

    // Test organization_members table
    console.log('\n   Testing organization_members table...');
    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .eq('user_id', loginData.user.id);
    
    if (memberError) {
      console.log('   ❌ Organization members table error:', memberError.message);
    } else {
      console.log('   ✅ Organization members table accessible:', members?.length || 0, 'records');
      if (members && members.length > 0) {
        console.log('   User memberships:', members);
      }
    }

    // Test conversations table
    console.log('\n   Testing conversations table...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .limit(1);
    
    if (convError) {
      console.log('   ❌ Conversations table error:', convError.message);
    } else {
      console.log('   ✅ Conversations table accessible:', conversations?.length || 0, 'records');
    }

    // Test mailboxes table
    console.log('\n   Testing mailboxes table...');
    const { data: mailboxes, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('id, organization_id')
      .limit(1);
    
    if (mailboxError) {
      console.log('   ❌ Mailboxes table error:', mailboxError.message);
    } else {
      console.log('   ✅ Mailboxes table accessible:', mailboxes?.length || 0, 'records');
    }

    // Test tickets table
    console.log('\n   Testing tickets table...');
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('id, mailbox_id')
      .limit(1);
    
    if (ticketError) {
      console.log('   ❌ Tickets table error:', ticketError.message);
    } else {
      console.log('   ✅ Tickets table accessible:', tickets?.length || 0, 'records');
    }

    console.log('\n✅ Database table test complete!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testDatabaseTables(); 