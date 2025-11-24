#!/bin/bash

# Build script for Render deployment

echo "🚀 Starting build process..."

# Check if client directory exists
if [ ! -d "client" ]; then
  echo "❌ Error: client directory not found"
  exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd client
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete!"
