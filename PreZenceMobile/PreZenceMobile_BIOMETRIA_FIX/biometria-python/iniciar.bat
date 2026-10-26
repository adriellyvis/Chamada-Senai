@echo off
setlocal
cd /d "%~dp0"

if not exist .venv\Scripts\python.exe (
  echo Ambiente Python nao encontrado. Rode instalar.bat primeiro.
  exit /b 1
)

call .venv\Scripts\activate.bat
python app.py
