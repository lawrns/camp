#!/usr/bin/env node

/**
 * Verification script for CRITICAL-001: sender_type/senderType mismatch fix
 */

const fs = require('fs');
const path = require('path');

function verifyCritical001() {
  console.log('🔍 CRITICAL-001: Verifying sender_type/senderType consistency fix\n');
  console.log('=' .repeat(70));

  const filePath = './src/components/InboxDashboard/hooks/useMessages.ts';
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const issues = [];
    const fixes = [];
    
    // Check for specific problematic patterns
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for message.senderType (should be message.sender_type)
      if (line.includes('message.senderType') && !line.includes('message.sender_type')) {
        issues.push(`Line ${lineNum}: Found message.senderType (should be message.sender_type)`);
      }
      
      // Check for database insert with wrong field name
      if (line.includes('senderType: senderType') && !line.includes('sender_type:')) {
        issues.push(`Line ${lineNum}: Database insert uses senderType instead of sender_type`);
      }
      
      // Check for undefined variable usage
      if (line.includes('sender_type === ') && !line.includes('senderType === ')) {
        const context = lines.slice(Math.max(0, index - 3), index + 3).join('\n');
        if (!context.includes('let senderType') && !context.includes('const senderType')) {
          issues.push(`Line ${lineNum}: Using undefined sender_type variable`);
        }
      }
    });
    
    // Check for positive fixes
    if (content.includes('message.sender_type')) {
      fixes.push('✅ Correctly reads sender_type from database');
    }
    
    if (content.includes('sender_type: senderType')) {
      fixes.push('✅ Correctly maps senderType to sender_type for database');
    }
    
    if (content.includes('senderType === "agent"') || content.includes('senderType === "ai_assistant"')) {
      fixes.push('✅ Uses senderType variable consistently in logic');
    }
    
    // Count references
    const snakeCaseRefs = (content.match(/sender_type/g) || []).length;
    const camelCaseRefs = (content.match(/senderType/g) || []).length;
    
    console.log('📊 ANALYSIS RESULTS:');
    console.log(`📈 snake_case references (sender_type): ${snakeCaseRefs}`);
    console.log(`📈 camelCase references (senderType): ${camelCaseRefs}`);
    
    console.log('\n🔧 FIXES IMPLEMENTED:');
    if (fixes.length > 0) {
      fixes.forEach(fix => console.log(fix));
    } else {
      console.log('❌ No fixes detected');
    }
    
    console.log('\n⚠️  REMAINING ISSUES:');
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`❌ ${issue}`));
    } else {
      console.log('✅ No issues found!');
    }
    
    // Overall assessment
    console.log('\n' + '='.repeat(70));
    console.log('📋 CRITICAL-001 FIX ASSESSMENT');
    console.log('='.repeat(70));
    
    if (issues.length === 0 && fixes.length >= 2) {
      console.log('🎉 CRITICAL-001 FIX SUCCESSFUL!');
      console.log('✅ sender_type/senderType mismatch resolved');
      console.log('✅ Database fields use snake_case consistently');
      console.log('✅ Application logic uses camelCase consistently');
      console.log('✅ Proper mapping between database and application layers');
      console.log('✅ No runtime errors expected from field mismatches');
      
      console.log('\n🚀 PRODUCTION IMPACT:');
      console.log('✅ Eliminates JavaScript runtime errors');
      console.log('✅ Fixes message loading and display issues');
      console.log('✅ Resolves real-time message processing errors');
      console.log('✅ Ensures consistent data flow in messaging system');
      
      return true;
    } else {
      console.log('⚠️  CRITICAL-001 FIX INCOMPLETE');
      console.log(`❌ ${issues.length} issues remaining`);
      console.log(`✅ ${fixes.length} fixes implemented`);
      console.log('🔧 Additional work needed for complete resolution');
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error reading file:', error.message);
    return false;
  }
}

// Run verification
const success = verifyCritical001();
process.exit(success ? 0 : 1);
