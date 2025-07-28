/**
 * Debug API Issues Script
 * Focused testing of failing API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';
const BASE_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAPIIssues() {
  console.log('🔍 Debugging API Issues\n');
  
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

    // Step 2: Get session
    console.log('\n2. Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError?.message || 'No session');
      return;
    }

    console.log('✅ Session valid:', session.user.email);
    console.log('Token:', session.access_token.substring(0, 50) + '...');

    // Step 3: Test failing endpoints with detailed error info
    console.log('\n3. Testing failing endpoints...');
    
    const token = session.access_token;
    
    // Test Auth User Endpoint (403)
    console.log('\n   Testing /api/auth/user (403)...');
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', userResponse.status);
    const userData = await userResponse.text();
    console.log('   Response:', userData);

    // Test Conversations API (500)
    console.log('\n   Testing /api/conversations (500)...');
    const conversationsResponse = await fetch(`${BASE_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', conversationsResponse.status);
    const conversationsData = await conversationsResponse.text();
    console.log('   Response:', conversationsData);

    // Test Tickets API (500)
    console.log('\n   Testing /api/tickets (500)...');
    const ticketsResponse = await fetch(`${BASE_URL}/api/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', ticketsResponse.status);
    const ticketsData = await ticketsResponse.text();
    console.log('   Response:', ticketsData);

    // Test Set Organization Endpoint (403)
    console.log('\n   Testing /api/auth/set-organization (403)...');
    const setOrgResponse = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organizationId: loginData.user.user_metadata?.organization_id })
    });

    console.log('   Status:', setOrgResponse.status);
    const setOrgData = await setOrgResponse.text();
    console.log('   Response:', setOrgData);

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugAPIIssues(); 