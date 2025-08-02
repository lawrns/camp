#!/usr/bin/env node

/**
 * 🧪 MINIMAL REALTIME TEST
 * 
 * This creates a minimal test that can be run in the browser console
 * to isolate the exact point of failure
 */

console.log('🧪 Generating Minimal Realtime Test...\n');

const testCode = `
// 🧪 MINIMAL REALTIME TEST - Paste this in browser console
// Run this in the dashboard at http://localhost:3001/dashboard/inbox

console.log('🧪 Starting Minimal Realtime Test...');

// Test 1: Check if Supabase client is available
console.log('\\n📋 Test 1: Supabase Client Check');
console.log('=================================');

if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
  console.log('✅ Supabase client found in window');
  const client = window.__SUPABASE_CLIENT__;
  
  // Test auth session
  client.auth.getSession().then(({ data: session, error }) => {
    if (error) {
      console.error('❌ Auth session error:', error);
    } else if (session?.session?.access_token) {
      console.log('✅ Valid auth session found');
      console.log('🔐 Token preview:', session.session.access_token.substring(0, 20) + '...');
      
      // Test 2: Create and subscribe to a test channel
      console.log('\\n📡 Test 2: Channel Subscription Test');
      console.log('====================================');
      
      const testChannelName = 'test-channel-' + Date.now();
      console.log('🏗️  Creating test channel:', testChannelName);
      
      const channel = client.channel(testChannelName, {
        config: {
          broadcast: { self: true },
          presence: { key: 'user_id' }
        }
      });
      
      console.log('📊 Initial channel state:', channel.state);
      
      // Add comprehensive event listeners
      channel.on('system', {}, (payload) => {
        console.log('🔔 System event:', payload);
      });
      
      channel.on('broadcast', { event: '*' }, (payload) => {
        console.log('📡 Broadcast received:', payload);
      });
      
      // Test subscription
      console.log('🔄 Starting subscription...');
      channel.subscribe((status) => {
        console.log('📢 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Channel successfully subscribed!');
          console.log('📊 Final channel state:', channel.state);
          
          // Test 3: Attempt broadcast
          console.log('\\n🚀 Test 3: Broadcast Test');
          console.log('==========================');
          
          const testPayload = {
            message: 'test-message-' + Date.now(),
            timestamp: new Date().toISOString()
          };
          
          console.log('📤 Sending test broadcast...');
          channel.send({
            type: 'broadcast',
            event: 'test-event',
            payload: testPayload
          }).then(result => {
            if (result === 'ok') {
              console.log('✅ Broadcast successful!');
            } else {
              console.error('❌ Broadcast failed:', result);
            }
          }).catch(error => {
            console.error('💥 Broadcast error:', error);
          });
          
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ Subscription failed:', status);
        }
      });
      
    } else {
      console.error('❌ No valid auth session');
    }
  });
  
} else {
  console.error('❌ Supabase client not found');
  console.log('ℹ️  Try importing the client first:');
  console.log('   import { supabase } from "/lib/supabase"');
  console.log('   const client = supabase.browser()');
}

// Test 4: Check if our enhanced code is running
console.log('\\n🔍 Test 4: Enhanced Code Verification');
console.log('======================================');

// Try to access the enhanced functions
if (typeof window !== 'undefined' && window.broadcastToChannel) {
  console.log('✅ Enhanced broadcastToChannel function available');
} else {
  console.log('❌ Enhanced broadcastToChannel function not available');
  console.log('ℹ️  This suggests the enhanced code is not loaded');
}

console.log('\\n🎯 Test Complete - Check results above');
`;

console.log('📋 MINIMAL REALTIME TEST CODE');
console.log('==============================');
console.log(testCode);

console.log('\n🎯 INSTRUCTIONS:');
console.log('================');
console.log('1. Start the dev server: npm run dev');
console.log('2. Open dashboard: http://localhost:3001/dashboard/inbox');
console.log('3. Open browser console (F12)');
console.log('4. Paste the test code above');
console.log('5. Watch the console output to see exactly where it fails');
console.log('');
console.log('🔍 WHAT TO LOOK FOR:');
console.log('====================');
console.log('✅ Valid auth session found');
console.log('✅ Channel successfully subscribed');
console.log('✅ Broadcast successful');
console.log('');
console.log('❌ Auth session error');
console.log('❌ Subscription failed');
console.log('❌ Broadcast failed');

console.log('\n🧪 Minimal test generated - ready for browser testing!');
