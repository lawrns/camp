/**
 * Comprehensive E2E Test Suite
 * Tests all aspects of the Campfire application
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';
const BASE_URL = 'http://localhost:3000';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results tracking
const results = {
  authentication: { passed: 0, failed: 0, tests: [] },
  api: { passed: 0, failed: 0, tests: [] },
  ui: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

function logTest(category, testName, success, details = '') {
  const status = success ? '✅' : '❌';
  const result = { testName, success, details };
  results[category].tests.push(result);
  
  if (success) {
    results[category].passed++;
  } else {
    results[category].failed++;
  }
  
  console.log(`${status} ${testName}: ${details}`);
}

async function testAuthentication() {
  console.log('\n🔐 AUTHENTICATION TESTS');
  console.log('------------------------------');
  
  try {
    // Test 1: User Login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });
    
    if (loginError) {
      logTest('authentication', 'User Login', false, `Login failed: ${loginError.message}`);
      return false;
    }
    
    logTest('authentication', 'User Login', true, `Logged in as ${loginData.user.email}`);
    
    // Test 2: Session Retrieval
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logTest('authentication', 'Session Retrieval', false, `Session error: ${sessionError?.message || 'No session'}`);
      return false;
    }
    
    logTest('authentication', 'Session Retrieval', true, `Session valid for ${session.user.email}`);
    
    // Test 3: Registration Page Access
    const registerResponse = await fetch(`${BASE_URL}/register`);
    logTest('authentication', 'Registration Page Access', registerResponse.ok, `Status: ${registerResponse.status}`);
    
    // Test 4: Login Page Access
    const loginResponse = await fetch(`${BASE_URL}/login`);
    logTest('authentication', 'Login Page Access', loginResponse.ok, `Status: ${loginResponse.status}`);
    
    // Test 5: Dashboard Page Access
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard`);
    logTest('authentication', 'Dashboard Page Access', dashboardResponse.ok, `Status: ${dashboardResponse.status}`);
    
    return true;
  } catch (error) {
    logTest('authentication', 'Authentication Suite', false, `Error: ${error.message}`);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 API TESTS');
  console.log('------------------------------');
  
  try {
    // Get session for API calls
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logTest('api', 'Session for API Tests', false, 'No valid session');
      return false;
    }
    
    const token = session.access_token;
    
    // Test 1: Auth User Endpoint
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logTest('api', 'Auth User Endpoint', userResponse.ok, `Status: ${userResponse.status}`);
    
    // Test 2: Auth Session Endpoint
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logTest('api', 'Auth Session Endpoint', sessionResponse.ok, `Status: ${sessionResponse.status}`);
    
    // Test 3: Auth Organization Endpoint
    const orgResponse = await fetch(`${BASE_URL}/api/auth/organization`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logTest('api', 'Auth Organization Endpoint', orgResponse.ok, `Status: ${orgResponse.status}`);
    
    // Test 4: Set Organization Endpoint
    const setOrgResponse = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organizationId: 'test-org-id' })
    });
    logTest('api', 'Set Organization Endpoint', setOrgResponse.ok, `Status: ${setOrgResponse.status}`);
    
    // Test 5: Conversations API
    const conversationsResponse = await fetch(`${BASE_URL}/api/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logTest('api', 'Conversations API', conversationsResponse.ok, `Status: ${conversationsResponse.status}`);
    
    // Test 6: Tickets API
    const ticketsResponse = await fetch(`${BASE_URL}/api/tickets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    logTest('api', 'Tickets API', ticketsResponse.ok, `Status: ${ticketsResponse.status}`);
    
  } catch (error) {
    logTest('api', 'API Suite', false, `Error: ${error.message}`);
  }
}

async function testUIPages() {
  console.log('\n🎨 UI TESTS');
  console.log('------------------------------');
  
  try {
    // Test 1: Homepage
    const homeResponse = await fetch(`${BASE_URL}/`);
    logTest('ui', 'Homepage Access', homeResponse.ok, `Status: ${homeResponse.status}`);
    
    // Test 2: Widget Page
    const widgetResponse = await fetch(`${BASE_URL}/widget`);
    logTest('ui', 'Widget Page Access', widgetResponse.ok, `Status: ${widgetResponse.status}`);
    
    // Test 3: Inbox Page
    const inboxResponse = await fetch(`${BASE_URL}/inbox`);
    logTest('ui', 'Inbox Page Access', inboxResponse.ok, `Status: ${inboxResponse.status}`);
    
  } catch (error) {
    logTest('ui', 'UI Suite', false, `Error: ${error.message}`);
  }
}

async function testIntegration() {
  console.log('\n🔗 INTEGRATION TESTS');
  console.log('------------------------------');
  
  try {
    // Test 1: Supabase Client
    const { data, error } = await supabase.from('organizations').select('count').limit(1);
    logTest('integration', 'Supabase Client', !error, error ? `Error: ${error.message}` : 'Client working');
    
    // Test 2: Database Connection
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    logTest('integration', 'Database Connection', !userError, userError ? `Error: ${userError.message}` : 'Connection successful');
    
    // Test 3: Real-time Connection
    const channel = supabase.channel('test-channel');
    const { data: channelData, error: channelError } = await channel.subscribe();
    logTest('integration', 'Real-time Connection', !channelError, channelError ? `Error: ${channelError.message}` : 'Channel created successfully');
    
    // Test 4: User Profile Data
    if (user) {
      logTest('integration', 'User Profile Data', true, `User: ${user.email}, ID: ${user.id}`);
    } else {
      logTest('integration', 'User Profile Data', false, 'No user data available');
    }
    
  } catch (error) {
    logTest('integration', 'Integration Suite', false, `Error: ${error.message}`);
  }
}

function printResults() {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('============================================================');
  
  Object.entries(results).forEach(([category, result]) => {
    console.log(`${category.toUpperCase()}:`);
    console.log(`  Passed: ${result.passed}, Failed: ${result.failed}`);
    
    result.tests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      console.log(`  ${status} ${test.testName}: ${test.details}`);
    });
    console.log('');
  });
  
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (totalFailed > 0) {
    console.log(`⚠️  ${totalFailed} test(s) failed. Please review the issues above.`);
  } else {
    console.log('🎉 All tests passed!');
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Comprehensive E2E Test Suite');
  console.log('============================================================');
  
  try {
    await testAuthentication();
    await testAPIEndpoints();
    await testUIPages();
    await testIntegration();
    
    printResults();
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  }
}

// Run the tests
runComprehensiveTests(); 