# scripts/start.ps1 — Start the Bomber game server (Windows PowerShell)
param(
    [string]$Port = "8060",
    [string]$NodeEnv = "production"
)

$RootDir = Split-Path -Parent $PSScriptRoot

# Load .env if present
$EnvFile = Join-Path $RootDir ".env"
if (Test-Path $EnvFile) {
    Write-Host "[bomber] Loading environment from .env"
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

# Override from env vars if set
if ($env:PORT)     { $Port     = $env:PORT }
if ($env:NODE_ENV) { $NodeEnv  = $env:NODE_ENV }

$env:PORT     = $Port
$env:NODE_ENV = $NodeEnv

Write-Host "[bomber] Starting server..."
Write-Host "[bomber]   PORT     = $Port"
Write-Host "[bomber]   NODE_ENV = $NodeEnv"
Write-Host "[bomber]   Game URL : http://localhost:$Port"

Set-Location $RootDir
node server.js
