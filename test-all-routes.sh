#!/bin/bash

# Myanmar POS System - Route Testing Script
# Tests all major API endpoints to verify system functionality

echo "🧪 Myanmar POS System - Route Testing"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test a route
test_route() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Response: $response"
        ((FAILED++))
    fi
}

# Health Check
echo "🏥 Health Check"
echo "---------------"
test_route "System Health" "$BASE_URL/health" '"status":"OK"'
echo ""

# Core Routes
echo "📦 Core Routes"
echo "---------------"
test_route "Products" "$API_URL/products" '"success":true'
test_route "Categories" "$API_URL/categories" '"success":true'
test_route "Customers" "$API_URL/customers" '"success":true'
test_route "Orders" "$API_URL/orders" '"success":true'
test_route "Stores" "$API_URL/stores" '"success":true'
echo ""

# Chat Routes
echo "💬 Chat/Messages Routes"
echo "------------------------"
test_route "Chat Sessions" "$API_URL/chat/sessions" '"success":true'
test_route "Unread Count" "$API_URL/chat/unread-count" '"success":true'
echo ""

# UOM Routes
echo "📏 UOM Routes"
echo "-------------"
test_route "UOM List" "$API_URL/uom" '"success":true'
echo ""

# Store Management
echo "🏪 Store Management"
echo "-------------------"
test_route "Store Transfers" "$API_URL/store-transfers" '"success":true'
echo ""

# Analytics
echo "📊 Analytics"
echo "------------"
test_route "Analytics Summary" "$API_URL/analytics/summary" '"success":true'
echo ""

# Summary
echo "======================================"
echo "📈 Test Summary"
echo "======================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is fully operational.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the output above.${NC}"
    exit 1
fi
