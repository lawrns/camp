#!/usr/bin/env node

/**
 * Test script to debug conversation creation API failure
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

async function testConversationCreation() {
  console.log('🔍 Testing Conversation Creation API...\n');

  try {
    console.log('📡 Testing POST /api/widget/auth (conversation creation)');
    console.log(`Organization ID: ${ORG_ID}\n`);

    const response = await fetch(`${BASE_URL}/api/widget/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': ORG_ID,
      },
      body: JSON.stringify({
        organizationId: ORG_ID,
        sessionData: {
          userAgent: 'Test-Agent/1.0',
          timestamp: Date.now(),
          referrer: '',
          currentUrl: 'http://localhost:3001',
        },
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📄 Raw Response:`, responseText);

    try {
      const result = JSON.parse(responseText);
      console.log('\n📦 Parsed Response:');
      console.log(JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON response');
    }

    return response.ok;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testOrganizationExists() {
  console.log('\n🏢 Testing Organization Existence...');
  
  try {
    // Test if we can access the organization directly
    const response = await fetch(`${BASE_URL}/api/organizations/${ORG_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Organization API Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const org = await response.json();
      console.log('✅ Organization found:', org);
    } else {
      const error = await response.text();
      console.log('❌ Organization error:', error);
    }

    return response.ok;
  } catch (error) {
    console.error('💥 Organization test failed:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...');
  
  try {
    // Test a simple API that should work
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
    });

    console.log(`📊 Health Check Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Health check passed:', health);
    } else {
      console.log('❌ Health check failed');
    }

    return response.ok;
  } catch (error) {
    console.error('💥 Database connection test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 Starting Conversation Creation Diagnostics\n');
  console.log('=' .repeat(60));

  const results = [];

  // Test 1: Database Connection
  console.log('\n1️⃣ Database Connection Test');
  console.log('-'.repeat(40));
  results.push(await testDatabaseConnection());

  // Test 2: Organization Existence
  console.log('\n2️⃣ Organization Existence Test');
  console.log('-'.repeat(40));
  results.push(await testOrganizationExists());

  // Test 3: Conversation Creation
  console.log('\n3️⃣ Conversation Creation Test');
  console.log('-'.repeat(40));
  results.push(await testConversationCreation());

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ALL DIAGNOSTICS PASSED! Conversation creation should work.');
  } else {
    console.log('\n⚠️  Some diagnostics failed. Check the logs above for details.');
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if Supabase is running and accessible');
    console.log('2. Verify organization exists in database');
    console.log('3. Check database schema for conversations table');
    console.log('4. Verify RLS policies allow conversation creation');
  }

  return passed === total;
}

// Run the diagnostics
runDiagnostics().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Diagnostic suite failed:', error);
  process.exit(1);
});
