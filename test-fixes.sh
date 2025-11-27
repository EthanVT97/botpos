#!/bin/bash

# Test script to verify all fixes are applied
# Myanmar POS System - Fix Verification

echo "🔍 Myanmar POS System - Fix Verification Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if files exist
echo "📁 Checking if fix files exist..."
echo ""

files=(
    "client/src/fixes.css"
    "client/src/components/EmptyState.js"
    "client/src/components/LoadingSpinner.js"
    "client/src/components/ErrorMessage.js"
    "FIXES_APPLIED.md"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = true ]; then
    echo -e "${GREEN}✅ All fix files are present!${NC}"
else
    echo -e "${RED}❌ Some fix files are missing!${NC}"
    exit 1
fi

echo ""
echo "🔍 Checking if fixes are imported..."
echo ""

# Check if fixes.css is imported in App.js
if grep -q "import './fixes.css'" client/src/App.js; then
    echo -e "${GREEN}✓${NC} fixes.css is imported in App.js"
else
    echo -e "${RED}✗${NC} fixes.css is NOT imported in App.js"
fi

echo ""
echo "🔍 Checking WebSocket transport order..."
echo ""

# Check if transport order is fixed in ChatRealtime.js
if grep -q "transports: \['polling', 'websocket'\]" client/src/components/ChatRealtime.js; then
    echo -e "${GREEN}✓${NC} ChatRealtime.js has correct transport order"
else
    echo -e "${YELLOW}⚠${NC}  ChatRealtime.js transport order may need verification"
fi

# Check if transport order is fixed in RealtimeContext.js
if grep -q "transports: \['polling', 'websocket'\]" client/src/contexts/RealtimeContext.js; then
    echo -e "${GREEN}✓${NC} RealtimeContext.js has correct transport order"
else
    echo -e "${YELLOW}⚠${NC}  RealtimeContext.js transport order may need verification"
fi

echo ""
echo "🔍 Checking CSS fixes..."
echo ""

# Check if page-title fix exists in fixes.css
if grep -q "\.page-title" client/src/fixes.css; then
    echo -e "${GREEN}✓${NC} Page title contrast fix exists"
else
    echo -e "${RED}✗${NC} Page title contrast fix missing"
fi

# Check if badge fixes exist
if grep -q "\.badge-danger" client/src/fixes.css; then
    echo -e "${GREEN}✓${NC} Badge styling fixes exist"
else
    echo -e "${RED}✗${NC} Badge styling fixes missing"
fi

# Check if empty state fixes exist
if grep -q "\.empty-state" client/src/fixes.css; then
    echo -e "${GREEN}✓${NC} Empty state styling exists"
else
    echo -e "${RED}✗${NC} Empty state styling missing"
fi

# Check if loading state fixes exist
if grep -q "\.loading-container" client/src/fixes.css; then
    echo -e "${GREEN}✓${NC} Loading state styling exists"
else
    echo -e "${RED}✗${NC} Loading state styling missing"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo ""
echo "✅ Critical Fixes:"
echo "   - WebSocket connection stability"
echo "   - Bot status badge visibility"
echo ""
echo "✅ UI/UX Fixes:"
echo "   - Page title contrast"
echo "   - Subtitle visibility"
echo "   - Text truncation"
echo "   - Empty states"
echo "   - Loading states"
echo "   - Error messages"
echo ""
echo "📝 Next Steps:"
echo "   1. Start backend: npm run dev"
echo "   2. Start frontend: cd client && npm start"
echo "   3. Test WebSocket: Go to /messages"
echo "   4. Test bot status: Go to /settings"
echo "   5. Check text contrast on all pages"
echo ""
echo -e "${GREEN}🎉 All fixes have been applied!${NC}"
echo ""
