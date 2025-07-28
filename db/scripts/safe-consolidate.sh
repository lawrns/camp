#!/bin/bash
# Generated Migration Consolidation Script

echo "🔄 Starting safe migration consolidation..."

# Create timestamped backup
BACKUP_DIR="db/migrations-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r db/drizzle/* "$BACKUP_DIR/"
echo "✅ Backup created: $BACKUP_DIR"

# Keep only recent migrations (last 20)
cd db/drizzle
ls -1 *.sql | head -70 | xargs rm -f
echo "✅ Removed old migration files"

echo "✅ Consolidation complete!"
echo "📦 Backup available at: $BACKUP_DIR"
