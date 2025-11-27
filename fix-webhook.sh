#!/bin/bash

# Fix Viber/Telegram webhook URLs
# This script helps fix incorrect webhook URLs

echo "🔧 Webhook Fix Script"
echo "===================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "Please start the backend first: npm run dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Get your production domain
read -p "Enter your production domain (e.g., https://your-backend.onrender.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required!"
    exit 1
fi

# Remove trailing slashes
DOMAIN=$(echo "$DOMAIN" | sed 's:/*$::')

echo ""
echo "🔧 Fixing webhooks for domain: $DOMAIN"
echo ""

# Fix Viber webhook
echo "📱 Fixing Viber webhook..."
VIBER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/bots/viber/fix-webhook \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"$DOMAIN\"}")

if echo "$VIBER_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Viber webhook fixed!"
    echo "$VIBER_RESPONSE" | grep -o '"webhook_url":"[^"]*"' | cut -d'"' -f4
else
    echo "⚠️  Viber webhook fix failed or not configured"
    echo "$VIBER_RESPONSE"
fi

echo ""

# Fix Telegram webhook
echo "✈️  Fixing Telegram webhook..."
TELEGRAM_RESPONSE=$(curl -s -X POST http://localhost:3001/api/bots/telegram/fix-webhook \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"$DOMAIN\"}")

if echo "$TELEGRAM_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Telegram webhook fixed!"
    echo "$TELEGRAM_RESPONSE" | grep -o '"webhook_url":"[^"]*"' | cut -d'"' -f4
else
    echo "⚠️  Telegram webhook fix failed or not configured"
    echo "$TELEGRAM_RESPONSE"
fi

echo ""
echo "✅ Webhook fix complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check webhook status in Settings page"
echo "2. Test by sending a message to your bot"
echo "3. Check backend logs for incoming webhooks"
echo ""
