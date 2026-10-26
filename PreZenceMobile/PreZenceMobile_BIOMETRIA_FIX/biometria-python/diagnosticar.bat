@echo off
setlocal
cd /d "%~dp0"

echo === PreZence - Diagnostico biometria ===
echo.

echo [1/4] Python
where python >nul 2>nul
if errorlevel 1 (
  echo ERRO: Python nao encontrado no PATH.
) else (
  python --version
)

echo.
echo [2/4] Ambiente virtual
if exist .venv\Scripts\python.exe (
  echo OK: .venv encontrado.
) else (
  echo ERRO: .venv nao encontrado. Rode instalar.bat.
)

echo.
echo [3/4] Porta 5000
netstat -ano | findstr :5000
if errorlevel 1 echo AVISO: nada esta escutando na porta 5000. Rode iniciar.bat.

echo.
echo [4/4] Health local
curl -s --max-time 5 http://127.0.0.1:5000/health
if errorlevel 1 (
  echo.
  echo ERRO: nao foi possivel acessar http://127.0.0.1:5000/health
) else (
  echo.
)

echo.
echo Se o health funcionar no PC, teste no navegador do celular:
echo http://IP_DO_PC:5000/health
