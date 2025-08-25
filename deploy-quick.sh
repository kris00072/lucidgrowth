#!/bin/bash

# Quick Deployment Script for Lucid Growth Email Analyzer
# This script helps you prepare for deployment

echo "🚀 Lucid Growth Email Analyzer - Quick Deployment Setup"
echo "======================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Lucid Growth Email Analyzer"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check for sensitive files
echo "🔍 Checking for sensitive files..."
if [ -f "backend/.env" ]; then
    echo "⚠️  WARNING: backend/.env file found! This should not be committed."
    echo "   Please remove it before pushing to GitHub:"
    echo "   rm backend/.env"
fi

# Check if all dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Test builds
echo "🔨 Testing builds..."
echo "Building backend..."
cd backend && npm run build && cd ..
echo "Building frontend..."
cd frontend && npm run build && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create GitHub repository"
echo "2. Push code to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/lucid-growth-email-analyzer.git"
echo "   git push -u origin main"
echo "3. Follow DEPLOYMENT_GUIDE.md for detailed instructions"
echo "4. Deploy backend to Render"
echo "5. Deploy frontend to Vercel"
echo ""
echo "📚 Documentation:"
echo "- DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "- DEPLOYMENT_CHECKLIST.md - Pre-deployment checklist"
echo "- README.md - Project documentation"
echo ""
echo "🔐 Security reminder:"
echo "- Never commit .env files"
echo "- Update all environment variables for production"
echo "- Generate new OAuth2 credentials for production"
