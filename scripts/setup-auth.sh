#!/bin/bash

# Myanmar POS System - Phase 1 Authentication Setup Script
# This script automates the installation of authentication features

set -e  # Exit on error

echo "🚀 Myanmar POS System - Phase 1 Authentication Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing backend dependencies...${NC}"
npm install bcryptjs jsonwebtoken

echo ""
echo -e "${YELLOW}Step 2: Installing frontend dependencies...${NC}"
cd client
npm install jwt-decode
cd ..

echo ""
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
fi

# Check if JWT_SECRET exists in .env
if ! grep -q "JWT_SECRET" .env; then
    echo -e "${YELLOW}⚠️  JWT_SECRET not found in .env. Generating...${NC}"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "" >> .env
    echo "# JWT Configuration" >> .env
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    echo -e "${GREEN}✅ JWT_SECRET generated and added to .env${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET already exists in .env${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Running database migration...${NC}"

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env || grep -q "DATABASE_URL=$" .env; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env${NC}"
    echo "Please set your DATABASE_URL in .env file and run this script again."
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

# Run migration
if [ -f "supabase/auth_schema.sql" ]; then
    echo "Running auth_schema.sql..."
    psql "$DATABASE_URL" -f supabase/auth_schema.sql
    echo -e "${GREEN}✅ Database migration completed${NC}"
else
    echo -e "${RED}❌ Error: supabase/auth_schema.sql not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Phase 1 Authentication Setup Complete!"
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
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. Login with default credentials:"
echo "   Email: admin@myanmarpos.com"
echo "   Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change the default admin password after first login!${NC}"
echo ""
echo "📚 For detailed documentation, see PHASE1_SETUP.md"
echo ""
echo "🎉 Happy coding!"
