import { test, expect } from '@playwright/test';

test.describe('Widget Network Test', () => {
  test('should capture network requests when sending widget message', async ({ page }) => {
    console.log('🔍 Testing widget network requests...');
    
    // Capture network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(`${request.method()} ${request.url()}`);
        console.log(`📡 Request: ${request.method()} ${request.url()}`);
        console.log(`📡 Headers:`, request.headers());
        if (request.postData()) {
          console.log(`📡 Body:`, request.postData());
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 Response: ${response.status()} ${response.url()}`);
        if (response.status() !== 200) {
          response.text().then(text => {
            console.log(`📡 Error response:`, text);
          });
        }
      }
    });
    
    // Navigate to homepage
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    console.log('✅ Homepage loaded');
    
    // Open widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="widget-message-input"]');
    console.log('✅ Widget opened');
    
    // Send a message
    const testMessage = `Network test message ${Date.now()}`;
    await page.fill('[data-testid="widget-message-input"]', testMessage);
    await page.click('[data-testid="widget-send-button"]');
    console.log(`✅ Message sent: ${testMessage}`);
    
    // Wait for network requests to complete
    await page.waitForTimeout(5000);
    
    // Log all captured requests
    console.log('📊 All API requests:');
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ${req}`);
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'widget-network-test.png', fullPage: true });
    console.log('📸 Screenshot saved: widget-network-test.png');
  });
}); 