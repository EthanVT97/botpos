#!/bin/bash

# Multi-Store Support Setup Script
# This script sets up the multi-store feature for Myanmar POS System

set -e

echo "🏪 Setting up Multi-Store Support..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL in your .env file or export it:"
  echo "  export DATABASE_URL='your_database_url'"
  exit 1
fi

echo "✅ Database URL found"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "⚠️  Warning: psql not found. Trying with node-postgres..."
  
  # Use Node.js to run the schema
  echo "📦 Running schema with Node.js..."
  node -e "
    const { Pool } = require('pg');
    const fs = require('fs');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const schema = fs.readFileSync('supabase/multi_store_schema.sql', 'utf8');
    
    pool.query(schema)
      .then(() => {
        console.log('✅ Multi-store schema created successfully');
        pool.end();
      })
      .catch(err => {
        console.error('❌ Error creating schema:', err.message);
        pool.end();
        process.exit(1);
      });
  "
else
  # Use psql
  echo "📦 Running multi-store schema..."
  psql "$DATABASE_URL" -f supabase/multi_store_schema.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Multi-store schema created successfully"
  else
    echo "❌ Error creating schema"
    exit 1
  fi
fi

echo ""
echo "🎉 Multi-Store Support setup complete!"
echo ""
echo "📋 What's been created:"
echo "  ✓ stores table - Store locations"
echo "  ✓ store_inventory table - Inventory per store"
echo "  ✓ store_transfers table - Transfer requests"
echo "  ✓ store_transfer_items table - Transfer items"
echo "  ✓ user_stores table - User access to stores"
echo "  ✓ Database functions for inventory management"
echo "  ✓ Performance views"
echo ""
echo "📍 Default stores created:"
echo "  • Main Store (MAIN) - Yangon"
echo "  • Branch 1 (BR01) - Mandalay"
echo ""
echo "🚀 Next steps:"
echo "  1. Restart your server: npm run dev"
echo "  2. Visit http://localhost:3000/stores"
echo "  3. Create additional stores as needed"
echo "  4. Set up store transfers between locations"
echo ""
echo "📚 Features available:"
echo "  • Multiple store locations"
echo "  • Per-store inventory tracking"
echo "  • Inter-store transfers"
echo "  • Store performance analytics"
echo "  • User-store assignments"
echo ""
