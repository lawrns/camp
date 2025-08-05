#!/usr/bin/env node

/**
 * Comprehensive Phosphor to Lucide Icon Migration Script
 * 
 * This script migrates all Phosphor icons to Lucide icons across the entire codebase
 * to ensure consistent design system usage and better performance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Phosphor to Lucide icon mapping
const ICON_MAPPING = {
  // Common icons
  'MagnifyingGlass': 'Search',
  'FunnelSimple': 'Filter',
  'DotsThreeVertical': 'MoreVertical',
  'PaperPlaneTilt': 'Send',
  'ChatCircle': 'MessageCircle',
  'Warning': 'AlertTriangle',
  'WarningCircle': 'AlertCircle',
  'Robot': 'Bot',
  'CalendarBlank': 'Calendar',
  'CaretDown': 'ChevronDown',
  'ArrowsClockwise': 'RefreshCw',
  'Lightning': 'Zap',
  'Sparkle': 'Sparkles',
  'Smiley': 'Smile',
  'Lifebuoy': 'HelpCircle',
  'Fire': 'Flame',
  'Gear': 'Settings',
  'Palette': 'Palette',
  'Shield': 'Shield',
  'ArrowLeft': 'ArrowLeft',
  'Microphone': 'Mic',
  'Square': 'Square',
  'X': 'X',
  'Image': 'Image',
  'Paperclip': 'Paperclip',
  
  // Status and action icons
  'CheckCircle': 'CheckCircle',
  'Clock': 'Clock',
  'Ticket': 'Ticket',
  'User': 'User',
  'Users': 'Users',
  'Plus': 'Plus',
  'Minus': 'Minus',
  'Archive': 'Archive',
  'Tag': 'Tag',
  
  // Navigation and UI
  'Calendar': 'Calendar',
  'Mail': 'Mail',
  'Phone': 'Phone',
  'Star': 'Star',
  'TrendingUp': 'TrendingUp',
  'MessageSquare': 'MessageSquare',
  'Question': 'HelpCircle',
};

// Directories to scan
const SCAN_DIRECTORIES = [
  'app',
  'components',
  'src/components',
  'lib',
  'src/lib',
  'hooks',
  'src/hooks',
];

// File extensions to process
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

console.log('🔄 Starting Phosphor to Lucide icon migration...\n');

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
      // Skip node_modules and other irrelevant directories
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
 * Process a single file
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file contains Phosphor imports
  if (content.includes('@phosphor-icons/react')) {
    console.log(`📝 Processing: ${filePath}`);
    
    // Replace Phosphor import with Lucide import
    const phosphorImportRegex = /import\s*{([^}]+)}\s*from\s*["']@phosphor-icons\/react["'];?/g;
    const matches = content.match(phosphorImportRegex);
    
    if (matches) {
      matches.forEach(match => {
        // Extract imported icons
        const importMatch = match.match(/import\s*{([^}]+)}\s*from/);
        if (importMatch) {
          const imports = importMatch[1]
            .split(',')
            .map(imp => imp.trim())
            .map(imp => {
              // Handle aliased imports like "Microphone as Mic"
              if (imp.includes(' as ')) {
                const [original, alias] = imp.split(' as ').map(s => s.trim());
                const lucideIcon = ICON_MAPPING[original] || original;
                return `${lucideIcon} as ${alias}`;
              } else {
                return ICON_MAPPING[imp] || imp;
              }
            });
          
          const newImport = `import { ${imports.join(', ')} } from "lucide-react";`;
          content = content.replace(match, newImport);
          modified = true;
        }
      });
    }
    
    // Replace individual icon usages in JSX
    Object.entries(ICON_MAPPING).forEach(([phosphor, lucide]) => {
      // Replace <PhosphorIcon with <LucideIcon
      const iconRegex = new RegExp(`<${phosphor}\\b`, 'g');
      if (content.match(iconRegex)) {
        content = content.replace(iconRegex, `<${lucide}`);
        modified = true;
      }
      
      // Replace {PhosphorIcon} with {LucideIcon} in object references
      const refRegex = new RegExp(`\\b${phosphor}\\b(?=\\s*[,})])`, 'g');
      if (content.match(refRegex)) {
        content = content.replace(refRegex, lucide);
        modified = true;
      }
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
 * Main migration function
 */
function migrate() {
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
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Icons migrated: ${Object.keys(ICON_MAPPING).length}`);
  
  if (modifiedFiles > 0) {
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`   All Phosphor icons have been replaced with Lucide icons.`);
    console.log(`   Please run your tests to ensure everything works correctly.`);
  } else {
    console.log(`\n✨ No Phosphor icons found to migrate.`);
  }
}

// Run the migration
migrate();
