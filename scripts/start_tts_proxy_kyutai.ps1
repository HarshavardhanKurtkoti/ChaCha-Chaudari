# Starts the standalone TTS microservice (Kyutai proxy)
# Requires a running Kyutai TTS server (set KYUTAI_WS_URL accordingly)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$backend = Join-Path $root 'backend'

Push-Location $backend

if (-not $env:KYUTAI_WS_URL) {
  Write-Host "ERROR: Please set KYUTAI_WS_URL to your Kyutai WebSocket endpoint (e.g., ws://localhost:7001/tts)" -ForegroundColor Red
  Write-Host "Example: `$env:KYUTAI_WS_URL = 'ws://localhost:7001/tts'"
  Pop-Location
  exit 1
}

$env:TTS_BACKEND = 'kyutai'
Write-Host "Starting TTS proxy with Kyutai backend: $env:KYUTAI_WS_URL" -ForegroundColor Cyan
python tts_proxy.py

Pop-Location
