#!/bin/bash

# Update all route files to use PostgreSQL instead of Supabase

echo "🔄 Updating route files to use PostgreSQL..."

# Find all route files
find src/routes -name "*.js" -type f | while read file; do
    echo "Processing: $file"
    
    # Replace supabase imports with database imports
    sed -i '' "s/require('..\/config\/supabase')/require('..\/config\/database')/g" "$file"
    sed -i '' "s/const { supabase }/const { pool, query }/g" "$file"
    
    echo "✅ Updated: $file"
done

echo "✅ All route files updated!"
