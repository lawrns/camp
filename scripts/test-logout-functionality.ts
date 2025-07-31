/**
 * Test script to verify logout functionality in the InboxDashboard header
 */

import { chromium, Browser, Page } from 'playwright';

async function testLogoutFunctionality() {
  console.log('🧪 Testing logout functionality...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Launch browser
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    // Test 1: Navigate to inbox dashboard
    console.log('📱 Test 1: Loading inbox dashboard...');
    await page.goto('http://localhost:3002/dashboard/inbox');
    await page.waitForTimeout(3000);
    
    // Test 2: Check if logout button is visible in desktop header
    console.log('📱 Test 2: Checking desktop logout button...');
    const desktopLogoutButton = page.locator('button[title*="Sign out"]:not([data-testid*="mobile"])').first();
    const isDesktopLogoutVisible = await desktopLogoutButton.isVisible();
    console.log(`✅ Desktop logout button visible: ${isDesktopLogoutVisible}`);
    
    if (isDesktopLogoutVisible) {
      // Check if the button has the correct icon
      const hasLogoutIcon = await desktopLogoutButton.locator('svg').isVisible();
      console.log(`✅ Desktop logout button has icon: ${hasLogoutIcon}`);
      
      // Check hover state
      await desktopLogoutButton.hover();
      await page.waitForTimeout(500);
      console.log('✅ Desktop logout button hover state tested');
    }
    
    // Test 3: Check mobile logout button (simulate mobile viewport)
    console.log('📱 Test 3: Testing mobile logout button...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);
    
    const mobileLogoutButton = page.locator('button[title*="Sign out"]').first();
    const isMobileLogoutVisible = await mobileLogoutButton.isVisible();
    console.log(`✅ Mobile logout button visible: ${isMobileLogoutVisible}`);
    
    // Test 4: Check mobile menu logout option
    console.log('📱 Test 4: Testing mobile menu logout...');
    const mobileMenuButton = page.locator('button').filter({ hasText: /menu/i }).first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      
      const mobileMenuLogout = page.locator('[data-testid="mobile-account-section"] button').filter({ hasText: /sign out/i });
      const isMobileMenuLogoutVisible = await mobileMenuLogout.isVisible();
      console.log(`✅ Mobile menu logout option visible: ${isMobileMenuLogoutVisible}`);
      
      // Close mobile menu
      const closeButton = page.locator('button').filter({ hasText: /close/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
    
    // Test 5: Test logout button accessibility
    console.log('📱 Test 5: Testing accessibility features...');
    await page.setViewportSize({ width: 1200, height: 800 }); // Back to desktop
    await page.waitForTimeout(1000);
    
    const logoutButton = page.locator('button[title*="Sign out"]').first();
    if (await logoutButton.isVisible()) {
      // Check ARIA label
      const ariaLabel = await logoutButton.getAttribute('aria-label');
      console.log(`✅ Logout button ARIA label: ${ariaLabel}`);
      
      // Check if button is focusable
      await logoutButton.focus();
      const isFocused = await logoutButton.evaluate(el => document.activeElement === el);
      console.log(`✅ Logout button focusable: ${isFocused}`);
      
      // Test keyboard navigation (Enter key)
      console.log('⚠️  Note: Actual logout test skipped to avoid session termination');
    }
    
    // Test 6: Check button states
    console.log('📱 Test 6: Checking button states...');
    const isButtonEnabled = await logoutButton.isEnabled();
    console.log(`✅ Logout button enabled: ${isButtonEnabled}`);
    
    const buttonClasses = await logoutButton.getAttribute('class');
    console.log(`✅ Logout button classes: ${buttonClasses}`);
    
    console.log('🎉 Logout functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (page) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'logout-test-failure-screenshot.png' });
      console.log('📸 Screenshot saved as logout-test-failure-screenshot.png');
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLogoutFunctionality().catch(console.error);
