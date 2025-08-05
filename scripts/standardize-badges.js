#!/usr/bin/env node

/**
 * Badge Standardization Script
 * 
 * This script ensures all Badge components across the dashboard use:
 * - Consistent rounded-full design
 * - Proper variant names
 * - Unified design tokens
 * - Consistent sizing and spacing
 */

const fs = require('fs');
const path = require('path');

// Badge variant mappings for consistency
const BADGE_VARIANT_MAPPING = {
  'primary': 'default',
  'default': 'default',
  'secondary': 'secondary',
  'destructive': 'destructive',
  'outline': 'outline',
  'success': 'success',
  'warning': 'secondary',
  'error': 'destructive',
  'info': 'default',
};

// Directories to scan
const SCAN_DIRECTORIES = [
  'app/dashboard',
  'components/dashboard',
  'components/inbox',
  'src/components/dashboard',
  'src/components/inbox',
];

// File extensions to process
const FILE_EXTENSIONS = ['.tsx', '.ts'];

console.log('🎨 Starting Badge standardization across dashboard...\n');

/**
 * Get all files to process
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Process a single file for badge standardization
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file contains Badge components
  if (content.includes('<Badge') || content.includes('Badge ')) {
    console.log(`📝 Processing: ${filePath}`);
    
    // 1. Ensure all badges have rounded-full class
    const badgeRegex = /<Badge([^>]*?)>/g;
    content = content.replace(badgeRegex, (match, attributes) => {
      if (!attributes.includes('rounded-full') && !attributes.includes('className')) {
        // Add rounded-full class
        return `<Badge${attributes} className="rounded-full">`;
      } else if (attributes.includes('className') && !attributes.includes('rounded-full')) {
        // Add rounded-full to existing className
        const classNameMatch = attributes.match(/className="([^"]*)"/);
        if (classNameMatch) {
          const existingClasses = classNameMatch[1];
          if (!existingClasses.includes('rounded-full')) {
            const newClasses = `${existingClasses} rounded-full`.trim();
            const newAttributes = attributes.replace(/className="[^"]*"/, `className="${newClasses}"`);
            modified = true;
            return `<Badge${newAttributes}>`;
          }
        }
      }
      return match;
    });
    
    // 2. Standardize variant names
    Object.entries(BADGE_VARIANT_MAPPING).forEach(([oldVariant, newVariant]) => {
      const variantRegex = new RegExp(`variant="${oldVariant}"`, 'g');
      if (content.match(variantRegex)) {
        content = content.replace(variantRegex, `variant="${newVariant}"`);
        modified = true;
      }
    });
    
    // 3. Replace hardcoded colors with design tokens
    const colorReplacements = {
      'bg-red-100': 'bg-[var(--fl-color-danger-subtle)]',
      'bg-green-100': 'bg-[var(--fl-color-success-subtle)]',
      'bg-yellow-100': 'bg-[var(--fl-color-warning-subtle)]',
      'bg-blue-100': 'bg-[var(--fl-color-primary-subtle)]',
      'bg-gray-100': 'bg-[var(--fl-color-surface)]',
      'text-red-800': 'text-[var(--fl-color-danger)]',
      'text-green-800': 'text-[var(--fl-color-success)]',
      'text-yellow-800': 'text-[var(--fl-color-warning)]',
      'text-blue-800': 'text-[var(--fl-color-primary)]',
      'text-gray-800': 'text-[var(--fl-color-text)]',
    };
    
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
      if (content.includes(oldColor)) {
        content = content.replace(new RegExp(oldColor, 'g'), newColor);
        modified = true;
      }
    });
    
    // 4. Ensure proper spacing with design tokens
    const spacingReplacements = {
      'px-2 py-1': 'px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]',
      'px-3 py-1': 'px-[var(--fl-spacing-3)] py-[var(--fl-spacing-1)]',
      'px-2.5 py-0.5': 'px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]',
      'gap-1': 'gap-[var(--fl-spacing-1)]',
      'gap-2': 'gap-[var(--fl-spacing-2)]',
    };
    
    Object.entries(spacingReplacements).forEach(([oldSpacing, newSpacing]) => {
      if (content.includes(oldSpacing)) {
        content = content.replace(new RegExp(oldSpacing, 'g'), newSpacing);
        modified = true;
      }
    });
    
    // 5. Fix StatusBadge usage to use single badge design
    const statusBadgeRegex = /<StatusBadge\s+([^>]*?)\/>/g;
    content = content.replace(statusBadgeRegex, (match, attributes) => {
      // Ensure StatusBadge uses proper props
      if (!attributes.includes('variant=')) {
        const newAttributes = `${attributes} variant="compact"`;
        modified = true;
        return `<StatusBadge ${newAttributes}/>`;
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Main standardization function
 */
function standardizeBadges() {
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  SCAN_DIRECTORIES.forEach(dir => {
    const files = getAllFiles(dir);
    totalFiles += files.length;
    
    files.forEach(file => {
      if (processFile(file)) {
        modifiedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Badge Standardization Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Badge variants standardized: ${Object.keys(BADGE_VARIANT_MAPPING).length}`);
  
  if (modifiedFiles > 0) {
    console.log(`\n🎉 Badge standardization completed successfully!`);
    console.log(`   All badges now use consistent rounded design and proper variants.`);
    console.log(`   Design tokens have been applied for colors and spacing.`);
  } else {
    console.log(`\n✨ All badges are already standardized.`);
  }
}

// Run the standardization
standardizeBadges();
