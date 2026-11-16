@echo off
setlocal
set "BASE=%~dp0.."
set "SRC=%BASE%\src\main\java\prezence\agenda"
set "TST=%BASE%\src\test\java\prezence\agenda"
set "SAIDA=%TEMP%\prezence-agenda-teste-%RANDOM%"
mkdir "%SAIDA%" || exit /b 1
javac --release 17 -d "%SAIDA%" "%SRC%\AgendaPerfil.java" "%SRC%\AgendaVisibilidade.java" "%SRC%\AgendaTipo.java" "%SRC%\AgendaIdentidade.java" "%SRC%\AgendaPermissoes.java" "%SRC%\AgendaApiException.java" "%SRC%\AgendaEventoDados.java" "%SRC%\AgendaValidacao.java" "%TST%\AgendaRegrasTeste.java"
if errorlevel 1 goto :erro
java -cp "%SAIDA%" prezence.agenda.AgendaRegrasTeste
if errorlevel 1 goto :erro
rmdir /s /q "%SAIDA%"
exit /b 0
:erro
rmdir /s /q "%SAIDA%"
exit /b 1
