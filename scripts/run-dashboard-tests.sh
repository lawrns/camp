#!/bin/bash

# Comprehensive Dashboard Testing Suite Runner
# Runs all dashboard-related unit tests and E2E tests with proper reporting

set -e

echo "🚀 Starting Comprehensive Dashboard Testing Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_TESTS_PASSED=0
E2E_TESTS_PASSED=0
TOTAL_FAILURES=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAILURE")
            echo -e "${RED}❌ $message${NC}"
            ((TOTAL_FAILURES++))
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️ $message${NC}"
            ;;
    esac
}

# Function to run unit tests
run_unit_tests() {
    echo ""
    echo "📋 Running Dashboard Unit Tests"
    echo "==============================="
    
    print_status "INFO" "Running InboxDashboard component tests..."
    if npm test -- __tests__/dashboard/InboxDashboard.test.tsx --passWithNoTests; then
        print_status "SUCCESS" "InboxDashboard unit tests passed"
        ((UNIT_TESTS_PASSED++))
    else
        print_status "FAILURE" "InboxDashboard unit tests failed"
    fi
    
    print_status "INFO" "Running ConversationList component tests..."
    if npm test -- __tests__/dashboard/ConversationList.test.tsx --passWithNoTests; then
        print_status "SUCCESS" "ConversationList unit tests passed"
        ((UNIT_TESTS_PASSED++))
    else
        print_status "FAILURE" "ConversationList unit tests failed"
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    echo ""
    echo "🌐 Running Dashboard E2E Tests"
    echo "==============================="

    # Set environment variables to disable dev overlay
    export DISABLE_DEV_OVERLAY=true
    export E2E_TESTING=true
    export NEXT_PUBLIC_E2E_TESTING=true

    print_status "INFO" "Environment configured for E2E testing (dev overlay disabled)"

    # Check if server is running
    if ! curl -s http://localhost:3001 > /dev/null; then
        print_status "WARNING" "Development server not running on port 3001"
        print_status "INFO" "Please start the server with: DISABLE_DEV_OVERLAY=true npm run dev"
        return 1
    fi
    
    print_status "INFO" "Running dashboard bidirectional communication tests..."
    if npx playwright test e2e/tests/dashboard-bidirectional.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Dashboard bidirectional tests passed"
        ((E2E_TESTS_PASSED++))
    else
        print_status "FAILURE" "Dashboard bidirectional tests failed"
    fi
    
    print_status "INFO" "Running dashboard UI functionality tests..."
    if npx playwright test e2e/tests/dashboard-ui-functionality.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Dashboard UI functionality tests passed"
        ((E2E_TESTS_PASSED++))
    else
        print_status "FAILURE" "Dashboard UI functionality tests failed"
    fi
    
    print_status "INFO" "Running dashboard authentication & permissions tests..."
    if npx playwright test e2e/tests/dashboard-auth-permissions.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Dashboard auth & permissions tests passed"
        ((E2E_TESTS_PASSED++))
    else
        print_status "FAILURE" "Dashboard auth & permissions tests failed"
    fi
    
    print_status "INFO" "Running dashboard integration & performance tests..."
    if npx playwright test e2e/tests/dashboard-integration-performance.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Dashboard integration & performance tests passed"
        ((E2E_TESTS_PASSED++))
    else
        print_status "FAILURE" "Dashboard integration & performance tests failed"
    fi
}

# Function to run existing widget tests for regression
run_widget_regression_tests() {
    echo ""
    echo "🔄 Running Widget Regression Tests"
    echo "=================================="
    
    print_status "INFO" "Running widget simple tests..."
    if npx playwright test e2e/tests/widget-simple.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Widget simple tests passed"
    else
        print_status "FAILURE" "Widget simple tests failed"
    fi
    
    print_status "INFO" "Running widget bidirectional tests..."
    if npx playwright test e2e/tests/ultimate-widget-bidirectional.spec.ts --project=chromium --workers=1; then
        print_status "SUCCESS" "Widget bidirectional tests passed"
    else
        print_status "FAILURE" "Widget bidirectional tests failed"
    fi
}

# Function to generate test report
generate_report() {
    echo ""
    echo "📊 Test Results Summary"
    echo "======================"
    echo ""
    echo "Unit Tests:"
    echo "  ✅ Passed: $UNIT_TESTS_PASSED"
    echo ""
    echo "E2E Tests:"
    echo "  ✅ Passed: $E2E_TESTS_PASSED"
    echo ""
    echo "Total Failures: $TOTAL_FAILURES"
    echo ""
    
    if [ $TOTAL_FAILURES -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! 🎉"
        echo ""
        echo "🚀 Dashboard testing suite completed successfully!"
        echo "   - Authentication and permissions working"
        echo "   - UI functionality verified"
        echo "   - Bidirectional communication tested"
        echo "   - Performance and integration validated"
        echo ""
        echo "Next steps:"
        echo "  1. Review any warnings in test output"
        echo "  2. Implement missing features identified in tests"
        echo "  3. Run tests regularly during development"
        return 0
    else
        print_status "FAILURE" "Some tests failed. Please review the output above."
        echo ""
        echo "Common issues to check:"
        echo "  - Server running on correct port (3001)"
        echo "  - Database connection working"
        echo "  - Authentication configuration correct"
        echo "  - All required test IDs implemented"
        return 1
    fi
}

# Main execution
main() {
    # Check prerequisites
    if ! command -v npm &> /dev/null; then
        print_status "FAILURE" "npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_status "FAILURE" "npx not found. Please install Node.js and npm."
        exit 1
    fi
    
    # Run test suites
    run_unit_tests
    run_e2e_tests
    run_widget_regression_tests
    
    # Generate final report
    generate_report
}

# Handle script arguments
case "${1:-all}" in
    "unit")
        run_unit_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "widget")
        run_widget_regression_tests
        ;;
    "all")
        main
        ;;
    *)
        echo "Usage: $0 [unit|e2e|widget|all]"
        echo ""
        echo "Options:"
        echo "  unit   - Run only unit tests"
        echo "  e2e    - Run only E2E tests"
        echo "  widget - Run only widget regression tests"
        echo "  all    - Run all tests (default)"
        exit 1
        ;;
esac
