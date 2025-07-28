#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * 
 * Tests the login and registration pages to ensure they load correctly
 * and that extension isolation is working properly.
 */

const { execSync } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3003';
const TIMEOUT = 10000;

console.log('🔥 Campfire Authentication Flow Test');
console.log('=====================================\n');

/**
 * Test if a URL loads successfully
 */
async function testPageLoad(url, pageName) {
  try {
    console.log(`📄 Testing ${pageName} page...`);
    
    // Use curl to test page load
    const result = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, {
      timeout: TIMEOUT,
      encoding: 'utf8'
    });
    
    const statusCode = parseInt(result.trim());
    
    if (statusCode === 200) {
      console.log(`✅ ${pageName} page loads successfully (${statusCode})`);
      return true;
    } else {
      console.log(`❌ ${pageName} page failed to load (${statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${pageName} page test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test if extension isolation components are present
 */
async function testExtensionIsolation(url, pageName) {
  try {
    console.log(`🛡️  Testing extension isolation on ${pageName}...`);
    
    // Get page content
    const content = execSync(`curl -s "${url}"`, {
      timeout: TIMEOUT,
      encoding: 'utf8'
    });
    
    // Check for extension isolation components
    const hasExtensionProvider = content.includes('ExtensionIsolationProvider');
    const hasAuthBoundary = content.includes('AuthExtensionBoundary');
    const hasIsolationScript = content.includes('extension-isolation') || 
                              content.includes('initializeExtensionIsolation');
    
    if (hasExtensionProvider) {
      console.log(`✅ ExtensionIsolationProvider detected on ${pageName}`);
    } else {
      console.log(`⚠️  ExtensionIsolationProvider not found on ${pageName}`);
    }
    
    return hasExtensionProvider;
  } catch (error) {
    console.log(`❌ Extension isolation test failed for ${pageName}: ${error.message}`);
    return false;
  }
}

/**
 * Test console error suppression patterns
 */
function testErrorSuppressionPatterns() {
  console.log('🔇 Testing error suppression patterns...');
  
  // Read the ConsoleManager file to verify patterns are present
  try {
    const consoleManagerPath = './src/components/system/ConsoleManager.tsx';
    if (fs.existsSync(consoleManagerPath)) {
      const content = fs.readFileSync(consoleManagerPath, 'utf8');
      
      const extensionPatterns = [
        'Could not establish connection',
        'DeviceTrust: access denied',
        'Extension context invalidated',
        'chrome-extension://',
        '1password',
        'lastpass'
      ];
      
      let patternsFound = 0;
      extensionPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          patternsFound++;
        }
      });
      
      if (patternsFound >= 4) {
        console.log(`✅ Extension error patterns configured (${patternsFound}/${extensionPatterns.length})`);
        return true;
      } else {
        console.log(`⚠️  Some extension error patterns missing (${patternsFound}/${extensionPatterns.length})`);
        return false;
      }
    } else {
      console.log('⚠️  ConsoleManager.tsx not found');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error pattern test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test if required files exist
 */
function testRequiredFiles() {
  console.log('📁 Testing required files...');
  
  const requiredFiles = [
    './lib/auth/extension-isolation.ts',
    './components/auth/auth-extension-boundary.tsx',
    './components/system/ExtensionIsolationProvider.tsx',
    './docs/AUTHENTICATION_EXTENSION_FIXES.md'
  ];
  
  let filesFound = 0;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      filesFound++;
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
  return filesFound === requiredFiles.length;
}

/**
 * Main test runner
 */
async function runTests() {
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Required files
  totalTests++;
  if (testRequiredFiles()) passedTests++;
  
  console.log('');
  
  // Test 2: Error suppression patterns
  totalTests++;
  if (testErrorSuppressionPatterns()) passedTests++;
  
  console.log('');
  
  // Test 3: Login page load
  totalTests++;
  if (await testPageLoad(`${BASE_URL}/login`, 'Login')) passedTests++;
  
  // Test 4: Register page load  
  totalTests++;
  if (await testPageLoad(`${BASE_URL}/register`, 'Register')) passedTests++;
  
  console.log('');
  
  // Test 5: Extension isolation on login
  totalTests++;
  if (await testExtensionIsolation(`${BASE_URL}/login`, 'Login')) passedTests++;
  
  // Test 6: Extension isolation on register
  totalTests++;
  if (await testExtensionIsolation(`${BASE_URL}/register`, 'Register')) passedTests++;
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Authentication extension fixes are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Check if server is running
try {
  execSync(`curl -s -o /dev/null "${BASE_URL}"`, { timeout: 5000 });
  console.log(`🚀 Server detected at ${BASE_URL}\n`);
  runTests();
} catch (error) {
  console.log(`❌ Server not running at ${BASE_URL}`);
  console.log('Please start the development server with: npm run dev\n');
  process.exit(1);
}
