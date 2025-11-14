#!/bin/bash

echo "🤖 Setting up Bot Flow Builder..."
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Run the bot flow schema in Supabase:"
echo "   - Open Supabase SQL Editor"
echo "   - Copy content from: supabase/bot_flow_schema.sql"
echo "   - Run the SQL"
echo ""
echo "2. Start the development servers:"
echo "   Terminal 1: npm run dev"
echo "   Terminal 2: cd client && npm start"
echo ""
echo "3. Access Bot Flows:"
echo "   - Open http://localhost:3000"
echo "   - Click 'Bot Flows' in the sidebar"
echo "   - Create your first flow!"
echo ""
echo "📚 Read BOT_FLOW_GUIDE.md for detailed instructions"
echo ""
echo "Happy building! 🚀"
