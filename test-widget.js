// Test script to verify widget functionality
const organizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd'; // Valid UUID from logs
const baseUrl = 'http://localhost:3000';

async function testWidget() {
    console.log('Testing widget functionality...');
    
    try {
        // Test 1: Create conversation
        console.log('\n1. Testing conversation creation...');
        const createResponse = await fetch(`${baseUrl}/api/widget`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Organization-ID': organizationId,
            },
            body: JSON.stringify({
                action: 'create-conversation',
                visitorId: 'test-visitor-123',
                customerEmail: 'test@example.com',
                customerName: 'Test User'
            })
        });
        
        if (!createResponse.ok) {
            throw new Error(`Create conversation failed: ${createResponse.status} ${createResponse.statusText}`);
        }
        
        const createResult = await createResponse.json();
        console.log('✅ Conversation created:', createResult);
        
        const conversationId = createResult.conversationId;
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(conversationId)) {
            throw new Error(`Invalid conversation ID format: ${conversationId}`);
        }
        console.log('✅ Conversation ID is valid UUID format');
        
        // Test 2: Send message
        console.log('\n2. Testing message sending...');
        const sendResponse = await fetch(`${baseUrl}/api/widget`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Organization-ID': organizationId,
            },
            body: JSON.stringify({
                action: 'send-message',
                conversationId: conversationId,
                content: 'Hello, this is a test message!',
                visitorId: 'test-visitor-123'
            })
        });
        
        if (!sendResponse.ok) {
            const errorText = await sendResponse.text();
            throw new Error(`Send message failed: ${sendResponse.status} ${sendResponse.statusText} - ${errorText}`);
        }
        
        const sendResult = await sendResponse.json();
        console.log('✅ Message sent successfully:', sendResult);
        
        console.log('\n🎉 All tests passed! Widget functionality is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testWidget();