#!/bin/bash

# GitHub Pages Deployment Script for moddonthemix.com

echo "🚀 Deploying to GitHub Pages..."
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production settings."
    exit 1
fi

echo "✅ Found .env.production"
echo ""

# Ask user to confirm production password
echo "⚠️  IMPORTANT: Have you updated .env.production with your production password?"
read -p "Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update .env.production first, then run this script again."
    exit 1
fi

echo ""
echo "📦 Installing gh-pages if needed..."
npm install

echo ""
echo "🏗️  Building and deploying to GitHub Pages..."
npm run deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your site will be live at: https://moddonthemix.com"
    echo ""
    echo "⏳ First-time setup (do this once):"
    echo "1. Go to GitHub repository → Settings → Pages"
    echo "2. Source: Deploy from branch 'gh-pages'"
    echo "3. Add custom domain: moddonthemix.com"
    echo "4. Configure DNS in Bluehost (see BLUEHOST_DNS_SETUP.md)"
    echo ""
    echo "📖 See GITHUB_PAGES_DEPLOYMENT.md for detailed instructions"
    echo ""
else
    echo ""
    echo "❌ Deployment failed! Please fix the errors above and try again."
    exit 1
fi
