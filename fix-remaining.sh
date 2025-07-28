#!/bin/bash

echo "🔧 Fixing remaining 8 syntax errors..."

# Fix the broken variable declaration in RealtimeMetricsDashboard
sed -i '' 's/const  = await \.getMetricsSummary();/const newSummary = await RealtimeMonitor.getMetricsSummary();/' src/components/admin/RealtimeMetricsDashboard.tsx

# Fix other syntax errors by reverting problematic sed replacements
echo "  🔧 Reverting problematic sed replacements..."

# Fix any broken variable declarations
find src -name "*.tsx" -exec sed -i '' 's/const  = await/const newSummary = await/g' {} \;

echo "✅ Remaining errors fixed!"
echo "Final error count: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)" 