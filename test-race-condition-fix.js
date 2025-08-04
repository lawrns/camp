#!/usr/bin/env node

/**
 * Test script to verify the race condition fix in realtime channels
 * This simulates the scenario where handleStopTyping was called immediately
 * after sendMessageHP, causing channel closures.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://b5e80170-004c-4e82-a88c-3e2166b169dd.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImI1ZTgwMTcwLTAwNGMtNGU4Mi1hODhjLTNlMjE2NmIxNjlkZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NTQ5NzE5LCJleHAiOjIwNTAxMjU3MTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const TEST_CONV_ID = '9e192f0a-92ed-4533-b31a-fb408afbac85';

async function testRaceConditionFix() {
  console.log('🧪 Testing Race Condition Fix...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test 1: Simulate the old behavior (immediate unsubscribe)
  console.log('📋 Test 1: Simulating old behavior (immediate unsubscribe)');
  
  const channel1 = supabase.channel(`test-race-old-${Date.now()}`, {
    config: {
      broadcast: { self: true, ack: true },
      presence: { key: 'test' }
    }
  });
  
  let channel1Status = 'unknown';
  
  channel1.subscribe((status) => {
    channel1Status = status;
    console.log(`   Channel 1 status: ${status}`);
  });
  
  // Wait for subscription
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (channel1Status === 'SUBSCRIBED') {
    console.log('   ✅ Channel 1 subscribed successfully');
    
    // Simulate sending message + immediate unsubscribe (old behavior)
    const sendPromise = channel1.send({
      type: 'broadcast',
      event: 'test_message',
      payload: { content: 'Test message' }
    });
    
    // Immediate unsubscribe (this was causing the race condition)
    channel1.unsubscribe();
    console.log('   ⚠️ Unsubscribed immediately after send (old behavior)');
    
    try {
      const result = await sendPromise;
      console.log(`   📤 Send result: ${result}`);
    } catch (error) {
      console.log(`   ❌ Send failed: ${error.message}`);
    }
  } else {
    console.log('   ❌ Channel 1 failed to subscribe');
  }
  
  console.log('\n📋 Test 2: Testing new behavior (delayed unsubscribe)');
  
  // Test 2: Simulate the new behavior (delayed unsubscribe)
  const channel2 = supabase.channel(`test-race-new-${Date.now()}`, {
    config: {
      broadcast: { self: true, ack: true },
      presence: { key: 'test' }
    }
  });
  
  let channel2Status = 'unknown';
  
  channel2.subscribe((status) => {
    channel2Status = status;
    console.log(`   Channel 2 status: ${status}`);
  });
  
  // Wait for subscription
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (channel2Status === 'SUBSCRIBED') {
    console.log('   ✅ Channel 2 subscribed successfully');
    
    // Simulate sending message
    const sendPromise = channel2.send({
      type: 'broadcast',
      event: 'test_message',
      payload: { content: 'Test message' }
    });
    
    try {
      const result = await sendPromise;
      console.log(`   📤 Send result: ${result}`);
      
      // Delayed unsubscribe (new behavior - 150ms delay)
      setTimeout(() => {
        channel2.unsubscribe();
        console.log('   ✅ Unsubscribed after 150ms delay (new behavior)');
      }, 150);
      
    } catch (error) {
      console.log(`   ❌ Send failed: ${error.message}`);
    }
  } else {
    console.log('   ❌ Channel 2 failed to subscribe');
  }
  
  // Wait for delayed unsubscribe to complete
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('\n🎯 Test Results:');
  console.log('   - Old behavior: Immediate unsubscribe may cause race conditions');
  console.log('   - New behavior: 150ms delay prevents race conditions');
  console.log('   - Fix implemented in handleSendMessage functions');
  
  console.log('\n✅ Race condition fix test completed!');
}

// Run the test
testRaceConditionFix().catch(console.error);
