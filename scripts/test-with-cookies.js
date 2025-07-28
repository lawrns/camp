/**
 * Test with Cookies Script
 * Simulates a browser session by manually setting cookies
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWithCookies() {
  console.log('🧪 Testing with Cookies...\n');

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

    // Step 3: Test API with cookies (simulating browser)
    console.log('\n3. Testing API with cookies...');
    
    // Get the session token
    const token = session.access_token;
    
    // Test the debug API first
    const debugResponse = await fetch('http://localhost:3000/api/auth/debug', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Debug API Status:', debugResponse.status);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug API successful:', debugData);
    } else {
      const error = await debugResponse.text();
      console.log('❌ Debug API failed:', error);
    }

    // Test the auth user API
    const userResponse = await fetch('http://localhost:3000/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Auth User API Status:', userResponse.status);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Auth User API successful:', userData);
    } else {
      const error = await userResponse.text();
      console.log('❌ Auth User API failed:', error);
    }

    // Test conversations API
    const conversationsResponse = await fetch('http://localhost:3000/api/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Conversations API Status:', conversationsResponse.status);
    
    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      console.log('✅ Conversations API successful:', conversationsData);
    } else {
      const error = await conversationsResponse.text();
      console.log('❌ Conversations API failed:', error);
    }

    // Test tickets API
    const ticketsResponse = await fetch('http://localhost:3000/api/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Tickets API Status:', ticketsResponse.status);
    
    if (ticketsResponse.ok) {
      const ticketsData = await ticketsResponse.json();
      console.log('✅ Tickets API successful:', ticketsData);
    } else {
      const error = await ticketsResponse.text();
      console.log('❌ Tickets API failed:', error);
    }

    console.log('\n✅ Test with cookies complete!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testWithCookies(); 