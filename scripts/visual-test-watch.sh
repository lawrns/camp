#!/bin/bash

# Continuous Visual Testing Script
# This script runs visual tests continuously to ensure UI changes are properly implemented

echo "🎨 Starting Continuous Visual Testing..."
echo "This will run visual tests every 30 seconds to verify UI changes"
echo "Press Ctrl+C to stop"
echo ""

# Function to run visual tests
run_visual_tests() {
    echo "🔄 Running visual tests... $(date)"
    
    # Run visual tests with minimal output
    npx playwright test --config=visual-testing.config.ts --reporter=line --workers=1 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Visual tests passed!"
    else
        echo "❌ Visual tests failed! Check the reports for details."
        echo "📊 View detailed report: npx playwright show-report visual-reports/html"
    fi
    
    echo ""
}

# Initial test run
run_visual_tests

# Continuous testing loop
while true; do
    sleep 30
    run_visual_tests
done 