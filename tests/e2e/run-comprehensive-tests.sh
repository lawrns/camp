#!/bin/bash

# Comprehensive Test Runner for Campfire v2
# This script runs all phases of the updated test suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3001"}
TEST_TIMEOUT=${TEST_TIMEOUT:-"120000"}
WORKERS=${WORKERS:-"4"}
RETRIES=${RETRIES:-"2"}

echo -e "${BLUE}🚀 Campfire v2 Comprehensive Test Suite${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}$(printf '=%.0s' {1..50})${NC}"
}

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if server is running
print_section "Checking Server Status"
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    print_result 0 "Server is running at $BASE_URL"
else
    print_result 1 "Server is not running at $BASE_URL"
    echo -e "${RED}Please start the development server first: npm run dev${NC}"
    exit 1
fi

# Check environment variables
print_section "Checking Environment Variables"
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_result 1 "Missing required environment variables"
    echo -e "${RED}Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY${NC}"
    exit 1
else
    print_result 0 "Environment variables are set"
fi

# Phase 1: Critical Route and Selector Tests
print_section "Phase 1: Critical Route and Selector Tests"
echo "Running tests for updated routes and selectors..."

# Test basic navigation
echo "Testing basic navigation..."
npx playwright test tests/e2e/manual-dashboard-test.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Basic navigation tests passed"
else
    print_result 1 "Basic navigation tests failed"
fi

# Test widget functionality
echo "Testing widget functionality..."
npx playwright test e2e/tests/basic-widget-dashboard.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Widget functionality tests passed"
else
    print_result 1 "Widget functionality tests failed"
fi

# Phase 2: New Features Tests
print_section "Phase 2: New Features Tests"
echo "Running tests for new features..."

# Test AI handover functionality
echo "Testing AI handover functionality..."
npx playwright test tests/e2e/ai-handover-comprehensive.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "AI handover tests passed"
else
    print_result 1 "AI handover tests failed"
fi

# Test real-time functionality
echo "Testing real-time functionality..."
npx playwright test tests/e2e/realtime-websocket-comprehensive.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Real-time tests passed"
else
    print_result 1 "Real-time tests failed"
fi

# Test API endpoints
echo "Testing API endpoints..."
npx playwright test tests/e2e/api-endpoints-comprehensive.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "API endpoint tests passed"
else
    print_result 1 "API endpoint tests failed"
fi

# Phase 3: Comprehensive Integration Tests
print_section "Phase 3: Comprehensive Integration Tests"
echo "Running comprehensive integration tests..."

# Test bidirectional communication
echo "Testing bidirectional communication..."
npx playwright test tests/e2e/bidirectional-communication.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Bidirectional communication tests passed"
else
    print_result 1 "Bidirectional communication tests failed"
fi

# Test conversation management
echo "Testing conversation management..."
npx playwright test tests/e2e/conversation-management-comprehensive.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Conversation management tests passed"
else
    print_result 1 "Conversation management tests failed"
fi

# Test authentication flows
echo "Testing authentication flows..."
npx playwright test e2e/tests/auth/comprehensive-authenticated-test.spec.ts \
    --project=chromium \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Authentication tests passed"
else
    print_result 1 "Authentication tests failed"
fi

# Phase 4: Performance and Reliability Tests
print_section "Phase 4: Performance and Reliability Tests"
echo "Running performance and reliability tests..."

# Test with multiple browsers
echo "Testing with multiple browsers..."
npx playwright test tests/e2e/ \
    --project=chromium \
    --project=firefox \
    --project=webkit \
    --timeout=$TEST_TIMEOUT \
    --workers=$WORKERS \
    --retries=$RETRIES \
    --reporter=html

if [ $? -eq 0 ]; then
    print_result 0 "Multi-browser tests passed"
else
    print_result 1 "Multi-browser tests failed"
fi

# Test mobile responsiveness
echo "Testing mobile responsiveness..."
npx playwright test e2e/tests/ultimate-widget-accessibility.spec.ts \
    --project="Mobile Chrome" \
    --project="Mobile Safari" \
    --timeout=$TEST_TIMEOUT \
    --workers=1 \
    --reporter=list

if [ $? -eq 0 ]; then
    print_result 0 "Mobile responsiveness tests passed"
else
    print_result 1 "Mobile responsiveness tests failed"
fi

# Generate test report
print_section "Generating Test Report"
echo "Generating comprehensive test report..."

# Create reports directory if it doesn't exist
mkdir -p reports

# Generate HTML report
npx playwright show-report reports/html

# Print summary
print_section "Test Suite Summary"
echo -e "${GREEN}🎉 All test phases completed!${NC}"
echo ""
echo -e "${BLUE}Test Results:${NC}"
echo "- Phase 1: Critical Route and Selector Tests"
echo "- Phase 2: New Features Tests (AI Handover, Real-time, API)"
echo "- Phase 3: Comprehensive Integration Tests"
echo "- Phase 4: Performance and Reliability Tests"
echo ""
echo -e "${BLUE}Reports Generated:${NC}"
echo "- HTML Report: reports/html/index.html"
echo "- JSON Results: reports/results.json"
echo "- JUnit Results: reports/results.xml"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review test results in the HTML report"
echo "2. Address any failing tests"
echo "3. Update test data if needed"
echo "4. Run specific test suites as needed"

# Cleanup
print_section "Cleanup"
echo "Cleaning up test data..."

# Run cleanup script if it exists
if [ -f "tests/e2e/cleanup-test-data.js" ]; then
    node tests/e2e/cleanup-test-data.js
    print_result 0 "Test data cleanup completed"
else
    echo "No cleanup script found, manual cleanup may be required"
fi

echo ""
echo -e "${GREEN}✅ Comprehensive test suite execution completed!${NC}" 