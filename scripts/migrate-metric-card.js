#!/usr/bin/env node

/**
 * MetricCard Migration Script
 * 
 * This script migrates the legacy MetricCard.tsx to use StandardizedDashboard.MetricCard
 * and updates all dependent components.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Migration mappings
const IMPORT_MAPPINGS = {
  // Legacy MetricCard imports
  "import { MetricCard } from './MetricCard'": "import { MetricCard } from './StandardizedDashboard'",
  "import { MetricCard } from '../MetricCard'": "import { MetricCard } from '../StandardizedDashboard'",
  "import { MetricCard } from '@/components/dashboard/MetricCard'": "import { MetricCard } from '@/components/dashboard/StandardizedDashboard'",
  
  // Preset metric imports
  "import { ResponseTimeMetric, SatisfactionMetric, HandoffRateMetric, ResolutionRateMetric } from './MetricCard'": 
    "import { MetricCard } from './StandardizedDashboard'",
  "import { ResponseTimeMetric, SatisfactionMetric, HandoffRateMetric, ResolutionRateMetric } from '@/components/dashboard/MetricCard'": 
    "import { MetricCard } from '@/components/dashboard/StandardizedDashboard'",
};

// Prop mappings for API changes
const PROP_MAPPINGS = {
  'status="success"': 'variant="success"',
  'status="warning"': 'variant="warning"',
  'status="error"': 'variant="error"',
  'status="info"': 'variant="info"',
  'status={status}': 'variant={status}',
};

// Files that need migration
const MIGRATION_TARGETS = [
  'components/dashboard/examples/StandardizedDashboardExample.tsx',
  'components/analytics/performance-monitor/PerformanceMonitor.tsx',
  'components/dashboard/README.md',
  'components/dashboard/STANDARDIZATION_SUMMARY.md',
];

// Preset component replacements
const PRESET_REPLACEMENTS = {
  'ResponseTimeMetric': {
    component: 'MetricCard',
    props: {
      title: '"Avg Response Time"',
      value: '`${(value / 1000).toFixed(1)}s`',
      description: '"Average AI response time"',
      variant: 'value <= target ? "success" : value <= target * 1.5 ? "warning" : "error"',
      target: '{ value: target / 1000, label: "Target response time" }'
    }
  },
  'SatisfactionMetric': {
    component: 'MetricCard',
    props: {
      title: '"Customer Satisfaction"',
      value: '`${value.toFixed(1)}/5`',
      description: '"Average rating from customers"',
      variant: 'value >= 4.5 ? "success" : value >= 3.5 ? "warning" : "error"'
    }
  },
  'HandoffRateMetric': {
    component: 'MetricCard',
    props: {
      title: '"AI Handoff Rate"',
      value: '`${value.toFixed(1)}%`',
      description: '"Percentage of conversations handed off to humans"',
      variant: 'value <= 10 ? "success" : value <= 25 ? "warning" : "error"'
    }
  },
  'ResolutionRateMetric': {
    component: 'MetricCard',
    props: {
      title: '"Resolution Rate"',
      value: '`${value.toFixed(1)}%`',
      description: '"Percentage of issues resolved"',
      variant: 'value >= 90 ? "success" : value >= 75 ? "warning" : "error"'
    }
  }
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function backupFile(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup: ${backupPath}`, 'info');
  return backupPath;
}

function migrateImports(content) {
  let updatedContent = content;
  let changesMade = false;
  
  Object.entries(IMPORT_MAPPINGS).forEach(([oldImport, newImport]) => {
    if (updatedContent.includes(oldImport)) {
      updatedContent = updatedContent.replace(new RegExp(oldImport, 'g'), newImport);
      changesMade = true;
      log(`Migrated import: ${oldImport} → ${newImport}`, 'success');
    }
  });
  
  return { content: updatedContent, changesMade };
}

function migrateProps(content) {
  let updatedContent = content;
  let changesMade = false;
  
  Object.entries(PROP_MAPPINGS).forEach(([oldProp, newProp]) => {
    if (updatedContent.includes(oldProp)) {
      updatedContent = updatedContent.replace(new RegExp(oldProp, 'g'), newProp);
      changesMade = true;
      log(`Migrated prop: ${oldProp} → ${newProp}`, 'success');
    }
  });
  
  return { content: updatedContent, changesMade };
}

function migratePresetComponents(content) {
  let updatedContent = content;
  let changesMade = false;
  
  Object.entries(PRESET_REPLACEMENTS).forEach(([presetName, replacement]) => {
    const presetPattern = new RegExp(`<${presetName}\\s+([^>]*)>`, 'g');
    const matches = [...updatedContent.matchAll(presetPattern)];
    
    matches.forEach(match => {
      const originalTag = match[0];
      const existingProps = match[1];
      
      // Extract value and other props from existing usage
      const valueMatch = existingProps.match(/value=\{([^}]+)\}/);
      const classNameMatch = existingProps.match(/className=\{([^}]+)\}|className="([^"]+)"/);
      
      if (valueMatch) {
        const valueVar = valueMatch[1];
        
        // Build new MetricCard with migrated props
        let newProps = [];
        Object.entries(replacement.props).forEach(([propName, propValue]) => {
          if (propValue.includes('value')) {
            // Replace 'value' with the actual variable name
            const actualValue = propValue.replace(/\bvalue\b/g, valueVar);
            newProps.push(`${propName}={${actualValue}}`);
          } else {
            newProps.push(`${propName}=${propValue}`);
          }
        });
        
        // Add className if it exists
        if (classNameMatch) {
          const className = classNameMatch[1] || classNameMatch[2];
          newProps.push(`className={${className}}`);
        }
        
        const newTag = `<MetricCard ${newProps.join(' ')} />`;
        updatedContent = updatedContent.replace(originalTag, newTag);
        changesMade = true;
        log(`Migrated preset component: ${presetName} → MetricCard`, 'success');
      }
    });
  });
  
  return { content: updatedContent, changesMade };
}

function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'warning');
    return false;
  }
  
  log(`Migrating file: ${filePath}`, 'info');
  
  // Create backup
  const backupPath = backupFile(filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let totalChanges = false;
    
    // Migrate imports
    const importResult = migrateImports(content);
    content = importResult.content;
    totalChanges = totalChanges || importResult.changesMade;
    
    // Migrate props
    const propResult = migrateProps(content);
    content = propResult.content;
    totalChanges = totalChanges || propResult.changesMade;
    
    // Migrate preset components
    const presetResult = migratePresetComponents(content);
    content = presetResult.content;
    totalChanges = totalChanges || presetResult.changesMade;
    
    if (totalChanges) {
      fs.writeFileSync(filePath, content);
      log(`Successfully migrated: ${filePath}`, 'success');
      return true;
    } else {
      // Remove backup if no changes were made
      fs.unlinkSync(backupPath);
      log(`No changes needed: ${filePath}`, 'info');
      return false;
    }
    
  } catch (error) {
    log(`Error migrating ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

function deprecateOriginalFile() {
  const originalPath = 'components/dashboard/MetricCard.tsx';
  const deprecatedPath = 'components/dashboard/MetricCard.deprecated.tsx';
  
  if (fs.existsSync(originalPath)) {
    // Add deprecation notice to the original file
    let content = fs.readFileSync(originalPath, 'utf8');
    
    const deprecationNotice = `/**
 * @deprecated This component has been deprecated in favor of StandardizedDashboard.MetricCard
 * 
 * Migration guide:
 * - Replace import: import { MetricCard } from './StandardizedDashboard'
 * - Change prop: status="success" → variant="success"
 * - Use preset components from StandardizedDashboard for common use cases
 * 
 * This file will be removed in the next major version.
 */

