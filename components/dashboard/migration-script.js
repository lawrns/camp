#!/usr/bin/env node

/**
 * Dashboard Component Migration Script
 * 
 * This script helps migrate existing dashboard components to use the standardized system.
 * It identifies components that need migration and provides guidance on the changes needed.
 */

const fs = require('fs');
const path = require('path');

// Components that need migration
const componentsToMigrate = [
  {
    file: 'StatCard.tsx',
    type: 'metric-card',
    description: 'Basic stat card component',
    migration: {
      import: "import { MetricCard } from './StandardizedDashboard';",
      usage: 'Replace StatCard with MetricCard',
      notes: 'Most props are compatible, just change the import'
    }
  },
  {
    file: 'MetricCard.tsx',
    type: 'metric-card',
    description: 'Enhanced metric card with status variants',
    migration: {
      import: "import { MetricCard } from './StandardizedDashboard';",
      usage: 'Replace status prop with variant prop',
      notes: 'status="success" becomes variant="success"'
    }
  },
  {
    file: 'EnhancedMetricCard.tsx',
    type: 'metric-card',
    description: 'Enhanced metric card with color variants',
    migration: {
      import: "import { MetricCard } from './StandardizedDashboard';",
      usage: 'Replace color prop with variant prop',
      notes: 'color="blue" becomes variant="info"'
    }
  },
  {
    file: 'PremiumKPICards.tsx',
    type: 'kpi-cards',
    description: 'Premium KPI cards with custom styling',
    migration: {
      import: "import { DashboardGrid, MetricCard } from './StandardizedDashboard';",
      usage: 'Replace custom KPI card with MetricCard in DashboardGrid',
      notes: 'Map color prop to variant prop'
    }
  },
  {
    file: 'IntercomMetricCard.tsx',
    type: 'metric-card',
    description: 'Intercom-specific metric card',
    migration: {
      import: "import { MetricCard } from './StandardizedDashboard';",
      usage: 'Replace with MetricCard',
      notes: 'May need custom styling for Intercom branding'
    }
  }
];

// Color mapping for migration
const colorToVariantMap = {
  'blue': 'info',
  'green': 'success',
  'yellow': 'warning',
  'orange': 'warning',
  'red': 'error',
  'purple': 'info',
  'warm': 'warning',
  'success': 'success',
  'danger': 'error',
  'info': 'info'
};

// Status mapping for migration
const statusToVariantMap = {
  'success': 'success',
  'warning': 'warning',
  'error': 'error',
  'info': 'info'
};

function analyzeComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = {
      file: path.basename(filePath),
      hasCustomStyling: false,
      usesDesignTokens: false,
      hasAccessibility: false,
      hasResponsiveDesign: false,
      issues: [],
      recommendations: []
    };

    // Check for custom styling
    if (content.includes('className=') && content.includes('bg-')) {
      analysis.hasCustomStyling = true;
      analysis.issues.push('Uses custom Tailwind classes instead of design tokens');
    }

    // Check for design tokens usage
    if (content.includes('var(--fl-')) {
      analysis.usesDesignTokens = true;
      analysis.recommendations.push('Already uses some design tokens');
    }

    // Check for accessibility
    if (content.includes('aria-') || content.includes('role=')) {
      analysis.hasAccessibility = true;
    } else {
      analysis.issues.push('Missing accessibility attributes');
    }

    // Check for responsive design
    if (content.includes('md:') || content.includes('lg:') || content.includes('xl:')) {
      analysis.hasResponsiveDesign = true;
    } else {
      analysis.issues.push('May not be fully responsive');
    }

    return analysis;
  } catch (error) {
    return {
      file: path.basename(filePath),
      error: error.message
    };
  }
}

function generateMigrationPlan(component) {
  const plan = {
    component: component.file,
    steps: [],
    estimatedTime: '15-30 minutes',
    risk: 'Low'
  };

  switch (component.type) {
    case 'metric-card':
      plan.steps = [
        '1. Update import statement to use StandardizedDashboard',
        '2. Replace component usage with MetricCard',
        '3. Map props: status -> variant, color -> variant',
        '4. Test component rendering and functionality',
        '5. Update any custom styling to use design tokens'
      ];
      break;
    case 'kpi-cards':
      plan.steps = [
        '1. Replace custom KPI card implementation',
        '2. Use DashboardGrid for layout',
        '3. Map each metric to MetricCard component',
        '4. Update color mappings to variant mappings',
        '5. Test responsive behavior'
      ];
      plan.estimatedTime = '30-45 minutes';
      break;
  }

  return plan;
}

