#!/usr/bin/env bash
# Bomber — Start script (Linux / macOS)
# Starts the unified server (HTTP + Socket.io + API) on port 9998.
# Usage: ./scripts/start.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Bomber server..."
echo "  Game + API : http://localhost:9998"
echo "  Socket.io  : http://localhost:9998/echo"
echo "  Rooms API  : http://localhost:9998/api/rooms"
echo ""

trap 'echo "Shutting down..."; exit 0' INT TERM

exec node server.js
