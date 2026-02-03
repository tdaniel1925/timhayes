#!/bin/bash
# AudiaPro build script for Railway

echo "========================================="
echo "Building AudiaPro Frontend"
echo "========================================="

# Install frontend dependencies
cd frontend
npm install

# Build frontend for production
npm run build

cd ..

echo "========================================="
echo "Frontend build complete!"
echo "========================================="
