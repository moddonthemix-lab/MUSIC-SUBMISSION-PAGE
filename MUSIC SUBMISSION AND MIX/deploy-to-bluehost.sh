#!/bin/bash

# Bluehost Deployment Helper Script
# This script prepares your app for Bluehost deployment

echo "🚀 Preparing for Bluehost Deployment..."
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
echo "📦 Building production app..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📁 Your files are ready in the 'build' folder"
    echo ""
    echo "Next steps:"
    echo "1. Log in to Bluehost cPanel"
    echo "2. Go to File Manager"
    echo "3. Navigate to your domain folder (public_html)"
    echo "4. Delete old files"
    echo "5. Upload ALL files from the 'build' folder"
    echo "6. Upload the .htaccess file from the project root"
    echo ""
    echo "📖 See BLUEHOST_DEPLOYMENT.md for detailed instructions"
    echo ""

    # Create a deployment checklist file
    cat > build/DEPLOYMENT_CHECKLIST.txt << 'EOF'
BLUEHOST DEPLOYMENT CHECKLIST
==============================

Upload these files to your Bluehost public_html directory:

From the 'build' folder:
  ✓ index.html
  ✓ asset-manifest.json
  ✓ manifest.json
  ✓ robots.txt
  ✓ static/ folder (entire folder with CSS and JS)

From the project root:
  ✓ .htaccess (copy the one from project root)

After uploading:
  ✓ Test home page
  ✓ Test submission form
  ✓ Test admin login
  ✓ Test queue display
  ✓ Clear browser cache and test again

IMPORTANT:
- Enable SSL certificate in Bluehost
- Set file permissions: 644 for files, 755 for folders
- If pages don't load, check .htaccess is uploaded correctly

Need help? See BLUEHOST_DEPLOYMENT.md
EOF

    echo "📝 Created deployment checklist in build/DEPLOYMENT_CHECKLIST.txt"
    echo ""

else
    echo ""
    echo "❌ Build failed! Please fix the errors above and try again."
    exit 1
fi
