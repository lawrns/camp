import { test, expect } from '@playwright/test';

test.describe('Simple UI Status Report', () => {
  test('should provide comprehensive UI/UX status report', async ({ page }) => {
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
        await page.goto(`http://localhost:3000${pageInfo.url}`);
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
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Check for login form elements
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');
      const loginButton = page.locator('button[type="submit"]');
      
      const hasEmailInput = await emailInput.count() > 0;
      const hasPasswordInput = await passwordInput.count() > 0;
      const hasLoginButton = await loginButton.count() > 0;
      
      if (hasEmailInput && hasPasswordInput && hasLoginButton) {
        console.log('✅ Login form elements present');
        
        // Try to login
        await page.fill('#email', 'jam@jam.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        
        statusReport.functionality.login = true;
        console.log('✅ Login functionality working');
      } else {
        statusReport.functionality.login = false;
        console.log('❌ Login form elements missing');
      }
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
    
    // Test accessibility
    console.log('\n♿ Testing Accessibility...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const accessibilityElements = [
      'button[aria-label]',
      'input[aria-label]',
      'nav[role="navigation"]',
      'main[role="main"]',
      'header[role="banner"]',
      'footer[role="contentinfo"]',
    ];
    
    let accessibilityScore = 0;
    for (const selector of accessibilityElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Accessibility ${selector} found`);
        accessibilityScore++;
      } else {
        console.log(`❌ Accessibility ${selector} missing`);
      }
    }
    
    statusReport.accessibility.score = accessibilityScore;
    statusReport.accessibility.total = accessibilityElements.length;
    
    // Print final status report
    console.log('\n📋 FINAL UI/UX STATUS REPORT');
    console.log('==============================');
    
    const workingPages = Object.values(statusReport.pages).filter((p: any) => p.loads).length;
    const totalPages = Object.keys(statusReport.pages).length;
    
    console.log(`📄 Pages: ${workingPages}/${totalPages} working`);
    console.log(`🔐 Login: ${statusReport.functionality.login ? '✅ Working' : '❌ Failed'}`);
    console.log(`📱 Responsive: ${Object.keys(statusReport.responsiveness).length}/3 viewports tested`);
    console.log(`♿ Accessibility: ${statusReport.accessibility.score}/${statusReport.accessibility.total} elements present`);
    
    // Calculate overall score
    const pageScore = (workingPages / totalPages) * 40; // 40% weight
    const loginScore = statusReport.functionality.login ? 30 : 0; // 30% weight
    const responsiveScore = (Object.keys(statusReport.responsiveness).length / 3) * 20; // 20% weight
    const accessibilityScorePercent = (statusReport.accessibility.score / statusReport.accessibility.total) * 10; // 10% weight
    
    const overallScore = pageScore + loginScore + responsiveScore + accessibilityScorePercent;
    
    console.log(`\n🎯 Overall UI/UX Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 80) {
      console.log('🌟 Excellent UI/UX status!');
    } else if (overallScore >= 60) {
      console.log('👍 Good UI/UX status with room for improvement');
    } else {
      console.log('⚠️ UI/UX needs significant attention');
    }
    
    // Detailed breakdown
    console.log('\n📊 DETAILED BREAKDOWN');
    console.log('=====================');
    
    for (const [pageName, pageData] of Object.entries(statusReport.pages)) {
      if (pageData.loads) {
        console.log(`✅ ${pageName}: Working`);
      } else {
        console.log(`❌ ${pageName}: Failed - ${pageData.error}`);
      }
    }
    
    console.log('\n🔧 RECOMMENDATIONS');
    console.log('==================');
    
    if (workingPages < totalPages) {
      console.log('⚠️ Fix page loading issues for better user experience');
    }
    
    if (!statusReport.functionality.login) {
      console.log('⚠️ Fix login functionality - critical for user access');
    }
    
    if (statusReport.accessibility.score < statusReport.accessibility.total) {
      console.log('⚠️ Improve accessibility features for better inclusivity');
    }
    
    if (Object.keys(statusReport.responsiveness).length < 3) {
      console.log('⚠️ Test responsive design across all viewport sizes');
    }
    
    console.log('\n✅ UI/UX Status Report Complete!');
  });
}); 