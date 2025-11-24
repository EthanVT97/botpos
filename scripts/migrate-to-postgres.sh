#!/bin/bash

# Myanmar POS System - PostgreSQL Migration Script
# This script helps migrate from Supabase to Render PostgreSQL

echo "🚀 Myanmar POS System - PostgreSQL Migration"
echo "=============================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your DATABASE_URL first:"
    echo "  export DATABASE_URL='postgres://username:password@hostname:port/database'"
    echo ""
    echo "Or add it to your .env file:"
    echo "  DATABASE_URL=postgres://username:password@hostname:port/database"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql is not installed"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

echo "✅ psql is installed"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ ERROR: Cannot connect to database"
    echo ""
    echo "Please check your DATABASE_URL and ensure:"
    echo "  1. The database is running"
    echo "  2. The credentials are correct"
    echo "  3. Your IP is whitelisted (if using Render)"
    echo ""
    exit 1
fi

echo ""
echo "📋 Running database schemas..."
echo ""

# Run schema files
SCHEMA_DIR="supabase"

if [ ! -d "$SCHEMA_DIR" ]; then
    echo "❌ ERROR: Schema directory not found: $SCHEMA_DIR"
    exit 1
fi

# Array of schema files in order
SCHEMAS=(
    "schema.sql"
    "chat_schema.sql"
    "bot_flow_schema.sql"
    "uom_schema.sql"
)

for schema in "${SCHEMAS[@]}"; do
    schema_file="$SCHEMA_DIR/$schema"
    
    if [ ! -f "$schema_file" ]; then
        echo "⚠️  WARNING: Schema file not found: $schema_file"
        continue
    fi
    
    echo "📄 Running $schema..."
    if psql "$DATABASE_URL" -f "$schema_file" > /dev/null 2>&1; then
        echo "✅ $schema completed successfully"
    else
        echo "❌ ERROR: Failed to run $schema"
        echo "   Check the file for syntax errors"
    fi
    echo ""
done

echo "=============================================="
echo "✅ Migration completed!"
echo ""
echo "Next steps:"
echo "  1. Install PostgreSQL driver: npm install pg"
echo "  2. Update your .env file with DATABASE_URL"
echo "  3. Start your server: npm run dev"
echo "  4. Test the API: curl http://localhost:3001/health"
echo ""
echo "For detailed instructions, see MIGRATION_GUIDE.md"
echo ""