function generateCodeExample(component) {
  const examples = {
    'StatCard.tsx': {
      before: `import { StatCard } from './StatCard';

<StatCard
  title="Revenue"
  value={1000}
  variant="success"
/>`,
      after: `import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Revenue"
  value={1000}
  variant="success"
/>`
    },
    'MetricCard.tsx': {
      before: `import { MetricCard } from './MetricCard';

<MetricCard
  title="Response Time"
  value="2.5s"
  status="success"
/>`,
      after: `import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Response Time"
  value="2.5s"
  variant="success"
/>`
    },
    'EnhancedMetricCard.tsx': {
      before: `import { EnhancedMetricCard } from './EnhancedMetricCard';

<EnhancedMetricCard
  title="Users"
  value={1000}
  color="blue"
  icon={Users}
/>`,
      after: `import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Users"
  value={1000}
  icon={Users}
  variant="info"
/>`
    }
  };

  return examples[component.file] || null;
}

function main() {
  console.log('🔍 Dashboard Component Migration Analysis\n');

  const dashboardDir = path.join(__dirname);
  
  console.log('📋 Components to migrate:');
  componentsToMigrate.forEach((component, index) => {
    console.log(`${index + 1}. ${component.file} - ${component.description}`);
  });

  console.log('\n📊 Analysis Results:');
  
  componentsToMigrate.forEach(component => {
    const filePath = path.join(dashboardDir, component.file);
    const analysis = analyzeComponent(filePath);
    
    console.log(`\n📁 ${component.file}:`);
    if (analysis.error) {
      console.log(`   ❌ Error: ${analysis.error}`);
    } else {
      console.log(`   ✅ File analyzed successfully`);
      if (analysis.hasCustomStyling) {
        console.log(`   ⚠️  Has custom styling that needs migration`);
      }
      if (analysis.usesDesignTokens) {
        console.log(`   ✅ Already uses some design tokens`);
      }
      if (analysis.hasAccessibility) {
        console.log(`   ✅ Has accessibility features`);
      } else {
        console.log(`   ❌ Missing accessibility features`);
      }
      if (analysis.hasResponsiveDesign) {
        console.log(`   ✅ Has responsive design`);
      } else {
        console.log(`   ❌ May not be fully responsive`);
      }
    }
  });

  console.log('\n🛠️  Migration Plans:');
  
  componentsToMigrate.forEach(component => {
    const plan = generateMigrationPlan(component);
    console.log(`\n📋 ${component.file}:`);
    console.log(`   Estimated time: ${plan.estimatedTime}`);
    console.log(`   Risk level: ${plan.risk}`);
    console.log('   Steps:');
    plan.steps.forEach(step => {
      console.log(`     ${step}`);
    });
  });

  console.log('\n💡 Migration Tips:');
  console.log('1. Start with the simplest components first');
  console.log('2. Test each component after migration');
  console.log('3. Use the design token system for consistent styling');
  console.log('4. Ensure accessibility features are maintained');
  console.log('5. Test responsive behavior on different screen sizes');

  console.log('\n🎯 Next Steps:');
  console.log('1. Review the migration plans above');
  console.log('2. Start with StatCard.tsx (simplest migration)');
  console.log('3. Use the StandardizedDashboard components');
  console.log('4. Update imports and prop names');
  console.log('5. Test thoroughly before deploying');

  console.log('\n📚 Resources:');
  console.log('- README.md: Complete documentation');
  console.log('- StandardizedDashboard.tsx: Main component file');
  console.log('- examples/: Usage examples');
  console.log('- Design tokens: components/unified-ui/tokens/');
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeComponent,
  generateMigrationPlan,
  generateCodeExample,
  colorToVariantMap,
  statusToVariantMap
}; 