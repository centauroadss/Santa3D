#!/bin/bash
echo "🚀 Starting UI Hotfix Deployment..."

# 1. Extract Files
echo "📦 Extracting updated files..."
if [ -f "deploy_hotfix.tar.gz" ]; then
    tar -xzf deploy_hotfix.tar.gz
    echo "   ✅ Files extracted."
else
    echo "   ❌ deploy_hotfix.tar.gz not found!"
    exit 1
fi

# 2. Build
echo "🏗️  Rebuilding application..."
export NODE_OPTIONS="--max-old-space-size=3584"
if npm run build; then
    echo "   ✅ Build Successful"
else
    echo "   ❌ Build Failed"
    exit 1
fi

# 3. Restart
echo "🔄 Restarting PM2..."
pm2 restart all

echo "✨ Hotfix Deployed Successfully."
