#!/bin/bash

# Myanmar POS System - Phase 2 Analytics Setup Script

set -e

echo "🚀 Myanmar POS System - Phase 2 Analytics Setup"
echo "=================================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing frontend dependencies (recharts)...${NC}"
cd client
npm install recharts
cd ..

echo ""
echo -e "${YELLOW}Step 2: Running database migration...${NC}"

# Check if DATABASE_URL is set
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Run migration
if [ -f "supabase/analytics_schema.sql" ]; then
    echo "Running analytics_schema.sql..."
    psql "$DATABASE_URL" -f supabase/analytics_schema.sql
    echo -e "${GREEN}✅ Database migration completed${NC}"
else
    echo -e "${RED}❌ Error: supabase/analytics_schema.sql not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Phase 2 Analytics Setup Complete!"
echo "==================================================${NC}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd client && npm start"
echo ""
echo "3. Open http://localhost:3000/analytics"
echo ""
echo "4. Login and explore the analytics dashboard!"
echo ""
echo "📊 Features Available:"
echo "   ✅ Sales summary with key metrics"
echo "   ✅ Sales trend charts (daily/weekly/monthly)"
echo "   ✅ Top products analysis"
echo "   ✅ Payment method breakdown"
echo "   ✅ Hourly sales patterns"
echo "   ✅ Category performance"
echo "   ✅ Customer analytics"
echo "   ✅ Inventory valuation"
echo "   ✅ Low stock alerts"
echo ""
echo "📚 For detailed documentation, see PHASE2_SETUP.md"
echo ""
echo "🎉 Happy analyzing!"
