#!/bin/bash

# Test script for Bot Configuration API
# Usage: bash test-bot-api.sh

BASE_URL="http://localhost:3001/api"
echo "🧪 Testing Bot Configuration API"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get Bot Config
echo "📋 Test 1: Get Bot Configuration"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/bots/config")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $http_code"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAIL${NC} - Status: $http_code"
    echo "Response: $body"
fi
echo ""

# Test 2: Get Webhook Status
echo "📊 Test 2: Get Webhook Status"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/bots/webhook/status")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $http_code"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAIL${NC} - Status: $http_code"
    echo "Response: $body"
fi
echo ""

# Test 3: Test Invalid Token (should fail gracefully)
echo "🔐 Test 3: Test Invalid Token (Expected to fail)"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid_token_123"}' \
    "${BASE_URL}/bots/test/telegram")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Correctly rejected invalid token - Status: $http_code"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Unexpected status: $http_code"
    echo "Response: $body"
fi
echo ""

# Test 4: Setup without token (should fail)
echo "⚙️  Test 4: Setup Without Token (Expected to fail)"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"domain":"https://example.com"}' \
    "${BASE_URL}/bots/telegram/setup")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Correctly rejected missing token - Status: $http_code"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Unexpected status: $http_code"
    echo "Response: $body"
fi
echo ""

# Test 5: Health Check
echo "🏥 Test 5: Health Check"
response=$(curl -s -w "\n%{http_code}" "http://localhost:3001/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Server is healthy - Status: $http_code"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAIL${NC} - Server health check failed - Status: $http_code"
    echo "Response: $body"
fi
echo ""

echo "=================================="
echo "✅ Bot API Tests Complete!"
echo ""
echo "Note: Some tests are expected to fail (invalid tokens, missing params)"
echo "This is normal and shows proper error handling."
echo ""
echo "To test with real tokens:"
echo "1. Get a bot token from @BotFather (Telegram) or Viber Partners"
echo "2. Use the Settings page UI for easy setup"
echo "3. Or use curl with your actual token:"
echo ""
echo "curl -X POST http://localhost:3001/api/bots/test/telegram \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"token\":\"YOUR_ACTUAL_TOKEN\"}'"
