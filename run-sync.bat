@echo off
cd /d "%~dp0"
echo [LOG] [%DATE% %TIME%] Iniciando Processamento Manual...
echo [AVISO] Certifique-se de que o arquivo "base_cone.csv" esteja na raiz!

:: 1. Processar CSV local
call npm run process-csv

:: 2. Sincronizar com a Nuvem (Git)
echo [LOG] Fazendo upload para o Dash Online...
git add .
git commit -m "chore: manual-sync sharepoint data [%DATE%]"
git push

echo [LOG] Dashboard atualizado e publicado com sucesso!
ping -n 5 127.0.0.1 >nul
