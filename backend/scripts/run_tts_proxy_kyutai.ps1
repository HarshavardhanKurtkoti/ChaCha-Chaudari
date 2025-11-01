# Run the standalone TTS proxy configured for Kyutai (requires an external Kyutai server)
Set-Location "$PSScriptRoot\.."

# This proxy does NOT start the Kyutai server for you. Start Kyutai separately and set the WS URL below.
$env:TTS_BACKEND = "kyutai"
if (-not $env:KYUTAI_WS_URL) {
  # Adjust this to your Kyutai server endpoint
  $env:KYUTAI_WS_URL = "ws://localhost:7001/tts"
}

Write-Host "Starting TTS proxy (Kyutai) with KYUTAI_WS_URL=$($env:KYUTAI_WS_URL)" -ForegroundColor Cyan
python .\tts_proxy.py

# Notes:
# 1) Place Kyutai model files under backend\kyutai\tts-1.6b-en_fr as documented.
# 2) Start the Kyutai TTS server pointing to that folder (see backend/kyutai/README.md).
# 3) Then run this script. The proxy will forward /tts to the Kyutai server.
