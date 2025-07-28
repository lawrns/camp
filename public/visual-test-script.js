/**
 * Visual Testing Script for Design System Consolidation
 * Tests that our design system tokens are properly loaded and working
 */

function runVisualTests() {
  console.log('🎯 Starting Design System Visual Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function addTest(name, passed, details) {
    results.tests.push({ name, passed, details });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}: ${details}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
  }

  // Test 1: Check if design system CSS variables are loaded
  const rootStyles = getComputedStyle(document.documentElement);
  
  // Test primary color tokens
  const primaryColor = rootStyles.getPropertyValue('--ds-color-primary-600').trim();
  addTest(
    'Primary Color Token', 
    primaryColor !== '', 
    primaryColor ? `Found: ${primaryColor}` : 'Missing --ds-color-primary-600'
  );

  // Test spacing tokens
  const spacing4 = rootStyles.getPropertyValue('--ds-spacing-4').trim();
  addTest(
    'Spacing Token', 
    spacing4 === '1rem', 
    spacing4 ? `Found: ${spacing4}` : 'Missing --ds-spacing-4'
  );

  // Test border radius tokens
  const radiusMd = rootStyles.getPropertyValue('--ds-radius-md').trim();
  addTest(
    'Border Radius Token', 
    radiusMd !== '', 
    radiusMd ? `Found: ${radiusMd}` : 'Missing --ds-radius-md'
  );

  // Test 2: Check if Badge components are rendered
  const badges = document.querySelectorAll('[class*="badge"]');
  addTest(
    'Badge Components', 
    badges.length > 0, 
    `Found ${badges.length} badge elements`
  );

  // Test 3: Check if design system classes are applied
  const dsColorElements = document.querySelectorAll('[class*="ds-color"], [style*="--ds-color"]');
  addTest(
    'Design System Color Usage', 
    dsColorElements.length > 0, 
    `Found ${dsColorElements.length} elements using ds-color tokens`
  );

  // Test 4: Check CSS custom property values
  const testElement = document.createElement('div');
  testElement.style.backgroundColor = 'var(--ds-color-primary-600)';
  document.body.appendChild(testElement);
  
  const computedBg = getComputedStyle(testElement).backgroundColor;
  const hasValidColor = computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent';
  
  addTest(
    'CSS Custom Property Resolution', 
    hasValidColor, 
    hasValidColor ? `Resolved to: ${computedBg}` : 'Failed to resolve --ds-color-primary-600'
  );
  
  document.body.removeChild(testElement);

  // Test 5: Check for legacy --fl-* tokens (should still work for compatibility)
  const legacyPrimary = rootStyles.getPropertyValue('--fl-color-primary').trim();
  addTest(
    'Legacy Token Compatibility', 
    legacyPrimary !== '', 
    legacyPrimary ? `Legacy token maps to: ${legacyPrimary}` : 'Legacy tokens not found'
  );

  // Test 6: Check focus ring consistency
  const focusColor = rootStyles.getPropertyValue('--ds-color-focus').trim();
  addTest(
    'Focus Ring Token', 
    focusColor !== '', 
    focusColor ? `Focus color: ${focusColor}` : 'Missing focus color token'
  );

  // Test 7: Check if consolidated CSS is loading (no duplicate styles)
  const stylesheets = Array.from(document.styleSheets);
  const designSystemSheets = stylesheets.filter(sheet => {
    try {
      return sheet.href && (
        sheet.href.includes('design-system') || 
        sheet.href.includes('globals')
      );
    } catch (e) {
      return false;
    }
  });

  addTest(
    'CSS Consolidation', 
    designSystemSheets.length <= 2, 
    `Found ${designSystemSheets.length} design system stylesheets (should be ≤2)`
  );

  // Test 8: Check component consistency
  const buttons = document.querySelectorAll('button');
  let consistentButtons = 0;
  
  buttons.forEach(button => {
    const styles = getComputedStyle(button);
    const hasDesignSystemStyling = 
      styles.borderRadius !== '0px' || 
      styles.padding !== '0px' ||
      styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    
    if (hasDesignSystemStyling) consistentButtons++;
  });

  addTest(
    'Component Styling Consistency', 
    buttons.length === 0 || consistentButtons > 0, 
    `${consistentButtons}/${buttons.length} buttons have design system styling`
  );

  // Final Results
  console.log('\n🎯 VISUAL TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  // Display results on page if possible
  const resultsContainer = document.getElementById('test-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="p-4 border rounded-lg ${results.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}">
        <h3 class="font-semibold mb-2">Visual Test Results</h3>
        <p class="mb-2">✅ Passed: ${results.passed} | ❌ Failed: ${results.failed}</p>
        <p class="mb-3">📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%</p>
        <details>
          <summary class="cursor-pointer font-medium">View Detailed Results</summary>
          <ul class="mt-2 space-y-1 text-sm">
            ${results.tests.map(test => `
              <li class="flex items-start gap-2">
                <span class="${test.passed ? 'text-green-600' : 'text-red-600'}">${test.passed ? '✅' : '❌'}</span>
                <span><strong>${test.name}:</strong> ${test.details}</span>
              </li>
            `).join('')}
          </ul>
        </details>
      </div>
    `;
  }

  return results;
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runVisualTests);
} else {
  runVisualTests();
}

// Make function available globally for manual testing
window.runVisualTests = runVisualTests;
