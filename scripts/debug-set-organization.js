const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';
const BASE_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSetOrganization() {
  console.log('🔍 Debugging Set Organization API Endpoint\n');

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

    // 3. Test the set-organization API endpoint
    console.log('\n3. Testing /api/auth/set-organization endpoint...');
    
    const organizationId = user.user_metadata?.organization_id;
    console.log('Organization ID to set:', organizationId);
    
    const response = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organizationId })
    });

    const responseText = await response.text();
    console.log('   Status:', response.status);
    console.log('   Response:', responseText);

    if (response.ok) {
      console.log('✅ Set organization API call successful');
    } else {
      console.log('❌ Set organization API call failed');
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugSetOrganization(); 