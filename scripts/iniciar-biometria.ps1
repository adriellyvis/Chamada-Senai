$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Biometria = Join-Path $Root "Front_Inicial\biometria-python"
Set-Location $Biometria

if (-not (Test-Path ".venv")) {
    py -m venv .venv
}

& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
& ".\.venv\Scripts\python.exe" app.py
