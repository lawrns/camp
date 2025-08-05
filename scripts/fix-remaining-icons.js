#!/usr/bin/env node

/**
 * Fix Remaining Icon Issues Script
 * 
 * This script fixes all remaining Phosphor to Lucide icon mapping issues
 * that weren't caught by the initial migration script.
 */

const fs = require('fs');
const path = require('path');

// Additional icon mappings that were missed
const ADDITIONAL_ICON_MAPPINGS = {
  'ArrowBendUpLeft': 'CornerUpLeft',
  'ArrowClockwise': 'RotateCw',
  'At': 'AtSign',
  'DotsThree': 'MoreHorizontal',
  'Envelope': 'Mail',
  'Spinner': 'Loader2',
  'TrendUp': 'TrendingUp',
  'TrendDown': 'TrendingDown',
  'GridFour': 'Grid3x3',
  'Funnel': 'Filter',
  'CaretRight': 'ChevronRight',
  'List': 'Menu',
  'MoreVertical': 'MoreVertical',
  'Envelope as Mail': 'Mail',
  'SignOut': 'LogOut',
  'House': 'Home',
  'ChartBar': 'BarChart3',
  'Lightbulb': 'Lightbulb',
  'Plug': 'Plug',
  'Flame': 'Flame',
};

// Files to process
const FILES_TO_FIX = [
  'components/InboxDashboard/sub-components/MessageRow.tsx',
  'components/InboxDashboard/sub-components/AttachmentPreview.tsx',
  'components/inbox/MentionsSystem.tsx',
  'components/InboxDashboard/sub-components/CustomerSidebar.tsx',
  'components/conversations/AssignmentDialog.tsx',
  'components/inbox/AIConfidenceIndicator.tsx',
  'src/components/inbox/InboxHeader.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/shared/CommandPalette.tsx',
];

console.log('🔧 Fixing remaining icon mapping issues...\n');

/**
 * Process a single file
 */
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`📝 Processing: ${filePath}`);
  
  // Fix import statements
  Object.entries(ADDITIONAL_ICON_MAPPINGS).forEach(([oldIcon, newIcon]) => {
    // Fix direct imports
    const importRegex = new RegExp(`\\b${oldIcon}\\b(?=\\s*[,})])`, 'g');
    if (content.match(importRegex)) {
      content = content.replace(importRegex, newIcon);
      modified = true;
      console.log(`   ✓ Fixed import: ${oldIcon} → ${newIcon}`);
    }
    
    // Fix aliased imports like "At as AtSign"
    const aliasRegex = new RegExp(`\\b${oldIcon}\\s+as\\s+\\w+`, 'g');
    if (content.match(aliasRegex)) {
      content = content.replace(aliasRegex, (match) => {
        const alias = match.split(' as ')[1];
        return `${newIcon} as ${alias}`;
      });
      modified = true;
      console.log(`   ✓ Fixed aliased import: ${oldIcon} → ${newIcon}`);
    }
    
    // Fix JSX usage
    const jsxRegex = new RegExp(`<${oldIcon}\\b`, 'g');
    if (content.match(jsxRegex)) {
      content = content.replace(jsxRegex, `<${newIcon}`);
      modified = true;
      console.log(`   ✓ Fixed JSX usage: <${oldIcon} → <${newIcon}`);
    }
    
    // Fix object property usage
    const propRegex = new RegExp(`\\b${oldIcon}(?=\\s*[,})])`, 'g');
    if (content.match(propRegex)) {
      content = content.replace(propRegex, newIcon);
      modified = true;
      console.log(`   ✓ Fixed property usage: ${oldIcon} → ${newIcon}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}\n`);
    return true;
  } else {
    console.log(`   No changes needed\n`);
    return false;
  }
}

/**
 * Main function
 */
function fixRemainingIcons() {
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  FILES_TO_FIX.forEach(filePath => {
    totalFiles++;
    if (processFile(filePath)) {
      modifiedFiles++;
    }
  });
  
  console.log(`📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Icon mappings applied: ${Object.keys(ADDITIONAL_ICON_MAPPINGS).length}`);
  
  if (modifiedFiles > 0) {
    console.log(`\n🎉 Remaining icon issues fixed successfully!`);
    console.log(`   All icons should now use correct Lucide names.`);
  } else {
    console.log(`\n✨ No remaining icon issues found.`);
  }
}

// Run the fix
fixRemainingIcons();
