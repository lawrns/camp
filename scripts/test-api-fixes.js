/**
 * Simple API Test Script
 * Tests the fixed API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - use environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAPIFixes() {
  console.log('🧪 Testing API Fixes\n');
  console.log('============================================================\n');

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

    // Step 3: Test API endpoints with Authorization header
    console.log('\n3. Testing API endpoints...');
    
    const token = session.access_token;
    
    // Test auth user endpoint
    console.log('\n   Testing /api/auth/user...');
    const userResponse = await fetch('http://localhost:3000/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', userResponse.status);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('   ✅ Success:', userData.user?.email);
    } else {
      const error = await userResponse.text();
      console.log('   ❌ Error:', error);
    }

    // Test conversations endpoint
    console.log('\n   Testing /api/conversations...');
    const conversationsResponse = await fetch('http://localhost:3000/api/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', conversationsResponse.status);
    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      console.log('   ✅ Success:', Array.isArray(conversationsData) ? `${conversationsData.length} conversations` : 'Data received');
    } else {
      const error = await conversationsResponse.text();
      console.log('   ❌ Error:', error);
    }

    // Test tickets endpoint
    console.log('\n   Testing /api/tickets...');
    const ticketsResponse = await fetch('http://localhost:3000/api/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', ticketsResponse.status);
    if (ticketsResponse.ok) {
      const ticketsData = await ticketsResponse.json();
      console.log('   ✅ Success:', Array.isArray(ticketsData) ? `${ticketsData.length} tickets` : 'Data received');
    } else {
      const error = await ticketsResponse.text();
      console.log('   ❌ Error:', error);
    }

    // Test session endpoint
    console.log('\n   Testing /api/auth/session...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', sessionResponse.status);
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('   ✅ Success: Session data received');
    } else {
      const error = await sessionResponse.text();
      console.log('   ❌ Error:', error);
    }

    console.log('\n✅ API fixes test complete!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testAPIFixes(); 