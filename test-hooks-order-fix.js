#!/usr/bin/env node

/**
 * Test script to verify React Hooks order fix in IntercomDashboard
 * Checks that all hooks are called before any early returns
 */

const fs = require('fs');

function testHooksOrderFix() {
  console.log('🧪 REACT HOOKS ORDER FIX VERIFICATION\n');

  const results = {
    hooksBeforeEarlyReturns: false,
    noConditionalHooks: false,
    useMemoMoved: false,
    errors: []
  };

  try {
    const filePath = 'components/dashboard/IntercomDashboard.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test 1: Check that useMemo is before early returns
    console.log('📋 Test 1: useMemo Hook Placement');
    
    const lines = content.split('\n');
    let useMemoLine = -1;
    let firstEarlyReturnLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Find useMemo for dashboardMetrics
      if (line.includes('const dashboardMetrics') && line.includes('useMemo')) {
        useMemoLine = i + 1; // Convert to 1-based line numbers
        console.log(`   ✅ Found useMemo at line ${useMemoLine}`);
      }
      
      // Find first early return (if statements with return)
      if (line.includes('if (isLoading)') && !firstEarlyReturnLine) {
        firstEarlyReturnLine = i + 1;
        console.log(`   ✅ Found first early return at line ${firstEarlyReturnLine}`);
      }
    }
    
    if (useMemoLine > 0 && firstEarlyReturnLine > 0) {
      if (useMemoLine < firstEarlyReturnLine) {
        console.log(`   ✅ useMemo (line ${useMemoLine}) is BEFORE early returns (line ${firstEarlyReturnLine})`);
        results.useMemoMoved = true;
      } else {
        console.log(`   ❌ useMemo (line ${useMemoLine}) is AFTER early returns (line ${firstEarlyReturnLine})`);
        results.errors.push('useMemo is still after early returns');
      }
    } else {
      console.log('   ⚠️  Could not find useMemo or early return patterns');
      results.errors.push('Could not locate useMemo or early return patterns');
    }

    // Test 2: Check for conditional hook usage
    console.log('\n📋 Test 2: Conditional Hook Usage Check');
    
    const hookPatterns = [
      /if\s*\([^)]+\)\s*{[^}]*use[A-Z]/,  // if statement containing hooks
      /\?\s*use[A-Z]/,                    // ternary with hooks
      /&&\s*use[A-Z]/                     // logical AND with hooks
    ];
    
    let conditionalHooksFound = false;
    
    hookPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   ❌ Found conditional hook pattern ${index + 1}: ${matches[0]}`);
        conditionalHooksFound = true;
        results.errors.push(`Conditional hook pattern found: ${matches[0]}`);
      }
    });
    
    if (!conditionalHooksFound) {
      console.log('   ✅ No conditional hook usage detected');
      results.noConditionalHooks = true;
    }

    // Test 3: Verify all hooks are at the top level
    console.log('\n📋 Test 3: Hook Declaration Order');
    
    const hookDeclarations = [];
    const earlyReturnStart = firstEarlyReturnLine;
    
    for (let i = 0; i < lines.length && i < earlyReturnStart - 1; i++) {
      const line = lines[i].trim();
      
      // Match hook declarations
      if (line.match(/const\s+.*=\s*use[A-Z]/) || 
          line.match(/const\s+\{.*\}\s*=\s*use[A-Z]/) ||
          line.match(/use[A-Z][a-zA-Z]*\s*\(/)) {
        hookDeclarations.push({
          line: i + 1,
          content: line.substring(0, 50) + (line.length > 50 ? '...' : '')
        });
      }
    }
    
    console.log(`   ✅ Found ${hookDeclarations.length} hooks before early returns:`);
    hookDeclarations.forEach(hook => {
      console.log(`      Line ${hook.line}: ${hook.content}`);
    });
    
    if (hookDeclarations.length >= 6) { // Expected minimum number of hooks
      results.hooksBeforeEarlyReturns = true;
    } else {
      results.errors.push('Insufficient hooks found before early returns');
    }

    // Test 4: Check for duplicate useMemo
    console.log('\n📋 Test 4: Duplicate useMemo Check');
    
    const useMemoMatches = content.match(/const dashboardMetrics.*useMemo/g);
    if (useMemoMatches && useMemoMatches.length === 1) {
      console.log('   ✅ Only one dashboardMetrics useMemo found');
    } else if (useMemoMatches && useMemoMatches.length > 1) {
      console.log(`   ❌ Found ${useMemoMatches.length} dashboardMetrics useMemo declarations`);
      results.errors.push('Duplicate useMemo declarations found');
    } else {
      console.log('   ⚠️  No dashboardMetrics useMemo found');
      results.errors.push('No dashboardMetrics useMemo found');
    }

  } catch (error) {
    console.log('   ❌ Error reading IntercomDashboard:', error.message);
    results.errors.push(`File read error: ${error.message}`);
  }

  // Test Summary
  console.log('\n🎯 HOOKS ORDER FIX SUMMARY');
  console.log('===========================');
  
  const allFixed = results.hooksBeforeEarlyReturns && 
                   results.noConditionalHooks && 
                   results.useMemoMoved && 
                   results.errors.length === 0;

  console.log(`${results.useMemoMoved ? '✅' : '❌'} useMemo moved before early returns`);
  console.log(`${results.hooksBeforeEarlyReturns ? '✅' : '❌'} All hooks before early returns`);
  console.log(`${results.noConditionalHooks ? '✅' : '❌'} No conditional hook usage`);
  console.log(`${results.errors.length === 0 ? '✅' : '❌'} No errors found`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS FOUND:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (allFixed) {
    console.log('\n🚀 REACT HOOKS ORDER: FIXED ✅');
    console.log('The "change in the order of Hooks" error should be resolved.');
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('1. Moved useMemo hook before all early returns');
    console.log('2. Ensured consistent hook call order on every render');
    console.log('3. Removed conditional hook execution');
    console.log('4. All hooks now follow the Rules of Hooks');
  } else {
    console.log('\n⚠️  REACT HOOKS ORDER: NEEDS ATTENTION');
    console.log('Some hook order issues remain.');
  }

  console.log('\n📋 TESTING INSTRUCTIONS:');
  console.log('1. Open http://localhost:3001/dashboard');
  console.log('2. Check browser console for hook order errors');
  console.log('3. Navigate between loading/error/success states');
  console.log('4. Verify no "change in the order of Hooks" warnings');

  return allFixed;
}

// Run the test
const success = testHooksOrderFix();
process.exit(success ? 0 : 1);
