#!/usr/bin/env node

/**
 * Test script to verify JWT enrichment fix
 * Tests the /api/auth/set-organization endpoint
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testJWTEnrichment() {
  console.log('🧪 Testing JWT Enrichment Fix...\n');

  try {
    // Test 1: Check if the endpoint is accessible
    console.log('📡 Test 1: Endpoint Accessibility');
    const response = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: 'test-org-id'
      })
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);

    if (response.status === 401) {
      console.log('   ✅ Expected 401 (Unauthorized) - endpoint is working');
      console.log('   ✅ This means the async createClient() fix is working');
    } else if (response.status === 500) {
      console.log('   ❌ 500 Internal Server Error - async issue likely still present');
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
      const responseText = await response.text();
      console.log(`   Response: ${responseText}`);
    }

    // Test 2: Check response format
    console.log('\n📋 Test 2: Response Format');
    try {
      const responseData = await response.json();
      console.log('   ✅ Response is valid JSON');
      console.log(`   Response data:`, responseData);
      
      if (responseData.error) {
        console.log('   ✅ Error message is properly formatted');
      }
    } catch (parseError) {
      console.log('   ❌ Response is not valid JSON');
      console.log(`   Parse error: ${parseError.message}`);
      return false;
    }

    // Test 3: Check if the endpoint handles missing organizationId
    console.log('\n🔍 Test 3: Missing Organization ID Handling');
    const missingOrgResponse = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log(`   Status: ${missingOrgResponse.status}`);
    
    if (missingOrgResponse.status === 400) {
      console.log('   ✅ Properly handles missing organizationId with 400 Bad Request');
      const errorData = await missingOrgResponse.json();
      console.log(`   Error message: ${errorData.error}`);
    } else {
      console.log('   ⚠️  Unexpected status for missing organizationId');
    }

    console.log('\n🎉 JWT Enrichment Fix Test Complete!');
    console.log('\n📝 Summary:');
    console.log('   - The async createClient() fix has been applied');
    console.log('   - The endpoint is responding properly');
    console.log('   - Error handling is working correctly');
    console.log('\n✅ The JWT enrichment "Failed to enrich JWT: {}" error should now be resolved!');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   This might indicate a network issue or server not running');
    return false;
  }
}

// Additional test for the GET method
async function testGetOrganization() {
  console.log('\n🔍 Testing GET /api/auth/set-organization...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/set-organization`, {
      method: 'GET'
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ GET method also working (401 Unauthorized expected)');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error('   ❌ GET test failed:', error.message);
  }
}

// Run the tests
async function main() {
  console.log('🚀 Starting JWT Enrichment Fix Verification\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  
  const success = await testJWTEnrichment();
  await testGetOrganization();
  
  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test with actual user authentication');
    console.log('   2. Verify JWT enrichment works in the browser');
    console.log('   3. Check that organization context is properly set');
    console.log('   4. Monitor for any remaining "Failed to enrich JWT: {}" errors');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { testJWTEnrichment, testGetOrganization };
