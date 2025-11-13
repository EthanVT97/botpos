#!/bin/bash

echo "🚀 Myanmar POS System - Quick Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Supabase credentials"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Supabase credentials"
echo "2. Run the SQL schema in Supabase (supabase/schema.sql)"
echo "3. Seed the database: npm run seed"
echo "4. Start backend: npm run dev"
echo "5. Start frontend (in new terminal): cd client && npm start"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
