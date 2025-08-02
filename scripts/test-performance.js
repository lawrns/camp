/**
 * PERFORMANCE TESTING SCRIPT
 * 
 * Tests homepage scrolling performance and other optimizations
 */

const puppeteer = require('puppeteer');

async function testHomepagePerformance() {
  console.log('🧪 Testing homepage performance...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Listen for performance metrics
    const performanceMetrics = [];
    page.on('metrics', data => {
      performanceMetrics.push(data);
    });
    
    // Navigate to homepage
    console.log('📄 Loading homepage...');
    const startTime = Date.now();
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  Page load time: ${loadTime}ms`);
    
    // Test scrolling performance
    console.log('🔄 Testing scrolling performance...');
    const scrollStart = Date.now();
    
    // Scroll down smoothly
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let scrollPosition = 0;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollStep = 100;
        
        function smoothScroll() {
          if (scrollPosition >= maxScroll) {
            resolve();
            return;
          }
          
          scrollPosition += scrollStep;
          window.scrollTo(0, scrollPosition);
          requestAnimationFrame(smoothScroll);
        }
        
        smoothScroll();
      });
    });
    
    const scrollTime = Date.now() - scrollStart;
    console.log(`📜 Scroll test completed in: ${scrollTime}ms`);
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test font loading
    console.log('🔤 Testing font loading...');
    const fontMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            resolve({
              fontsLoaded: true,
              fontCount: document.fonts.size
            });
          });
        } else {
          resolve({ fontsLoaded: false, fontCount: 0 });
        }
      });
    });
    
    console.log(`📊 Font metrics:`, fontMetrics);
    
    // Performance summary
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`✅ Page load time: ${loadTime}ms`);
    console.log(`✅ Scroll test time: ${scrollTime}ms`);
    console.log(`✅ Fonts loaded: ${fontMetrics.fontsLoaded}`);
    console.log(`✅ Console errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Performance thresholds
    const loadTimeThreshold = 4000; // 4 seconds
    const scrollTimeThreshold = 5000; // 5 seconds
    
    if (loadTime < loadTimeThreshold) {
      console.log(`✅ Page load time (${loadTime}ms) is under threshold (${loadTimeThreshold}ms)`);
    } else {
      console.log(`❌ Page load time (${loadTime}ms) exceeds threshold (${loadTimeThreshold}ms)`);
    }
    
    if (scrollTime < scrollTimeThreshold) {
      console.log(`✅ Scroll test time (${scrollTime}ms) is under threshold (${scrollTimeThreshold}ms)`);
    } else {
      console.log(`❌ Scroll test time (${scrollTime}ms) exceeds threshold (${scrollTimeThreshold}ms)`);
    }
    
    return {
      loadTime,
      scrollTime,
      fontMetrics,
      errors: errors.length,
      success: loadTime < loadTimeThreshold && scrollTime < scrollTimeThreshold
    };
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testHomepagePerformance()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 All performance tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some performance tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testHomepagePerformance }; 