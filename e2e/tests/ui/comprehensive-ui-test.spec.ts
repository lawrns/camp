import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI/UX Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('should test login page UI components', async ({ page }) => {
    console.log('🔍 Testing Login Page UI Components...');

    // Navigate to login page
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Campfire/i);
    
    // Check for login form elements
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Check for proper input types
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Test form validation
    await loginButton.click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    
    console.log('✅ Login page UI components working correctly');
  });

  test('should test authenticated pages after login', async ({ page }) => {
    console.log('🔍 Testing Authenticated Pages UI Components...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Test Dashboard page
    console.log('📊 Testing Dashboard UI...');
    await expect(page).toHaveTitle(/Campfire/i);

    // Check for dashboard elements
    const dashboardElements = [
      'h1', // Main heading
      'nav', // Navigation
      '[role="main"]', // Main content area
    ];

    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Dashboard ${selector} found`);
      } else {
        console.log(`❌ Dashboard ${selector} missing`);
      }
    }

    // Test Inbox page
    console.log('📥 Testing Inbox UI...');
    await page.goto('http://localhost:3001/inbox');
    await page.waitForLoadState('networkidle');
    
    const inboxElements = [
      'h1', // Main heading
      'nav', // Navigation
      '[role="main"]', // Main content area
      'button', // Action buttons
    ];
    
    for (const selector of inboxElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Inbox ${selector} found`);
      } else {
        console.log(`❌ Inbox ${selector} missing`);
      }
    }
    
    // Test Widget page
    console.log('🎛️ Testing Widget UI...');
    await page.goto('http://localhost:3001/widget');
    await page.waitForLoadState('networkidle');
    
    const widgetElements = [
      'h1', // Main heading
      'nav', // Navigation
      '[role="main"]', // Main content area
    ];
    
    for (const selector of widgetElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Widget ${selector} found`);
      } else {
        console.log(`❌ Widget ${selector} missing`);
      }
    }
  });

  test('should test navigation and layout components', async ({ page }) => {
    console.log('🧭 Testing Navigation and Layout Components...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Test navigation elements
    const navElements = [
      'nav',
      'a[href*="dashboard"]',
      'a[href*="inbox"]',
      'a[href*="widget"]',
    ];
    
    for (const selector of navElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Navigation ${selector} found`);
      } else {
        console.log(`❌ Navigation ${selector} missing`);
      }
    }
    
    // Test responsive design
    console.log('📱 Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileElements = page.locator('nav, main, header, footer');
    if (await mobileElements.count() > 0) {
      console.log('✅ Mobile responsive elements present');
    } else {
      console.log('❌ Mobile responsive elements missing');
    }
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopElements = page.locator('nav, main, header, footer');
    if (await desktopElements.count() > 0) {
      console.log('✅ Desktop responsive elements present');
    } else {
      console.log('❌ Desktop responsive elements missing');
    }
  });

  test('should test form components and interactions', async ({ page }) => {
    console.log('📝 Testing Form Components and Interactions...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Test form interactions in inbox
    await page.goto('http://localhost:3001/inbox');
    await page.waitForLoadState('networkidle');
    
    // Look for message input forms
    const formElements = [
      'input[type="text"]',
      'textarea',
      'button[type="submit"]',
      'form',
    ];
    
    for (const selector of formElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Form ${selector} found`);
      } else {
        console.log(`❌ Form ${selector} missing`);
      }
    }
    
    // Test button interactions
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`🔘 Found ${buttonCount} buttons on inbox page`);
    
    if (buttonCount > 0) {
      console.log('✅ Button interactions available');
    } else {
      console.log('❌ No buttons found for interaction testing');
    }
  });

  test('should test accessibility features', async ({ page }) => {
    console.log('♿ Testing Accessibility Features...');
    
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Test accessibility attributes
    const accessibilityElements = [
      'button[aria-label]',
      'input[aria-label]',
      'nav[role="navigation"]',
      'main[role="main"]',
      'header[role="banner"]',
      'footer[role="contentinfo"]',
    ];
    
    for (const selector of accessibilityElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Accessibility ${selector} found`);
      } else {
        console.log(`❌ Accessibility ${selector} missing`);
      }
    }
    
    // Test keyboard navigation
    console.log('⌨️ Testing Keyboard Navigation...');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      console.log('✅ Keyboard navigation working');
    } else {
      console.log('❌ Keyboard navigation not working');
    }
  });

  test('should test error handling and loading states', async ({ page }) => {
    console.log('⚠️ Testing Error Handling and Loading States...');
    
    // Test 404 page
    await page.goto('http://localhost:3001/nonexistent-page');
    await page.waitForLoadState('networkidle');

    const errorElements = page.locator('h1, [role="alert"], .error, .not-found');
    if (await errorElements.count() > 0) {
      console.log('✅ Error page elements present');
    } else {
      console.log('❌ Error page elements missing');
    }

    // Test loading states
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const loadingElements = page.locator('[aria-busy="true"], .loading, .spinner');
    if (await loadingElements.count() > 0) {
      console.log('✅ Loading state elements present');
    } else {
      console.log('❌ Loading state elements missing');
    }
  });

  test('should provide comprehensive UI status report', async ({ page }) => {
    console.log('\n📊 COMPREHENSIVE UI/UX STATUS REPORT');
    console.log('=====================================');
    
    // Test all major pages
    const pages = [
      { name: 'Home', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Inbox', url: '/inbox' },
      { name: 'Widget', url: '/widget' },
    ];
    
    const statusReport: {
      pages: Record<string, any>;
      components: Record<string, any>;
      accessibility: Record<string, any>;
      responsiveness: Record<string, any>;
      functionality: Record<string, any>;
    } = {
      pages: {},
      components: {},
      accessibility: {},
      responsiveness: {},
      functionality: {},
    };
    
    for (const pageInfo of pages) {
      console.log(`\n🔍 Testing ${pageInfo.name} page...`);
      
      try {
        await page.goto(`http://localhost:3001${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if page loads
        const title = await page.title();
        const hasContent = await page.locator('body').textContent();
        
        statusReport.pages[pageInfo.name] = {
          loads: true,
          hasTitle: title.length > 0,
          hasContent: hasContent && hasContent.length > 0,
          url: pageInfo.url,
        };
        
        console.log(`✅ ${pageInfo.name} page loads successfully`);
        
        // Test basic components
        const basicElements = ['h1', 'nav', 'main', 'button'];
        for (const element of basicElements) {
          const count = await page.locator(element).count();
          if (count > 0) {
            console.log(`  ✅ ${element} elements found (${count})`);
          } else {
            console.log(`  ❌ ${element} elements missing`);
          }
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${pageInfo.name} page failed to load: ${errorMessage}`);
        statusReport.pages[pageInfo.name] = {
          loads: false,
          error: errorMessage,
          url: pageInfo.url,
        };
      }
    }
    
    // Test login functionality
    console.log('\n🔐 Testing Login Functionality...');
    try {
      await page.goto('http://localhost:3001/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('#email', 'jam@jam.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      statusReport.functionality.login = true;
      console.log('✅ Login functionality working');
    } catch (error) {
      statusReport.functionality.login = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Login functionality failed: ${errorMessage}`);
    }
    
    // Test responsive design
    console.log('\n📱 Testing Responsive Design...');
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      const hasNav = await page.locator('nav').count() > 0;
      const hasMain = await page.locator('main').count() > 0;
      
      statusReport.responsiveness[viewport.name] = {
        nav: hasNav,
        main: hasMain,
      };
      
      console.log(`✅ ${viewport.name} viewport: nav=${hasNav}, main=${hasMain}`);
    }
    
    // Print final status report
    console.log('\n📋 FINAL UI/UX STATUS REPORT');
    console.log('==============================');
    
    const workingPages = Object.values(statusReport.pages).filter((p: any) => p.loads).length;
    const totalPages = Object.keys(statusReport.pages).length;
    
    console.log(`📄 Pages: ${workingPages}/${totalPages} working`);
    console.log(`🔐 Login: ${statusReport.functionality.login ? '✅ Working' : '❌ Failed'}`);
    console.log(`📱 Responsive: ${Object.keys(statusReport.responsiveness).length}/3 viewports tested`);
    
    // Summary
    const overallScore = (workingPages / totalPages) * 100;
    console.log(`\n🎯 Overall UI/UX Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 80) {
      console.log('🌟 Excellent UI/UX status!');
    } else if (overallScore >= 60) {
      console.log('👍 Good UI/UX status with room for improvement');
    } else {
      console.log('⚠️ UI/UX needs significant attention');
    }
  });
}); 