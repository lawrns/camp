const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMailboxes() {
  console.log('🔍 Debugging Mailboxes Table Access\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError);
      return;
    }

    console.log('✅ Login successful:', user.email);

    // 2. Get session
    console.log('\n2. Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError);
      return;
    }

    console.log('✅ Session valid:', session.user.email);
    console.log('Token:', session.access_token.substring(0, 50) + '...');

    // 3. Test mailboxes table access
    console.log('\n3. Testing mailboxes table access...');
    
    // Test with organization_id from user metadata
    const organizationId = user.user_metadata?.organization_id;
    console.log('Organization ID from metadata:', organizationId);

    if (organizationId) {
      console.log('\n   Testing mailboxes query with organization_id...');
      const { data: mailboxes, error: mailboxError } = await supabase
        .from('mailboxes')
        .select('*')
        .eq('organization_id', organizationId);

      if (mailboxError) {
        console.error('❌ Mailboxes query error:', mailboxError);
      } else {
        console.log('✅ Mailboxes query successful');
        console.log('   Found mailboxes:', mailboxes?.length || 0);
        if (mailboxes && mailboxes.length > 0) {
          console.log('   First mailbox:', mailboxes[0]);
        }
      }
    }

    // 4. Test general mailboxes access (without filter)
    console.log('\n4. Testing general mailboxes access...');
    const { data: allMailboxes, error: allMailboxError } = await supabase
      .from('mailboxes')
      .select('*')
      .limit(5);

    if (allMailboxError) {
      console.error('❌ General mailboxes access error:', allMailboxError);
    } else {
      console.log('✅ General mailboxes access successful');
      console.log('   Found mailboxes:', allMailboxes?.length || 0);
      if (allMailboxes && allMailboxes.length > 0) {
        console.log('   Sample mailboxes:', allMailboxes.slice(0, 2));
      }
    }

    // 5. Test tickets table access
    console.log('\n5. Testing tickets table access...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(5);

    if (ticketsError) {
      console.error('❌ Tickets table access error:', ticketsError);
    } else {
      console.log('✅ Tickets table access successful');
      console.log('   Found tickets:', tickets?.length || 0);
      if (tickets && tickets.length > 0) {
        console.log('   Sample tickets:', tickets.slice(0, 2));
      }
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugMailboxes(); 