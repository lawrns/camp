#!/usr/bin/env node

/**
 * 🔍 REALTIME ISOLATION TEST
 * 
 * This script will help us identify the exact point of failure by testing
 * each component in isolation:
 * 1. Supabase client creation
 * 2. Channel creation
 * 3. Channel subscription
 * 4. Broadcast attempt
 */

console.log('🔍 Starting Realtime Isolation Diagnostic...\n');

// Test 1: Check if the enhanced code is actually running
console.log('📋 Test 1: Code Version Verification');
console.log('=====================================');

const fs = require('fs');

try {
  const realtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (realtimeFile.includes('SABOTEUR-FIX-V2')) {
    console.log('✅ Enhanced code version detected (SABOTEUR-FIX-V2)');
  } else {
    console.log('❌ Enhanced code version NOT detected - caching issue?');
  }

  if (realtimeFile.includes('ensureChannelSubscription called for')) {
    console.log('✅ Enhanced subscription logging present');
  } else {
    console.log('❌ Enhanced subscription logging missing');
  }
} catch (error) {
  console.log('❌ Code verification failed:', error.message);
}

// Test 2: Check auth validation design flaw
console.log('\n🔐 Test 2: Auth Validation Design Analysis');
console.log('==========================================');

try {
  const supabaseFile = fs.readFileSync('lib/supabase/index.ts', 'utf8');
  
  if (supabaseFile.includes('validateAuthToken(browserClient);') && 
      !supabaseFile.includes('await validateAuthToken')) {
    console.log('❌ CRITICAL FLAW: validateAuthToken called without await');
    console.log('   This means auth validation never completes!');
  } else if (supabaseFile.includes('await validateAuthToken')) {
    console.log('✅ Auth validation properly awaited');
  } else {
    console.log('⚠️  Auth validation call not found');
  }

  if (supabaseFile.includes('async function validateAuthToken')) {
    console.log('✅ validateAuthToken is async function');
  } else {
    console.log('❌ validateAuthToken not found or not async');
  }

  if (supabaseFile.includes('export function getBrowserClient()') && 
      !supabaseFile.includes('export async function getBrowserClient()')) {
    console.log('❌ DESIGN FLAW: getBrowserClient is sync but calls async validateAuthToken');
    console.log('   This creates a race condition!');
  }
} catch (error) {
  console.log('❌ Auth analysis failed:', error.message);
}

// Test 3: Check for execution path issues
console.log('\n🔄 Test 3: Execution Path Analysis');
console.log('===================================');

try {
  const useRealtimeFile = fs.readFileSync('hooks/useRealtime.ts', 'utf8');
  const realtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (useRealtimeFile.includes('RealtimeHelpers.broadcastMessage') && 
      realtimeFile.includes('broadcastToChannel')) {
    console.log('✅ Execution path: useRealtime → RealtimeHelpers → broadcastToChannel');
  } else {
    console.log('❌ Execution path broken');
  }

  if (realtimeFile.includes('ensureChannelSubscription(channelName, config)')) {
    console.log('✅ broadcastToChannel calls ensureChannelSubscription');
  } else {
    console.log('❌ ensureChannelSubscription not called from broadcastToChannel');
  }
} catch (error) {
  console.log('❌ Execution path analysis failed:', error.message);
}

// Test 4: Identify potential race conditions
console.log('\n⏱️  Test 4: Race Condition Analysis');
console.log('===================================');

try {
  const realtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (realtimeFile.includes('await ensureChannelSubscription') && 
      realtimeFile.includes('channel.send')) {
    console.log('✅ Subscription awaited before broadcast');
  } else {
    console.log('❌ Potential race condition: broadcast not waiting for subscription');
  }

  if (realtimeFile.includes('channel.state === \'joined\'')) {
    console.log('✅ Channel state check present');
  } else {
    console.log('❌ No channel state validation');
  }

  if (realtimeFile.includes('new Promise') && realtimeFile.includes('channel.subscribe')) {
    console.log('✅ Promise-based subscription waiting');
  } else {
    console.log('❌ No proper subscription waiting mechanism');
  }
} catch (error) {
  console.log('❌ Race condition analysis failed:', error.message);
}

// Test 5: Check for Supabase API compatibility issues
console.log('\n🔌 Test 5: Supabase API Compatibility');
console.log('=====================================');

try {
  const realtimeFile = fs.readFileSync('lib/realtime/standardized-realtime.ts', 'utf8');
  
  if (realtimeFile.includes('channel.subscribe((status)')) {
    console.log('✅ Using callback-based subscription (correct for Supabase)');
  } else if (realtimeFile.includes('await channel.subscribe()')) {
    console.log('❌ Using promise-based subscription (incorrect for Supabase)');
  } else {
    console.log('⚠️  Subscription method unclear');
  }

  if (realtimeFile.includes('status === \'SUBSCRIBED\'')) {
    console.log('✅ Checking for SUBSCRIBED status');
  } else {
    console.log('❌ Not checking for SUBSCRIBED status');
  }
} catch (error) {
  console.log('❌ API compatibility analysis failed:', error.message);
}

console.log('\n🎯 DIAGNOSTIC SUMMARY');
console.log('=====================');
console.log('Based on this analysis, the most likely issues are:');
console.log('');
console.log('1. 🚨 CRITICAL: Auth validation race condition');
console.log('   - validateAuthToken() is async but not awaited');
console.log('   - getBrowserClient() returns before auth validation completes');
console.log('   - Channels created with invalid/unvalidated auth');
console.log('');
console.log('2. ⏱️  TIMING: Subscription promise resolution');
console.log('   - ensureChannelSubscription() may not be waiting properly');
console.log('   - Channel state checks might be unreliable');
console.log('');
console.log('3. 🔄 CACHING: Code version mismatch');
console.log('   - Enhanced code might not be running due to build cache');
console.log('   - Browser cache preventing new code execution');

console.log('\n🛠️  RECOMMENDED IMMEDIATE ACTIONS');
console.log('==================================');
console.log('1. Fix auth validation race condition by making getBrowserClient async');
console.log('2. Add unique identifiers to verify new code is running');
console.log('3. Test channel subscription in complete isolation');
console.log('4. Clear all caches and rebuild application');
console.log('5. Add granular timing logs to identify exact failure point');

console.log('\n🔥 Diagnostic Complete - Ready for Targeted Fixes!');
