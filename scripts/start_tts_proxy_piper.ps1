# Starts the standalone TTS microservice (Piper backend)
# Edit PIPER_PATH to point to your local piper.exe

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$backend = Join-Path $root 'backend'

Push-Location $backend

if (-not (Test-Path 'piper\piper.exe')) {
  Write-Host "WARNING: backend\\piper\\piper.exe not found. Please download Piper for Windows and place it there." -ForegroundColor Yellow
}

$env:TTS_BACKEND = 'piper'
if (-not $env:PIPER_PATH) {
  $env:PIPER_PATH = (Join-Path $backend 'piper\piper.exe')
}
if (-not $env:PIPER_VOICES_DIR) {
  $env:PIPER_VOICES_DIR = (Join-Path $backend 'voices\piper')
}

Write-Host "Starting TTS proxy with Piper..." -ForegroundColor Cyan
python tts_proxy.py

Pop-Location