`;
    
    content = deprecationNotice + content;
    fs.writeFileSync(originalPath, content);
    
    log(`Added deprecation notice to: ${originalPath}`, 'warning');
  }
}

function validateMigration() {
  log('Validating migration...', 'info');
  
  // Check if StandardizedDashboard exists
  const standardizedPath = 'components/dashboard/StandardizedDashboard.tsx';
  if (!fs.existsSync(standardizedPath)) {
    log(`StandardizedDashboard.tsx not found at: ${standardizedPath}`, 'error');
    return false;
  }
  
  // Check if MetricCard is exported from StandardizedDashboard
  const standardizedContent = fs.readFileSync(standardizedPath, 'utf8');
  if (!standardizedContent.includes('export function MetricCard')) {
    log('MetricCard not found in StandardizedDashboard.tsx', 'error');
    return false;
  }
  
  log('Migration validation passed', 'success');
  return true;
}

function main() {
  log('🚀 Starting MetricCard Migration', 'info');
  
  // Validate prerequisites
  if (!validateMigration()) {
    log('Migration validation failed. Aborting.', 'error');
    process.exit(1);
  }
  
  let migratedFiles = 0;
  
  // Migrate target files
  MIGRATION_TARGETS.forEach(filePath => {
    if (migrateFile(filePath)) {
      migratedFiles++;
    }
  });
  
  // Deprecate original file
  deprecateOriginalFile();
  
  log(`\n📊 Migration Summary:`, 'info');
  log(`Files migrated: ${migratedFiles}`, 'success');
  log(`Files checked: ${MIGRATION_TARGETS.length}`, 'info');
  
  if (migratedFiles > 0) {
    log('\n🔧 Next steps:', 'info');
    log('1. Run tests to ensure everything works correctly', 'info');
    log('2. Update any remaining references manually', 'info');
    log('3. Remove backup files after verification', 'info');
    log('4. Consider removing the deprecated MetricCard.tsx file', 'info');
  }
  
  log('\n✅ MetricCard migration completed!', 'success');
}

if (require.main === module) {
  main();
}

module.exports = {
  migrateFile,
  migrateImports,
  migrateProps,
  migratePresetComponents,
  IMPORT_MAPPINGS,
  PROP_MAPPINGS,
  PRESET_REPLACEMENTS
};
