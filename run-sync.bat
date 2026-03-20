@echo off
cd /d "%~dp0"
echo [LOG] Iniciando Sincronizacao Automatica Locavia...
npm run sync
echo [LOG] Sincronizacao concluida.
pause
