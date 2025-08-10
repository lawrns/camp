import { test as setup, expect } from '@playwright/test';

// This setup runs before browser projects to produce a storageState and hide the Next.js dev overlay.
// It relies on Playwright projects depending on `setup` and using storageState: 'e2e/auth-state.json'.

setup.setTimeout(120000);

setup('authenticate and prepare UI environment', async ({ page }) => {
  // Helper to hide Next.js dev overlay that intercepts pointer events
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      nextjs-portal, [data-nextjs-portal] {
        display: none !important;
        pointer-events: none !important;
      }
      #nextjs__container, #nextjs-toast, #nextjs-global-error, [data-nextjs-error-overlay] {
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  });

  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  const email = process.env.E2E_EMAIL || 'jam@jam.com';
  const password = process.env.E2E_PASSWORD || 'password123';

  // Navigate to login and authenticate (API-first to be robust in mock mode)
  // Handle locale redirects by following them
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // Wait for potential locale redirect to complete
  await page.waitForLoadState('networkidle');

  // Get the current URL after potential redirects to determine the correct API path
  const currentUrl = page.url();
  const isLocalized = currentUrl.includes('/es/');
  const apiPath = isLocalized ? '/es/api/auth/login' : '/api/auth/login';

  console.log('[E2E Auth] Current URL after redirect:', currentUrl);
  console.log('[E2E Auth] Using API path:', apiPath);

  // For E2E tests, always use the UI path since API routes have locale issues
  console.log('[E2E Auth] Using UI login path for E2E reliability');

  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });

  // Fill login form
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]', { force: true });

  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  } catch {
    // Fallback 1: perform API auth via request fixture to get server cookies
    const res = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });
    if (!res.ok()) {
      throw new Error(`API auth failed with status ${res.status()}`);
    }
    // Navigate to dashboard to ensure browser has cookies
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  }

  // Create test data for E2E tests
  console.log('🔧 Creating test data...');

  try {
    // Get organization ID from current user context
    const userRes = await page.request.get(`${BASE_URL}/api/auth/user`);
    const userData = await userRes.json();
    const organizationId = userData?.organizationId || 'test-org-id';

    // Create test conversations via widget API
    const createConversationRes = await page.request.post(`${BASE_URL}/api/widget/conversations`, {
      data: {
        customerEmail: 'test-customer@example.com',
        customerName: 'Test Customer',
        subject: 'E2E Test Conversation'
      },
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': organizationId
      },
    });

    if (createConversationRes.ok()) {
      const conversation = await createConversationRes.json();
      console.log('✅ Created test conversation:', conversation.id);

      // Create a test message in the conversation
      await page.request.post(`${BASE_URL}/api/widget/messages`, {
        data: {
          conversationId: conversation.id,
          content: 'Test message for E2E testing',
          senderType: 'visitor',
          senderName: 'Test Customer'
        },
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('✅ Created test message');
    } else {
      console.warn('⚠️ Failed to create test conversation, tests may fail');
    }
  } catch (error) {
    console.warn('⚠️ Test data creation failed:', error);
  }

  // Save storage state for reuse
  await page.context().storageState({ path: 'e2e/auth-state.json' });
});

