#!/usr/bin/env node

/**
 * Session Persistence Test Script
 * Tests complete login flow and session persistence across page refreshes
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer not found. Install it with: npm install puppeteer');
  process.exit(1);
}

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  email: 'jam@jam.com',
  password: 'password123',
  headless: false, // Set to true for CI
  timeout: 30000,
};

async function testSessionPersistence() {
  console.log('🧪 Testing Session Persistence...');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    devtools: !TEST_CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ]
  });

  const page = await browser.newPage();
  
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  try {
    // Test 1: Navigate to login page
    console.log('📝 Test 1: Navigate to login page');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeout });
    console.log('✅ Login page loaded');

    // Test 2: Fill and submit login form
    console.log('📝 Test 2: Fill and submit login form');
    await page.type('input[type="email"]', TEST_CONFIG.email);
    await page.type('input[type="password"]', TEST_CONFIG.password);
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: TEST_CONFIG.timeout }),
      page.click('button[type="submit"]')
    ]);
    
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
    } else {
      console.log('⚠️  Login may have failed - not on dashboard');
    }

    // Test 3: Check if user is authenticated
    console.log('📝 Test 3: Check authentication state');
    await page.waitForTimeout(2000); // Allow auth to settle
    
    // Look for user-specific content
    const pageContent = await page.content();
    if (pageContent.includes('Welcome back') || pageContent.includes('jam') || pageContent.includes('Dashboard')) {
      console.log('✅ User appears to be authenticated');
    } else {
      console.log('⚠️  Authentication state unclear');
    }

    // Test 4: Page refresh persistence
    console.log('📝 Test 4: Test session persistence on page refresh');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000); // Allow auth check to complete
    
    const urlAfterRefresh = page.url();
    console.log(`URL after refresh: ${urlAfterRefresh}`);
    
    if (urlAfterRefresh.includes('/dashboard')) {
      console.log('✅ Session persisted after page refresh');
    } else if (urlAfterRefresh.includes('/login')) {
      console.log('❌ Session lost - redirected to login');
    } else {
      console.log('⚠️  Unexpected URL after refresh');
    }

    // Test 5: New tab persistence
    console.log('📝 Test 5: Test session persistence in new tab');
    const newPage = await browser.newPage();
    await newPage.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await newPage.waitForTimeout(3000);
    
    const newTabUrl = newPage.url();
    console.log(`URL in new tab: ${newTabUrl}`);
    
    if (newTabUrl.includes('/dashboard')) {
      console.log('✅ Session persisted in new tab');
    } else if (newTabUrl.includes('/login')) {
      console.log('❌ Session not shared across tabs');
    } else {
      console.log('⚠️  Unexpected URL in new tab');
    }
    
    await newPage.close();

    // Test 6: Check for extension errors
    console.log('📝 Test 6: Check for extension errors');
    const extensionErrors = consoleMessages.filter(msg => 
      msg.includes('Could not establish connection') ||
      msg.includes('message port closed') ||
      msg.includes('DeviceTrust access denied') ||
      msg.includes('Failed to request') ||
      msg.includes('Lock monitor stopped')
    );
    
    if (extensionErrors.length === 0) {
      console.log('✅ No extension errors detected');
    } else {
      console.log(`⚠️  ${extensionErrors.length} extension errors detected (should be suppressed)`);
      extensionErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Test 7: Check debug panel (if available)
    console.log('📝 Test 7: Check debug panel');
    try {
      const debugButton = await page.$('[data-testid="auth-debug"], button:contains("Auth Debug")');
      if (debugButton) {
        await debugButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Debug panel opened');
      } else {
        console.log('ℹ️  Debug panel not found (may be hidden in production)');
      }
    } catch (error) {
      console.log('ℹ️  Debug panel not accessible');
    }

    console.log('\n📊 Test Summary:');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Extension errors: ${extensionErrors.length}`);
    console.log(`Final URL: ${page.url()}`);
    
    console.log('\n✅ Session Persistence Test Completed!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    // Capture screenshot for debugging
    await page.screenshot({ 
      path: 'session-test-failure.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved as session-test-failure.png');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testSessionPersistence()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testSessionPersistence };
