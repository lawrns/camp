/**
 * Debug Login Test
 * 
 * Simple test to debug what's actually on the login page
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Login Page', () => {
  test('should debug login page structure', async ({ page }) => {
    console.log('🔍 Debugging login page...');

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see what's actually there
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });

    // Log the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Log the current URL
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Check if page has unknown content
    const bodyText = await page.locator('body').textContent();
    console.log(`Body text length: ${bodyText?.length || 0}`);

    // Look for any form elements
    const forms = await page.locator('form').count();
    console.log(`Number of forms: ${forms}`);

    // Look for any input elements
    const inputs = await page.locator('input').count();
    console.log(`Number of inputs: ${inputs}`);

    // Look for email inputs specifically
    const emailInputs = await page.locator('input[type="email"]').count();
    console.log(`Number of email inputs: ${emailInputs}`);

    // Look for password inputs specifically
    const passwordInputs = await page.locator('input[type="password"]').count();
    console.log(`Number of password inputs: ${passwordInputs}`);

    // Look for buttons
    const buttons = await page.locator('button').count();
    console.log(`Number of buttons: ${buttons}`);

    // Look for our specific test IDs
    const emailTestId = await page.locator('[data-testid="email-input"]').count();
    const passwordTestId = await page.locator('[data-testid="password-input"]').count();
    const loginButtonTestId = await page.locator('[data-testid="login-button"]').count();
    
    console.log(`Email test ID elements: ${emailTestId}`);
    console.log(`Password test ID elements: ${passwordTestId}`);
    console.log(`Login button test ID elements: ${loginButtonTestId}`);

    // Get all input elements and their attributes
    const allInputs = await page.locator('input').all();
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const testId = await input.getAttribute('data-testid');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input ${i}: type=${type}, id=${id}, testId=${testId}, placeholder=${placeholder}`);
    }

    // Get all button elements and their text
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const testId = await button.getAttribute('data-testid');
      const type = await button.getAttribute('type');
      console.log(`Button ${i}: text="${text}", testId=${testId}, type=${type}`);
    }

    // Check if there are any error messages or redirects
    const errorElements = await page.locator('[role="alert"], .error, .alert-error').count();
    console.log(`Error elements: ${errorElements}`);

    // Log the HTML content of the body (first 1000 chars)
    const bodyHTML = await page.locator('body').innerHTML();
    console.log(`Body HTML (first 1000 chars): ${bodyHTML.substring(0, 1000)}`);

    console.log('✅ Debug complete - check debug-login-page.png for visual');
  });

  test('should test manual login with debug info', async ({ page }) => {
    console.log('🔍 Testing manual login with debug...');

    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Try to find and fill the form step by step
    try {
      // Look for email input by different selectors
      let emailInput = page.locator('[data-testid="email-input"]');
      if (await emailInput.count() === 0) {
        emailInput = page.locator('input[type="email"]');
      }
      if (await emailInput.count() === 0) {
        emailInput = page.locator('#email');
      }

      if (await emailInput.count() > 0) {
        console.log('✅ Found email input');
        await emailInput.fill('jam@jam.com');
      } else {
        console.log('❌ Could not find email input');
      }

      // Look for password input by different selectors
      let passwordInput = page.locator('[data-testid="password-input"]');
      if (await passwordInput.count() === 0) {
        passwordInput = page.locator('input[type="password"]');
      }
      if (await passwordInput.count() === 0) {
        passwordInput = page.locator('#password');
      }

      if (await passwordInput.count() > 0) {
        console.log('✅ Found password input');
        await passwordInput.fill('password123');
      } else {
        console.log('❌ Could not find password input');
      }

      // Look for submit button by different selectors
      let submitButton = page.locator('[data-testid="login-button"]');
      if (await submitButton.count() === 0) {
        submitButton = page.locator('button[type="submit"]');
      }
      if (await submitButton.count() === 0) {
        submitButton = page.locator('button:has-text("Sign in")');
      }

      if (await submitButton.count() > 0) {
        console.log('✅ Found submit button');
        await submitButton.click();
        
        // Wait a bit to see what happens
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        console.log(`Final URL after login attempt: ${finalUrl}`);
        
        // Take screenshot of result
        await page.screenshot({ path: 'debug-login-result.png', fullPage: true });
      } else {
        console.log('❌ Could not find submit button');
      }

    } catch (error) {
      console.log(`❌ Login test error: ${error}`);
      await page.screenshot({ path: 'debug-login-error.png', fullPage: true });
    }

    console.log('✅ Manual login test complete');
  });
});
