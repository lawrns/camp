import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
};

test('Debug authentication and dashboard access', async ({ page }) => {
  console.log('🔐 Starting authentication debug test...');

  // Step 1: Login as agent
  console.log('🔐 Logging in as agent...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 2: Check authentication status
  console.log('🔍 Checking authentication status...');
  const response = await page.request.get(`${TEST_CONFIG.baseURL}/api/auth/session`);
  console.log(`📊 Auth session status: ${response.status()}`);
  
  if (response.ok()) {
    const sessionData = await response.json();
    console.log('✅ Authentication successful:', sessionData.user?.email || 'No email');
  } else {
    console.log('❌ Authentication failed');
  }

  // Step 3: Navigate to inbox and check conversations
  console.log('📂 Navigating to inbox...');
  await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Inbox loaded');

  // Wait a bit for conversations to load
  await page.waitForTimeout(3000);

  // Check if conversations are loaded
  const conversations = await page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]').count();
  console.log(`📋 Found ${conversations} conversations in dashboard`);

  // Check if there are any error messages
  const errorMessages = await page.locator('.error, [data-testid="error"]').count();
  console.log(`❌ Found ${errorMessages} error messages`);

  console.log('🔐 Authentication debug test completed');
});
