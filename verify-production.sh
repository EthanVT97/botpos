#!/bin/bash

# Myanmar POS System - Production Verification Script
# This script verifies all system components are working

echo "🔍 Myanmar POS System - Production Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "📍 Testing URLs:"
echo "   Backend:  $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_code)"
        return 1
    fi
}

# Counter
passed=0
failed=0

echo "🔧 Step 1: Backend Health Check"
echo "--------------------------------"
if test_endpoint "Health Check" "$BACKEND_URL/health"; then
    ((passed++))
else
    ((failed++))
fi
echo ""

echo "🔧 Step 2: Frontend Accessibility"
echo "--------------------------------"
if test_endpoint "Frontend" "$FRONTEND_URL"; then
    ((passed++))
else
    ((failed++))
fi
echo ""

echo "🔧 Step 3: API Endpoints (Public)"
echo "--------------------------------"
# Note: Most endpoints require authentication, so we expect 401
if test_endpoint "Products API" "$BACKEND_URL/api/products" 401; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Categories API" "$BACKEND_URL/api/categories" 401; then
    ((passed++))
else
    ((failed++))
fi

if test_endpoint "Orders API" "$BACKEND_URL/api/orders" 401; then
    ((passed++))
else
    ((failed++))
fi
echo ""

echo "🔧 Step 4: Database Connection"
echo "--------------------------------"
if [ -n "$DATABASE_URL" ]; then
    echo -n "Testing database connection... "
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((passed++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((failed++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (DATABASE_URL not set)"
fi
echo ""

echo "🔧 Step 5: Environment Configuration"
echo "--------------------------------"
if [ -f .env ]; then
    echo -n "Checking .env file... "
    echo -e "${GREEN}✅ EXISTS${NC}"
    
    # Check required variables
    required_vars=("DATABASE_URL" "JWT_SECRET" "PORT")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            echo -e "  $var: ${GREEN}✅${NC}"
        else
            echo -e "  $var: ${RED}❌ MISSING${NC}"
        fi
    done
else
    echo -e "${RED}❌ .env file not found${NC}"
    ((failed++))
fi
echo ""

echo "📊 Summary"
echo "=========="
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! System is operational.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
