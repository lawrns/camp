/**
 * Final Comprehensive E2E Test Suite
 * Tests all functionality after implementing fixes
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';
const BASE_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runFinalE2ETest() {
  console.log('🎯 FINAL E2E TEST - Core Functionality Verification');
  console.log('==================================================\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(testName, success, details = '') {
    const status = success ? '✅' : '❌';
    results.tests.push({ testName, success, details });
    
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    console.log(`${status} ${testName}: ${details}`);
  }

  try {
    // 1. Authentication Tests
    console.log('🔐 AUTHENTICATION TESTS');
    console.log('------------------------');
    
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });
    
    if (loginError) {
      logTest('User Login', false, `Login failed: ${loginError.message}`);
      return;
    }
    
    logTest('User Login', true, `Logged in as ${user.email}`);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logTest('Session Retrieval', false, `Session error: ${sessionError?.message || 'No session'}`);
      return;
    }
    
    logTest('Session Retrieval', true, `Session valid for ${session.user.email}`);

    // 2. API Endpoint Tests
    console.log('\n🔌 API ENDPOINT TESTS');
    console.log('------------------------');
    
    // Test /api/auth/user
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Auth User API', userResponse.ok, `Status: ${userResponse.status}`);
    
    // Test /api/conversations
    const conversationsResponse = await fetch(`${BASE_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Conversations API', conversationsResponse.ok, `Status: ${conversationsResponse.status}`);
    
    // Test /api/tickets
    const ticketsResponse = await fetch(`${BASE_URL}/api/tickets`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Tickets API', ticketsResponse.ok, `Status: ${ticketsResponse.status}`);
    
    // Test /api/auth/set-organization
    const setOrgResponse = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organizationId: user.user_metadata?.organization_id })
    });
    
    logTest('Set Organization API', setOrgResponse.ok, `Status: ${setOrgResponse.status}`);

    // 3. UI Page Tests
    console.log('\n🎨 UI PAGE TESTS');
    console.log('------------------');
    
    const pages = [
      { name: 'Homepage', path: '/' },
      { name: 'Login Page', path: '/login' },
      { name: 'Register Page', path: '/register' },
      { name: 'Dashboard Page', path: '/dashboard' },
      { name: 'Widget Page', path: '/widget' },
      { name: 'Inbox Page', path: '/inbox' }
    ];
    
    for (const page of pages) {
      try {
        const response = await fetch(`${BASE_URL}${page.path}`);
        logTest(page.name, response.ok, `Status: ${response.status}`);
      } catch (error) {
        logTest(page.name, false, `Error: ${error.message}`);
      }
    }

    // 4. Database Access Tests
    console.log('\n🗄️ DATABASE ACCESS TESTS');
    console.log('-------------------------');
    
    // Test mailboxes access
    const { data: mailboxes, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('*')
      .eq('organization_id', user.user_metadata?.organization_id);
    
    logTest('Mailboxes Access', !mailboxError, mailboxError ? `Error: ${mailboxError.message}` : `Found ${mailboxes?.length || 0} mailboxes`);
    
    // Test organization_members access
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);
    
    logTest('Organization Members Access', !membershipError, membershipError ? `Error: ${membershipError.message}` : `Found ${memberships?.length || 0} memberships`);

    // 5. Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The application is fully functional.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

runFinalE2ETest(); 