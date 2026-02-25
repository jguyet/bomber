#!/usr/bin/env bash
# scripts/start.sh — Start the Bomber game server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$ROOT_DIR/.env" ]; then
  echo "[bomber] Loading environment from .env"
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

PORT="${PORT:-8060}"
NODE_ENV="${NODE_ENV:-production}"

echo "[bomber] Starting server..."
echo "[bomber]   PORT     = $PORT"
echo "[bomber]   NODE_ENV = $NODE_ENV"
echo "[bomber]   Game URL : http://localhost:$PORT"

cd "$ROOT_DIR"
exec node server.js
