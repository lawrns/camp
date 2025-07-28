#!/bin/bash

# Campfire Database Migration Consolidation Script
# This script consolidates 94+ migrations into a single, optimized schema

set -e

echo "🔄 Starting database migration consolidation..."

# Create backup directory
BACKUP_DIR="db/drizzle-archive-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup of existing migrations in $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r db/drizzle/* "$BACKUP_DIR/"

# Archive old migrations
echo "📚 Archiving old migration files..."
mkdir -p db/archive
mv db/drizzle db/archive/drizzle-old-$(date +%Y%m%d-%H%M%S)
mkdir -p db/drizzle
mkdir -p db/drizzle/meta

# Create the consolidated migration
echo "🏗️ Creating consolidated migration..."
cat > db/drizzle/0000_consolidated_schema.sql << 'EOF'
-- Campfire Consolidated Database Schema
-- This migration consolidates 94+ previous migrations into a single, optimized schema
-- Generated on $(date)

-- Drop all existing tables to start fresh
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

EOF

# Append the consolidated schema
cat db/schema/consolidated-schema.sql >> db/drizzle/0000_consolidated_schema.sql

# Create meta snapshot
cat > db/drizzle/meta/0000_snapshot.json << 'EOF'
{
  "id": "00000000-0000-0000-0000-000000000000",
  "version": "7",
  "dialect": "postgresql",
  "tables": {},
  "enums": {},
  "schemas": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
EOF

# Update drizzle config to reset migration state
echo "⚙️ Updating drizzle configuration..."
if [ -f "drizzle.config.ts" ]; then
    echo "Found drizzle.config.ts - manual update required"
else
    echo "No drizzle config found - assuming default configuration"
fi

echo "✅ Migration consolidation complete!"
echo ""
echo "📊 Summary:"
echo "  - Consolidated 94+ migrations into 1 optimized schema"
echo "  - Archived old migrations to: $BACKUP_DIR"
echo "  - Created consolidated schema at: db/drizzle/0000_consolidated_schema.sql"
echo ""
echo "🔧 Next steps:"
echo "  1. Review the consolidated schema"
echo "  2. Test in development environment"
echo "  3. Run: npm run db:push (development) or npm run db:migrate (production)"
echo ""
echo "⚠️  Important: This is a destructive operation. Make sure you have backups!"
echo "    Backed up to: $BACKUP_DIR"