# Run the standalone TTS proxy using Piper on Windows
Set-Location "$PSScriptRoot\.."

# EDIT this path to your Piper binary if different
$env:TTS_BACKEND = "piper"
if (-not $env:PIPER_PATH) {
  $env:PIPER_PATH = (Join-Path (Get-Location) "piper\piper.exe")
}

# Optional: point voices dir if you placed models elsewhere
if (-not $env:PIPER_VOICES_DIR) {
  $env:PIPER_VOICES_DIR = (Join-Path (Get-Location) "voices\piper")
}

Write-Host "Starting TTS proxy (Piper) with PIPER_PATH=$($env:PIPER_PATH) and VOICES=$($env:PIPER_VOICES_DIR)" -ForegroundColor Cyan
python .\tts_proxy.py
