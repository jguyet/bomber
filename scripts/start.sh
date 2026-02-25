#!/usr/bin/env bash
# Bomber — Start script (Linux / macOS)
# Starts both the WebSocket game server and the static HTTP server.
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

echo "Starting Bomber servers..."
echo "  WebSocket server : ws://localhost:9998/echo"
echo "  HTTP server      : http://localhost:8060"
echo ""

# Start both servers; trap to clean up background process on exit
node server.js &
WS_PID=$!

trap 'echo "Shutting down..."; kill $WS_PID 2>/dev/null; exit 0' INT TERM

node http_server.js
