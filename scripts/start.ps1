# Bomber — Start script (Windows PowerShell)
# Starts the unified server (HTTP + Socket.io + API) on port 9998.
# Usage: .\scripts\start.ps1

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectDir

# Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

Write-Host "Starting Bomber server..."
Write-Host "  Game + API : http://localhost:9998"
Write-Host "  Socket.io  : http://localhost:9998/echo"
Write-Host "  Rooms API  : http://localhost:9998/api/rooms"
Write-Host ""

node server.js
