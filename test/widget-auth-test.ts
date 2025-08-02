/**
 * Widget Authentication Test
 * 
 * Tests the widget authentication fix for real-time operations
 */

import { ensureWidgetAuthentication, getAuthDebugInfo } from '@/lib/realtime/widget-auth-helper';

/**
 * Test widget authentication functionality
 */
export async function testWidgetAuthentication() {
  console.log('🧪 Starting Widget Authentication Test...');
  
  const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const testVisitorId = `test_visitor_${Date.now()}`;

  try {
    // Test 1: Get current auth state
    console.log('\n📋 Test 1: Getting current auth state...');
    const debugInfo = await getAuthDebugInfo();
    console.log('Auth debug info:', debugInfo);

    // Test 2: Ensure authentication
    console.log('\n🔐 Test 2: Ensuring widget authentication...');
    const authResult = await ensureWidgetAuthentication(testOrgId, testVisitorId);
    
    if (authResult.isAuthenticated) {
      console.log('✅ Authentication successful!');
      console.log('Session info:', {
        hasAccessToken: !!authResult.session?.access_token,
        userId: authResult.session?.user?.id,
        isAnonymous: authResult.session?.user?.is_anonymous,
        expiresAt: authResult.session?.expires_at
      });
    } else {
      console.error('❌ Authentication failed:', authResult.error);
      return false;
    }

    // Test 3: Test typing indicator channel
    console.log('\n📡 Test 3: Testing typing indicator channel...');
    try {
      const { broadcastToChannel, UNIFIED_CHANNELS, UNIFIED_EVENTS } = await import('@/lib/realtime/standardized-realtime');
      
      const channelName = UNIFIED_CHANNELS.conversationTyping(testOrgId, 'test-conversation');
      console.log('Testing channel:', channelName);
      
      const success = await broadcastToChannel(
        channelName,
        UNIFIED_EVENTS.TYPING_START,
        {
          userId: testVisitorId,
          isTyping: true,
          timestamp: new Date().toISOString()
        }
      );

      if (success) {
        console.log('✅ Typing indicator broadcast successful!');
      } else {
        console.warn('⚠️ Typing indicator broadcast failed');
      }
    } catch (broadcastError) {
      console.error('❌ Broadcast test failed:', broadcastError);
    }

    console.log('\n🎉 Widget Authentication Test completed successfully!');
    return true;

  } catch (error) {
    console.error('💥 Widget Authentication Test failed:', error);
    return false;
  }
}

/**
 * Run the test if this file is executed directly
 */
if (typeof window !== 'undefined') {
  // Make test available globally for browser console testing
  (window as any).testWidgetAuthentication = testWidgetAuthentication;
  console.log('🧪 Widget authentication test available as window.testWidgetAuthentication()');
}
