import { test, expect } from '@playwright/test';

test.describe('Homepage Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/');

    // Check if homepage loads
    await expect(page).toHaveURL('http://localhost:3001/');
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Get Started")')).toBeVisible();
  });

  test('should navigate to login page from navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Click the Sign In link
    await page.click('nav a:has-text("Sign In")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/app/login');
    
    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate to signup page from navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Click the Get Started link
    await page.click('nav a:has-text("Get Started")');
    
    // Should redirect to signup page
    await expect(page).toHaveURL('http://localhost:3000/app/register');
    
    // Check if signup form is visible
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate to signup from hero section CTA', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Click the "Get Started Free" button in hero section
    await page.click('a:has-text("Get Started Free")');
    
    // Should redirect to signup page
    await expect(page).toHaveURL('http://localhost:3000/app/register');
  });

  test('should navigate to features section', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Click the "View Features" link
    await page.click('a:has-text("View Features")');
    
    // Should scroll to features section (same page)
    await expect(page).toHaveURL('http://localhost:3000/#features');
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for hero section content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Transform Customer Service');
    
    // Check for main content areas
    await expect(page.locator('main, div[class*="home-page"]')).toBeVisible();
  });
}); 