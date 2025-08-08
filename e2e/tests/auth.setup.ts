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

  // Navigate to login and authenticate
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Force click submit to bypass any residual overlays
  await page.click('button[type="submit"]', { force: true });

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

  // Save storage state for reuse
  await page.context().storageState({ path: 'e2e/auth-state.json' });
});

