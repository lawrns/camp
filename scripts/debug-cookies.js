/**
 * Debug Cookies Script
 * Checks what cookies are being sent and received by the API
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

async function debugCookies() {
  console.log('🔍 Debugging Cookies...\n');

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

    // Step 3: Check what cookies are set
    console.log('\n3. Checking cookies...');
    
    // Note: In Node.js, we can't access browser cookies directly
    console.log('Session access token length:', session.access_token?.length || 0);
    console.log('Session refresh token length:', session.refresh_token?.length || 0);

    // Step 4: Test API with detailed logging
    console.log('\n4. Testing API with detailed logging...');
    
    const response = await fetch('http://localhost:3000/api/auth/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    // Step 5: Test with just the token
    console.log('\n5. Testing with just the token...');
    
    const tokenResponse = await fetch('http://localhost:3000/api/auth/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    console.log('Token response status:', tokenResponse.status);
    const tokenResponseText = await tokenResponse.text();
    console.log('Token response body:', tokenResponseText);

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugCookies(); 