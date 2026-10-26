@echo off
cd /d "%~dp0"
echo === Porta 5000 ===
netstat -ano | findstr :5000
echo.
echo === Health ===
curl http://127.0.0.1:5000/health
echo.
echo.
echo === Status ===
curl http://127.0.0.1:5000/status
echo.
pause
