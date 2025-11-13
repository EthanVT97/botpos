#!/bin/bash

echo "🚀 Myanmar POS System - GitHub Setup"
echo "====================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Check if there are commits
if ! git rev-parse HEAD > /dev/null 2>&1; then
    echo "❌ Error: No commits found"
    echo "Run: git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo "✅ Git repository is ready"
echo ""

# Prompt for GitHub username
echo "📝 Please enter your GitHub username:"
read -p "Username: " github_username

if [ -z "$github_username" ]; then
    echo "❌ Error: Username cannot be empty"
    exit 1
fi

# Repository name
repo_name="myanmar-pos-system"

echo ""
echo "📦 Repository Details:"
echo "   Username: $github_username"
echo "   Repository: $repo_name"
echo "   URL: https://github.com/$github_username/$repo_name"
echo ""

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists"
    current_url=$(git remote get-url origin)
    echo "   Current URL: $current_url"
    echo ""
    read -p "Do you want to replace it? (y/n): " replace_remote
    
    if [ "$replace_remote" = "y" ] || [ "$replace_remote" = "Y" ]; then
        git remote remove origin
        echo "✅ Removed existing remote"
    else
        echo "❌ Cancelled"
        exit 1
    fi
fi

# Add remote
echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$github_username/$repo_name.git"

if [ $? -eq 0 ]; then
    echo "✅ Remote added successfully"
else
    echo "❌ Failed to add remote"
    exit 1
fi

# Verify remote
echo ""
echo "📋 Remote configuration:"
git remote -v

echo ""
echo "⚠️  IMPORTANT: Before pushing, make sure you have:"
echo "   1. Created the repository on GitHub: https://github.com/new"
echo "   2. Repository name: $repo_name"
echo "   3. DO NOT initialize with README, .gitignore, or license"
echo ""

read -p "Have you created the repository on GitHub? (y/n): " repo_created

if [ "$repo_created" != "y" ] && [ "$repo_created" != "Y" ]; then
    echo ""
    echo "📝 Please create the repository first:"
    echo "   1. Go to: https://github.com/new"
    echo "   2. Repository name: $repo_name"
    echo "   3. Description: Myanmar Business POS System with Multi-Channel Bot Integrations"
    echo "   4. Choose Public or Private"
    echo "   5. DO NOT check any initialization options"
    echo "   6. Click 'Create repository'"
    echo ""
    echo "Then run this script again."
    exit 0
fi

# Ensure we're on main branch
echo ""
echo "🌿 Checking branch..."
current_branch=$(git branch --show-current)

if [ "$current_branch" != "main" ]; then
    echo "   Renaming branch to 'main'..."
    git branch -M main
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo "   This may take a moment..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your repository is now live at:"
    echo "   https://github.com/$github_username/$repo_name"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit your repository"
    echo "   2. Add topics: pos-system, myanmar, telegram-bot, nodejs, react"
    echo "   3. Star your repository ⭐"
    echo "   4. Share with others!"
    echo ""
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo ""
    echo "Common issues:"
    echo "   1. Repository doesn't exist on GitHub"
    echo "   2. Authentication failed (you may need a Personal Access Token)"
    echo "   3. No permission to push"
    echo ""
    echo "For authentication, you may need to:"
    echo "   1. Go to: https://github.com/settings/tokens"
    echo "   2. Generate new token (classic)"
    echo "   3. Select 'repo' scope"
    echo "   4. Use token as password when pushing"
    echo ""
fi
