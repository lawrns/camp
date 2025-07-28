#!/bin/bash

echo "🚀 Starting Comprehensive E2E Testing Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests with status
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}📋 Running $suite_name...${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $suite_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name failed${NC}"
        return 1
    fi
}

# Check if development server is running
echo -e "${YELLOW}🔍 Checking if development server is running...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Development server not running. Starting it...${NC}"
    npm run dev &
    DEV_PID=$!
    sleep 10
else
    echo -e "${GREEN}✅ Development server is running${NC}"
fi

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run test suites
echo ""
echo -e "${BLUE}🎯 Phase 1: Core Functionality Tests${NC}"

run_test_suite "Authentication Tests" "npx playwright test e2e/tests/auth/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Widget Integration Tests" "npx playwright test e2e/tests/widget/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Real-time Communication Tests" "npx playwright test e2e/tests/conversations/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

echo ""
echo -e "${BLUE}🎯 Phase 2: Quality Assurance Tests${NC}"

run_test_suite "Accessibility Tests" "npx playwright test e2e/tests/accessibility/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Performance Tests" "npx playwright test e2e/tests/performance/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Visual Regression Tests" "npx playwright test e2e/tests/visual/ --project=chromium --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

echo ""
echo -e "${BLUE}🎯 Phase 3: Cross-browser Tests${NC}"

run_test_suite "Firefox Tests" "npx playwright test e2e/tests/ --project=firefox --grep='@smoke' --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Safari Tests" "npx playwright test e2e/tests/ --project=webkit --grep='@smoke' --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

run_test_suite "Mobile Tests" "npx playwright test e2e/tests/ --project='Mobile Chrome' --grep='@smoke' --config=e2e/playwright.config.ts"
if [ $? -eq 0 ]; then ((PASSED_TESTS++)); else ((FAILED_TESTS++)); fi
((TOTAL_TESTS++))

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    echo -e "${YELLOW}🧹 Cleaning up development server...${NC}"
    kill $DEV_PID 2>/dev/null
fi

# Final results
echo ""
echo "=========================================="
echo -e "${BLUE}📊 E2E Testing Results Summary${NC}"
echo "=========================================="
echo -e "Total Test Suites: ${TOTAL_TESTS}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
echo -e "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All E2E tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check the reports for details.${NC}"
    echo -e "${YELLOW}📋 View detailed report: npm run test:e2e:report${NC}"
    exit 1
fi
