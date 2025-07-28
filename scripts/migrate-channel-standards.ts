#!/usr/bin/env tsx
/**
 * CHANNEL STANDARDS MIGRATION SCRIPT
 * 
 * Automatically migrates all existing channel usage to the new unified standards.
 * This script will:
 * 1. Scan all files for channel usage patterns
 * 2. Update channel names to use unified standards
 * 3. Update event names to use unified events
 * 4. Add proper imports for the standards
 * 5. Generate a migration report
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ============================================================================
// MIGRATION PATTERNS
// ============================================================================

interface MigrationPattern {
  description: string;
  pattern: RegExp;
  replacement: string;
  requiresImport?: boolean;
}

const CHANNEL_MIGRATIONS: MigrationPattern[] = [
  // Legacy channel patterns to unified standards
  {
    description: 'Organization channel pattern',
    pattern: /`org:\$\{([^}]+)\}`/g,
    replacement: 'UNIFIED_CHANNELS.organization($1)',
    requiresImport: true,
  },
  {
    description: 'Conversation channel pattern',
    pattern: /`org:\$\{([^}]+)\}:conv:\$\{([^}]+)\}`/g,
    replacement: 'UNIFIED_CHANNELS.conversation($1, $2)',
    requiresImport: true,
  },
  {
    description: 'Conversation typing channel pattern',
    pattern: /`org:\$\{([^}]+)\}:conv:\$\{([^}]+)\}:typing`/g,
    replacement: 'UNIFIED_CHANNELS.conversationTyping($1, $2)',
    requiresImport: true,
  },
  {
    description: 'User notifications channel pattern',
    pattern: /`org:\$\{([^}]+)\}:user:\$\{([^}]+)\}:notifications`/g,
    replacement: 'UNIFIED_CHANNELS.userNotifications($1, $2)',
    requiresImport: true,
  },
  {
    description: 'Widget channel pattern',
    pattern: /`org:\$\{([^}]+)\}:widget:\$\{([^}]+)\}`/g,
    replacement: 'UNIFIED_CHANNELS.widget($1, $2)',
    requiresImport: true,
  },
  // String literal patterns
  {
    description: 'String literal org channel',
    pattern: /"org:([^"]+)"/g,
    replacement: 'UNIFIED_CHANNELS.organization("$1")',
    requiresImport: true,
  },
];

const EVENT_MIGRATIONS: MigrationPattern[] = [
  // Legacy event names to unified events
  {
    description: 'Message created event',
    pattern: /"message_created"/g,
    replacement: 'UNIFIED_EVENTS.MESSAGE_CREATED',
    requiresImport: true,
  },
  {
    description: 'New message event',
    pattern: /"new_message"/g,
    replacement: 'UNIFIED_EVENTS.MESSAGE_CREATED',
    requiresImport: true,
  },
  {
    description: 'Typing start event',
    pattern: /"typing_start"/g,
    replacement: 'UNIFIED_EVENTS.TYPING_START',
    requiresImport: true,
  },
  {
    description: 'Typing stop event',
    pattern: /"typing_stop"/g,
    replacement: 'UNIFIED_EVENTS.TYPING_STOP',
    requiresImport: true,
  },
  {
    description: 'Typing indicator event',
    pattern: /"typingIndicator"/g,
    replacement: 'UNIFIED_EVENTS.TYPING_START',
    requiresImport: true,
  },
  {
    description: 'Agent joined event',
    pattern: /"agent_joined"/g,
    replacement: 'UNIFIED_EVENTS.AGENT_STATUS_ONLINE',
    requiresImport: true,
  },
  {
    description: 'New notification event',
    pattern: /"new_notification"/g,
    replacement: 'UNIFIED_EVENTS.NOTIFICATION_CREATED',
    requiresImport: true,
  },
];

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

interface MigrationResult {
  filePath: string;
  changes: Array<{
    description: string;
    line: number;
    before: string;
    after: string;
  }>;
  needsImport: boolean;
  success: boolean;
  error?: string;
}

class ChannelMigrator {
  private results: MigrationResult[] = [];
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  /**
   * Run migration on all relevant files
   */
  async migrate(): Promise<MigrationResult[]> {
    console.log('🚀 Starting channel standards migration...');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

    // Find all TypeScript and JavaScript files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '__tests__/**',
        '*.test.*',
        '*.spec.*',
        'scripts/**',
      ],
    });

    console.log(`Found ${files.length} files to process`);

    for (const file of files) {
      await this.migrateFile(file);
    }

    this.generateReport();
    return this.results;
  }

  /**
   * Migrate a single file
   */
  private async migrateFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let modifiedContent = content;
      let needsImport = false;
      const changes: MigrationResult['changes'] = [];

      // Apply channel migrations
      for (const migration of CHANNEL_MIGRATIONS) {
        const matches = Array.from(modifiedContent.matchAll(migration.pattern));
        for (const match of matches) {
          const lineNumber = this.findLineNumber(lines, match.index || 0);
          const before = match[0];
          const after = modifiedContent.replace(migration.pattern, migration.replacement);
          
          if (before !== after) {
            changes.push({
              description: migration.description,
              line: lineNumber,
              before,
              after: migration.replacement,
            });
            
            if (migration.requiresImport) {
              needsImport = true;
            }
          }
        }
        
        modifiedContent = modifiedContent.replace(migration.pattern, migration.replacement);
      }

      // Apply event migrations
      for (const migration of EVENT_MIGRATIONS) {
        const matches = Array.from(modifiedContent.matchAll(migration.pattern));
        for (const match of matches) {
          const lineNumber = this.findLineNumber(lines, match.index || 0);
          const before = match[0];
          
          changes.push({
            description: migration.description,
            line: lineNumber,
            before,
            after: migration.replacement,
          });
          
          if (migration.requiresImport) {
            needsImport = true;
          }
        }
        
        modifiedContent = modifiedContent.replace(migration.pattern, migration.replacement);
      }

      // Add import if needed
      if (needsImport && !this.hasUnifiedImport(content)) {
        modifiedContent = this.addUnifiedImport(modifiedContent);
        changes.push({
          description: 'Added unified standards import',
          line: 1,
          before: '',
          after: 'import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";',
        });
      }

      // Write file if not dry run and there are changes
      if (!this.dryRun && changes.length > 0) {
        fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      }

      // Record result
      this.results.push({
        filePath,
        changes,
        needsImport,
        success: true,
      });

      if (changes.length > 0) {
        console.log(`✅ ${filePath}: ${changes.length} changes`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      this.results.push({
        filePath,
        changes: [],
        needsImport: false,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find line number for a character index
   */
  private findLineNumber(lines: string[], charIndex: number): number {
    let currentIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      currentIndex += lines[i].length + 1; // +1 for newline
      if (currentIndex > charIndex) {
        return i + 1;
      }
    }
    return lines.length;
  }

  /**
   * Check if file already has unified import
   */
  private hasUnifiedImport(content: string): boolean {
    return content.includes('unified-channel-standards') || 
           content.includes('UNIFIED_CHANNELS') ||
           content.includes('UNIFIED_EVENTS');
  }

  /**
   * Add unified import to file
   */
  private addUnifiedImport(content: string): string {
    const lines = content.split('\n');
    
    // Find the best place to insert the import
    let insertIndex = 0;
    
    // Look for existing imports
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Found empty line after imports
        break;
      } else if (!lines[i].trim().startsWith('import ') && insertIndex > 0) {
        // Found non-import line after imports
        break;
      }
    }

    const importStatement = 'import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";';
    lines.splice(insertIndex, 0, importStatement);
    
    return lines.join('\n');
  }

  /**
   * Generate migration report
   */
  private generateReport(): void {
    const totalFiles = this.results.length;
    const changedFiles = this.results.filter(r => r.changes.length > 0).length;
    const totalChanges = this.results.reduce((sum, r) => sum + r.changes.length, 0);
    const errors = this.results.filter(r => !r.success).length;

    console.log('\n📊 MIGRATION REPORT');
    console.log('==================');
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Files with changes: ${changedFiles}`);
    console.log(`Total changes made: ${totalChanges}`);
    console.log(`Errors encountered: ${errors}`);

    if (errors > 0) {
      console.log('\n❌ ERRORS:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  ${result.filePath}: ${result.error}`);
      });
    }

    if (changedFiles > 0) {
      console.log('\n✅ CHANGED FILES:');
      this.results.filter(r => r.changes.length > 0).forEach(result => {
        console.log(`  ${result.filePath} (${result.changes.length} changes)`);
        result.changes.forEach(change => {
          console.log(`    Line ${change.line}: ${change.description}`);
        });
      });
    }

    // Write detailed report to file
    const reportPath = 'migration-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report written to: ${reportPath}`);
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no files will be modified');
  } else {
    console.log('⚠️  Running in LIVE mode - files will be modified');
    console.log('   Use --dry-run flag to preview changes first');
  }

  const migrator = new ChannelMigrator(dryRun);
  await migrator.migrate();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ChannelMigrator };
