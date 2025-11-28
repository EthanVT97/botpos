#!/bin/bash

# Chat Enhancements Setup Script
# This script sets up all the new chat features

echo "🎉 Myanmar POS - Chat Enhancements Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Please create .env file with DATABASE_URL"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found${NC}"
    echo "Please install Node.js first"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 2: Create uploads directory
echo -e "${BLUE}Step 2: Creating uploads directory...${NC}"
mkdir -p uploads/chat
chmod 755 uploads/chat
echo -e "${GREEN}✓ Uploads directory created${NC}"
echo ""

# Step 3: Apply database migration
echo -e "${BLUE}Step 3: Applying database migration...${NC}"
node scripts/apply-chat-enhancements.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration completed${NC}"
else
    echo -e "${YELLOW}⚠️  Migration failed${NC}"
    echo "Please check the error above and try again"
    exit 1
fi
echo ""

# Step 4: Install dependencies (if needed)
echo -e "${BLUE}Step 4: Checking dependencies...${NC}"

# Check if multer is installed
if ! npm list multer &> /dev/null; then
    echo "Installing multer..."
    npm install multer
fi

# Check if xlsx is installed
if ! npm list xlsx &> /dev/null; then
    echo "Installing xlsx..."
    npm install xlsx
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"
echo ""

# Step 5: Summary
echo -e "${GREEN}=========================================="
echo "🎉 Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "New features added:"
echo "  ✓ Typing indicators"
echo "  ✓ File attachments (up to 10MB)"
echo "  ✓ Message templates (6 defaults)"
echo "  ✓ Customer notes"
echo "  ✓ Conversation tags (8 defaults)"
echo "  ✓ Message search"
echo "  ✓ Export to Excel"
echo ""
echo "Next steps:"
echo "  1. Restart backend:  npm run dev"
echo "  2. Restart frontend: cd client && npm start"
echo "  3. Visit: http://localhost:3000/messages"
echo ""
echo "Documentation:"
echo "  - README.md (updated)"
echo "  - CHAT_ENHANCEMENTS.md (detailed guide)"
echo ""
echo -e "${GREEN}Happy chatting! 💬${NC}"
