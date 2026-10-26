@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  echo Ambiente virtual nao encontrado. Rode instalar.bat primeiro.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
echo.
echo Iniciando biometria oficial do PreZence (Spring/MySQL)...
echo API Spring esperada: http://127.0.0.1:8080
echo Porta biometria: 5000
echo.
python app.py
pause
