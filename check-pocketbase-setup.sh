#!/bin/bash

# PocketBase Schema Setup Script
# This script creates collections using PocketBase migrations

echo "🚀 Setting up PocketBase schema..."

# Check if PocketBase is running
if ! curl -s http://127.0.0.1:8090/api/health > /dev/null 2>&1; then
    echo "❌ PocketBase is not running. Please start it first with: ./start-pocketbase.sh"
    exit 1
fi

echo "✅ PocketBase is running"
echo ""
echo "📋 To complete the setup, you have two options:"
echo ""
echo "Option 1: Automated Setup (requires admin credentials)"
echo "  Run: node setup-pocketbase-schema.js <admin-email> <admin-password>"
echo ""
echo "Option 2: Manual Setup via Admin UI"
echo "  1. Open http://127.0.0.1:8090/_/ in your browser"
echo "  2. Create/login to your admin account"
echo "  3. Import the schema from: pocketbase-schema.json"
echo "     (Go to Settings → Import collections)"
echo ""
echo "Option 3: Use existing database"
echo "  If you already have a pb_data folder with collections, you're all set!"
echo ""

# Check if collections already exist by looking at the database
if [ -f "pocketbase/pb_data/data.db" ]; then
    echo "📊 Checking existing database..."
    
    # Try to query collections (this will work even without auth for collection metadata)
    COLLECTIONS=$(sqlite3 pocketbase/pb_data/data.db "SELECT name FROM _collections WHERE name IN ('timelines', 'flashcard_reviews', 'learning_cache');" 2>/dev/null || echo "")
    
    if [ ! -z "$COLLECTIONS" ]; then
        echo "✅ Found existing collections:"
        echo "$COLLECTIONS" | while read -r line; do
            echo "   - $line"
        done
        echo ""
        echo "🎉 Your PocketBase is already configured!"
        exit 0
    fi
fi

echo "⚠️  No existing collections found. Please use one of the options above."
