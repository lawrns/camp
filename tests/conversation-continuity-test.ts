/**
 * Conversation Continuity Test
 * 
 * Tests the visitor tracking and conversation continuity implementation
 * by simulating widget authentication with visitor fingerprinting.
 */

import { VisitorFingerprintingService } from '../lib/services/visitor-fingerprinting';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd'
};

// Simulate browser environment for testing
function setupBrowserMocks() {
  // Mock localStorage
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem: function(key: string) {
      return this.store[key] || null;
    },
    setItem: function(key: string, value: string) {
      this.store[key] = value;
    },
    removeItem: function(key: string) {
      delete this.store[key];
    },
    clear: function() {
      this.store = {};
    }
  };

  // Mock navigator
  const navigatorMock = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    language: 'en-US',
    platform: 'MacIntel',
    cookieEnabled: true,
    doNotTrack: '0'
  };

  // Mock screen
  const screenMock = {
    width: 1920,
    height: 1080,
    colorDepth: 24
  };

  // Mock Intl
  const IntlMock = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  };

  // Mock document and canvas
  const canvasMock = {
    getContext: () => ({
      textBaseline: '',
      font: '',
      fillStyle: '',
      fillRect: () => {},
      fillText: () => {}
    }),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  };

  const documentMock = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return canvasMock;
      return {};
    },
    referrer: 'https://example.com'
  };

  // Set up global mocks
  (global as unknown).localStorage = localStorageMock;
  (global as unknown).navigator = navigatorMock;
  (global as unknown).screen = screenMock;
  (global as unknown).Intl = IntlMock;
  (global as unknown).document = documentMock;
}

async function testVisitorFingerprinting() {
  console.log('\n🔍 Testing Visitor Fingerprinting...');
  
  setupBrowserMocks();

  // Test fingerprint generation
  const fingerprint1 = VisitorFingerprintingService.generateFingerprint();
  const fingerprint2 = VisitorFingerprintingService.getOrCreateFingerprint();
  
  console.log(`Generated fingerprint: ${fingerprint1}`);
  console.log(`Retrieved fingerprint: ${fingerprint2}`);
  console.log(`Fingerprints match: ${fingerprint1 === fingerprint2}`);

  // Test visitor ID generation
  const visitorId1 = VisitorFingerprintingService.getOrCreateVisitorId(TEST_CONFIG.organizationId);
  const visitorId2 = VisitorFingerprintingService.getOrCreateVisitorId(TEST_CONFIG.organizationId);
  
  console.log(`Generated visitor ID: ${visitorId1}`);
  console.log(`Retrieved visitor ID: ${visitorId2}`);
  console.log(`Visitor IDs match: ${visitorId1 === visitorId2}`);

  // Test metadata
  const metadata = VisitorFingerprintingService.getVisitorMetadata();
  console.log(`Visitor metadata:`, metadata);

  return {
    fingerprint: fingerprint1,
    visitorId: visitorId1,
    fingerprintsMatch: fingerprint1 === fingerprint2,
    visitorIdsMatch: visitorId1 === visitorId2
  };
}

async function testWidgetAuth(visitorId: string, sessionFingerprint: string) {
  console.log('\n🔐 Testing Widget Authentication...');

  const authPayload = {
    organizationId: TEST_CONFIG.organizationId,
    visitorId: visitorId,
    sessionFingerprint: sessionFingerprint,
    sessionData: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: Date.now(),
      referrer: 'https://example.com'
    }
  };

  console.log('Auth payload:', JSON.stringify(authPayload, null, 2));

  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/widget/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authPayload)
    });

    const result = await response.json();
    console.log('Auth response:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Auth test failed:', error);
    return null;
  }
}

async function testConversationContinuity() {
  console.log('\n🔄 Testing Conversation Continuity...');

  // Test 1: First session
  console.log('\n--- First Session ---');
  const session1 = await testVisitorFingerprinting();
  const auth1 = await testWidgetAuth(session1.visitorId, session1.fingerprint);

  if (auth1?.success) {
    console.log(`✅ First session created conversation: ${auth1.conversationId}`);
  } else {
    console.log('❌ First session failed');
    return;
  }

  // Test 2: Second session with same visitor ID and fingerprint
  console.log('\n--- Second Session (Same Visitor) ---');
  const auth2 = await testWidgetAuth(session1.visitorId, session1.fingerprint);

  if (auth2?.success) {
    console.log(`✅ Second session conversation: ${auth2.conversationId}`);
    
    if (auth1.conversationId === auth2.conversationId) {
      console.log('🎉 SUCCESS: Conversation continuity working! Same conversation ID returned.');
    } else {
      console.log('⚠️ WARNING: Different conversation IDs returned. Continuity may not be working.');
    }
  } else {
    console.log('❌ Second session failed');
  }

  // Test 3: Third session with different visitor (should create new conversation)
  console.log('\n--- Third Session (New Visitor) ---');
  const session3 = await testVisitorFingerprinting();
  // Clear storage to simulate new visitor
  VisitorFingerprintingService.clearVisitorData();
  const newVisitorId = VisitorFingerprintingService.getOrCreateVisitorId(TEST_CONFIG.organizationId);
  const newFingerprint = VisitorFingerprintingService.getOrCreateFingerprint();
  
  const auth3 = await testWidgetAuth(newVisitorId, newFingerprint);

  if (auth3?.success) {
    console.log(`✅ Third session conversation: ${auth3.conversationId}`);
    
    if (auth1.conversationId !== auth3.conversationId) {
      console.log('🎉 SUCCESS: New visitor gets new conversation ID.');
    } else {
      console.log('⚠️ WARNING: Same conversation ID for different visitor.');
    }
  } else {
    console.log('❌ Third session failed');
  }

  return {
    session1ConversationId: auth1?.conversationId,
    session2ConversationId: auth2?.conversationId,
    session3ConversationId: auth3?.conversationId,
    continuityWorking: auth1?.conversationId === auth2?.conversationId,
    newVisitorWorking: auth1?.conversationId !== auth3?.conversationId
  };
}

// Run the test
async function runTest() {
  console.log('🚀 Starting Conversation Continuity Test');
  console.log('=========================================');

  try {
    const results = await testConversationContinuity();
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Conversation continuity working: ${results?.continuityWorking ? '✅ YES' : '❌ NO'}`);
    console.log(`New visitor separation working: ${results?.newVisitorWorking ? '✅ YES' : '❌ NO'}`);
    
    if (results?.continuityWorking && results?.newVisitorWorking) {
      console.log('\n🎉 ALL TESTS PASSED! Conversation management optimization is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation.');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Export for use in other test files
export { testVisitorFingerprinting, testWidgetAuth, testConversationContinuity, runTest };

// Run if called directly
if (require.main === module) {
  runTest();
}
