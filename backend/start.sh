#!/bin/bash

# HRMS Backend - Production Startup Script
# Usage: ./start.sh [--dev|--prod]

set -e

MODE="${1:---prod}"

echo "========================================"
echo "  HRMS Backend - Starting..."
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "[!] .env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[*] Created .env from .env.example"
        echo "[!] Please update .env with your database credentials"
    else
        echo "[!] No .env.example found. Creating default .env..."
        cat > .env << EOF
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrm
DB_USER=root
DB_PASSWORD=
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-in-production")
JWT_REFRESH_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-refresh-secret")
APP_URL=http://localhost:5173
EOF
        echo "[*] Default .env created"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[*] Installing dependencies..."
    npm install
fi

# Run database migrations
echo "[*] Running database migrations..."
npx sequelize-cli db:migrate 2>/dev/null || echo "[!] Migration skipped or failed"

# Seed data if needed
echo "[*] Running seeders..."
npx sequelize-cli db:seed:all 2>/dev/null || echo "[!] Seed skipped or already seeded"

# Start server
if [ "$MODE" = "--dev" ]; then
    echo "[*] Starting in development mode..."
    npm run dev
else
    echo "[*] Starting in production mode..."
    echo "[*] Server will run on http://localhost:\${PORT:-5000}"
    node server.js
fi
