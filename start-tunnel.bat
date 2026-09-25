@echo off
cd /d "%~dp0"
title FlowState - Expo (tunnel)
call npm install --no-audit --no-fund
echo.
echo Tunnel mode: works on mobile data and any Wi-Fi (needs expo login first).
echo.
call npx expo start --tunnel --port 8082
pause
