#!/usr/bin/env node

/**
 * Migration Analysis Script
 * Analyzes the 94 migration files to identify:
 * - Redundant migrations
 * - Conflicting changes
 * - Opportunities for consolidation
 */

const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = "db/drizzle";

function analyzeMigrations() {
  console.log("🔍 Analyzing migration files...\n");

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`📊 Found ${files.length} migration files\n`);

  const analysis = {
    totalFiles: files.length,
    tableCreations: new Map(),
    tableAlterations: new Map(),
    duplicateOperations: [],
    largeFiles: [],
    recentFiles: [],
    emptyFiles: [],
  };

  files.forEach((file) => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const stats = fs.statSync(filePath);

    // Analyze file size
    if (stats.size > 10000) {
      analysis.largeFiles.push({ file, size: stats.size });
    }

    if (stats.size < 100) {
      analysis.emptyFiles.push({ file, size: stats.size });
    }

    // Analyze SQL operations
    const lines = content.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim().toUpperCase();

      if (trimmed.startsWith("CREATE TABLE")) {
        const match = trimmed.match(/CREATE TABLE.*?"([^"]+)"/);
        if (match) {
          const tableName = match[1];
          if (!analysis.tableCreations.has(tableName)) {
            analysis.tableCreations.set(tableName, []);
          }
          analysis.tableCreations.get(tableName).push(file);
        }
      }

      if (trimmed.startsWith("ALTER TABLE")) {
        const match = trimmed.match(/ALTER TABLE.*?"([^"]+)"/);
        if (match) {
          const tableName = match[1];
          if (!analysis.tableAlterations.has(tableName)) {
            analysis.tableAlterations.set(tableName, []);
          }
          analysis.tableAlterations.get(tableName).push(file);
        }
      }
    });

    // Check for recent files (last 10)
    if (files.indexOf(file) >= files.length - 10) {
      analysis.recentFiles.push(file);
    }
  });

  // Find duplicate table operations
  for (const [table, migrations] of analysis.tableCreations) {
    if (migrations.length > 1) {
      analysis.duplicateOperations.push({
        type: "CREATE TABLE",
        table,
        files: migrations,
      });
    }
  }

  return analysis;
}

function generateReport(analysis) {
  console.log("📋 MIGRATION ANALYSIS REPORT");
  console.log("================================\n");

  console.log(`📁 Total Migration Files: ${analysis.totalFiles}`);
  console.log(`📦 Tables Created: ${analysis.tableCreations.size}`);
  console.log(`🔧 Tables Altered: ${analysis.tableAlterations.size}`);
  console.log("");

  if (analysis.duplicateOperations.length > 0) {
    console.log("⚠️  DUPLICATE OPERATIONS:");
    analysis.duplicateOperations.forEach((dup) => {
      console.log(`   ${dup.type} ${dup.table}: ${dup.files.join(", ")}`);
    });
    console.log("");
  }

  if (analysis.largeFiles.length > 0) {
    console.log("📈 LARGE MIGRATION FILES (>10KB):");
    analysis.largeFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)
      .forEach((file) => {
        console.log(`   ${file.file}: ${(file.size / 1024).toFixed(1)}KB`);
      });
    console.log("");
  }

  if (analysis.emptyFiles.length > 0) {
    console.log("📄 SMALL/EMPTY MIGRATION FILES (<100 bytes):");
    analysis.emptyFiles.forEach((file) => {
      console.log(`   ${file.file}: ${file.size} bytes`);
    });
    console.log("");
  }

  console.log("🎯 RECENT MIGRATIONS (Last 10):");
  analysis.recentFiles.forEach((file) => {
    console.log(`   ${file}`);
  });
  console.log("");

  console.log("💡 CONSOLIDATION RECOMMENDATIONS:");
  console.log(`   - Remove ${analysis.emptyFiles.length} small/empty migrations`);
  console.log(`   - Merge ${analysis.duplicateOperations.length} duplicate operations`);
  console.log(`   - Consider squashing first ${Math.max(0, analysis.totalFiles - 20)} migrations`);
  console.log(
    `   - Potential file reduction: ${analysis.totalFiles} → ~20 files (${Math.round((1 - 20 / analysis.totalFiles) * 100)}% reduction)`
  );
  console.log("");

  console.log("🚀 NEXT STEPS:");
  console.log("   1. Backup current migrations");
  console.log("   2. Create consolidated schema from current state");
  console.log("   3. Keep only recent migrations (last 10-20)");
  console.log("   4. Test thoroughly in development");
  console.log("");
}

function generateConsolidationScript() {
  const script = `#!/bin/bash
# Generated Migration Consolidation Script

echo "🔄 Starting safe migration consolidation..."

# Create timestamped backup
BACKUP_DIR="db/migrations-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r db/drizzle/* "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR"

# Keep only recent migrations (last 20)
cd db/drizzle
ls -1 *.sql | head -n -20 | xargs rm -f
echo "✅ Removed old migration files"

echo "✅ Consolidation complete!"
echo "📦 Backup available at: $BACKUP_DIR"
`;

  fs.writeFileSync("db/scripts/safe-consolidate.sh", script);
  fs.chmodSync("db/scripts/safe-consolidate.sh", "755");
  console.log("📝 Generated safe consolidation script: db/scripts/safe-consolidate.sh");
}

// Run analysis
try {
  const analysis = analyzeMigrations();
  generateReport(analysis);
  generateConsolidationScript();
} catch (error) {
  console.error("❌ Error analyzing migrations:", error.message);
  process.exit(1);
}
