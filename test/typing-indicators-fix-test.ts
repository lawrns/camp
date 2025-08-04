/**
 * Typing Indicators Fix Test
 * 
 * Tests the corrected implementation using database-driven approach
 */

/**
 * Test the widget typing indicator API endpoint
 */
export async function testWidgetTypingAPI() {
  console.log('🧪 Testing Widget Typing API Fix...');
  
  const testData = {
    conversationId: 'c6ea0690-3ca9-46d0-ae6d-b437b0f6dfeb',
    organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    userId: 'test_visitor_' + Date.now(),
    userName: 'Test Customer'
  };

  try {
    // Test 1: Start typing
    console.log('\n📝 Test 1: Start typing indicator...');
    const startResponse = await fetch('/api/widget/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': testData.organizationId,
      },
      body: JSON.stringify({
        conversationId: testData.conversationId,
        userId: testData.userId,
        userName: testData.userName,
        isTyping: true,
      }),
    });

    if (startResponse.ok) {
      const startResult = await startResponse.json();
      console.log('✅ Start typing API successful:', startResult);
    } else {
      const startError = await startResponse.json().catch(() => ({}));
      console.error('❌ Start typing API failed:', startResponse.status, startError);
      return false;
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Stop typing
    console.log('\n📝 Test 2: Stop typing indicator...');
    const stopResponse = await fetch('/api/widget/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': testData.organizationId,
      },
      body: JSON.stringify({
        conversationId: testData.conversationId,
        userId: testData.userId,
        userName: testData.userName,
        isTyping: false,
      }),
    });

    if (stopResponse.ok) {
      const stopResult = await stopResponse.json();
      console.log('✅ Stop typing API successful:', stopResult);
    } else {
      const stopError = await stopResponse.json().catch(() => ({}));
      console.error('❌ Stop typing API failed:', stopResponse.status, stopError);
      return false;
    }

    // Test 3: Get typing indicators
    console.log('\n📝 Test 3: Get typing indicators...');
    const getResponse = await fetch(
      `/api/widget/typing?conversationId=${testData.conversationId}&organizationId=${testData.organizationId}`
    );

    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Get typing indicators successful:', getResult);
    } else {
      const getError = await getResponse.json().catch(() => ({}));
      console.error('❌ Get typing indicators failed:', getResponse.status, getError);
    }

    console.log('\n🎉 Widget Typing API Test completed successfully!');
    return true;

  } catch (error) {
    console.error('💥 Widget Typing API Test failed:', error);
    return false;
  }
}

/**
 * Test real-time subscription to typing indicators
 */
export async function testTypingIndicatorSubscription() {
  console.log('\n🧪 Testing Typing Indicator Real-time Subscription...');
  
  const testData = {
    conversationId: 'c6ea0690-3ca9-46d0-ae6d-b437b0f6dfeb',
    organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  };

  try {
    // Import Supabase client
    const { supabase } = await import('@/lib/supabase');
    const client = supabase.browser();

    console.log('📡 Setting up real-time subscription...');
    
    // Set up subscription to typing indicators
    const channel = client
      .channel(`test-typing-${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "typing_indicators",
        filter: `conversation_id=eq.${testData.conversationId}`,
      }, (payload: unknown) => {
        console.log('✅ REAL-TIME: Received typing indicator INSERT:', payload);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "typing_indicators",
        filter: `conversation_id=eq.${testData.conversationId}`,
      }, (payload: unknown) => {
        console.log('✅ REAL-TIME: Received typing indicator UPDATE:', payload);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "typing_indicators",
        filter: `conversation_id=eq.${testData.conversationId}`,
      }, (payload: unknown) => {
        console.log('✅ REAL-TIME: Received typing indicator DELETE:', payload);
      });

    // Subscribe to the channel
    const subscriptionResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Subscription timeout after 10 seconds'));
      }, 10000);

      channel.subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve(status);
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error('Channel subscription error'));
        }
      });
    });

    console.log('✅ Real-time subscription successful:', subscriptionResult);

    // Clean up
    setTimeout(() => {
      channel.unsubscribe();
      console.log('🧹 Cleaned up test subscription');
    }, 5000);

    return true;

  } catch (error) {
    console.error('💥 Real-time subscription test failed:', error);
    return false;
  }
}

/**
 * Run all typing indicator tests
 */
export async function runTypingIndicatorTests() {
  console.log('🚀 Starting Typing Indicators Fix Tests...');
  
  const apiTest = await testWidgetTypingAPI();
  const subscriptionTest = await testTypingIndicatorSubscription();
  
  if (apiTest && subscriptionTest) {
    console.log('\n🎉 ALL TESTS PASSED! Typing indicators should now work correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the logs above for details.');
  }
  
  return apiTest && subscriptionTest;
}

/**
 * Make test available globally for browser console testing
 */
if (typeof window !== 'undefined') {
  (window as unknown).testTypingIndicators = runTypingIndicatorTests;
  (window as unknown).testWidgetTypingAPI = testWidgetTypingAPI;
  (window as unknown).testTypingSubscription = testTypingIndicatorSubscription;
  console.log('🧪 Typing indicator tests available:');
  console.log('  - window.testTypingIndicators() - Run all tests');
  console.log('  - window.testWidgetTypingAPI() - Test API only');
  console.log('  - window.testTypingSubscription() - Test subscription only');
}
