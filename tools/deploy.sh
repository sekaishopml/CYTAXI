#!/bin/bash

# ===========================================
# CYTAXI - Deployment Script
# ===========================================

set -e

echo "🚀 CYTAXI Deployment Script"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first."
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
bun install

echo ""
echo "🐳 Step 2: Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Step 3: Waiting for services to be ready..."
sleep 10

echo ""
echo "🗄️ Step 4: Initializing database..."
docker exec -i cytaxi-postgres psql -U cytaxi -d cytaxi < tools/seed-db.sql

echo ""
echo "🔨 Step 5: Building packages..."
bun run build:all

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Services running:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - NATS: localhost:4222"
echo "   - PgAdmin: http://localhost:5050"
echo "   - Redis Commander: http://localhost:8081"
echo ""
echo "🚀 To start all services in development mode:"
echo "   bun run dev:all"
echo ""
echo "📖 For more information, see README.md"
