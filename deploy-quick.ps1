# Quick Deployment Script for Lucid Growth Email Analyzer (PowerShell)
# This script helps you prepare for deployment

Write-Host "🚀 Lucid Growth Email Analyzer - Quick Deployment Setup" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: Lucid Growth Email Analyzer"
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check for sensitive files
Write-Host "🔍 Checking for sensitive files..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "⚠️  WARNING: backend/.env file found! This should not be committed." -ForegroundColor Red
    Write-Host "   Please remove it before pushing to GitHub:" -ForegroundColor Red
    Write-Host "   Remove-Item backend/.env" -ForegroundColor Red
}

# Check if all dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Test builds
Write-Host "🔨 Testing builds..." -ForegroundColor Yellow
Write-Host "Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create GitHub repository"
Write-Host "2. Push code to GitHub:"
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/lucid-growth-email-analyzer.git"
Write-Host "   git push -u origin main"
Write-Host "3. Follow DEPLOYMENT_GUIDE.md for detailed instructions"
Write-Host "4. Deploy backend to Render"
Write-Host "5. Deploy frontend to Vercel"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- DEPLOYMENT_GUIDE.md - Complete deployment guide"
Write-Host "- DEPLOYMENT_CHECKLIST.md - Pre-deployment checklist"
Write-Host "- README.md - Project documentation"
Write-Host ""
Write-Host "🔐 Security reminder:" -ForegroundColor Red
Write-Host "- Never commit .env files"
Write-Host "- Update all environment variables for production"
Write-Host "- Generate new OAuth2 credentials for production"
