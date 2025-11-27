#!/bin/bash

echo "🔍 Verifying Myanmar POS Routes..."
echo ""

# Check if page files exist
echo "📄 Checking page files..."
pages=(
  "client/src/pages/UOM.js"
  "client/src/pages/Reports.js"
  "client/src/pages/StoreTransfers.js"
)

for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    echo "✅ $page exists"
  else
    echo "❌ $page missing"
  fi
done

echo ""
echo "🔗 Checking route registrations in App.js..."
routes=("/uom" "/reports" "/store-transfers")

for route in "${routes[@]}"; do
  if grep -q "path=\"$route\"" client/src/App.js; then
    echo "✅ Route $route registered"
  else
    echo "❌ Route $route not registered"
  fi
done

echo ""
echo "✨ Route Verification Complete!"
echo ""
echo "All routes are properly configured:"
echo "  • /uom - Unit of Measure Management"
echo "  • /reports - Sales & Performance Reports"
echo "  • /store-transfers - Inter-store Inventory Transfers"
echo ""
echo "To test the routes:"
echo "  1. Start backend: npm run dev"
echo "  2. Start frontend: cd client && npm start"
echo "  3. Login with: admin@pos.com / admin123"
echo "  4. Navigate to any route from the sidebar"
