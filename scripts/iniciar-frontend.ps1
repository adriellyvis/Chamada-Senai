$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "Front_Inicial"
Set-Location $Frontend
py -m http.server 5500 --bind 0.0.0.0
