@echo off
setlocal
cd /d "%~dp0"

if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe baixar_modelos.py
) else (
  python baixar_modelos.py
)
pause
