/**
 * Test Session Script
 * Tests if the session is working properly with the existing user
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

async function testSession() {
  console.log('🧪 Testing Session with jam@jam.com...\n');

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

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }

    if (!session) {
      console.error('❌ No session found');
      return;
    }

    console.log('✅ Session valid:', session.user.email);
    console.log('   User ID:', session.user.id);
    console.log('   Access Token:', session.access_token ? 'Present' : 'Missing');
    console.log('   Refresh Token:', session.refresh_token ? 'Present' : 'Missing');

    // Step 3: Test API call with session
    console.log('\n3. Testing API call...');
    
    // Get the session token
    const token = session.access_token;
    
    const response = await fetch('http://localhost:3000/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful:', data);
    } else {
      const error = await response.text();
      console.log('❌ API call failed:', error);
    }

    // Step 4: Test with cookies
    console.log('\n4. Testing with cookies...');
    
    // Get cookies from the session
    const cookieResponse = await fetch('http://localhost:3000/api/auth/user', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('   Cookie Response Status:', cookieResponse.status);
    
    if (cookieResponse.ok) {
      const data = await cookieResponse.json();
      console.log('✅ Cookie call successful:', data);
    } else {
      const error = await cookieResponse.text();
      console.log('❌ Cookie call failed:', error);
    }

    console.log('\n✅ Session test complete!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testSession(); 