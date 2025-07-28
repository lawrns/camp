/**
 * Debug Auth User API
 * Understand why auth user API is returning 403
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAuthUser() {
  console.log('🔍 Debugging Auth User API\n');
  
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
    console.log('User ID:', loginData.user.id);
    console.log('User metadata:', loginData.user.user_metadata);

    // Step 2: Check organization membership directly
    console.log('\n2. Checking organization membership...');
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .eq('user_id', loginData.user.id);
    
    if (memberError) {
      console.error('❌ Membership check error:', memberError.message);
    } else {
      console.log('✅ Memberships found:', memberships);
    }

    // Step 3: Check organizations table
    console.log('\n3. Checking organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', memberships?.[0]?.organization_id);
    
    if (orgError) {
      console.error('❌ Organizations check error:', orgError.message);
    } else {
      console.log('✅ Organization found:', orgs);
    }

    // Step 4: Test auth user API with detailed logging
    console.log('\n4. Testing auth user API...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError?.message || 'No session');
      return;
    }

    const token = session.access_token;
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

    const userResponse = await fetch('http://localhost:3001/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', userResponse.status);
    const userData = await userResponse.text();
    console.log('Response body:', userData);

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugAuthUser(); 