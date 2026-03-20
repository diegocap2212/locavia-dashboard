@echo off
cd /d "%~dp0"
echo [LOG] [%DATE% %TIME%] Iniciando Sincronizacao...

:: 1. Baixar dados do SharePoint
call npm run sync

:: 2. Sincronizar com a Nuvem (Git)
echo [LOG] Fazendo upload para o Dash Online...
git add src/summary_data.json
git commit -m "chore: auto-sync sharepoint data [%DATE%]"
git push

echo [LOG] Sincronizacao concluida com sucesso!
timeout /t 5
