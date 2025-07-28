/**
 * Snake Case Detection Utility for Jest Tests
 * 
 * This utility scans the codebase for snake_case patterns in Supabase calls
 * and fails tests when violations are found, ensuring compliance with
 * the Ten Commandments naming conventions.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class SnakeCaseDetector {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      excludePatterns: options.excludePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/types/supabase.ts', // Generated types are allowed to have snake_case
        '**/src/types/supabase.ts'
      ],
      includePatterns: options.includePatterns || [
        'app/**/*.{ts,tsx,js,jsx}',
        'lib/**/*.{ts,tsx,js,jsx}',
        'src/**/*.{ts,tsx,js,jsx}',
        'services/**/*.{ts,tsx,js,jsx}',
        'components/**/*.{ts,tsx,js,jsx}'
      ],
      verbose: options.verbose || false
    };
    
    this.violations = [];
    this.scannedFiles = 0;
  }

  /**
   * Scan the codebase for snake_case violations in Supabase calls
   */
  async scan() {
    this.violations = [];
    this.scannedFiles = 0;
    
    const files = this.getFilesToScan();
    
    for (const file of files) {
      await this.scanFile(file);
    }
    
    return {
      violations: this.violations,
      scannedFiles: this.scannedFiles,
      hasViolations: this.violations.length > 0
    };
  }

  /**
   * Get list of files to scan based on include/exclude patterns
   */
  getFilesToScan() {
    const files = [];
    
    for (const pattern of this.options.includePatterns) {
      const matchedFiles = glob.sync(pattern, {
        cwd: this.options.rootDir,
        absolute: true,
        ignore: this.options.excludePatterns
      });
      files.push(...matchedFiles);
    }
    
    // Remove duplicates
    return [...new Set(files)];
  }

  /**
   * Scan a single file for snake_case violations
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;
      
      const violations = this.detectViolations(content, filePath);
      this.violations.push(...violations);
      
      if (this.options.verbose && violations.length > 0) {
        console.log(`Found ${violations.length} violations in ${filePath}`);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Detect snake_case violations in file content
   */
  detectViolations(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    
    // Patterns to detect snake_case in Supabase calls
    const patterns = [
      // .eq('field_name', value)
      {
        regex: /\.eq\s*\(\s*['"]([a-z_]+_[a-z_]+)['"]\s*,/g,
        type: 'supabase_eq_call',
        description: 'snake_case field in .eq() call'
      },
      // .select('field_name')
      {
        regex: /\.select\s*\(\s*['"]([^'"]*[a-z_]+_[a-z_]+[^'"]*)['"]\s*\)/g,
        type: 'supabase_select_call',
        description: 'snake_case field in .select() call'
      },
      // .insert({ field_name: value })
      {
        regex: /\.insert\s*\(\s*{[^}]*([a-z_]+_[a-z_]+)\s*:/g,
        type: 'supabase_insert_call',
        description: 'snake_case field in .insert() call'
      },
      // .update({ field_name: value })
      {
        regex: /\.update\s*\(\s*{[^}]*([a-z_]+_[a-z_]+)\s*:/g,
        type: 'supabase_update_call',
        description: 'snake_case field in .update() call'
      },
      // .order('field_name')
      {
        regex: /\.order\s*\(\s*['"]([a-z_]+_[a-z_]+)['"]\s*[,)]/g,
        type: 'supabase_order_call',
        description: 'snake_case field in .order() call'
      },
      // .filter('field_name', ...)
      {
        regex: /\.filter\s*\(\s*['"]([a-z_]+_[a-z_]+)['"]\s*,/g,
        type: 'supabase_filter_call',
        description: 'snake_case field in .filter() call'
      },
      // .match({ field_name: value })
      {
        regex: /\.match\s*\(\s*{[^}]*([a-z_]+_[a-z_]+)\s*:/g,
        type: 'supabase_match_call',
        description: 'snake_case field in .match() call'
      }
    ];
    
    lines.forEach((line, lineNumber) => {
      patterns.forEach(pattern => {
        let match;
        pattern.regex.lastIndex = 0; // Reset regex state
        
        while ((match = pattern.regex.exec(line)) !== null) {
          const snakeCaseField = match[1];
          
          // Skip if this looks like a valid snake_case pattern that should be allowed
          // (e.g., database column names in generated types)
          if (this.isAllowedSnakeCase(snakeCaseField, filePath)) {
            continue;
          }
          
          violations.push({
            file: filePath,
            line: lineNumber + 1,
            column: match.index + 1,
            field: snakeCaseField,
            type: pattern.type,
            description: pattern.description,
            suggestion: this.suggestCamelCase(snakeCaseField),
            context: line.trim()
          });
        }
      });
    });
    
    return violations;
  }

  /**
   * Check if a snake_case field is allowed (e.g., in generated types)
   */
  isAllowedSnakeCase(field, filePath) {
    // Allow snake_case in generated Supabase types
    if (filePath.includes('types/supabase.ts') || filePath.includes('src/types/supabase.ts')) {
      return true;
    }
    
    // Allow certain system fields that are commonly snake_case
    const allowedSystemFields = [
      'created_at',
      'updated_at',
      'deleted_at',
      'auth_user_id'
    ];
    
    return allowedSystemFields.includes(field);
  }

  /**
   * Suggest camelCase equivalent for snake_case field
   */
  suggestCamelCase(snakeCase) {
    return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Generate a detailed report of violations
   */
  generateReport() {
    if (this.violations.length === 0) {
      return {
        summary: `✅ No snake_case violations found in ${this.scannedFiles} files`,
        details: []
      };
    }
    
    const groupedViolations = this.violations.reduce((acc, violation) => {
      const key = violation.file;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(violation);
      return acc;
    }, {});
    
    const details = Object.entries(groupedViolations).map(([file, violations]) => {
      const relativePath = path.relative(this.options.rootDir, file);
      return {
        file: relativePath,
        violationCount: violations.length,
        violations: violations.map(v => ({
          line: v.line,
          field: v.field,
          suggestion: v.suggestion,
          description: v.description,
          context: v.context
        }))
      };
    });
    
    return {
      summary: `❌ Found ${this.violations.length} snake_case violations in ${Object.keys(groupedViolations).length} files (scanned ${this.scannedFiles} total)`,
      details
    };
  }

  /**
   * Jest matcher for testing
   */
  static createJestMatcher() {
    return {
      toHaveNoSnakeCaseViolations(received) {
        const detector = new SnakeCaseDetector(received);
        const result = detector.scan();
        const report = detector.generateReport();
        
        return {
          pass: !result.hasViolations,
          message: () => {
            if (result.hasViolations) {
              return `${report.summary}\n\n${report.details.map(detail => 
                `${detail.file}:\n${detail.violations.map(v => 
                  `  Line ${v.line}: ${v.field} → ${v.suggestion} (${v.description})`
                ).join('\n')}`
              ).join('\n\n')}`;
            }
            return report.summary;
          }
        };
      }
    };
  }
}

module.exports = {
  SnakeCaseDetector,
  createSnakeCaseJestMatcher: SnakeCaseDetector.createJestMatcher
};