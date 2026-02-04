#!/bin/bash
# Railway Database Migration Script
# Run this on Railway to migrate the database

echo "🔧 Railway Database Migration"
echo "=============================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

echo "📦 Installing dependencies..."
pip install psycopg2-binary sqlalchemy

echo ""
echo "🚀 Running migration..."
python migrate_database.py

exit $?
