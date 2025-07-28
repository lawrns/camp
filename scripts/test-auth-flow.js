/**
 * Test Authentication Flow Script
 * Tests registration and login functionality
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

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  const testEmail = `test-${Date.now()}@campfire.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';
  const testOrg = 'Test Organization';

  try {
    // Test 1: Registration
    console.log('📝 Test 1: User Registration');
    console.log('Email:', testEmail);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          organization_name: testOrg,
        },
      },
    });

    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message);
      return;
    }

    console.log('✅ Registration successful');
    console.log('User ID:', signUpData.user?.id);
    console.log('Session:', signUpData.session ? 'Created' : 'Not created');
    console.log('Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');

    // Test 2: Login (if session was created)
    if (signUpData.session) {
      console.log('\n🔐 Test 2: User Login (with session)');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful');
        console.log('User ID:', loginData.user?.id);
        console.log('Session created:', loginData.session ? 'Yes' : 'No');
      }
    } else {
      console.log('\n⚠️  Test 2: Skipped (no session created during registration)');
      console.log('This is normal for Supabase - email confirmation may be required');
    }

    // Test 3: Get current session
    console.log('\n🔍 Test 3: Get Current Session');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
    } else {
      console.log('✅ Session check successful');
      console.log('Has session:', sessionData.session ? 'Yes' : 'No');
      if (sessionData.session) {
        console.log('User ID:', sessionData.session.user.id);
        console.log('Email:', sessionData.session.user.email);
      }
    }

    // Test 4: Get user data
    console.log('\n👤 Test 4: Get User Data');
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User data fetch failed:', userError.message);
    } else {
      console.log('✅ User data fetch successful');
      console.log('User ID:', userData.user?.id);
      console.log('Email:', userData.user?.email);
      console.log('Full name:', userData.user?.user_metadata?.full_name);
      console.log('Organization:', userData.user?.user_metadata?.organization_name);
    }

    // Test 5: Logout
    console.log('\n🚪 Test 5: User Logout');
    
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Logout failed:', logoutError.message);
    } else {
      console.log('✅ Logout successful');
    }

    // Test 6: Verify logout
    console.log('\n🔍 Test 6: Verify Logout');
    
    const { data: finalSessionData } = await supabase.auth.getSession();
    console.log('Session after logout:', finalSessionData.session ? 'Still exists' : 'Cleared');

    console.log('\n🎉 Authentication flow test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuthFlow(); 