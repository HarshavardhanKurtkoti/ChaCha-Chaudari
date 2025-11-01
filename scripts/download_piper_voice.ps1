param(
  [Parameter(Mandatory=$true)][string]$ModelUrl,
  [Parameter(Mandatory=$true)][string]$ConfigUrl,
  [string]$Id = "voice"
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$voices = Join-Path (Join-Path $root 'backend') 'voices\piper'
New-Item -ItemType Directory -Force -Path $voices | Out-Null

# Ensure sensible filenames that match piper_tts pairing logic: <stem>.onnx and <stem>.onnx.json
$stem = $Id -replace '[^A-Za-z0-9_-]','_'
$modelPath = Join-Path $voices ("$stem.onnx")
$configPath = Join-Path $voices ("$stem.onnx.json")

Write-Host "Downloading model -> $modelPath" -ForegroundColor Cyan
Invoke-WebRequest -Uri $ModelUrl -OutFile $modelPath

Write-Host "Downloading config -> $configPath" -ForegroundColor Cyan
Invoke-WebRequest -Uri $ConfigUrl -OutFile $configPath

Write-Host "Done. Placed files in $voices" -ForegroundColor Green
Write-Host "You can now run: .\\scripts\\start_tts_proxy_piper.ps1" -ForegroundColor Green
