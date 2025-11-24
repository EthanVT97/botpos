#!/bin/bash

# Myanmar POS System - Phases 3, 4, 5 Setup Script
# Receipt Printing, Barcode Scanning, Notifications

set -e

echo "🚀 Myanmar POS System - Phases 3, 4, 5 Setup"
echo "=============================================="
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

echo -e "${YELLOW}Step 1: Installing backend dependencies...${NC}"
npm install pdfkit nodemailer twilio

echo ""
echo -e "${YELLOW}Step 2: Installing frontend dependencies...${NC}"
cd client
npm install quagga react-to-print
cd ..

echo ""
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
fi

# Check for new environment variables
if ! grep -q "SMTP_HOST" .env; then
    echo -e "${YELLOW}⚠️  Adding email configuration to .env...${NC}"
    cat >> .env << 'EOF'

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Myanmar POS <your-email@gmail.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Admin Configuration
ADMIN_EMAIL=admin@yourcompany.com
EOF
    echo -e "${GREEN}✅ Email and SMS configuration added to .env${NC}"
    echo -e "${YELLOW}⚠️  Please update the values in .env file${NC}"
else
    echo -e "${GREEN}✅ Email and SMS configuration already exists in .env${NC}"
fi

echo ""
echo -e "${GREEN}=============================================="
echo "✅ Phases 3, 4, 5 Setup Complete!"
echo "==============================================$ {NC}"
echo ""
echo "📝 What's Been Installed:"
echo ""
echo "Phase 3: Receipt Printing"
echo "   ✅ PDFKit for PDF generation"
echo "   ✅ Receipt component"
echo "   ✅ Print API routes"
echo ""
echo "Phase 4: Barcode Scanning"
echo "   ✅ Quagga barcode scanner"
echo "   ✅ Camera-based scanning"
echo "   ✅ Manual barcode input"
echo ""
echo "Phase 5: Notifications"
echo "   ✅ Nodemailer for emails"
echo "   ✅ Twilio for SMS"
echo "   ✅ Notification templates"
echo "   ✅ Order confirmations"
echo "   ✅ Status updates"
echo "   ✅ Low stock alerts"
echo "   ✅ Daily reports"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update .env with your credentials:"
echo "   - Email (SMTP) settings"
echo "   - Twilio SMS settings"
echo "   - Admin email"
echo ""
echo "2. Start the servers:"
echo "   npm run dev                    # Backend"
echo "   cd client && npm start         # Frontend"
echo ""
echo "3. Test the features:"
echo "   - Print receipts from Orders page"
echo "   - Scan barcodes in POS"
echo "   - Send test notifications from Settings"
echo ""
echo "📚 For detailed documentation, see README.md"
echo ""
echo "🎉 Happy coding!"
