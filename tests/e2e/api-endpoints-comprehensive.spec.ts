import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestHelpers } from './test-config';

test.describe('API Endpoints Comprehensive Tests', () => {
  test('should test widget messages API endpoint', async ({ page }) => {
    console.log('📡 Testing widget messages API endpoint...');
    
    // Test widget messages API directly
    const response = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/widget/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      },
      data: {
        conversationId: TEST_CONFIG.TEST_CONVERSATION_ID,
        content: 'API test message from widget',
        senderType: 'visitor',
        senderEmail: 'test@example.com',
        senderName: 'Test User'
      }
    });
    
    console.log(`Widget API response status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('Widget API response data:', responseData);
    
    expect(responseData).toHaveProperty('message');
    expect(responseData.message).toHaveProperty('id');
    expect(responseData.message).toHaveProperty('content');
    
    console.log('✅ Widget messages API endpoint test completed');
  });
  
  test('should test dashboard messages API endpoint', async ({ page }) => {
    console.log('📡 Testing dashboard messages API endpoint...');
    
    // Login first to get authentication context
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_EMAIL], TEST_CONFIG.AGENT_EMAIL);
    await TestHelpers.fillInput(page, [TEST_CONFIG.SELECTORS.LOGIN_PASSWORD], TEST_CONFIG.AGENT_PASSWORD);
    await TestHelpers.clickElement(page, [TEST_CONFIG.SELECTORS.LOGIN_SUBMIT]);
    
    await TestHelpers.waitForNavigation(page, '**/dashboard**');
    
    // Test dashboard messages API
    const response = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/dashboard/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      },
      data: {
        conversationId: TEST_CONFIG.TEST_CONVERSATION_ID,
        content: 'API test message from dashboard',
        senderType: 'agent',
        senderEmail: TEST_CONFIG.AGENT_EMAIL,
        senderName: 'Test Agent'
      }
    });
    
    console.log(`Dashboard API response status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('Dashboard API response data:', responseData);
    
    expect(responseData).toHaveProperty('message');
    expect(responseData.message).toHaveProperty('id');
    expect(responseData.message).toHaveProperty('content');
    
    console.log('✅ Dashboard messages API endpoint test completed');
  });
  
  test('should test conversations API endpoint', async ({ page }) => {
    console.log('📡 Testing conversations API endpoint...');
    
    // Test conversations list API
    const response = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/conversations`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Conversations API response status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('Conversations API response data:', responseData);
    
    expect(responseData).toHaveProperty('conversations');
    expect(Array.isArray(responseData.conversations)).toBe(true);
    
    console.log('✅ Conversations API endpoint test completed');
  });
  
  test('should test conversation details API endpoint', async ({ page }) => {
    console.log('📡 Testing conversation details API endpoint...');
    
    // Test specific conversation API
    const response = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/conversations/${TEST_CONFIG.TEST_CONVERSATION_ID}`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Conversation details API response status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('Conversation details API response data:', responseData);
    
    expect(responseData).toHaveProperty('conversation');
    expect(responseData.conversation).toHaveProperty('id');
    expect(responseData.conversation).toHaveProperty('messages');
    
    console.log('✅ Conversation details API endpoint test completed');
  });
  
  test('should test organization API endpoint', async ({ page }) => {
    console.log('📡 Testing organization API endpoint...');
    
    // Test organization details API
    const response = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/organizations/${TEST_CONFIG.TEST_ORG_ID}`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Organization API response status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('Organization API response data:', responseData);
    
    expect(responseData).toHaveProperty('organization');
    expect(responseData.organization).toHaveProperty('id');
    
    console.log('✅ Organization API endpoint test completed');
  });
  
  test('should test authentication API endpoints', async ({ page }) => {
    console.log('📡 Testing authentication API endpoints...');
    
    // Test login API
    const loginResponse = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/login`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: TEST_CONFIG.AGENT_EMAIL,
        password: TEST_CONFIG.AGENT_PASSWORD
      }
    });
    
    console.log(`Login API response status: ${loginResponse.status()}`);
    expect(loginResponse.status()).toBe(200);
    
    const loginData = await loginResponse.json();
    console.log('Login API response data:', loginData);
    
    expect(loginData).toHaveProperty('user');
    expect(loginData).toHaveProperty('session');
    
    // Test user profile API
    const profileResponse = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${loginData.session?.access_token}`
      }
    });
    
    console.log(`Profile API response status: ${profileResponse.status()}`);
    expect(profileResponse.status()).toBe(200);
    
    const profileData = await profileResponse.json();
    console.log('Profile API response data:', profileData);
    
    expect(profileData).toHaveProperty('user');
    expect(profileData.user).toHaveProperty('email');
    
    console.log('✅ Authentication API endpoints test completed');
  });
  
  test('should test error handling in API endpoints', async ({ page }) => {
    console.log('📡 Testing API error handling...');
    
    // Test invalid conversation ID
    const invalidResponse = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/conversations/invalid-id`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Invalid conversation API response status: ${invalidResponse.status()}`);
    expect(invalidResponse.status()).toBe(404);
    
    // Test invalid organization ID
    const invalidOrgResponse = await page.request.get(`${TEST_CONFIG.BASE_URL}/api/organizations/invalid-org-id`, {
      headers: {
        'X-Organization-ID': 'invalid-org-id'
      }
    });
    
    console.log(`Invalid organization API response status: ${invalidOrgResponse.status()}`);
    expect(invalidOrgResponse.status()).toBe(404);
    
    // Test missing required fields in widget messages API
    const missingFieldsResponse = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/widget/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      },
      data: {
        // Missing required fields
      }
    });
    
    console.log(`Missing fields API response status: ${missingFieldsResponse.status()}`);
    expect(missingFieldsResponse.status()).toBe(400);
    
    console.log('✅ API error handling test completed');
  });
  
  test('should test API rate limiting', async ({ page }) => {
    console.log('📡 Testing API rate limiting...');
    
    // Send multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.post(`${TEST_CONFIG.BASE_URL}/api/widget/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
          },
          data: {
            conversationId: TEST_CONFIG.TEST_CONVERSATION_ID,
            content: `Rate limit test message ${i}`,
            senderType: 'visitor',
            senderEmail: 'test@example.com',
            senderName: 'Test User'
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Check if any requests were rate limited (429 status)
    const rateLimitedResponses = responses.filter(response => response.status() === 429);
    console.log(`Rate limited responses: ${rateLimitedResponses.length}`);
    
    // Most requests should succeed
    const successfulResponses = responses.filter(response => response.status() === 200);
    console.log(`Successful responses: ${successfulResponses.length}`);
    
    expect(successfulResponses.length).toBeGreaterThan(0);
    
    console.log('✅ API rate limiting test completed');
  });
}); 