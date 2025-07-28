#!/bin/bash

echo "🚀 Starting Aggressive TypeScript Fix Campaign"
echo "Current errors: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)"

# Phase 1: High-Impact Automated Fixes
echo "📦 Phase 1: High-Impact Automated Fixes"

# Fix OptimizedMotion SVG elements
echo "  🔧 Fixing OptimizedMotion SVG elements..."
find src -name "*.tsx" -exec sed -i '' 's/OptimizedMotion\.circle/circle/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/OptimizedMotion\.path/path/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/OptimizedMotion\.p/p/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/OptimizedMotion\.svg/svg/g' {} \;

# Fix Button variants
echo "  🔧 Fixing Button variants..."
find src -name "*.tsx" -exec sed -i '' 's/variant="default"/variant="primary"/g' {} \;

# Fix Badge variants
echo "  🔧 Fixing Badge variants..."
find src -name "*.tsx" -exec sed -i '' 's/Badge variant="default"/Badge variant="secondary"/g' {} \;

# Fix Avatar usage patterns
echo "  🔧 Fixing Avatar usage patterns..."
find src -name "*.tsx" -exec sed -i '' 's/<Avatar.*name=.*src=.*size=.*>/<Avatar className="h-8 w-8"><AvatarImage src={src} alt={name} \/><AvatarFallback>{name.charAt(0).toUpperCase()}<\/AvatarFallback><\/Avatar>/g' {} \;

# Fix import paths
echo "  🔧 Fixing common import paths..."
find src -name "*.tsx" -exec sed -i '' 's/from "@campfire\/ui"/from "@\/components\/ui\/Button-unified"/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/from "\.\/assistant-panel"/from "\.\/assistant-panel\/AIAssistantPanel"/g' {} \;

echo "✅ Phase 1 Complete"
echo "Current errors: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)"

# Phase 2: Pattern-Based Fixes
echo "📦 Phase 2: Pattern-Based Fixes"

# Fix unknown type issues
echo "  🔧 Fixing unknown type issues..."
find src -name "*.tsx" -exec sed -i '' 's/error\.message/(error instanceof Error ? error.message : String(error))/g' {} \;

# Fix async/await patterns
echo "  🔧 Fixing async/await patterns..."
find src -name "*.tsx" -exec sed -i '' 's/const.*=.*\(.*\)\.getMetricsSummary()/const \1 = await \1.getMetricsSummary()/g' {} \;

echo "✅ Phase 2 Complete"
echo "Current errors: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)"

echo "🎉 TypeScript Fix Campaign Complete!"
echo "Final error count: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)" 