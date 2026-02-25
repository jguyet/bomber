# Bomber — Start script (Windows PowerShell)
# Starts both the WebSocket game server and the static HTTP server.
# Usage: .\scripts\start.ps1

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectDir

# Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

Write-Host "Starting Bomber servers..."
Write-Host "  WebSocket server : ws://localhost:9998/echo"
Write-Host "  HTTP server      : http://localhost:8060"
Write-Host ""

# Start WebSocket server as background job
$wsJob = Start-Job -ScriptBlock {
    Set-Location $using:ProjectDir
    node server.js
}

# Start HTTP server in foreground
try {
    node http_server.js
}
finally {
    # Clean up background job on exit
    Stop-Job $wsJob -ErrorAction SilentlyContinue
    Remove-Job $wsJob -ErrorAction SilentlyContinue
}
