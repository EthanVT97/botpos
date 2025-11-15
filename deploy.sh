#!/bin/bash

# Myanmar POS - Render Deployment Script
# This script helps prepare your app for Render deployment

echo "🚀 Myanmar POS - Render Deployment Preparation"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Check for required files
echo "📋 Checking required files..."

files=(
    "render.yaml"
    "client/public/_redirects"
    "client/src/pages/NotFound.js"
    ".env.example"
    "package.json"
    "client/package.json"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        all_files_exist=false
    fi
done

echo ""

if [ "$all_files_exist" = false ]; then
    echo "❌ Some required files are missing"
    exit 1
fi

echo "✅ All required files present"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    fi
else
    echo "✅ No uncommitted changes"
fi

echo ""

# Check for remote
if git remote | grep -q "origin"; then
    echo "✅ Git remote 'origin' configured"
    echo "   Remote URL: $(git remote get-url origin)"
else
    echo "⚠️  No git remote configured"
    echo "   You'll need to add a remote before deploying to Render"
    echo "   Run: git remote add origin <your-github-repo-url>"
fi

echo ""
echo "=============================================="
echo "📋 Pre-Deployment Checklist:"
echo "=============================================="
echo ""
echo "Backend Setup:"
echo "  [ ] Push code to GitHub"
echo "  [ ] Create Web Service on Render"
echo "  [ ] Add environment variables (see .env.example)"
echo "  [ ] Note backend URL"
echo ""
echo "Frontend Setup:"
echo "  [ ] Create Static Site on Render"
echo "  [ ] Set REACT_APP_API_URL to backend URL"
echo "  [ ] Note frontend URL"
echo ""
echo "Database Setup:"
echo "  [ ] Run schema.sql in Supabase"
echo "  [ ] Run chat_schema.sql in Supabase"
echo "  [ ] Run bot_flow_schema.sql in Supabase"
echo "  [ ] Run uom_schema.sql in Supabase"
echo "  [ ] Run price_history_schema.sql in Supabase"
echo ""
echo "Final Steps:"
echo "  [ ] Update backend CLIENT_URL with frontend URL"
echo "  [ ] Test health endpoint"
echo "  [ ] Test 404 page redirect"
echo "  [ ] Configure bot webhooks"
echo ""
echo "=============================================="
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 Ready to deploy!"
echo ""
