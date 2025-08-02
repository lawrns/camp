#!/usr/bin/env node

/**
 * BIDIRECTIONAL COMMUNICATION TEST SUITE
 * 
 * This script tests all aspects of realtime communication to identify
 * the silent failures that are causing ghost messages and broken handovers.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BIDIRECTIONAL COMMUNICATION ERROR DETECTION');
console.log('==============================================\n');

// Test 1: Check for missing ensureChannelSubscription function
console.log('📡 Test 1: Channel Subscription Fixes');
try {
  const srcRealtimeFile = fs.readFileSync('src/lib/realtime/standardized-realtime.ts', 'utf8');
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  // Check if src version is missing the critical fix
  if (!srcRealtimeFile.includes('ensureChannelSubscription')) {
    console.log('❌ CRITICAL: src/lib/realtime/standardized-realtime.ts missing ensureChannelSubscription');
    console.log('   This is causing silent broadcast failures');
  } else {
    console.log('✅ ensureChannelSubscription function found in src version');
  }

  if (!srcRealtimeFile.includes('await ensureChannelSubscription')) {
    console.log('❌ CRITICAL: broadcastToChannel not using ensureChannelSubscription in src version');
    console.log('   This is the root cause of ghost messages');
  } else {
    console.log('✅ broadcastToChannel uses ensureChannelSubscription in src version');
  }

  // Check if lib version has the fix
  if (libRealtimeFile.includes('ensureChannelSubscription') && libRealtimeFile.includes('await ensureChannelSubscription')) {
    console.log('✅ lib version has the working implementation');
  } else {
    console.log('❌ lib version also missing the fix');
  }

} catch (error) {
  console.log('❌ Test 1 failed:', error.message);
}

// Test 2: Check for auth validation in realtime
console.log('\n🔐 Test 2: Authentication Validation');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('auth.getSession()')) {
    console.log('✅ Auth validation implemented in lib version');
  } else {
    console.log('❌ Auth validation missing - this could cause auth failures');
  }

  if (libRealtimeFile.includes('access_token')) {
    console.log('✅ Access token validation implemented');
  } else {
    console.log('❌ Access token validation missing');
  }

} catch (error) {
  console.log('❌ Test 2 failed:', error.message);
}

// Test 3: Check for proper error handling
console.log('\n🛡️ Test 3: Error Handling');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('SABOTEUR-FIX-V3')) {
    console.log('✅ Enhanced error handling with detailed logging');
  } else {
    console.log('❌ Missing enhanced error handling');
  }

  if (libRealtimeFile.includes('Broadcast result:')) {
    console.log('✅ Detailed broadcast result logging');
  } else {
    console.log('❌ Missing broadcast result logging');
  }

} catch (error) {
  console.log('❌ Test 3 failed:', error.message);
}

// Test 4: Check for subscription timeout handling
console.log('\n⏰ Test 4: Subscription Timeout Handling');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('5000')) {
    console.log('✅ 5-second subscription timeout implemented');
  } else {
    console.log('❌ Subscription timeout missing');
  }

  if (libRealtimeFile.includes('Subscription timeout for')) {
    console.log('✅ Subscription timeout error handling');
  } else {
    console.log('❌ Subscription timeout error handling missing');
  }

} catch (error) {
  console.log('❌ Test 4 failed:', error.message);
}

// Test 5: Check for channel state validation
console.log('\n📊 Test 5: Channel State Validation');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('channel.state === \'joined\'')) {
    console.log('✅ Channel state check before subscription');
  } else {
    console.log('❌ Channel state check missing');
  }

  if (libRealtimeFile.includes('Channel state before subscription:')) {
    console.log('✅ Channel state logging implemented');
  } else {
    console.log('❌ Channel state logging missing');
  }

} catch (error) {
  console.log('❌ Test 5 failed:', error.message);
}

// Test 6: Check for global function exposure for debugging
console.log('\n🐛 Test 6: Debug Function Exposure');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('broadcastToChannel = broadcastToChannel')) {
    console.log('✅ Global function exposure for debugging');
  } else {
    console.log('❌ Global function exposure missing');
  }

  if (libRealtimeFile.includes('REALTIME_VERSION')) {
    console.log('✅ Version tracking for debugging');
  } else {
    console.log('❌ Version tracking missing');
  }

} catch (error) {
  console.log('❌ Test 6 failed:', error.message);
}

// Test 7: Check for proper payload logging
console.log('\n📤 Test 7: Payload Logging');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('Broadcast payload:')) {
    console.log('✅ Payload logging implemented');
  } else {
    console.log('❌ Payload logging missing');
  }

  if (libRealtimeFile.includes('payloadSize:')) {
    console.log('✅ Payload size tracking');
  } else {
    console.log('❌ Payload size tracking missing');
  }

} catch (error) {
  console.log('❌ Test 7 failed:', error.message);
}

// Test 8: Check for failure details logging
console.log('\n🔍 Test 8: Failure Details Logging');
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (libRealtimeFile.includes('Failure details:')) {
    console.log('✅ Failure details logging');
  } else {
    console.log('❌ Failure details logging missing');
  }

  if (libRealtimeFile.includes('Error details:')) {
    console.log('✅ Error details logging');
  } else {
    console.log('❌ Error details logging missing');
  }

} catch (error) {
  console.log('❌ Test 8 failed:', error.message);
}

// Summary
console.log('\n📋 SUMMARY OF CRITICAL ISSUES');
console.log('==============================');

const issues = [];

// Check if src version is broken
try {
  const srcRealtimeFile = fs.readFileSync('src/lib/realtime/standardized-realtime.ts', 'utf8');
  if (!srcRealtimeFile.includes('ensureChannelSubscription')) {
    issues.push('❌ src/lib/realtime/standardized-realtime.ts missing ensureChannelSubscription');
  }
  if (!srcRealtimeFile.includes('await ensureChannelSubscription')) {
    issues.push('❌ src/lib/realtime/standardized-realtime.ts broadcastToChannel not using ensureChannelSubscription');
  }
} catch (error) {
  issues.push('❌ Cannot read src/lib/realtime/standardized-realtime.ts');
}

// Check if lib version has fixes
try {
  const libRealtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  if (libRealtimeFile.includes('ensureChannelSubscription') && libRealtimeFile.includes('await ensureChannelSubscription')) {
    console.log('✅ lib/realtime/standardized-realtime.ts has working implementation');
  } else {
    issues.push('❌ lib/realtime/standardized-realtime.ts also missing fixes');
  }
} catch (error) {
  issues.push('❌ Cannot read lib/realtime/standardized-realtime.ts');
}

if (issues.length === 0) {
  console.log('✅ All critical issues resolved');
} else {
  console.log('\n🚨 CRITICAL ISSUES FOUND:');
  issues.forEach(issue => console.log(issue));
  console.log('\n💡 RECOMMENDATION: Copy the working implementation from lib/ to src/');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Fix src/lib/realtime/standardized-realtime.ts');
console.log('2. Test bidirectional communication');
console.log('3. Monitor for ghost messages');
console.log('4. Verify handover functionality'); 