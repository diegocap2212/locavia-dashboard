@echo off
cd /d "%~dp0"
echo [LOG] [%DATE% %TIME%] Iniciando Sincronizacao...
echo [AVISO] Certifique-se de que o Chrome esteja FECHADO para o Agente funcionar!

:: 1. Baixar dados do SharePoint
call npm run sync

:: 2. Sincronizar com a Nuvem (Git)
echo [LOG] Fazendo upload para o Dash Online...
git add .
git commit -m "chore: auto-sync sharepoint data [%DATE%]"
git push

echo [LOG] Sincronizacao concluida com sucesso!
ping -n 5 127.0.0.1 >nul
