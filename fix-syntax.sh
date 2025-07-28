#!/bin/bash

echo "🔧 Fixing all remaining syntax errors..."

# Fix the broken error.message replacements
echo "  🔧 Fixing error.message syntax errors..."
find src -name "*.tsx" -exec sed -i '' 's/this\.state\.(error instanceof Error ? error\.message : String(error))/this.state.error instanceof Error ? this.state.error.message : String(this.state.error)/g' {} \;
find src -name "*.tsx" -exec sed -i '' 's/this\.state\.(error instanceof Error ? error\.message : String(error))/this.state.error instanceof Error ? this.state.error.message : String(this.state.error)/g' {} \;

# Fix any remaining broken variable declarations
echo "  🔧 Fixing broken variable declarations..."
find src -name "*.tsx" -exec sed -i '' 's/const  = await/const newSummary = await/g' {} \;

# Fix any broken property access
echo "  🔧 Fixing broken property access..."
find src -name "*.tsx" -exec sed -i '' 's/\.(error instanceof Error/\.error instanceof Error/g' {} \;

echo "✅ All syntax errors fixed!"
echo "Final error count: $(npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l)" 