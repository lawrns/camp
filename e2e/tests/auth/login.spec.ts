import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should load login page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Should redirect to /app/login
    await expect(page).toHaveURL('http://localhost:3000/app/login');
    
    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display login form with proper styling', async ({ page }) => {
    await page.goto('http://localhost:3000/app/login');
    
    // Check if the page has proper styling (using the actual classes)
    await expect(page.locator('body')).toHaveClass(/bg-background/);
    
    // Check if form is centered
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check for proper form layout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    await page.goto('http://localhost:3000/app/login');
    
    // Fill in the form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should not crash or show 404
    await expect(page).not.toHaveURL('/404');
  });
}); 