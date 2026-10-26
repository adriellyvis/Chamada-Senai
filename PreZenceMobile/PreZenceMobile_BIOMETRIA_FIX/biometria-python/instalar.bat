@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python nao foi encontrado no PATH.
  echo Instale Python 3.11 ou 3.12 64 bits e marque Add python.exe to PATH.
  exit /b 1
)

if not exist .venv\Scripts\python.exe (
  python -m venv .venv
  if errorlevel 1 exit /b 1
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

python baixar_modelos.py
if errorlevel 1 exit /b 1

echo.
echo Instalacao concluida. Rode iniciar.bat.
