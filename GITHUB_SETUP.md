# GitHub Repository Setup Guide

## Step 1: Create Repository on GitHub

### Option A: Using GitHub CLI (Recommended)

If you have GitHub CLI installed:

```bash
# Login to GitHub (if not already logged in)
gh auth login

# Create repository
gh repo create myanmar-pos-system --public --source=. --remote=origin --push

# That's it! Your code is now on GitHub
```

### Option B: Using GitHub Website

1. **Go to GitHub**
   - Visit https://github.com/new
   - Or click the "+" icon → "New repository"

2. **Repository Details**
   - **Repository name:** `myanmar-pos-system`
   - **Description:** Myanmar Business POS System with Multi-Channel Bot Integrations
   - **Visibility:** Public (or Private if you prefer)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

## Step 2: Push Your Code

After creating the repository on GitHub, run these commands:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/myanmar-pos-system.git

# Verify remote was added
git remote -v

# Push to GitHub
git push -u origin main
```

If you get an error about "main" branch, try:
```bash
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to your repository: `https://github.com/YOUR_USERNAME/myanmar-pos-system`
2. You should see all your files
3. The README.md will be displayed on the main page

## Alternative: Using SSH

If you prefer SSH:

```bash
# Add remote using SSH
git remote add origin git@github.com:YOUR_USERNAME/myanmar-pos-system.git

# Push
git push -u origin main
```

## Repository Settings (Optional)

### Add Topics
Go to your repository → Click "⚙️ Settings" → Add topics:
- `pos-system`
- `myanmar`
- `telegram-bot`
- `viber-bot`
- `messenger-bot`
- `nodejs`
- `react`
- `supabase`
- `point-of-sale`
- `ecommerce`

### Add Description
```
Myanmar Business POS System with Multi-Channel Bot Integrations (Telegram, Viber, Messenger). Features bilingual support, auto bot configuration, inventory management, and comprehensive reporting.
```

### Add Website (if deployed)
```
https://your-deployed-app.herokuapp.com
```

## Troubleshooting

### Authentication Error
If you get authentication errors:

```bash
# For HTTPS, you may need a Personal Access Token
# Go to GitHub → Settings → Developer settings → Personal access tokens
# Generate new token with 'repo' scope
# Use token as password when pushing
```

### Branch Name Issues
If your default branch is "master" instead of "main":

```bash
# Rename branch to main
git branch -M main

# Push
git push -u origin main
```

### Remote Already Exists
If you get "remote origin already exists":

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/myanmar-pos-system.git

# Push
git push -u origin main
```

## Next Steps

After pushing to GitHub:

1. **Add a Star** ⭐ to your own repository
2. **Enable Issues** for bug tracking
3. **Add GitHub Actions** for CI/CD (optional)
4. **Create Releases** for version tags
5. **Add Contributors** if working with a team

## Making Future Changes

```bash
# Make changes to your code
# ...

# Stage changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Creating a Release

```bash
# Tag the current version
git tag -a v1.1.0 -m "Version 1.1.0 - Auto Bot Configuration"

# Push tags to GitHub
git push --tags
```

Then go to GitHub → Releases → "Create a new release" → Select tag v1.1.0

## Repository URL

After setup, your repository will be at:
```
https://github.com/YOUR_USERNAME/myanmar-pos-system
```

Share this URL with others to let them:
- View your code
- Clone the repository
- Report issues
- Contribute

---

**Need help?** Check GitHub's documentation: https://docs.github.com/en/get-started
