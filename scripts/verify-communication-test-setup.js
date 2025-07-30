#!/usr/bin/env node

/**
 * Communication Test Setup Verification
 * Verifies all components are ready for comprehensive communication testing
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  // Test files
  'e2e/tests/comprehensive/widget-dashboard-communication.spec.ts',
  'scripts/run-comprehensive-communication-test.js',
  
  // Widget components
  'src/components/widget/DefinitiveWidget.tsx',
  'src/components/widget/DefinitiveButton.tsx',
  'src/components/widget/hooks/useMessages.ts',
  'src/components/widget/hooks/useWidgetState.ts',
  'src/components/widget/hooks/useReadReceipts.ts',
  
  // Dashboard components
  'src/hooks/useDashboardReadReceipts.ts',
  
  // API endpoints
  'app/api/widget/messages/route.ts',
  'app/api/widget/typing/route.ts',
  'app/api/widget/read-receipts/route.ts',
  'app/api/dashboard/messages/route.ts',
  'app/api/dashboard/typing/route.ts',
  'app/api/dashboard/read-receipts/route.ts',
  'app/api/presence/route.ts',
  
  // Real-time infrastructure
  'lib/realtime/unified-channel-standards.ts',
  'lib/realtime/standardized-realtime.ts',
  
  // UI components
  'src/components/ui/ReadReceiptIndicator.tsx',
  
  // Demo page
  'app/widget-demo/page.tsx',
  
  // Test data setup
  'e2e/test-data-setup.ts',
  'e2e/TEST_DATA.md'
];

const REQUIRED_TEST_SELECTORS = [
  // Widget selectors
  'data-testid="widget-button"',
  'data-testid="widget-panel"',
  'data-testid="widget-header"',
  'data-testid="widget-message"',
  'data-testid="widget-message-input"',
  'data-testid="widget-send-button"',
  'data-testid="widget-close-button"',
  'data-testid="widget-read-receipt"',
  'data-testid="widget-agent-typing-indicator"',
  
  // Dashboard selectors
  'data-testid="message-list"',
  'data-testid="message"',
  'data-testid="message-input"',
  'data-testid="send-button"',
  'data-testid="typing-indicator"',
  'data-testid="dashboard-read-receipt"'
];

async function verifySetup() {
  console.log('🔍 Verifying Comprehensive Communication Test Setup');
  console.log('='.repeat(60));

  let allGood = true;
  const issues = [];
  const warnings = [];

  // Check required files
  console.log('\n📁 Checking required files...');
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      issues.push(`Missing file: ${file}`);
      allGood = false;
    }
  }

  // Check test selectors in components
  console.log('\n🏷️  Checking test selectors...');
  const selectorChecks = [
    { file: 'src/components/widget/DefinitiveWidget.tsx', selectors: ['widget-panel', 'widget-header', 'widget-message', 'widget-message-input', 'widget-send-button', 'widget-close-button'] },
    { file: 'src/components/widget/DefinitiveButton.tsx', selectors: ['widget-button'] },
    { file: 'app/widget-demo/page.tsx', selectors: ['widget-container'] }
  ];

  for (const check of selectorChecks) {
    const fullPath = path.join(process.cwd(), check.file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const selector of check.selectors) {
        if (content.includes(`data-testid="${selector}"`)) {
          console.log(`✅ ${selector} found in ${check.file}`);
        } else {
          console.log(`❌ ${selector} missing in ${check.file}`);
          issues.push(`Missing test selector: ${selector} in ${check.file}`);
          allGood = false;
        }
      }
    }
  }

  // Check environment variables
  console.log('\n🌍 Checking environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
    } else {
      console.log(`⚠️  ${envVar} is not set`);
      warnings.push(`Environment variable not set: ${envVar}`);
    }
  }

  // Check unified events
  console.log('\n📡 Checking unified events...');
  const unifiedEventsFile = path.join(process.cwd(), 'lib/realtime/unified-channel-standards.ts');
  if (fs.existsSync(unifiedEventsFile)) {
    const content = fs.readFileSync(unifiedEventsFile, 'utf8');
    const requiredEvents = ['MESSAGE_CREATED', 'TYPING_UPDATE', 'READ_RECEIPT', 'PRESENCE_UPDATE'];
    
    for (const event of requiredEvents) {
      if (content.includes(event)) {
        console.log(`✅ ${event} event defined`);
      } else {
        console.log(`❌ ${event} event missing`);
        issues.push(`Missing unified event: ${event}`);
        allGood = false;
      }
    }
  }

  // Check API endpoints
  console.log('\n🔌 Checking API endpoints...');
  const apiEndpoints = [
    'app/api/widget/messages/route.ts',
    'app/api/widget/typing/route.ts',
    'app/api/widget/read-receipts/route.ts',
    'app/api/dashboard/messages/route.ts',
    'app/api/dashboard/typing/route.ts',
    'app/api/dashboard/read-receipts/route.ts'
  ];

  for (const endpoint of apiEndpoints) {
    const fullPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('export async function POST') || content.includes('export async function GET')) {
        console.log(`✅ ${endpoint} has HTTP handlers`);
      } else {
        console.log(`⚠️  ${endpoint} may be missing HTTP handlers`);
        warnings.push(`API endpoint may be incomplete: ${endpoint}`);
      }
    }
  }

  // Check test data
  console.log('\n🧪 Checking test data...');
  const testDataFile = path.join(process.cwd(), 'e2e/test-data-setup.ts');
  if (fs.existsSync(testDataFile)) {
    const content = fs.readFileSync(testDataFile, 'utf8');
    const testConstants = ['TEST_DATA', 'E2ETestDataSetup', 'b5e80170-004c-4e82-a88c-3e2166b169dd', '48eedfba-2568-4231-bb38-2ce20420900d'];
    
    for (const constant of testConstants) {
      if (content.includes(constant)) {
        console.log(`✅ ${constant} found in test data`);
      } else {
        console.log(`⚠️  ${constant} not found in test data`);
        warnings.push(`Test data may be incomplete: ${constant}`);
      }
    }
  }

  // Check package.json scripts
  console.log('\n📦 Checking package.json scripts...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredScripts = ['test:comprehensive', 'test:communication', 'test:e2e'];
    
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ ${script} script defined`);
      } else {
        console.log(`⚠️  ${script} script missing`);
        warnings.push(`Package.json script missing: ${script}`);
      }
    }
  }

  // Server connectivity check
  console.log('\n🌐 Checking server connectivity...');
  const ports = [3003, 3005, 3000]; // Check multiple common ports
  let serverFound = false;
  let serverPort = null;

  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/widget-demo`);
      if (response.ok) {
        console.log(`✅ Development server is running on port ${port}`);
        serverFound = true;
        serverPort = port;
        break;
      }
    } catch (error) {
      // Continue to next port
    }
  }

  if (!serverFound) {
    console.log('⚠️  Cannot connect to development server on any common port');
    warnings.push('Development server is not running on ports 3000, 3003, or 3005');
  }

  // Widget demo page check
  if (serverFound && serverPort) {
    console.log('\n🔧 Checking widget demo page...');
    try {
      const response = await fetch(`http://localhost:${serverPort}/widget-demo`);
      if (response.ok) {
        console.log('✅ Widget demo page is accessible');
      } else {
        console.log('⚠️  Widget demo page not accessible');
        warnings.push('Widget demo page may not be working');
      }
    } catch (error) {
      console.log('⚠️  Cannot access widget demo page');
      warnings.push('Widget demo page is not accessible');
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  if (allGood && issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED - Ready for comprehensive testing!');
  } else {
    console.log('❌ ISSUES FOUND - Please fix before running comprehensive test');
  }

  console.log(`📁 Files checked: ${REQUIRED_FILES.length}`);
  console.log(`❌ Issues found: ${issues.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  if (issues.length > 0) {
    console.log('\n❌ Critical Issues:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  console.log('\n🚀 To run the comprehensive test:');
  console.log('   npm run test:comprehensive');
  console.log('   # or');
  console.log('   npm run test:communication');

  console.log('\n📋 Test will verify:');
  console.log('   • Bidirectional message flow (widget ↔ dashboard)');
  console.log('   • Real-time typing indicators');
  console.log('   • Read receipt tracking');
  console.log('   • AI handover functionality');
  console.log('   • Error handling and edge cases');
  console.log('   • WebSocket connection status');
  console.log('   • Performance metrics and timing');

  console.log('='.repeat(60));

  return allGood && issues.length === 0;
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifySetup().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifySetup };
